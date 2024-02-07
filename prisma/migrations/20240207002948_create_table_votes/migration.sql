-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pollOptionId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "polls-options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
