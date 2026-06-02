import { ErpQueryPort } from '@motor100/shared';
import { IdentityResolver } from './identity-resolver';

function setup() {
  const erp = {
    getCustomerByDocument: jest.fn(),
  } as unknown as ErpQueryPort & { getCustomerByDocument: jest.Mock };
  const prisma = {
    identityBinding: {
      findUnique: jest.fn(),
      upsert: jest.fn().mockResolvedValue({}),
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

    const result = await resolver.resolve('+554999991234', '07100189918');

    expect(result.verified).toBe(true);
    expect(result.cdCliente).toBe(8401);
    expect(result.maskedDocument).toMatch(/918$/);
    expect(prisma.identityBinding.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { phone: '+554999991234' },
        create: expect.objectContaining({ phone: '+554999991234', cdCliente: 8401 }),
      }),
    );
  });

  it('refuses to bind when the WhatsApp phone does not match the cadastro (anti-impersonation)', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(customer);

    const result = await resolver.resolve('+5511888880000', '07100189918');

    expect(result.verified).toBe(false);
    expect(result.reason).toBe('phone_mismatch');
    expect(prisma.identityBinding.upsert).not.toHaveBeenCalled();
  });

  it('reports not_found when there is no cadastro for the document', async () => {
    const { resolver, erp, prisma } = setup();
    erp.getCustomerByDocument.mockResolvedValue(null);

    const result = await resolver.resolve('+554999991234', '00000000000');

    expect(result.verified).toBe(false);
    expect(result.reason).toBe('not_found');
    expect(prisma.identityBinding.upsert).not.toHaveBeenCalled();
  });

  it('returns an existing verified binding for a phone', async () => {
    const { resolver, prisma } = setup();
    prisma.identityBinding.findUnique.mockResolvedValue({ phone: '+554999991234', cdCliente: 8401 });

    expect(await resolver.getBinding('+554999991234')).toEqual({ cdCliente: 8401 });
  });

  it('returns null when no binding exists for a phone', async () => {
    const { resolver, prisma } = setup();
    prisma.identityBinding.findUnique.mockResolvedValue(null);

    expect(await resolver.getBinding('+550000000000')).toBeNull();
  });
});
