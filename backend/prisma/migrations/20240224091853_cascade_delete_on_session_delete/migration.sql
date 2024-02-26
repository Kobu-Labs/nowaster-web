-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TagToSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "TagToSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScheduledEntity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TagToSession_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TagToSession" ("id", "sessionId", "tagId") SELECT "id", "sessionId", "tagId" FROM "TagToSession";
DROP TABLE "TagToSession";
ALTER TABLE "new_TagToSession" RENAME TO "TagToSession";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
