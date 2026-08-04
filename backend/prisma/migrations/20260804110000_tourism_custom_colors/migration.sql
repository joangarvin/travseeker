ALTER TABLE "TourismType"
ADD COLUMN "colorValue" TEXT NOT NULL DEFAULT '#5f6470';

UPDATE "TourismType"
SET "colorValue" = CASE "colorKey"
    WHEN 'cultural' THEN '#3047f2'
    WHEN 'naturaleza' THEN '#256628'
    WHEN 'playa' THEN '#006b63'
    WHEN 'rural' THEN '#6d4c41'
    WHEN 'montana' THEN '#4b4db0'
    WHEN 'patrimonial' THEN '#8c1046'
    ELSE '#5f6470'
END;
