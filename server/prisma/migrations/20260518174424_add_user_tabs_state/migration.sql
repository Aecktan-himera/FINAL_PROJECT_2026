-- CreateTable
CREATE TABLE "user_tabs_state" (
    "user_id" UUID NOT NULL,
    "tabs" JSONB NOT NULL,
    "active_id" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tabs_state_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "user_tabs_state" ADD CONSTRAINT "user_tabs_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
