-- Fase 6 — Channel Instance Management
-- Hand-authored: backfill-safe (existing conversations linked to a default
-- instance before instance_id is made NOT NULL). Avoids Prisma's unsafe
-- "ADD COLUMN NOT NULL" which would fail on populated tables.

-- CreateTable
CREATE TABLE "channel_instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "instance_name" TEXT NOT NULL,
    "server_url" TEXT NOT NULL,
    "instance_token" TEXT NOT NULL,
    "webhook_secret" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_instances_instance_name_key" ON "channel_instances"("instance_name");

-- Seed default instance from legacy single-number config.
-- instance_token left empty: ChannelService still reads UAZAPI_TOKEN from env
-- until the Fase 6 ChannelService refactor populates it encrypted (CryptoService).
INSERT INTO "channel_instances" (
    "id", "name", "instance_name", "server_url",
    "instance_token", "webhook_secret", "status", "updated_at"
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default',
    'default',
    'https://milennialstech.uazapi.com/instance/gipp01',
    '',
    gen_random_uuid()::text,
    'disconnected',
    CURRENT_TIMESTAMP
);

-- AlterTable: add instance_id nullable, backfill, then enforce NOT NULL
ALTER TABLE "conversations" ADD COLUMN "instance_id" TEXT;

UPDATE "conversations"
   SET "instance_id" = '00000000-0000-0000-0000-000000000001'
 WHERE "instance_id" IS NULL;

ALTER TABLE "conversations" ALTER COLUMN "instance_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "conversations_instance_id_idx" ON "conversations"("instance_id");

-- AddForeignKey
ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_instance_id_fkey"
    FOREIGN KEY ("instance_id") REFERENCES "channel_instances"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
