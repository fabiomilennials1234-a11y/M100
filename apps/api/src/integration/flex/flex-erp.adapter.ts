import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CustomerSummary,
  ErpQueryPort,
  OrderSummary,
  ProductSummary,
  StockInfo,
} from '@motor100/shared';
import axios from 'axios';
import { FlexAuthSession } from './flex-auth-session';

/**
 * HTTP adapter over the Flex Smart ERP REST API. ALL Flex idiosyncrasies live
 * here and nowhere else: exact (case-sensitive) endpoint paths and params,
 * per-endpoint date formats, the 2-hop product search (Detalhada → getByIds),
 * and the rule that getAll is never used on the hot path.
 *
 * ⚠️ VERIFY before go-live (#51): the auth header is sent as `authToken`
 * (per the doc body text), but the doc is inconsistent (`AuthToken` elsewhere)
 * and the API is case-sensitive. Confirm against the real Flex server.
 */
@Injectable()
export class FlexErpAdapter implements ErpQueryPort {
  private readonly logger = new Logger(FlexErpAdapter.name);
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly auth: FlexAuthSession,
  ) {
    this.baseUrl = this.config.get<string>('FLEX_BASE_URL') ?? '';
  }

  async searchProducts(
    query: string,
    cdFilial: number,
  ): Promise<ProductSummary[]> {
    const ids = await this.searchProductIds(query);
    if (ids.length === 0) return [];
    return this.getProductsByIds(ids, cdFilial);
  }

  async getCustomerByDocument(cpfCnpj: string): Promise<CustomerSummary | null> {
    const params = new URLSearchParams({ cpfCnpj });
    const data = await this.authedGet(
      `${this.baseUrl}/Cliente/getByCpfCnpj?${params.toString()}`,
    );
    if (!data || typeof data !== 'object' || (data as any).cdCliente == null) {
      return null;
    }
    const c = data as any;
    const telefones = [c.fone, c.fone2, c.celular]
      .filter((t): t is string => typeof t === 'string' && t.trim() !== '');
    return {
      cdCliente: c.cdCliente,
      nome: c.nmCliente ?? '',
      telefones,
      vendedorId: c.cdVendedor ?? null,
    };
  }

  async getStock(idItem: number, cdFilial: number): Promise<StockInfo> {
    // NOTE: the param is `item` (not idItem) — Flex case/name gotcha.
    const params = new URLSearchParams({
      item: String(idItem),
      cdFilial: String(cdFilial),
    });
    const data = (await this.authedGet(
      `${this.baseUrl}/WmsEstoque/consultar?${params.toString()}`,
    )) as any;
    const quantidade = Number(data?.qtDisponivel ?? data?.qtAtual ?? 0) || 0;
    return { idItem, disponivel: quantidade > 0, quantidade };
  }

  async getOrdersByCustomer(cdCliente: number): Promise<OrderSummary[]> {
    // business sends emAberto=false; origem=E (external).
    const params = new URLSearchParams({
      cdCliente: String(cdCliente),
      emAberto: 'false',
      origem: 'E',
    });
    const data = await this.authedGet(
      `${this.baseUrl}/PedidoVenda/buscarPedidosVendaByCliente?${params.toString()}`,
    );
    const rows: any[] = Array.isArray(data) ? data : [];
    return rows.map((r) => ({
      nrPedido: r.nrPedido,
      situacao: r.nmSituacao ?? `Situação ${r.cdSituacao}`,
      emissao: r.dtEmissao ?? null,
      total: Number(r.vlTotal ?? 0) || 0,
    }));
  }

  /** Hop 1: free-text search → list of idItem. Vehicle/ficha flags must be true. */
  private async searchProductIds(query: string): Promise<number[]> {
    const params = new URLSearchParams({
      consulta: query,
      montadora: '0',
      modelo: '0',
      complemento: '0',
      injecao: '0',
      motor: '0',
      transmissao: '0',
      anoInicial: '0',
      anoFinal: '0',
      considerarInfVeiculo: 'true',
      considerarFichaTecnica: 'true',
    });
    const data = await this.authedGet(
      `${this.baseUrl}/Produto/Detalhada?${params.toString()}`,
    );
    return this.extractIds(data);
  }

  /** Hop 2: hydrate IDs → narrow product DTOs. ids is a repeated param, not CSV. */
  private async getProductsByIds(
    ids: number[],
    cdFilial: number,
  ): Promise<ProductSummary[]> {
    const query = [
      `cdFilial=${cdFilial}`,
      ...ids.map((id) => `ids=${id}`),
    ].join('&');
    const data = await this.authedGet(`${this.baseUrl}/Produto/getByIds?${query}`);
    const rows: any[] = Array.isArray(data) ? data : [];
    return rows.map((r) => ({
      idItem: r.idItem,
      codigo: r.cdItem,
      nome: r.nmItem,
      marca: r.nmMarca,
      temEstoque: Boolean(r.temEstoque),
      unidadeVenda: r.unMedvenda,
    }));
  }

  private extractIds(data: unknown): number[] {
    if (!Array.isArray(data)) {
      this.logger.warn(
        `Produto/Detalhada returned a non-array body (got ${typeof data}) — treating as no results`,
      );
      return [];
    }
    return data.filter((x): x is number => typeof x === 'number');
  }

  /**
   * GET with the Flex auth header. On a 401, invalidates the session and
   * retries once with a fresh token (handles server-side token expiry).
   */
  private async authedGet(url: string): Promise<unknown> {
    try {
      const { data } = await axios.get(url, {
        headers: { authToken: await this.auth.getToken() },
      });
      return data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        this.auth.invalidate();
        const { data } = await axios.get(url, {
          headers: { authToken: await this.auth.getToken() },
        });
        return data;
      }
      throw error;
    }
  }
}
