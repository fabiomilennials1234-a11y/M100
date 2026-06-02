import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FlexErpAdapter } from './flex-erp.adapter';
import { FlexAuthSession } from './flex-auth-session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function setup() {
  const config = {
    get: (k: string) =>
      (({ FLEX_BASE_URL: 'http://flex.local:8080' }) as Record<string, string>)[k],
  } as unknown as ConfigService;
  const auth = { getToken: jest.fn().mockResolvedValue('TK'), invalidate: jest.fn() } as unknown as FlexAuthSession;
  const adapter = new FlexErpAdapter(config, auth);
  return { adapter, auth };
}

const getByIdsRows = [
  {
    idItem: 1111,
    cdItem: '1111TESTE',
    nmItem: 'JUNTA TAMPA VALVULA',
    nmMarca: 'MARCA1',
    temEstoque: true,
    unMedvenda: 'PC',
  },
  {
    idItem: 2222,
    cdItem: '2222TESTE',
    nmItem: 'RETENTOR',
    nmMarca: 'MARCA2',
    temEstoque: false,
    unMedvenda: 'UN',
  },
];

describe('FlexErpAdapter.searchProducts', () => {
  afterEach(() => jest.clearAllMocks());

  it('resolves a free-text search via Detalhada then hydrates the IDs via getByIds', async () => {
    const { adapter } = setup();
    mockedAxios.get
      .mockResolvedValueOnce({ data: [1111, 2222] }) // Detalhada → IDs
      .mockResolvedValueOnce({ data: getByIdsRows }); // getByIds → hydrated rows

    const result = await adapter.searchProducts('junta tampa', 1);

    // Hop 1: Detalhada with free text + mandatory vehicle/ficha flags true, authToken header
    const [detalhadaUrl, detalhadaCfg] = mockedAxios.get.mock.calls[0];
    expect(detalhadaUrl).toContain('/Produto/Detalhada');
    expect(detalhadaUrl).toContain('consulta=junta+tampa');
    expect(detalhadaUrl).toContain('considerarInfVeiculo=true');
    expect(detalhadaUrl).toContain('considerarFichaTecnica=true');
    expect(detalhadaCfg).toEqual({ headers: { authToken: 'TK' } });

    // Hop 2: getByIds with cdFilial + repeated ids params (not CSV)
    const getByIdsUrl = mockedAxios.get.mock.calls[1][0] as string;
    expect(getByIdsUrl).toContain('/Produto/getByIds');
    expect(getByIdsUrl).toContain('cdFilial=1');
    expect(getByIdsUrl).toContain('ids=1111');
    expect(getByIdsUrl).toContain('ids=2222');

    // Narrow DTO mapping — never the raw Flex shape
    expect(result).toEqual([
      { idItem: 1111, codigo: '1111TESTE', nome: 'JUNTA TAMPA VALVULA', marca: 'MARCA1', temEstoque: true, unidadeVenda: 'PC' },
      { idItem: 2222, codigo: '2222TESTE', nome: 'RETENTOR', marca: 'MARCA2', temEstoque: false, unidadeVenda: 'UN' },
    ]);
  });

  it('returns empty without hitting getByIds when the search finds nothing', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    const result = await adapter.searchProducts('inexistente', 1);

    expect(result).toEqual([]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('invalidates the session and retries once on a 401', async () => {
    const { adapter, auth } = setup();
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      response: { status: 401 },
    });
    mockedAxios.get
      .mockRejectedValueOnce(unauthorized) // Detalhada → 401
      .mockResolvedValueOnce({ data: [1111] }) // retry Detalhada
      .mockResolvedValueOnce({ data: [getByIdsRows[0]] }); // getByIds

    const result = await adapter.searchProducts('junta', 1);

    expect(auth.invalidate).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it('retries a 401 on the second hop (getByIds), not just the search', async () => {
    const { adapter, auth } = setup();
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      response: { status: 401 },
    });
    mockedAxios.get
      .mockResolvedValueOnce({ data: [1111] }) // Detalhada ok
      .mockRejectedValueOnce(unauthorized) // getByIds → 401
      .mockResolvedValueOnce({ data: [getByIdsRows[0]] }); // retry getByIds ok

    const result = await adapter.searchProducts('junta', 1);

    expect(auth.invalidate).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].idItem).toBe(1111);
  });

  it('propagates the error when a 401 persists after retry', async () => {
    const { adapter } = setup();
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      response: { status: 401 },
    });
    mockedAxios.get.mockRejectedValue(unauthorized); // every call 401

    await expect(adapter.searchProducts('junta', 1)).rejects.toThrow('Unauthorized');
  });

  it('treats a non-array search body as no results (defensive)', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: { unexpected: 'shape' } });

    const result = await adapter.searchProducts('junta', 1);

    expect(result).toEqual([]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});

describe('FlexErpAdapter.getCustomerByDocument', () => {
  afterEach(() => jest.clearAllMocks());

  it('looks up a customer by CPF/CNPJ and maps a narrow DTO with cadastro phones', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        cdCliente: 8401,
        nmCliente: 'Fulano de Tal',
        fone: '49 3333-0000',
        fone2: '49 9 9999-1234',
        cdVendedor: 109,
      },
    });

    const customer = await adapter.getCustomerByDocument('07100189918');

    const [url, cfg] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/Cliente/getByCpfCnpj');
    expect(url).toContain('cpfCnpj=07100189918');
    expect(cfg).toEqual({ headers: { authToken: 'TK' } });
    expect(customer).toEqual({
      cdCliente: 8401,
      nome: 'Fulano de Tal',
      telefones: ['49 3333-0000', '49 9 9999-1234'],
      vendedorId: 109,
    });
  });

  it('returns null when there is no cadastro for the document', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: '' });

    expect(await adapter.getCustomerByDocument('00000000000')).toBeNull();
  });

  it('maps a missing vendedor to null', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({
      data: { cdCliente: 1, nmCliente: 'Sem Vendedor', fone: '49 3000-0000' },
    });

    const customer = await adapter.getCustomerByDocument('11111111111');
    expect(customer?.vendedorId).toBeNull();
    expect(customer?.telefones).toEqual(['49 3000-0000']);
  });
});

describe('FlexErpAdapter.getStock', () => {
  afterEach(() => jest.clearAllMocks());

  it('queries WmsEstoque with the item param (not idItem) and the Filial', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: { qtDisponivel: 5, qtAtual: 7 } });

    const stock = await adapter.getStock(106, 2);

    const [url, cfg] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/WmsEstoque/consultar');
    expect(url).toContain('item=106');
    expect(url).toContain('cdFilial=2');
    expect(cfg).toEqual({ headers: { authToken: 'TK' } });
    expect(stock).toEqual({ idItem: 106, disponivel: true, quantidade: 5 });
  });

  it('reports unavailable when quantity is zero', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: { qtDisponivel: 0 } });

    const stock = await adapter.getStock(106, 1);
    expect(stock).toEqual({ idItem: 106, disponivel: false, quantidade: 0 });
  });

  it('defaults to zero/unavailable when the body lacks quantity fields', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    const stock = await adapter.getStock(106, 1);
    expect(stock).toEqual({ idItem: 106, disponivel: false, quantidade: 0 });
  });

  it('falls back to qtAtual when qtDisponivel is absent', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: { qtAtual: 5 } });

    expect(await adapter.getStock(106, 1)).toEqual({ idItem: 106, disponivel: true, quantidade: 5 });
  });

  it('prefers qtDisponivel over qtAtual (zero disponível wins)', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: { qtDisponivel: 0, qtAtual: 7 } });

    expect(await adapter.getStock(106, 1)).toEqual({ idItem: 106, disponivel: false, quantidade: 0 });
  });
});

describe('FlexErpAdapter.getOrdersByCustomer', () => {
  afterEach(() => jest.clearAllMocks());

  it('lists a customer orders with readable status, mapped to a narrow DTO', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { nrPedido: 95, cdSituacao: 20, nmSituacao: 'EM DIGITACAO', dtEmissao: '2021-12-22 00:00:00.0', vlTotal: 246.92 },
        { nrPedido: 6896, cdSituacao: 13, nmSituacao: 'AGUARDANDO ESTOQUE', dtEmissao: '2021-12-22 00:00:00.0', vlTotal: 67.11 },
      ],
    });

    const orders = await adapter.getOrdersByCustomer(1448);

    const [url, cfg] = mockedAxios.get.mock.calls[0];
    expect(url).toContain('/PedidoVenda/buscarPedidosVendaByCliente');
    expect(url).toContain('cdCliente=1448');
    expect(url).toContain('emAberto=false');
    expect(url).toContain('origem=E');
    expect(cfg).toEqual({ headers: { authToken: 'TK' } });
    expect(orders).toEqual([
      { nrPedido: 95, situacao: 'EM DIGITACAO', emissao: '2021-12-22 00:00:00.0', total: 246.92 },
      { nrPedido: 6896, situacao: 'AGUARDANDO ESTOQUE', emissao: '2021-12-22 00:00:00.0', total: 67.11 },
    ]);
  });

  it('falls back to the situation code when nmSituacao is absent', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ nrPedido: 1, cdSituacao: 14, dtEmissao: null, vlTotal: 10 }],
    });

    const orders = await adapter.getOrdersByCustomer(1);
    expect(orders[0].situacao).toBe('Situação 14');
    expect(orders[0].emissao).toBeNull();
  });

  it('does not render "undefined" when both situation fields are missing', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: [{ nrPedido: 1, vlTotal: 10 }] });

    const orders = await adapter.getOrdersByCustomer(1);
    expect(orders[0].situacao).toBe('Situação desconhecida');
    expect(orders[0].situacao).not.toContain('undefined');
  });

  it.each([
    [246.92, 246.92],
    ['246.92', 246.92],
    ['', 0],
    [null, 0],
    [undefined, 0],
    ['abc', 0],
  ])('coerces vlTotal %j to the number %j', async (input, expected) => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ nrPedido: 1, nmSituacao: 'OK', dtEmissao: null, vlTotal: input }],
    });

    const orders = await adapter.getOrdersByCustomer(1);
    expect(orders[0].total).toBe(expected);
  });

  it('returns empty for a non-array body (defensive)', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: '' });

    expect(await adapter.getOrdersByCustomer(1)).toEqual([]);
  });
});

describe('FlexErpAdapter.getPrice', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the generic table price when no customer is given', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: [{ cdTabelaPreco: 1, preco: 141.96 }] });

    const price = await adapter.getPrice(691171, 1);

    const url = mockedAxios.get.mock.calls[0][0] as string;
    expect(url).toContain('/PrecoProduto/getPrecoItem');
    expect(url).toContain('idItem=691171');
    expect(url).toContain('filial=1');
    expect(url).not.toContain('cdCliente=');
    // data sent as MM/DD/YYYY (Flex gotcha) — URL-encoded slashes
    expect(decodeURIComponent(url)).toMatch(/data=\d{2}\/\d{2}\/\d{4}/);
    expect(price).toEqual({ idItem: 691171, preco: 141.96, personalizado: false });
  });

  it('applies the customer discount policy when cdCliente is given', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: [{ cdTabelaPreco: 5, preco: 25.0 }] });

    const price = await adapter.getPrice(691171, 1, 40491);

    const url = mockedAxios.get.mock.calls[0][0] as string;
    expect(url).toContain('cdCliente=40491');
    expect(price).toEqual({ idItem: 691171, preco: 25.0, personalizado: true });
  });

  it('defaults price to zero on an empty/non-array body', async () => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    expect(await adapter.getPrice(1, 1)).toEqual({ idItem: 1, preco: 0, personalizado: false });
  });

  it.each([
    [25.0, 25.0],
    ['25.00', 25.0],
    [null, 0],
    ['xx', 0],
  ])('coerces preco %j to number %j', async (input, expected) => {
    const { adapter } = setup();
    mockedAxios.get.mockResolvedValueOnce({ data: [{ preco: input }] });

    expect((await adapter.getPrice(1, 1)).preco).toBe(expected);
  });
});
