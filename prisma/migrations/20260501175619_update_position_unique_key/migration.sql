/*
  Warnings:

  - A unique constraint covering the columns `[userId,tokenMint]` on the table `Position` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Position_tokenMint_key";

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_tokenMint_key" ON "Position"("userId", "tokenMint");
