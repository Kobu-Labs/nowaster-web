/*
  Warnings:

  - You are about to drop the column `userId` on the `ScheduledEntity` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `RecordedEntity` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduledEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT
);
INSERT INTO "new_ScheduledEntity" ("category", "description", "endTime", "id", "startTime") SELECT "category", "description", "endTime", "id", "startTime" FROM "ScheduledEntity";
DROP TABLE "ScheduledEntity";
ALTER TABLE "new_ScheduledEntity" RENAME TO "ScheduledEntity";
CREATE TABLE "new_RecordedEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT
);
INSERT INTO "new_RecordedEntity" ("category", "description", "id", "startTime") SELECT "category", "description", "id", "startTime" FROM "RecordedEntity";
DROP TABLE "RecordedEntity";
ALTER TABLE "new_RecordedEntity" RENAME TO "RecordedEntity";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
