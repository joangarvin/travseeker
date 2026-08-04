CREATE TABLE "TourismType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'Compass',
    "colorKey" TEXT NOT NULL DEFAULT 'otro',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TourismType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DestinoTourismType" (
    "destinoId" TEXT NOT NULL,
    "tourismTypeId" TEXT NOT NULL,
    CONSTRAINT "DestinoTourismType_pkey" PRIMARY KEY ("destinoId", "tourismTypeId")
);

CREATE UNIQUE INDEX "TourismType_name_key" ON "TourismType"("name");
CREATE UNIQUE INDEX "TourismType_slug_key" ON "TourismType"("slug");
CREATE INDEX "TourismType_isActive_sortOrder_name_idx" ON "TourismType"("isActive", "sortOrder", "name");
CREATE INDEX "DestinoTourismType_tourismTypeId_idx" ON "DestinoTourismType"("tourismTypeId");

ALTER TABLE "DestinoTourismType" ADD CONSTRAINT "DestinoTourismType_destinoId_fkey"
FOREIGN KEY ("destinoId") REFERENCES "Destino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DestinoTourismType" ADD CONSTRAINT "DestinoTourismType_tourismTypeId_fkey"
FOREIGN KEY ("tourismTypeId") REFERENCES "TourismType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH defaults(name, description, icon, "colorKey", "sortOrder") AS (
    VALUES
        ('Cultural', 'Ideas, arte y vida local', 'Landmark', 'cultural', 10),
        ('Naturaleza', 'Paisajes con espacio para respirar', 'Leaf', 'naturaleza', 20),
        ('Sol y playa', 'Costa, luz y tiempo junto al mar', 'Waves', 'playa', 30),
        ('Rural', 'Pueblos, caminos y ritmo pausado', 'Wheat', 'rural', 40),
        ('Montaña', 'Altura, senderos y aire abierto', 'Mountain', 'montana', 50),
        ('Patrimonial', 'Historia que todavía se recorre', 'Castle', 'patrimonial', 60)
), existing_values AS (
    SELECT DISTINCT trim(value) AS name
    FROM "Destino" destination
    CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE
            WHEN left(trim(destination."tipoTurismoPrincipal"), 1) = '[' THEN destination."tipoTurismoPrincipal"::jsonb
            WHEN trim(destination."tipoTurismoPrincipal") = '' THEN '[]'::jsonb
            ELSE to_jsonb(string_to_array(destination."tipoTurismoPrincipal", ','))
        END
    ) AS value
    WHERE trim(value) <> ''
), catalog AS (
    SELECT name, description, icon, "colorKey", "sortOrder" FROM defaults
    UNION
    SELECT existing.name, '', 'Compass', 'otro', 100
    FROM existing_values existing
    WHERE NOT EXISTS (
        SELECT 1 FROM defaults WHERE lower(defaults.name) = lower(existing.name)
    )
)
INSERT INTO "TourismType" ("id", "name", "slug", "description", "icon", "colorKey", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT
    md5(name)::uuid::text,
    name,
    trim(both '-' from regexp_replace(lower(translate(name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '[^a-z0-9]+', '-', 'g')),
    description,
    icon,
    "colorKey",
    "sortOrder",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM catalog
ON CONFLICT ("name") DO NOTHING;

WITH destination_values AS (
    SELECT destination."id" AS "destinoId", trim(value) AS name
    FROM "Destino" destination
    CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE
            WHEN left(trim(destination."tipoTurismoPrincipal"), 1) = '[' THEN destination."tipoTurismoPrincipal"::jsonb
            WHEN trim(destination."tipoTurismoPrincipal") = '' THEN '[]'::jsonb
            ELSE to_jsonb(string_to_array(destination."tipoTurismoPrincipal", ','))
        END
    ) AS value
    WHERE trim(value) <> ''
)
INSERT INTO "DestinoTourismType" ("destinoId", "tourismTypeId")
SELECT values."destinoId", type."id"
FROM destination_values values
JOIN "TourismType" type ON lower(type."name") = lower(values.name)
ON CONFLICT DO NOTHING;
