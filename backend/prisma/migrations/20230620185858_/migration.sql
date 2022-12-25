/*
  Warnings:

  - You are about to drop the `GroupInvites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GroupInvites";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "GroupInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    CONSTRAINT "GroupInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
