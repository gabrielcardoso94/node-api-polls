/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,pollId]` on the table `votes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "votes_sessionId_pollId_key" ON "votes"("sessionId", "pollId");
