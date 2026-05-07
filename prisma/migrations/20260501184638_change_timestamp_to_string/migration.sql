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
    "timestamp" TEXT,
    "nonce" TEXT,
    "slippage" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DcaOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DcaOrder" ("amount", "createdAt", "frequency", "fromToken", "id", "nextExecutionAt", "nonce", "signature", "slippage", "status", "timestamp", "toToken", "updatedAt", "userId") SELECT "amount", "createdAt", "frequency", "fromToken", "id", "nextExecutionAt", "nonce", "signature", "slippage", "status", "timestamp", "toToken", "updatedAt", "userId" FROM "DcaOrder";
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
    "timestamp" TEXT,
    "nonce" TEXT,
    "slippage" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LimitOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LimitOrder" ("amountIn", "createdAt", "id", "inputToken", "nonce", "outputToken", "signature", "slippage", "status", "timestamp", "triggerPrice", "updatedAt", "userId") SELECT "amountIn", "createdAt", "id", "inputToken", "nonce", "outputToken", "signature", "slippage", "status", "timestamp", "triggerPrice", "updatedAt", "userId" FROM "LimitOrder";
DROP TABLE "LimitOrder";
ALTER TABLE "new_LimitOrder" RENAME TO "LimitOrder";
CREATE TABLE "new_Position" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "entryPrice" REAL NOT NULL,
    "takeProfitPrice" REAL,
    "stopLossPrice" REAL,
    "signature" TEXT,
    "timestamp" TEXT,
    "nonce" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Position" ("amount", "createdAt", "entryPrice", "id", "nonce", "signature", "status", "stopLossPrice", "takeProfitPrice", "timestamp", "tokenMint", "updatedAt", "userId") SELECT "amount", "createdAt", "entryPrice", "id", "nonce", "signature", "status", "stopLossPrice", "takeProfitPrice", "timestamp", "tokenMint", "updatedAt", "userId" FROM "Position";
DROP TABLE "Position";
ALTER TABLE "new_Position" RENAME TO "Position";
CREATE UNIQUE INDEX "Position_userId_tokenMint_key" ON "Position"("userId", "tokenMint");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
