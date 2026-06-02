import { ErpQueryPort } from '@motor100/shared';
import { IdentityResolver } from './identity-resolver';

function setup() {
  const erp = {
    getCustomerByDocument: jest.fn(),
  } as unknown as ErpQueryPort & { getCustomerByDocument: jest.Mock };
  const prisma = {
    identityBinding: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const resolver = new IdentityResolver(erp, prisma as any);
  return { resolver, erp, prisma };
}

const customer = {
  cdCliente: 8401,
  nome: 'Fulano de Tal',
  telefones: ['49 3333-0000', '49 9 9999-1234'],
  vendedorId: 109,
};

describe('IdentityResolver', () => {
  it('binds phone → cdCliente when the WhatsApp phone matches a cadastro phone', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(customer);

    // WhatsApp form (DDI 55 + DDD 49 + 9 + número) of the cadastro celular.
    const result = await resolver.resolve('+5549999991234', '07100189918');

    expect(result.verified).toBe(true);
    expect(result.cdCliente).toBe(8401);
    expect(result.maskedDocument).toMatch(/918$/);
    expect(prisma.identityBinding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: '+5549999991234', cdCliente: 8401, verified: true }),
      }),
    );
  });

  it('refuses to bind when the WhatsApp phone does not match the cadastro (anti-impersonation)', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(customer);

    const result = await resolver.resolve('+5511888880000', '07100189918');

    expect(result.verified).toBe(false);
    expect(result.reason).toBe('phone_mismatch');
    expect(prisma.identityBinding.create).not.toHaveBeenCalled();
  });

  it('rejects a cross-DDD collision (same last 8 digits, different area code)', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(customer);

    // Same trailing 8 digits (99991234) but DDD 11 instead of 49 — must NOT match.
    const result = await resolver.resolve('+5511999991234', '07100189918');

    expect(result.verified).toBe(false);
    expect(result.reason).toBe('phone_mismatch');
    expect(prisma.identityBinding.create).not.toHaveBeenCalled();
  });

  it('rejects DDDs that share the same final digit (11 vs 21) — last-8 alone would collide', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue({
      ...customer,
      telefones: ['21 9 9999-1234'], // DDD 21
    });

    // DDD 11, same trailing 8 digits — must NOT match (key includes the DDD).
    const result = await resolver.resolve('+5511999991234', '07100189918');

    expect(result.verified).toBe(false);
    expect(result.reason).toBe('phone_mismatch');
  });

  it('reports no_phones_on_record when the cadastro has no phones', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue({ ...customer, telefones: [] });

    const result = await resolver.resolve('+5549999991234', '07100189918');

    expect(result.verified).toBe(false);
    expect(result.reason).toBe('no_phones_on_record');
    expect(prisma.identityBinding.create).not.toHaveBeenCalled();
  });

  it('refuses to rebind a phone already linked to a different cliente (anti-hijack)', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(customer); // cdCliente 8401
    prisma.identityBinding.findUnique.mockResolvedValue({
      phone: '+5549999991234',
      cdCliente: 9999, // already bound to someone else
    });

    const result = await resolver.resolve('+5549999991234', '07100189918');

    expect(result.verified).toBe(false);
    expect(result.reason).toBe('binding_conflict');
    expect(prisma.identityBinding.create).not.toHaveBeenCalled();
  });

  it('is idempotent when re-binding the same phone to the same cliente', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(customer);
    prisma.identityBinding.findUnique.mockResolvedValue({
      phone: '+5549999991234',
      cdCliente: 8401, // same cliente
    });

    const result = await resolver.resolve('+5549999991234', '07100189918');

    expect(result.verified).toBe(true);
    expect(prisma.identityBinding.create).not.toHaveBeenCalled();
  });

  it('does not report verified when create fails with a transient (non-unique) error', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(customer);
    prisma.identityBinding.findUnique.mockResolvedValue(null);
    prisma.identityBinding.create.mockRejectedValue(
      Object.assign(new Error('connection lost'), { code: 'P1001' }),
    );

    await expect(resolver.resolve('+5549999991234', '07100189918')).rejects.toThrow();
  });

  it('treats a P2002 unique violation by the same cliente as a benign race (verified)', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(customer);
    prisma.identityBinding.findUnique
      .mockResolvedValueOnce(null) // pre-create check
      .mockResolvedValueOnce({ phone: '+5549999991234', cdCliente: 8401 }); // post-race re-read
    prisma.identityBinding.create.mockRejectedValue(
      Object.assign(new Error('unique'), { code: 'P2002' }),
    );

    const result = await resolver.resolve('+5549999991234', '07100189918');
    expect(result.verified).toBe(true);
  });

  it('reports not_found when there is no cadastro for the document', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(null);

    const result = await resolver.resolve('+5549999991234', '00000000000');

    expect(result.verified).toBe(false);
    expect(result.reason).toBe('not_found');
    expect(prisma.identityBinding.create).not.toHaveBeenCalled();
  });

  it('returns an existing verified binding for a phone', async () => {
    const { resolver, prisma } = setup();
    prisma.identityBinding.findUnique.mockResolvedValue({ phone: '+5549999991234', cdCliente: 8401 });

    expect(await resolver.getBinding('+5549999991234')).toEqual({ cdCliente: 8401 });
  });

  it('returns null when no binding exists for a phone', async () => {
    const { resolver, prisma } = setup();
    prisma.identityBinding.findUnique.mockResolvedValue(null);

    expect(await resolver.getBinding('+550000000000')).toBeNull();
  });
});
