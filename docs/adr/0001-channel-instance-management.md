# ADR-0001: Channel Instance Management

## Status
Accepted

## Context
Motor100 hardcodes UAZAPI credentials (URL + token) in .env. This means changing the WhatsApp number requires a redeploy. The system needs to support connecting WhatsApp numbers dynamically via UI, and the schema should support multiple simultaneous instances even though initial use is single-number.

## Decision

1. **Single-tenant, multi-instance**: One deployment per company. Multiple WhatsApp numbers can be active simultaneously. Each Conversation belongs to exactly one instance (`instanceId` FK).

2. **Credentials in database**: Instance token stored encrypted in `channel_instances` table. Only `ENCRYPTION_KEY` stays in .env. Admin manages instances via UI without touching code.

3. **Webhook per instance**: Each instance registers a dedicated webhook at `POST /webhook/uazapi/:instanceId`. No ambiguity about which instance received a message.

4. **Full lifecycle via UAZAPI API**: Motor100 creates instances, fetches QR codes, registers webhooks, and monitors status — all through the UAZAPI API using the admin token. Admin never needs to open the UAZAPI panel.

5. **All instances active**: No "active/standby" toggle. Every connected instance receives and processes messages independently. Conversations are scoped to their originating instance.

## Consequences
- Conversation model gains `instanceId` (non-nullable FK)
- ChannelService resolves credentials from DB per-instance instead of .env
- Migration needed for existing conversations (assign to default instance)
- Webhook controller becomes parameterized (`:instanceId` in route)
- New Prisma model `ChannelInstance` with encrypted token field
- New UI settings page for admin to manage instances
