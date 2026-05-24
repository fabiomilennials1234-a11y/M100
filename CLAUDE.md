# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Motor100 — sistema de atendimento via WhatsApp com IA + agentes humanos. Monolito modular TypeScript/NestJS. Monorepo Turborepo. Escala-alvo: 5.000+ conversas/dia.

## Stack

- **Linguagem:** TypeScript
- **Backend:** NestJS (monolito modular)
- **Frontend:** React + Vite
- **Banco:** Supabase (Postgres managed)
- **ORM:** Prisma
- **Fila:** BullMQ (Redis)
- **WhatsApp:** UAZAPI (SaaS, webhook-based)
- **IA/LLM:** OpenRouter (multi-model)
- **Monorepo:** Turborepo
- **Deploy:** Railway ou EasyPanel (Hostinger VPS)

## Arquitetura

Monolito modular: deploy único, cada módulo NestJS com fronteira bem definida, extraível para microserviço via `@nestjs/microservices` sem reescrita. Comunicação entre módulos por injeção de dependência e eventos (`@nestjs/event-emitter`). Nunca importar diretamente de outro módulo sem passar pelo barrel export.

### Módulos NestJS (apps/api/src/)

| Módulo | Responsabilidade |
|--------|-----------------|
| `conversation` | Máquina de estados da conversa. Regra de ouro: toda conversa tem exatamente um dono por vez (IA, agente específico, ou "fila"). Lock otimista via campo `version` no Prisma. |
| `routing` | Fila de atendimento (BullMQ) e distribuição entre agentes. |
| `ai` | AI Orchestrator. OpenRouter SDK. Decide quando IA responde e quando faz handoff. Reage a eventos, não chama outros módulos. Retorna structured output `{ action: "respond" \| "handoff", reason, message? }`. |
| `channel` | Adapter UAZAPI. Interface `ChannelSender`/`ChannelReceiver` — trocável pra Cloud API oficial futuramente. |
| `integration` | Integration Hub — porta do ERP futuro. Interface-only por enquanto. |
| `agent` | Usuários/funcionários, permissões. |

### Máquina de estados da conversa

```
Nova → Atendida pela IA → (handoff) Na fila → Atendida por humano → Encerrada
```

Transições válidas (mapa explícito no código + lock otimista no Postgres):
- `Nova → [AtendidaPelaIA]`
- `AtendidaPelaIA → [NaFila, Encerrada]`
- `NaFila → [AtendidaPorHumano]`
- `AtendidaPorHumano → [AtendidaPelaIA, Encerrada]`
- `Encerrada → [Nova]` (reabre se cliente responder)

Transições inválidas são rejeitadas explicitamente. Nenhuma mensagem processada sem checar dono atual.

Implementação híbrida:
1. Enum + `Record<State, State[]>` no código — validação rápida
2. `UPDATE WHERE version = X` no Postgres — lock otimista, garante consistência

### Fluxo de dados

```
WhatsApp/Cliente → UAZAPI (webhook) → NestJS Channel Module → Conversation Core → [Routing | AI Orchestrator | Agent Workspace] → Integration Hub → ERP (futuro)
```

## Estrutura de pastas

```
motor100/
├── apps/
│   ├── api/                  # NestJS
│   │   └── src/
│   │       ├── conversation/ # State machine, domain, service
│   │       ├── routing/      # Fila BullMQ e distribuição
│   │       ├── ai/           # OpenRouter, handoff logic
│   │       ├── channel/      # Adapter UAZAPI
│   │       ├── integration/  # Interface ERP futuro
│   │       └── agent/        # Usuários, permissões
│   └── web/                  # React + Vite
│       └── src/
├── packages/
│   └── shared/               # Types, enums, contratos compartilhados
├── turbo.json
├── docker-compose.yml        # Redis local (Supabase é cloud)
└── package.json
```

## Comandos

```bash
# Instalar dependências
npm install

# Dev (todos os apps)
npx turbo dev

# Dev (só backend)
npx turbo dev --filter=api

# Dev (só frontend)
npx turbo dev --filter=web

# Build
npx turbo build

# Testes
npx turbo test
npx turbo test --filter=api                         # só backend
npx jest --filter=api -- --testPathPattern=conversation  # módulo específico

# Lint
npx turbo lint

# Prisma
cd apps/api && npx prisma generate                  # gerar client
cd apps/api && npx prisma migrate dev               # criar migration
cd apps/api && npx prisma studio                    # visual DB browser

# Docker (Redis local)
docker compose up -d
```

## Princípios de código

- Módulos NestJS comunicam por DI (interfaces) e eventos (`EventEmitter2`). Nunca import cruzado direto.
- Cada conversa processada em ordem. Estado no Postgres via Prisma com lock otimista (`version` field).
- Types compartilhados entre frontend e backend vivem em `packages/shared`.
- Testes de integração contra Supabase/Postgres real — sem mock de banco.
- Fronteiras de módulo claras: cada `@Module()` exporta apenas o que outros módulos precisam.
- AI module usa interface `AIProvider` — OpenRouter hoje, trocável sem reescrever lógica.
- Channel module usa interface `ChannelAdapter` — UAZAPI hoje, trocável pra Cloud API.
