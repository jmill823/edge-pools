-- Session A: Scoring configuration + Transfer requests

-- Add scoring configuration columns to Pool
ALTER TABLE "Pool" ADD COLUMN "missedCutPenalty" TEXT NOT NULL DEFAULT '+8';
ALTER TABLE "Pool" ADD COLUMN "scoringMode" TEXT NOT NULL DEFAULT 'total';
ALTER TABLE "Pool" ADD COLUMN "bestX" INTEGER;
ALTER TABLE "Pool" ADD COLUMN "bestY" INTEGER;
ALTER TABLE "Pool" ADD COLUMN "tiebreaker" TEXT NOT NULL DEFAULT 'lowest_final_round';

-- Create TransferRequest table
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "poolType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileData" TEXT,
    "fileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);
