/*
  Warnings:

  - Changed the type of `withdrawId` on the `Withdraw` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Withdraw" DROP COLUMN "withdrawId",
ADD COLUMN     "withdrawId" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Withdraw_withdrawId_key" ON "Withdraw"("withdrawId");
