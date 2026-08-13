CREATE TABLE "ClimateCache" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "coordinateFingerprint" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "monthlySummary" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClimateCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClimateCache_destinationId_key" ON "ClimateCache"("destinationId");
CREATE INDEX "ClimateCache_expiresAt_idx" ON "ClimateCache"("expiresAt");

ALTER TABLE "ClimateCache"
ADD CONSTRAINT "ClimateCache_destinationId_fkey"
FOREIGN KEY ("destinationId") REFERENCES "Destino"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
