import { Inject, Injectable } from '@nestjs/common';
import { ERP_QUERY_PORT, ErpQueryPort } from '@motor100/shared';

/** Context resolved per conversation and passed to every tool dispatch. */
export interface ToolContext {
  cdFilial: number;
  // cdCliente arrives in a later slice (identity resolution).
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

/**
 * Single source mapping the guardrail allowlist tool names to read-only ERP
 * queries. Owns the OpenRouter tool schemas and the dispatch → ErpQueryPort,
 * returning narrow DTOs (never raw Flex JSON).
 */
@Injectable()
export class ErpToolRegistry {
  constructor(
    @Inject(ERP_QUERY_PORT) private readonly erp: ErpQueryPort,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'get_product_info',
          description:
            'Busca produtos no catálogo por texto livre (nome, código ou descrição da peça). Use quando o cliente perguntar se um produto existe ou pedir informações de um produto.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Texto livre da busca, ex.: "junta tampa válvula duratec".',
              },
            },
            required: ['query'],
          },
        },
      },
    ];
  }

  async dispatch(
    name: string,
    args: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<unknown> {
    switch (name) {
      case 'get_product_info': {
        const products = await this.erp.searchProducts(
          String(args.query ?? ''),
          ctx.cdFilial,
        );
        return { products };
      }
      default:
        throw new Error(`unmapped tool: ${name}`);
    }
  }
}
