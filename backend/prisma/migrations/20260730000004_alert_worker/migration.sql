ALTER TABLE "Destino" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AlertSubscription" ADD COLUMN "lastCheckedAt" TIMESTAMP(3), ADD COLUMN "lastNotifiedAt" TIMESTAMP(3);

CREATE TABLE "AlertDelivery" (
  "id" TEXT NOT NULL,
  "alertId" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AlertDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AlertDelivery_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "AlertSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AlertDelivery_alertId_fingerprint_key" ON "AlertDelivery"("alertId", "fingerprint");
CREATE INDEX "AlertDelivery_status_createdAt_idx" ON "AlertDelivery"("status", "createdAt");
