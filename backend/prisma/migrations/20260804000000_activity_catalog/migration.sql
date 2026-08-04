CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Compass',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DestinoActivity" (
    "destinoId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,

    CONSTRAINT "DestinoActivity_pkey" PRIMARY KEY ("destinoId", "activityId")
);

CREATE UNIQUE INDEX "Activity_name_key" ON "Activity"("name");
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");
CREATE INDEX "Activity_isActive_sortOrder_name_idx" ON "Activity"("isActive", "sortOrder", "name");
CREATE INDEX "DestinoActivity_activityId_idx" ON "DestinoActivity"("activityId");

ALTER TABLE "DestinoActivity"
ADD CONSTRAINT "DestinoActivity_destinoId_fkey"
FOREIGN KEY ("destinoId") REFERENCES "Destino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DestinoActivity"
ADD CONSTRAINT "DestinoActivity_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH existing_values AS (
    SELECT DISTINCT trim(value) AS name
    FROM "Destino" destination
    CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE
            WHEN left(trim(destination."tipoTurismoSecundario"), 1) = '['
                THEN destination."tipoTurismoSecundario"::jsonb
            WHEN trim(destination."tipoTurismoSecundario") = ''
                THEN '[]'::jsonb
            ELSE to_jsonb(string_to_array(destination."tipoTurismoSecundario", ','))
        END
    ) AS value
    WHERE trim(value) <> ''
), catalog AS (
    SELECT
        name,
        trim(both '-' from regexp_replace(
            lower(translate(name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
            '[^a-z0-9]+', '-', 'g'
        )) AS slug,
        CASE name
            WHEN 'Aventura' THEN 'Compass'
            WHEN 'Observación de fauna' THEN 'Binoculars'
            WHEN 'Observación astronómica' THEN 'Telescope'
            WHEN 'Deportes acuáticos' THEN 'Waves'
            WHEN 'Gastronomía' THEN 'Utensils'
            WHEN 'Senderismo' THEN 'Footprints'
            WHEN 'Ocio' THEN 'PartyPopper'
            WHEN 'Relax y bienestar' THEN 'HeartPulse'
            ELSE 'Compass'
        END AS icon
    FROM existing_values
)
INSERT INTO "Activity" ("id", "name", "slug", "icon", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT
    md5(name)::uuid::text,
    name,
    CASE WHEN slug = '' THEN 'actividad-' || substr(md5(name), 1, 8) ELSE slug END,
    icon,
    0,
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
            WHEN left(trim(destination."tipoTurismoSecundario"), 1) = '['
                THEN destination."tipoTurismoSecundario"::jsonb
            WHEN trim(destination."tipoTurismoSecundario") = ''
                THEN '[]'::jsonb
            ELSE to_jsonb(string_to_array(destination."tipoTurismoSecundario", ','))
        END
    ) AS value
    WHERE trim(value) <> ''
)
INSERT INTO "DestinoActivity" ("destinoId", "activityId")
SELECT values."destinoId", activity."id"
FROM destination_values values
JOIN "Activity" activity ON lower(activity."name") = lower(values.name)
ON CONFLICT DO NOTHING;
