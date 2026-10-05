-- Additive migration: existing Spanish content remains unchanged.
ALTER TABLE "Destino" ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Municipio" ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Place" ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Activity" ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "TourismType" ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "EssentialGroup" ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "EssentialItem" ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}';
