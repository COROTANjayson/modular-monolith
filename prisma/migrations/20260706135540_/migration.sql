/*
  Warnings:

  - A unique constraint covering the columns `[previousJti]` on the table `UserSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "previousJti" TEXT,
ADD COLUMN     "previousJtiExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_previousJti_key" ON "UserSession"("previousJti");
