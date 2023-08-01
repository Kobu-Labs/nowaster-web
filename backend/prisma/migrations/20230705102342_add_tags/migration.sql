-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TagToSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "TagToSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScheduledEntity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TagToSession_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
