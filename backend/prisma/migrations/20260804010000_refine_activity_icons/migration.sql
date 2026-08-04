UPDATE "Activity"
SET "icon" = CASE
    WHEN "name" = 'Geológico' THEN 'MountainSnow'
    WHEN "name" = 'Histórico' THEN 'Landmark'
    WHEN "name" = 'Nieve' THEN 'Snowflake'
    WHEN "name" IN (
        'Patrimonio Barroco',
        'Patrimonio Medieval',
        'Patrimonio Modernista'
    ) THEN 'Landmark'
    WHEN "name" = 'Submarinismo' THEN 'Fish'
    ELSE "icon"
END
WHERE "name" IN (
    'Geológico',
    'Histórico',
    'Nieve',
    'Patrimonio Barroco',
    'Patrimonio Medieval',
    'Patrimonio Modernista',
    'Submarinismo'
);
