/*
  Warnings:

  - You are about to drop the column `category` on the `ScheduledEntity` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `ScheduledEntity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduledEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "ScheduledEntity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ScheduledEntity" ("description", "endTime", "id", "startTime") SELECT "description", "endTime", "id", "startTime" FROM "ScheduledEntity";
DROP TABLE "ScheduledEntity";
ALTER TABLE "new_ScheduledEntity" RENAME TO "ScheduledEntity";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
