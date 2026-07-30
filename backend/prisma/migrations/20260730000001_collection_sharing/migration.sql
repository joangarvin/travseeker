ALTER TABLE "Collection"
  ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS "shareToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Collection_shareToken_key" ON "Collection"("shareToken");
