import { ErpQueryPort, ToolContext } from '@motor100/shared';
import { ErpToolRegistry } from './erp-tool-registry';
import { IdentityResolver } from './identity-resolver';

const CTX: ToolContext = { cdFilial: 1, phone: '+554999991234' };

function setup() {
  const erp = {
    searchProducts: jest.fn(),
    getStock: jest.fn(),
    getOrdersByCustomer: jest.fn(),
    getPrice: jest.fn(),
  } as unknown as ErpQueryPort & {
    searchProducts: jest.Mock;
    getStock: jest.Mock;
    getOrdersByCustomer: jest.Mock;
    getPrice: jest.Mock;
  };
  const identity = {
    resolve: jest.fn(),
    getBinding: jest.fn(),
  } as unknown as IdentityResolver & { resolve: jest.Mock };
  const registry = new ErpToolRegistry(erp, identity);
  return { registry, erp, identity };
}

describe('ErpToolRegistry', () => {
  it('exposes get_product_info as an OpenRouter tool definition with a query param', () => {
    const { registry } = setup();
    const defs = registry.definitions();

    const productTool = defs.find((d) => d.function.name === 'get_product_info');
    expect(productTool).toBeDefined();
    expect(productTool!.type).toBe('function');
    expect(productTool!.function.parameters.required).toContain('query');
  });

  it('dispatches get_product_info to searchProducts with the context Filial', async () => {
    const { registry, erp } = setup();
    erp.searchProducts.mockResolvedValue([
      { idItem: 1, codigo: 'A', nome: 'Peça', marca: 'M', temEstoque: true, unidadeVenda: 'PC' },
    ]);

    const result = await registry.dispatch(
      'get_product_info',
      { query: 'junta' },
      { ...CTX, cdFilial: 7 },
    );

    expect(erp.searchProducts).toHaveBeenCalledWith('junta', 7);
    expect(result).toEqual({
      products: [
        { idItem: 1, codigo: 'A', nome: 'Peça', marca: 'M', temEstoque: true, unidadeVenda: 'PC' },
      ],
    });
  });

  it('throws on an unmapped tool name', async () => {
    const { registry } = setup();
    await expect(
      registry.dispatch('definitely_not_a_tool', {}, CTX),
    ).rejects.toThrow(/unmapped/i);
  });

  it.each([
    [{ query: 'junta' }, 'junta'],
    [{ query: 123 }, '123'],
    [{}, ''],
    [{ query: null }, ''],
  ])('coerces query arg %j to the string %j before querying', async (args, expected) => {
    const { registry, erp } = setup();
    erp.searchProducts.mockResolvedValue([]);

    await registry.dispatch('get_product_info', args as any, CTX);

    expect(erp.searchProducts).toHaveBeenCalledWith(expected, 1);
  });

  it('exposes check_stock with an idItem param', () => {
    const { registry } = setup();
    const tool = registry.definitions().find((d) => d.function.name === 'check_stock');
    expect(tool).toBeDefined();
    expect(tool!.function.parameters.required).toContain('idItem');
  });

  it('dispatches check_stock to getStock with idItem and the context Filial', async () => {
    const { registry, erp } = setup();
    erp.getStock.mockResolvedValue({ idItem: 106, disponivel: true, quantidade: 4 });

    const result = await registry.dispatch('check_stock', { idItem: 106 }, { ...CTX, cdFilial: 2 });

    expect(erp.getStock).toHaveBeenCalledWith(106, 2);
    expect(result).toEqual({ idItem: 106, disponivel: true, quantidade: 4 });
  });

  it.each([
    [{ idItem: 106 }, 106],
    [{ idItem: '106' }, 106],
    [{}, 0],
    [{ idItem: null }, 0],
  ])('coerces check_stock idItem %j to number %j', async (args, expected) => {
    const { registry, erp } = setup();
    erp.getStock.mockResolvedValue({ idItem: expected, disponivel: false, quantidade: 0 });

    await registry.dispatch('check_stock', args as any, { ...CTX, cdFilial: 3 });

    expect(erp.getStock).toHaveBeenCalledWith(expected, 3);
  });

  it('get_product_price uses the table price when the customer is not identified', async () => {
    const { registry, erp, identity } = setup();
    (identity.getBinding as jest.Mock).mockResolvedValue(null);
    erp.getPrice.mockResolvedValue({ idItem: 691171, preco: 141.96, personalizado: false });

    const result = await registry.dispatch('get_product_price', { idItem: 691171 }, { ...CTX, cdFilial: 1 });

    expect(erp.getPrice).toHaveBeenCalledWith(691171, 1, undefined);
    expect(result).toEqual({ idItem: 691171, preco: 141.96, personalizado: false });
  });

  it('get_product_price applies the customer discount when identified', async () => {
    const { registry, erp, identity } = setup();
    (identity.getBinding as jest.Mock).mockResolvedValue({ cdCliente: 40491 });
    erp.getPrice.mockResolvedValue({ idItem: 691171, preco: 25.0, personalizado: true });

    await registry.dispatch('get_product_price', { idItem: 691171 }, { ...CTX, cdFilial: 1 });

    expect(erp.getPrice).toHaveBeenCalledWith(691171, 1, 40491);
  });

  it('refuses check_order_status when the customer is not identified', async () => {
    const { registry, erp, identity } = setup();
    (identity.getBinding as jest.Mock).mockResolvedValue(null);

    const result: any = await registry.dispatch('check_order_status', {}, CTX);

    expect(result).toEqual({ erro: 'cliente_nao_identificado' });
    expect(erp.getOrdersByCustomer).not.toHaveBeenCalled();
  });

  it('returns orders for an identified customer using the bound cdCliente', async () => {
    const { registry, erp, identity } = setup();
    (identity.getBinding as jest.Mock).mockResolvedValue({ cdCliente: 1448 });
    erp.getOrdersByCustomer.mockResolvedValue([
      { nrPedido: 95, situacao: 'EM DIGITACAO', emissao: '2021-12-22', total: 246.92 },
    ]);

    const result: any = await registry.dispatch('check_order_status', {}, CTX);

    expect(identity.getBinding).toHaveBeenCalledWith(CTX.phone);
    expect(erp.getOrdersByCustomer).toHaveBeenCalledWith(1448);
    expect(result).toEqual({ pedidos: [{ nrPedido: 95, situacao: 'EM DIGITACAO', emissao: '2021-12-22', total: 246.92 }] });
  });

  it('ignores a model-supplied cdCliente and always uses the verified binding', async () => {
    const { registry, erp, identity } = setup();
    (identity.getBinding as jest.Mock).mockResolvedValue({ cdCliente: 1448 });
    erp.getOrdersByCustomer.mockResolvedValue([]);

    // Model tries to inject someone else's cdCliente — must be ignored.
    await registry.dispatch('check_order_status', { cdCliente: 9999 }, CTX);

    expect(erp.getOrdersByCustomer).toHaveBeenCalledWith(1448);
    expect(erp.getOrdersByCustomer).not.toHaveBeenCalledWith(9999);
  });

  it('exposes identify_customer with a document param', () => {
    const { registry } = setup();
    const tool = registry.definitions().find((d) => d.function.name === 'identify_customer');
    expect(tool).toBeDefined();
    expect(tool!.function.parameters.required).toContain('document');
  });

  it('dispatches identify_customer to the resolver using the context phone, hiding cdCliente', async () => {
    const { registry, identity } = setup();
    (identity.resolve as jest.Mock).mockResolvedValue({
      verified: true,
      cdCliente: 8401,
      nome: 'Fulano',
      maskedDocument: '...918',
      vendedorId: 109,
    });

    const result = await registry.dispatch('identify_customer', { document: '07100189918' }, CTX);

    expect(identity.resolve).toHaveBeenCalledWith('+554999991234', '07100189918');
    expect(result).toEqual({ verified: true, nome: 'Fulano', documento: '...918', motivo: undefined });
    expect(result).not.toHaveProperty('cdCliente'); // internal id never reaches the model
    expect(JSON.stringify(result)).not.toContain('8401');
  });

  it.each(['not_found', 'phone_mismatch', 'binding_conflict', 'no_phones_on_record'])(
    'maps identity failure reason %s to motivo for the model',
    async (reason) => {
      const { registry, identity } = setup();
      (identity.resolve as jest.Mock).mockResolvedValue({ verified: false, reason });

      const result: any = await registry.dispatch('identify_customer', { document: 'x' }, CTX);

      expect(result.verified).toBe(false);
      expect(result.motivo).toBe(reason);
    },
  );

  it('every advertised tool is dispatchable (definitions ↔ dispatch stay in sync)', async () => {
    const { registry, erp, identity } = setup();
    erp.searchProducts.mockResolvedValue([]);
    erp.getStock.mockResolvedValue({ idItem: 0, disponivel: false, quantidade: 0 });
    erp.getPrice.mockResolvedValue({ idItem: 0, preco: 0, personalizado: false });
    erp.getOrdersByCustomer.mockResolvedValue([]);
    (identity.resolve as jest.Mock).mockResolvedValue({ verified: false, reason: 'not_found' });
    (identity.getBinding as jest.Mock).mockResolvedValue(null);

    for (const def of registry.definitions()) {
      await expect(
        registry.dispatch(def.function.name, {}, CTX),
      ).resolves.toBeDefined();
    }
  });
});
