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
});
