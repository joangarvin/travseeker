-- Rebuild the enum instead of incrementally adding values. This makes the
-- hidden -> rejected conversion safe in the same transaction and leaves a
-- rerunnable migration when the enum is already in its final shape.
DO $$
DECLARE
  current_values text[];
BEGIN
  SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO current_values
  FROM pg_enum
  WHERE enumtypid = '"ReviewStatus"'::regtype;

  IF current_values IS DISTINCT FROM ARRAY['pending', 'published', 'rejected', 'flagged'] THEN
    ALTER TABLE "Review" ALTER COLUMN "status" DROP DEFAULT;

    DROP TYPE IF EXISTS "ReviewStatus_next";
    CREATE TYPE "ReviewStatus_next" AS ENUM ('pending', 'published', 'rejected', 'flagged');

    ALTER TABLE "Review"
      ALTER COLUMN "status" TYPE "ReviewStatus_next"
      USING (
        CASE "status"::text
          WHEN 'hidden' THEN 'rejected'
          ELSE "status"::text
        END
      )::"ReviewStatus_next";

    DROP TYPE "ReviewStatus";
    ALTER TYPE "ReviewStatus_next" RENAME TO "ReviewStatus";
  END IF;

  ALTER TABLE "Review" ALTER COLUMN "status" SET DEFAULT 'pending'::"ReviewStatus";
END $$;
