-- Fase 7 #43 — vínculo verificado telefone → Cliente Flex
CREATE TABLE "identity_bindings" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cd_cliente" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "identity_bindings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "identity_bindings_phone_key" ON "identity_bindings"("phone");
