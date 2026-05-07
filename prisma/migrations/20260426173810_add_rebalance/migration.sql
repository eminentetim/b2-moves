-- CreateTable
CREATE TABLE "RebalanceIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetWeights" TEXT NOT NULL,
    "slippage" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "snapshotT0" TEXT,
    "snapshotT1" TEXT,
    "plan" TEXT,
    "messageId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RebalanceIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("telegramId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rebalanceIntentId" TEXT NOT NULL,
    "inputToken" TEXT NOT NULL,
    "outputToken" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "txId" TEXT,
    "outAmount" REAL,
    "delayMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradeChunk_rebalanceIntentId_fkey" FOREIGN KEY ("rebalanceIntentId") REFERENCES "RebalanceIntent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
