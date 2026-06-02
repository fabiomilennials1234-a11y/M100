import { ErpQueryPort, ToolContext } from '@motor100/shared';
import { ErpToolRegistry } from './erp-tool-registry';
import { IdentityResolver } from './identity-resolver';

const CTX: ToolContext = { cdFilial: 1, phone: '+554999991234' };

function setup() {
  const erp = {
    searchProducts: jest.fn(),
  } as unknown as ErpQueryPort & { searchProducts: jest.Mock };
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
    expect(JSON.stringify(result)).not.toContain('8401'); // internal id never reaches the model
  });
});
