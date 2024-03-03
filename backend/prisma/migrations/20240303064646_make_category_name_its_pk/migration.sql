/*
  Warnings:

  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `ScheduledEntity` table. All the data in the column will be lost.
  - Added the required column `categoryName` to the `ScheduledEntity` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "Category" (
    "name" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "Category" ("name") SELECT DISTINCT "category" from "ScheduledEntity";

CREATE TABLE "new_ScheduledEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "categoryName" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "ScheduledEntity_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "Category" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_ScheduledEntity" ("description", "endTime", "id", "startTime", "categoryName")   SELECT "ScheduledEntity"."description", "ScheduledEntity"."endTime", "ScheduledEntity"."id", "ScheduledEntity"."startTime", "Category"."name"
FROM "ScheduledEntity"
JOIN "Category" on "Category"."name" = "ScheduledEntity"."category";


DROP TABLE "ScheduledEntity";
ALTER TABLE "new_ScheduledEntity" RENAME TO "ScheduledEntity";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
