/**
 * Tool registry contract consumed by the AI tool-calling loop. Decouples the
 * AI module from any concrete ERP tooling implementation (DI via token), so the
 * AI never imports a concrete class across module boundaries.
 */

/** Per-conversation context passed to every tool dispatch. */
export interface ToolContext {
  cdFilial: number;
  /** WhatsApp phone of the customer — used for identity binding/lookup. */
  phone: string;
}

/** OpenRouter-shaped function tool definition. */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

export interface ToolRegistry {
  /** Tool schemas offered to the model. */
  definitions(): ToolDefinition[];
  /** Executes a tool by name, returning a narrow result (never raw ERP JSON). */
  dispatch(
    name: string,
    args: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<unknown>;
}
