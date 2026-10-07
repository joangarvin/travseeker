ALTER TABLE "EssentialItem" ADD COLUMN IF NOT EXISTS "catalogActivityId" TEXT REFERENCES "Experience"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "EssentialItem_catalogActivityId_idx" ON "EssentialItem"("catalogActivityId");
ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "translations" JSONB NOT NULL DEFAULT '{}'::jsonb;
