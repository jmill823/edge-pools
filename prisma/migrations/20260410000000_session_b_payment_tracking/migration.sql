-- Session B: Payment tracking + Guest player support

-- Create GuestPlayer table
CREATE TABLE "GuestPlayer" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestPlayer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestPlayer_poolId_email_key" ON "GuestPlayer"("poolId", "email");
ALTER TABLE "GuestPlayer" ADD CONSTRAINT "GuestPlayer_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Make Entry.userId nullable and add guestPlayerId
ALTER TABLE "Entry" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Entry" ADD COLUMN "guestPlayerId" TEXT;
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_guestPlayerId_fkey" FOREIGN KEY ("guestPlayerId") REFERENCES "GuestPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add payment tracking to entries
ALTER TABLE "Entry" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid';

-- Add entry fee and payment info to pools
ALTER TABLE "Pool" ADD COLUMN "entryFee" TEXT;
ALTER TABLE "Pool" ADD COLUMN "paymentInfo" TEXT;
