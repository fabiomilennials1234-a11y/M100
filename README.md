# Motor100

Sistema de atendimento via WhatsApp com IA + agentes humanos. Monolito modular TypeScript/NestJS.

## Regra de ouro

**Toda conversa tem exatamente um dono por vez** — IA, um agente específico, ou "fila". Nenhuma mensagem é processada sem checar o dono atual. Lock otimista (campo `version`) previne corrida de concorrência.

## Máquina de estados

```
Nova → Atendida pela IA → Na fila → Atendida por humano → Encerrada
                ↑                                    │
                └────────── devolve à IA ────────────┘
                                                     │
Encerrada ──→ Nova (reabre se cliente responder)     │
         ←── IA ou humano resolve ───────────────────┘
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS (TypeScript) |
| Frontend | React + Vite |
| Banco | Supabase (PostgreSQL managed) |
| ORM | Prisma |
| Fila | BullMQ (Redis) |
| WhatsApp | UAZAPI (SaaS) |
| IA/LLM | OpenRouter (multi-model) |
| Monorepo | Turborepo |

## Estrutura

```
apps/api/     — NestJS backend (conversation, routing, ai, channel, integration, agent)
apps/web/     — React frontend (Agent Workspace)
packages/shared/ — Types e enums compartilhados
```

## Setup

```bash
# Pré-requisitos: Node 20+, Docker

# 1. Instalar dependências
npm install

# 2. Subir Redis local
docker compose up -d

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais Supabase

# 4. Gerar Prisma client e rodar migrations
cd apps/api
npx prisma generate
npx prisma migrate dev
cd ../..

# 5. Rodar em dev
npx turbo dev
```

API roda em `http://localhost:3000`, frontend em `http://localhost:5173`.

## Módulos

| Módulo | Status | Descrição |
|--------|--------|-----------|
| `conversation` | Implementado | State machine, service, lock otimista |
| `routing` | Stub | Distribuição BullMQ entre agentes |
| `ai` | Stub | OpenRouter, handoff logic |
| `channel` | Stub | Adapter UAZAPI |
| `integration` | Stub | Porta do ERP futuro |
| `agent` | Implementado | CRUD agentes, disponibilidade |
