CREATE TYPE "CollectionRole" AS ENUM ('editor', 'viewer');

CREATE TABLE "CollectionMember" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "CollectionRole" NOT NULL DEFAULT 'viewer',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CollectionMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CollectionMember_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CollectionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CollectionMember_collectionId_userId_key" ON "CollectionMember"("collectionId", "userId");
CREATE INDEX "CollectionMember_userId_idx" ON "CollectionMember"("userId");
