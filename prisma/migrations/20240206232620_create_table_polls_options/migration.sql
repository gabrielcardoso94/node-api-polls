-- CreateTable
CREATE TABLE "polls-options" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,

    CONSTRAINT "polls-options_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "polls-options" ADD CONSTRAINT "polls-options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
