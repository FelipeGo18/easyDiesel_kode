-- CreateTable
CREATE TABLE "session_tokens" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_tokens_token_hash_key" ON "session_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "session_tokens_usuario_id_expires_at_idx" ON "session_tokens"("usuario_id", "expires_at");

-- CreateIndex
CREATE INDEX "session_tokens_revoked_at_idx" ON "session_tokens"("revoked_at");

-- AddForeignKey
ALTER TABLE "session_tokens" ADD CONSTRAINT "session_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;