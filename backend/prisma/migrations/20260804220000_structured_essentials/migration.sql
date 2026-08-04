-- Preserve Destino.imprescindibles as a compatibility fallback while the
-- application moves to ordered, editable groups and items.
CREATE TABLE "EssentialGroup" (
    "id" TEXT NOT NULL,
    "destinoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssentialGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EssentialItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "placeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssentialItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EssentialGroup_destinoId_sortOrder_idx"
ON "EssentialGroup"("destinoId", "sortOrder");

CREATE INDEX "EssentialItem_groupId_sortOrder_idx"
ON "EssentialItem"("groupId", "sortOrder");

CREATE INDEX "EssentialItem_placeId_idx" ON "EssentialItem"("placeId");

ALTER TABLE "EssentialGroup"
ADD CONSTRAINT "EssentialGroup_destinoId_fkey"
FOREIGN KEY ("destinoId") REFERENCES "Destino"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EssentialItem"
ADD CONSTRAINT "EssentialItem_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "EssentialGroup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EssentialItem"
ADD CONSTRAINT "EssentialItem_placeId_fkey"
FOREIGN KEY ("placeId") REFERENCES "Place"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
