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
