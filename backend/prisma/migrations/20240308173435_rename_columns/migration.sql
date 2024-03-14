/*
  Warnings:

  - You are about to drop the `TagToCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TagToCategory";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TagToAllowedCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "TagToAllowedCategory_name_fkey" FOREIGN KEY ("name") REFERENCES "Category" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TagToAllowedCategory_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
