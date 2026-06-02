/**
 * Read-only contract over the Flex Smart ERP. Exposes ONLY safe consult
 * capabilities to the Motor100 (and to the AI via tool-calling). Returns narrow
 * DTOs owned by Motor100 — never the raw, unstable Flex JSON. Write operations
 * to the ERP live on a separate port by construction, so the AI can never write.
 */

/** Narrow product view returned to the AI/customer — not the raw Flex item. */
export interface ProductSummary {
  idItem: number;
  codigo: string;
  nome: string;
  marca: string;
  temEstoque: boolean;
  unidadeVenda: string;
}

/** Narrow customer view used for identity resolution — not the raw Flex client. */
export interface CustomerSummary {
  cdCliente: number;
  nome: string;
  /** Phones on the Flex cadastro (fone, fone2/celular), for phone-match verification. */
  telefones: string[];
  /** Vendedor vinculado, if any — influences human routing. */
  vendedorId: number | null;
}

export interface ErpQueryPort {
  /**
   * Free-text product search within a Filial. Resolves to a list of products.
   * @param query free-text query (e.g. "junta tampa válvula duratec")
   * @param cdFilial the Filial to search within (derived from the Channel Instance)
   */
  searchProducts(query: string, cdFilial: number): Promise<ProductSummary[]>;

  /**
   * Looks up a customer by CPF/CNPJ. Returns null when no cadastro exists.
   * Used to bind a WhatsApp phone to a Cliente Flex (with phone-match check).
   */
  getCustomerByDocument(cpfCnpj: string): Promise<CustomerSummary | null>;
}
