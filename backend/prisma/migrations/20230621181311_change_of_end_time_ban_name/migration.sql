/*
  Warnings:

  - You are about to drop the column `endOfBan` on the `Ban` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ban" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endTime" DATETIME,
    CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ban" ("id", "userId") SELECT "id", "userId" FROM "Ban";
DROP TABLE "Ban";
ALTER TABLE "new_Ban" RENAME TO "Ban";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
