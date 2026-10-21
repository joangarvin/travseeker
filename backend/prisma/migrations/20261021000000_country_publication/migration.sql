CREATE TABLE IF NOT EXISTS "Country" ("code" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "preparationComplete" BOOLEAN NOT NULL DEFAULT false, "showOnWebsite" BOOLEAN NOT NULL DEFAULT false, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO "Country" ("code","name","preparationComplete","showOnWebsite","updatedAt") VALUES ('ES','España',true,true,CURRENT_TIMESTAMP),('PT','Portugal',false,false,CURRENT_TIMESTAMP),('FR','Francia',false,false,CURRENT_TIMESTAMP),('MA','Marruecos',false,false,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Destino' AND column_name='preparationComplete') THEN
 ALTER TABLE "Destino" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "Destino" SET "preparationComplete"=("editorialStatus" = 'published'), "showOnWebsite"=("editorialStatus" = 'published');
 END IF;
 END $$;
ALTER TABLE "Destino" ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'ES', ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT '';
 DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Destino_countryCode_fkey') THEN ALTER TABLE "Destino" ADD CONSTRAINT "Destino_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;
 CREATE INDEX IF NOT EXISTS "Destino_publication_idx" ON "Destino"("countryCode","region","preparationComplete","showOnWebsite");
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Municipio' AND column_name='preparationComplete') THEN
 ALTER TABLE "Municipio" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "Municipio" SET "preparationComplete"=("editorialStatus" = 'published'), "showOnWebsite"=("editorialStatus" = 'published');
 END IF;
 END $$;
ALTER TABLE "Municipio" ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'ES', ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT '';
 DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Municipio_countryCode_fkey') THEN ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;
 CREATE INDEX IF NOT EXISTS "Municipio_publication_idx" ON "Municipio"("countryCode","region","preparationComplete","showOnWebsite");
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Place' AND column_name='preparationComplete') THEN
 ALTER TABLE "Place" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "Place" SET "preparationComplete"=("editorialStatus" = 'published'), "showOnWebsite"=("editorialStatus" = 'published' AND "isActive" = true);
 END IF;
 END $$;
ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'ES', ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT '';
 DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Place_countryCode_fkey') THEN ALTER TABLE "Place" ADD CONSTRAINT "Place_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;
 CREATE INDEX IF NOT EXISTS "Place_publication_idx" ON "Place"("countryCode","region","preparationComplete","showOnWebsite");
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='EssentialItem' AND column_name='preparationComplete') THEN
 ALTER TABLE "EssentialItem" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "EssentialItem" SET "preparationComplete"=(true), "showOnWebsite"=(true);
 END IF;
 END $$;
ALTER TABLE "EssentialItem" ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'ES', ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT '';
 DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='EssentialItem_countryCode_fkey') THEN ALTER TABLE "EssentialItem" ADD CONSTRAINT "EssentialItem_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;
 CREATE INDEX IF NOT EXISTS "EssentialItem_publication_idx" ON "EssentialItem"("countryCode","region","preparationComplete","showOnWebsite");
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Experience' AND column_name='preparationComplete') THEN
 ALTER TABLE "Experience" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "Experience" SET "preparationComplete"=("isPublished" = true), "showOnWebsite"=("isPublished" = true);
 END IF;
 END $$;
ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'ES', ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT '';
 DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Experience_countryCode_fkey') THEN ALTER TABLE "Experience" ADD CONSTRAINT "Experience_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;
 CREATE INDEX IF NOT EXISTS "Experience_publication_idx" ON "Experience"("countryCode","region","preparationComplete","showOnWebsite");
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Hotel' AND column_name='preparationComplete') THEN
 ALTER TABLE "Hotel" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "Hotel" SET "preparationComplete"=("isPublished" = true), "showOnWebsite"=("isPublished" = true);
 END IF;
 END $$;
ALTER TABLE "Hotel" ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'ES', ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT '';
 DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Hotel_countryCode_fkey') THEN ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;
 CREATE INDEX IF NOT EXISTS "Hotel_publication_idx" ON "Hotel"("countryCode","region","preparationComplete","showOnWebsite");
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Restaurant' AND column_name='preparationComplete') THEN
 ALTER TABLE "Restaurant" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "Restaurant" SET "preparationComplete"=("isPublished" = true), "showOnWebsite"=("isPublished" = true);
 END IF;
 END $$;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT 'ES', ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT '';
 DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Restaurant_countryCode_fkey') THEN ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE; END IF; END $$;
 CREATE INDEX IF NOT EXISTS "Restaurant_publication_idx" ON "Restaurant"("countryCode","region","preparationComplete","showOnWebsite");
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Activity' AND column_name='preparationComplete') THEN
 ALTER TABLE "Activity" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "Activity" SET "preparationComplete"=("editorialStatus" = 'published'), "showOnWebsite"=("editorialStatus" = 'published' AND "isActive" = true);
 END IF;
 END $$;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='TourismType' AND column_name='preparationComplete') THEN
 ALTER TABLE "TourismType" ADD COLUMN "preparationComplete" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
 UPDATE "TourismType" SET "preparationComplete"=("editorialStatus" = 'published'), "showOnWebsite"=("editorialStatus" = 'published' AND "isActive" = true);
 END IF;
 END $$;
