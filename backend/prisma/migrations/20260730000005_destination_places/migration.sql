CREATE TABLE "Place" (
  "id" TEXT NOT NULL,
  "destinoId" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "descripcion" TEXT,
  "latitud" DOUBLE PRECISION NOT NULL,
  "longitud" DOUBLE PRECISION NOT NULL,
  "website" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Place_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Place_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Destino"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Place_destinoId_isActive_sortOrder_idx" ON "Place"("destinoId", "isActive", "sortOrder");
