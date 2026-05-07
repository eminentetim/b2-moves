-- AlterTable
ALTER TABLE "Position" ADD COLUMN "nonce" TEXT;
ALTER TABLE "Position" ADD COLUMN "signature" TEXT;
ALTER TABLE "Position" ADD COLUMN "timestamp" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DcaOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromToken" TEXT NOT NULL,
    "toToken" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "nextExecutionAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "signature" TEXT,
    "timestamp" INTEGER,
    "nonce" TEXT,
    "slippage" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DcaOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DcaOrder" ("amount", "createdAt", "frequency", "fromToken", "id", "nextExecutionAt", "status", "toToken", "updatedAt", "userId") SELECT "amount", "createdAt", "frequency", "fromToken", "id", "nextExecutionAt", "status", "toToken", "updatedAt", "userId" FROM "DcaOrder";
DROP TABLE "DcaOrder";
ALTER TABLE "new_DcaOrder" RENAME TO "DcaOrder";
CREATE TABLE "new_LimitOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "inputToken" TEXT NOT NULL,
    "outputToken" TEXT NOT NULL,
    "amountIn" REAL NOT NULL,
    "triggerPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "signature" TEXT,
    "timestamp" INTEGER,
    "nonce" TEXT,
    "slippage" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LimitOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LimitOrder" ("amountIn", "createdAt", "id", "inputToken", "outputToken", "status", "triggerPrice", "updatedAt", "userId") SELECT "amountIn", "createdAt", "id", "inputToken", "outputToken", "status", "triggerPrice", "updatedAt", "userId" FROM "LimitOrder";
DROP TABLE "LimitOrder";
ALTER TABLE "new_LimitOrder" RENAME TO "LimitOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
