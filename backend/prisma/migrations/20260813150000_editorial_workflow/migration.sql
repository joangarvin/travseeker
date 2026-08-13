CREATE TYPE "EditorialStatus" AS ENUM ('draft', 'pending', 'published', 'archived');

ALTER TABLE "Destino"
  ADD COLUMN "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Activity"
  ADD COLUMN "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "TourismType"
  ADD COLUMN "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Municipio"
  ADD COLUMN "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Place"
  ADD COLUMN "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "reviewedById" TEXT;

-- Existing content remains visible. Prisma's schema default is pending for future rows;
-- the database defaults are switched only after the backfill-safe ALTER statements.
ALTER TABLE "Destino" ALTER COLUMN "editorialStatus" SET DEFAULT 'pending';
ALTER TABLE "Activity" ALTER COLUMN "editorialStatus" SET DEFAULT 'pending';
ALTER TABLE "TourismType" ALTER COLUMN "editorialStatus" SET DEFAULT 'pending';
ALTER TABLE "Municipio" ALTER COLUMN "editorialStatus" SET DEFAULT 'pending';
ALTER TABLE "Place" ALTER COLUMN "editorialStatus" SET DEFAULT 'pending';
ALTER TABLE "Activity" ALTER COLUMN "isActive" SET DEFAULT false;
ALTER TABLE "TourismType" ALTER COLUMN "isActive" SET DEFAULT false;
ALTER TABLE "Place" ALTER COLUMN "isActive" SET DEFAULT false;

CREATE INDEX "Destino_editorialStatus_updatedAt_idx" ON "Destino"("editorialStatus", "updatedAt");
CREATE INDEX "Destino_createdById_idx" ON "Destino"("createdById");
CREATE INDEX "Destino_reviewedById_idx" ON "Destino"("reviewedById");
CREATE INDEX "Activity_editorialStatus_sortOrder_name_idx" ON "Activity"("editorialStatus", "sortOrder", "name");
CREATE INDEX "Activity_createdById_idx" ON "Activity"("createdById");
CREATE INDEX "Activity_reviewedById_idx" ON "Activity"("reviewedById");
CREATE INDEX "TourismType_editorialStatus_sortOrder_name_idx" ON "TourismType"("editorialStatus", "sortOrder", "name");
CREATE INDEX "TourismType_createdById_idx" ON "TourismType"("createdById");
CREATE INDEX "TourismType_reviewedById_idx" ON "TourismType"("reviewedById");
CREATE INDEX "Municipio_editorialStatus_nombre_idx" ON "Municipio"("editorialStatus", "nombre");
CREATE INDEX "Municipio_createdById_idx" ON "Municipio"("createdById");
CREATE INDEX "Municipio_reviewedById_idx" ON "Municipio"("reviewedById");
CREATE INDEX "Place_editorialStatus_destinoId_sortOrder_idx" ON "Place"("editorialStatus", "destinoId", "sortOrder");
CREATE INDEX "Place_createdById_idx" ON "Place"("createdById");
CREATE INDEX "Place_reviewedById_idx" ON "Place"("reviewedById");

ALTER TABLE "Destino" ADD CONSTRAINT "Destino_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Destino" ADD CONSTRAINT "Destino_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TourismType" ADD CONSTRAINT "TourismType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TourismType" ADD CONSTRAINT "TourismType_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Place" ADD CONSTRAINT "Place_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Place" ADD CONSTRAINT "Place_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
