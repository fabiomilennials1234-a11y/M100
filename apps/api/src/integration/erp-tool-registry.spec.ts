import { ErpQueryPort } from '@motor100/shared';
import { ErpToolRegistry } from './erp-tool-registry';

function setup() {
  const erp = {
    searchProducts: jest.fn(),
  } as unknown as ErpQueryPort & { searchProducts: jest.Mock };
  const registry = new ErpToolRegistry(erp);
  return { registry, erp };
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
      { cdFilial: 7 },
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
      registry.dispatch('definitely_not_a_tool', {}, { cdFilial: 1 }),
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

    await registry.dispatch('get_product_info', args as any, { cdFilial: 1 });

    expect(erp.searchProducts).toHaveBeenCalledWith(expected, 1);
  });
});
