-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecordedEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "groupId" TEXT,
    CONSTRAINT "RecordedEntity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecordedEntity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RecordedEntity" ("category", "description", "id", "startTime", "userId") SELECT "category", "description", "id", "startTime", "userId" FROM "RecordedEntity";
DROP TABLE "RecordedEntity";
ALTER TABLE "new_RecordedEntity" RENAME TO "RecordedEntity";
CREATE TABLE "new_ScheduledEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "groupId" TEXT,
    CONSTRAINT "ScheduledEntity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduledEntity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ScheduledEntity" ("category", "description", "endTime", "id", "startTime", "userId") SELECT "category", "description", "endTime", "id", "startTime", "userId" FROM "ScheduledEntity";
DROP TABLE "ScheduledEntity";
ALTER TABLE "new_ScheduledEntity" RENAME TO "ScheduledEntity";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
