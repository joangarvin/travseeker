CREATE TYPE "ReviewStatus" AS ENUM ('published', 'hidden');

ALTER TABLE "Review"
  ADD COLUMN "visitMonth" INTEGER,
  ADD COLUMN "travelParty" TEXT,
  ADD COLUMN "crowdRating" INTEGER,
  ADD COLUMN "valueRating" INTEGER,
  ADD COLUMN "accessRating" INTEGER,
  ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN "adminResponse" TEXT,
  ADD COLUMN "respondedAt" TIMESTAMP(3);

CREATE INDEX "Review_destinoId_status_idx" ON "Review"("destinoId", "status");
