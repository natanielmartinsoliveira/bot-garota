-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('BASE', 'FLIRTY', 'HOT', 'ADULT');

-- AlterTable
ALTER TABLE "GirlClient" ADD COLUMN     "desireLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastHeat" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "GirlTemplate" (
    "id" TEXT NOT NULL,
    "girlId" TEXT,
    "type" "TemplateType" NOT NULL,
    "heatLevel" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GirlTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GirlTemplate" ADD CONSTRAINT "GirlTemplate_girlId_fkey" FOREIGN KEY ("girlId") REFERENCES "Girl"("id") ON DELETE SET NULL ON UPDATE CASCADE;
