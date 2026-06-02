import { Inject, Injectable } from '@nestjs/common';
import {
  ERP_QUERY_PORT,
  ErpQueryPort,
  ToolContext,
  ToolDefinition,
  ToolRegistry,
} from '@motor100/shared';
import { IdentityResolver } from './identity-resolver';

/**
 * Single source mapping the guardrail allowlist tool names to read-only ERP
 * queries. Owns the OpenRouter tool schemas and the dispatch → ports,
 * returning narrow DTOs (never raw Flex JSON, never internal ids to the model).
 */
@Injectable()
export class ErpToolRegistry implements ToolRegistry {
  constructor(
    @Inject(ERP_QUERY_PORT) private readonly erp: ErpQueryPort,
    private readonly identity: IdentityResolver,
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
      {
        type: 'function',
        function: {
          name: 'check_stock',
          description:
            'Verifica a disponibilidade e a quantidade em estoque de um produto pelo seu idItem (obtido antes via get_product_info). Use quando o cliente perguntar se há em estoque ou quanto tem.',
          parameters: {
            type: 'object',
            properties: {
              idItem: {
                type: 'number',
                description: 'Identificador do produto (idItem) retornado por get_product_info.',
              },
            },
            required: ['idItem'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_product_price',
          description:
            'Consulta o preço de um produto pelo idItem (obtido via get_product_info). Se o cliente já foi identificado nesta conversa (via identify_customer), o preço considera a tabela e o desconto dele (resolvidos internamente pelo telefone, não por parâmetro); caso contrário, retorna o preço de tabela.',
          parameters: {
            type: 'object',
            properties: {
              idItem: { type: 'number', description: 'idItem retornado por get_product_info.' },
            },
            required: ['idItem'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'check_order_status',
          description:
            'Consulta os pedidos do cliente e a situação de cada um. Requer que o cliente já tenha sido identificado (identify_customer). Use quando o cliente perguntar sobre o status/andamento de pedidos.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      },
      {
        type: 'function',
        function: {
          name: 'identify_customer',
          description:
            'Confirma a identidade do cliente pelo CPF ou CNPJ informado por ele. Necessário antes de consultar pedidos ou preço personalizado. Só vincula se o telefone bater com o cadastro.',
          parameters: {
            type: 'object',
            properties: {
              document: {
                type: 'string',
                description: 'CPF ou CNPJ informado pelo cliente (apenas dígitos ou formatado).',
              },
            },
            required: ['document'],
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
      case 'check_stock': {
        const stock = await this.erp.getStock(
          Number(args.idItem ?? 0),
          ctx.cdFilial,
        );
        return stock;
      }
      case 'get_product_price': {
        const binding = await this.identity.getBinding(ctx.phone);
        return this.erp.getPrice(
          Number(args.idItem ?? 0),
          ctx.cdFilial,
          binding?.cdCliente,
        );
      }
      case 'check_order_status': {
        const binding = await this.identity.getBinding(ctx.phone);
        if (!binding) {
          return { erro: 'cliente_nao_identificado' };
        }
        const pedidos = await this.erp.getOrdersByCustomer(binding.cdCliente);
        return { pedidos };
      }
      case 'identify_customer': {
        const result = await this.identity.resolve(
          ctx.phone,
          String(args.document ?? ''),
        );
        // Narrow, model-facing shape — never leak internal cdCliente.
        return {
          verified: result.verified,
          nome: result.nome,
          documento: result.maskedDocument,
          motivo: result.reason,
        };
      }
      default:
        throw new Error(`unmapped tool: ${name}`);
    }
  }
}
