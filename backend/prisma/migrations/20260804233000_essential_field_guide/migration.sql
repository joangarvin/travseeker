ALTER TABLE "EssentialGroup"
ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'Compass';

ALTER TABLE "EssentialItem"
ADD COLUMN "icon" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "imageAlt" TEXT,
ADD COLUMN "duration" TEXT,
ADD COLUMN "bestTime" TEXT,
ADD COLUMN "reservationRequired" BOOLEAN,
ADD COLUMN "officialUrl" TEXT;

-- Give migrated themes a useful initial symbol without changing their copy.
UPDATE "EssentialGroup"
SET "icon" = CASE
  WHEN lower("title") LIKE ANY (ARRAY['%cultur%', '%histor%', '%patrimon%']) THEN 'Landmark'
  WHEN lower("title") LIKE ANY (ARRAY['%natur%', '%parque%', '%bosque%']) THEN 'Trees'
  WHEN lower("title") LIKE ANY (ARRAY['%mar%', '%playa%', '%costa%']) THEN 'Waves'
  WHEN lower("title") LIKE ANY (ARRAY['%sender%', '%ruta%', '%camino%']) THEN 'Footprints'
  WHEN lower("title") LIKE ANY (ARRAY['%gastronom%', '%comer%', '%sabores%']) THEN 'Utensils'
  WHEN lower("title") LIKE ANY (ARRAY['%monta%', '%mirador%', '%cumbre%']) THEN 'Mountain'
  WHEN lower("title") LIKE ANY (ARRAY['%arte%', '%museo%']) THEN 'Palette'
  ELSE 'Compass'
END;
