CREATE TABLE "AlertSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "month" INTEGER,
  "tipos" JSONB,
  "presupuesto" TEXT,
  "avoidCrowds" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AlertSubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AlertSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AlertSubscription_userId_isActive_idx" ON "AlertSubscription"("userId", "isActive");
