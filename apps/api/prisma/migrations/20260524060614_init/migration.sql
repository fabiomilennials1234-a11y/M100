-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('nova', 'atendida_ia', 'na_fila', 'atendida_humano', 'encerrada');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('ai', 'agent', 'queue', 'none');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location', 'contact');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('customer', 'ai', 'agent', 'system');

-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('admin', 'supervisor', 'attendant');

-- CreateEnum
CREATE TYPE "AgentAvailability" AS ENUM ('online', 'away', 'offline');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "external_phone" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'nova',
    "owner_type" "OwnerType" NOT NULL DEFAULT 'none',
    "agent_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "external_id" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "sender" "MessageSender" NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AgentRole" NOT NULL DEFAULT 'attendant',
    "availability" "AgentAvailability" NOT NULL DEFAULT 'offline',
    "max_concurrent" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_external_phone_idx" ON "conversations"("external_phone");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_agent_id_idx" ON "conversations"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_external_id_key" ON "messages"("external_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
