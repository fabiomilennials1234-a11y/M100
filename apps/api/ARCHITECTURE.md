
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          MOTOR100 — ARQUITETURA FASE 5                              ║
║                     Monolito Modular · Ports & Adapters · NestJS                    ║
╚══════════════════════════════════════════════════════════════════════════════════════╝


                          ┌──────────────────────┐
                          │   WhatsApp (UAZAPI)   │
                          │    webhook + REST      │
                          └──────────┬─────────────┘
                                     │ HTTP POST
                                     ▼
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  CHANNEL MODULE                                                                     ║
║  ┌─────────────────────┐    ┌──────────────────┐    ┌──────────────────────┐        ║
║  │  ChannelController   │───▶│  DebounceService  │───▶│ emit DEBOUNCE_FLUSHED│        ║
║  │  (webhook receiver)  │    │  (2s window)      │    └──────────┬─────────┘        ║
║  └─────────────────────┘    └──────────────────┘               │                   ║
║  ┌─────────────────────┐    ┌──────────────────┐               │                   ║
║  │  RateLimitGuard      │    │  ChannelService   │◀─────────────┼────── (send)      ║
║  │  (Redis counter)     │    │  implements       │               │                   ║
║  └─────────────────────┘    │  ChannelSender    │               │                   ║
║                              └──────────────────┘               │                   ║
╚══════════════════════════════════════════════════════════════════╪═══════════════════╝
                                                                   │ event
                                                                   ▼
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  ROUTING MODULE                              PIPELINE (síncrono)                    ║
║                                                                                     ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  MessageProcessorService  (@OnEvent DEBOUNCE_FLUSHED)                        │   ║
║  │                                                                              │   ║
║  │  ┌───────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────────┐        │   ║
║  │  │ sanitize   │──▶│ handleInbound │──▶│ AI decide  │──▶│ validate     │        │   ║
║  │  │ Input      │   │ Message      │   │            │   │ Output       │        │   ║
║  │  │(guardrail) │   │(conversation)│   │(aiService) │   │(guardrail)   │        │   ║
║  │  └───────────┘   └──────────────┘   └─────┬──────┘   └──────┬───────┘        │   ║
║  │                                            │                  │                │   ║
║  │                                    ┌───────┴───────┐   ┌─────┴──────┐        │   ║
║  │                                    │               │   │            │        │   ║
║  │                              ┌─────▼─────┐  ┌──────▼───▼──┐  ┌─────▼─────┐  │   ║
║  │                              │  respond   │  │   handoff    │  │  blocked   │  │   ║
║  │                              │            │  │              │  │ (guardrail)│  │   ║
║  │                              │ channel    │  │ requestHand  │  │ → handoff  │  │   ║
║  │                              │  .send()   │  │  off()       │  │  path      │  │   ║
║  │                              └───────────┘  │ routing      │  └───────────┘  │   ║
║  │                                              │  .assign()   │                 │   ║
║  │                                              │ [assignAgent]│                 │   ║
║  │                                              └──────────────┘                 │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                     ║
║  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐                ║
║  │  RoutingService   │   │  MessageWorker    │   │ DeadLetterProc   │                ║
║  │  implements       │   │  (BullMQ consumer)│   │ (failed jobs)    │                ║
║  │  RoutingPort      │   └──────────────────┘   └──────────────────┘                ║
║  │                   │                                                              ║
║  │  least-busy algo  │   DI Tokens: ROUTING_PORT ──▶ RoutingService                 ║
║  │  maxConcurrent    │              AGENT_PORT   ──▶ AgentService                   ║
║  └──────────────────┘                                                              ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
          │                        │                           │
          │ inject                 │ inject                    │ inject
          ▼                        ▼                           ▼
╔═══════════════════════╗ ╔═══════════════════════╗ ╔═══════════════════════╗
║  CONVERSATION MODULE  ║ ║     AI MODULE         ║ ║   GUARDRAIL MODULE   ║
║                       ║ ║                       ║ ║                       ║
║ ConversationService   ║ ║  AiService            ║ ║  GuardrailService     ║
║ (ConversationPort)    ║ ║  implements           ║ ║  implements           ║
║                       ║ ║  AIProvider            ║ ║  GuardrailPort        ║
║ • findOrCreate        ║ ║                       ║ ║                       ║
║ • transition (FSM)    ║ ║  • processMessage     ║ ║  • sanitizeInput      ║
║ • handleInbound       ║ ║  • generateResponse   ║ ║  • validateOutput     ║
║ • handleOutbound      ║ ║                       ║ ║  • interceptToolCall  ║
║ • requestHandoff      ║ ║  OpenRouter ──▶ LLM   ║ ║  • requestHumanApprv  ║
║ • assignAgent         ║ ║  structured output:   ║ ║                       ║
║ • returnToAi / close  ║ ║  {action, reason,     ║ ║  4 camadas:           ║
║ • findById/Many       ║ ║   message?}           ║ ║  input│output│tool│   ║
║ • getMessages         ║ ╚═══════════════════════╝ ║  human-in-loop       ║
║ • getMetrics          ║                           ╚═══════════════════════╝
║                       ║
║ Lock otimista:        ║
║ WHERE version = X     ║
║                       ║
║ FSM:                  ║
║ nova→ia→fila→         ║
║ humano→encerrada      ║
╚═══════════════════════╝
          │
          │ emits events
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN EVENTS (EventEmitter2)                    │
│                                                                         │
│  CONVERSATION_CREATED ──────────▶ (listeners)                           │
│  CONVERSATION_STATUS_CHANGED ──▶ (listeners)                           │
│  CONVERSATION_OWNER_CHANGED ───▶ owner ai→queue, queue→agent, etc     │
│  CONVERSATION_CLOSED ──────────▶ final summary trigger                 │
│  CONVERSATION_REOPENED ────────▶ encerrada→nova                        │
│  MESSAGE_RECEIVED ─────────────▶ (listeners)                           │
│  MESSAGE_SENT ─────────────────▶ outbound tracking                     │
│  HANDOFF_REQUESTED ────────────▶ conversation→na_fila                  │
│  HANDOFF_COMPLETED ────────────▶ routing assigned agent                │
│  AGENT_ASSIGNED ───────────────▶ agent took ownership                  │
│  AI_RESPONSE_GENERATED ────────▶ tracing / analytics                   │
│  DEBOUNCE_FLUSHED ─────────────▶ → MessageProcessor enqueues BullMQ   │
└─────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════╗ ╔═══════════════════════╗ ╔═══════════════════════╗
║   AGENT MODULE        ║ ║   SUMMARY MODULE      ║ ║   MEMORY MODULE       ║
║                       ║ ║                       ║ ║                       ║
║  AgentService         ║ ║  SummaryService       ║ ║  MemoryService        ║
║  (AgentPort)          ║ ║  implements           ║ ║  implements           ║
║                       ║ ║  SummaryPort          ║ ║  MemoryPort           ║
║  • findAvailable      ║ ║                       ║ ║                       ║
║  • setAvailability    ║ ║  • generateProgressive║ ║  • storeMemory        ║
║  • getActiveCnvCount  ║ ║  • generateFinal      ║ ║  • retrieveRelevant   ║
║  • findById           ║ ║                       ║ ║                       ║
╚═══════════════════════╝ ║  LLM via OpenRouter   ║ ║  pgvector embeddings  ║
                          ╚═══════════════════════╝ ╚═══════════════════════╝

╔═══════════════════════╗ ╔═══════════════════════╗ ╔═══════════════════════╗
║  INTEGRATION MODULE   ║ ║   MEDIA MODULE        ║ ║   TRACING MODULE      ║
║                       ║ ║                       ║ ║                       ║
║  IntegrationService   ║ ║  MediaService         ║ ║  TracingService       ║
║  implements           ║ ║  • validateSize       ║ ║  TracingProvider      ║
║  IntegrationProvider  ║ ║  • detectMime         ║ ║                       ║
║                       ║ ║  • generateUrl        ║ ║  NoopTracingProvider  ║
║  • syncContact (stub) ║ ║  • processAttachment  ║ ║  (production: real)   ║
║  • syncConversation   ║ ╚═══════════════════════╝ ╚═══════════════════════╝
║    (stub, ERP futuro) ║
╚═══════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════════════╗
║  API MODULE (Dashboard REST)                                                        ║
║                                                                                     ║
║  ApiController (@UseGuards SupabaseAuthGuard)                                       ║
║  ─────────────────────────────────────────────                                      ║
║  GET  /api/conversations          → conversationService.findMany(filter)            ║
║  GET  /api/conversations/:id      → conversationService.findById(id)                ║
║  GET  /api/conversations/:id/msgs → conversationService.getMessages(id, take, skip) ║
║  POST /api/conversations/:id/msgs → conversationService.handleOutboundMessage()     ║
║                                     + channelService.send()                         ║
║  POST /api/conversations/:id/assign    → conversationService.assignAgent()          ║
║  POST /api/conversations/:id/close     → conversationService.close()                ║
║  POST /api/conversations/:id/return    → conversationService.returnToAi()           ║
║  POST /api/conversations/:id/reassign  → (supervisor only) assignAgent()            ║
║  GET  /api/metrics                     → conversationService.getMetrics()           ║
║  PATCH /api/agents/me/status           → agentService.setAvailability()             ║
║                                                                                     ║
║  DTOs: SendMessageDto │ ReassignDto │ UpdateAvailabilityDto │ ConversationFilterDto  ║
║  Zero Prisma imports. Tudo via ConversationService/AgentService.                    ║
╚══════════════════════════════════════════════════════════════════════════════════════╝


                    ┌─────────────────────────────────────────┐
                    │         INFRAESTRUTURA EXTERNA           │
                    │                                         │
                    │  ┌───────────┐  ┌──────────────────┐   │
                    │  │  Supabase  │  │  Redis (BullMQ)   │   │
                    │  │  Postgres  │  │  rate-limit       │   │
                    │  │  + Prisma  │  │  job queue         │   │
                    │  │  + pgvec  │  │  debounce state    │   │
                    │  └───────────┘  └──────────────────┘   │
                    │                                         │
                    │  ┌───────────┐  ┌──────────────────┐   │
                    │  │ OpenRouter │  │  UAZAPI (WhatsApp)│   │
                    │  │ LLM API   │  │  webhook + REST   │   │
                    │  └───────────┘  └──────────────────┘   │
                    └─────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════════════╗
║  PORT CONTRACTS (9 ports, 30 métodos, 171 testes)                                   ║
║                                                                                     ║
║  ┌─────────────────┬──────────────────────┬────────────────────────┐                ║
║  │ Port            │ Implementation       │ Contract Enforcement   │                ║
║  ├─────────────────┼──────────────────────┼────────────────────────┤                ║
║  │ ConversationPort│ ConversationService  │ runtime (Prisma enum)  │                ║
║  │ AgentPort       │ AgentService         │ runtime (Prisma enum)  │                ║
║  │ MemoryPort      │ MemoryService        │ compile + runtime      │                ║
║  │ SummaryPort     │ SummaryService       │ compile + runtime      │                ║
║  │ RoutingPort     │ RoutingService       │ compile + runtime      │                ║
║  │ GuardrailPort   │ GuardrailService     │ compile + runtime      │                ║
║  │ AIProvider      │ AiService            │ compile + runtime      │                ║
║  │ ChannelSender   │ ChannelService       │ compile + runtime      │                ║
║  │ IntegrationProv │ IntegrationService   │ compile + runtime      │                ║
║  └─────────────────┴──────────────────────┴────────────────────────┘                ║
║                                                                                     ║
║  Barrel exports (index.ts) enforce module boundaries.                               ║
║  Modules communicate via DI (ports) + EventEmitter2 (async events).                 ║
║  Pipeline (sync): sanitize → inbound → AI → validate → send/handoff.               ║
║  No cross-module imports without barrel.                                            ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```
