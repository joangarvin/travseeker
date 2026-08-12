ALTER TABLE "Collection"
ADD COLUMN "travelerCount" INTEGER NOT NULL DEFAULT 2;

ALTER TABLE "Collection"
ADD CONSTRAINT "Collection_travelerCount_check" CHECK ("travelerCount" BETWEEN 1 AND 50);
