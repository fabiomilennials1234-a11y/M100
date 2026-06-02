# Motor100 — Domain Glossary

## Core Domain

- **Conversa** — Sessão de atendimento entre um cliente (via WhatsApp) e o sistema. Tem exatamente um dono por vez: IA, agente humano, ou fila. Vinculada a uma Instância de Canal específica.
- **Agente** — Funcionário da empresa que atende conversas. Tem role (admin, supervisor, attendant) e availability (online, away, offline). Attendant vê apenas conversas atribuídas a si.
- **Instância de Canal** — Número WhatsApp conectado ao sistema via UAZAPI. Possui credenciais próprias (token, URL), webhook dedicado, e status de conexão. Cada conversa pertence a exatamente uma instância.
- **Handoff** — Transição de uma conversa do domínio da IA para fila humana. Acontece por decisão da IA ou por falha de guardrail. Operação síncrona no pipeline (não evento fire-and-forget).
- **Guardrail** — Camada de segurança com 4 níveis: sanitização de input (PII, injection), validação de output, interceptação de tool calls (blocklist/allowlist), e HITL (human-in-the-loop, fail-closed com timeout 30s).
- **Pipeline** — Fluxo síncrono de processamento de mensagem: sanitize → handleInbound → processAI → validateOutput → send (ou handoff → route).

## Channel Domain

- **UAZAPI** — Provedor SaaS de API WhatsApp usado como adapter de canal. Cada instância UAZAPI representa um número WhatsApp conectado.
- **Admin Token** — Token global UAZAPI com acesso a todas as instâncias do servidor. Armazenado no .env. Usado para criar/listar/gerenciar instâncias via API.
- **Instance Token** — Token específico de uma instância UAZAPI. Armazenado encriptado no banco. Usado para enviar/receber mensagens daquela instância.
- **Webhook** — Endpoint HTTP que UAZAPI chama quando recebe mensagem. Cada instância tem webhook dedicado: `POST /webhook/uazapi/:instanceId`.

## Ownership

- **OwnerType** — Enum que define quem detém uma conversa: `ai`, `agent`, `queue`, `none`.
- **Lock Otimista** — Mecanismo de concorrência via campo `version` no Postgres. `UPDATE WHERE version = X` garante que duas transições simultâneas não corrompam estado.

## Integration / ERP Domain

- **ERP Flex Smart (FlexWeb)** — Sistema de gestão externo (autopeças) que o Motor100 consulta em modo **read-only** durante o atendimento. A IA o consulta para responder sobre produtos, preços, estoque e pedidos. Escrita no ERP e consulta de crédito (Serasa) estão fora do alcance da IA.
- **Filial** — Unidade de negócio no ERP Flex. Toda consulta de produto, preço e estoque é vinculada a uma Filial. Cada Instância de Canal atende exatamente uma Filial.
- **Cliente Flex** — Cliente cadastrado no ERP, identificado por `cdCliente`. Distinto do contato de WhatsApp: o telefone é ligado a um Cliente Flex apenas após o cliente informar CPF/CNPJ **e** o telefone bater com o cadastro no Flex. Sem esse vínculo verificado, a IA só responde consultas genéricas (não expõe pedidos nem preço personalizado).
- **Vínculo de Identidade** — Associação verificada entre um telefone WhatsApp e um Cliente Flex, persistida no Motor100. Pré-requisito para consultas específicas do cliente (pedidos, preço com desconto).
- **Pedido de Venda** — Pedido do cliente no ERP, consultável por Cliente Flex. Possui uma Situação.
- **Situação do Pedido** — Estado de um Pedido de Venda (ex.: "Em digitação", "Aguardando estoque").
- **Vendedor** — Vendedor cadastrado no ERP, podendo estar vinculado a um Cliente Flex; o vínculo influencia o roteamento para atendimento humano.
