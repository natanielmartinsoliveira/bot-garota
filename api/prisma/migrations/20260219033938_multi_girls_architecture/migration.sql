-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('FACT', 'EMOTION', 'PREFERENCE', 'RELATION');

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "girlId" TEXT NOT NULL,
    "girlClientId" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "content" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);
