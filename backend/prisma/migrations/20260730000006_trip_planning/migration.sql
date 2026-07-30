-- Turn collaborative collections into lightweight trip itineraries.
ALTER TABLE "Collection"
ADD COLUMN "startDate" DATE,
ADD COLUMN "endDate" DATE;

ALTER TABLE "CollectionItem"
ADD COLUMN "dayIndex" INTEGER,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'idea',
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Collection"
ADD CONSTRAINT "Collection_date_range_check"
CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "CollectionItem"
ADD CONSTRAINT "CollectionItem_day_index_check"
CHECK ("dayIndex" IS NULL OR ("dayIndex" >= 1 AND "dayIndex" <= 365));

ALTER TABLE "CollectionItem"
ADD CONSTRAINT "CollectionItem_status_check"
CHECK ("status" IN ('idea', 'confirmed', 'booked'));

CREATE INDEX "CollectionItem_collectionId_sortOrder_idx"
ON "CollectionItem"("collectionId", "sortOrder");
