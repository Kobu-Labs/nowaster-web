/*
  Warnings:

  - You are about to drop the `Ban` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserFunction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserFunctionToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserToGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "User_username_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Ban";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Group";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GroupInvite";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserFunction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserFunctionToUser";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserToGroup";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecordedEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT
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
    "description" TEXT
);
INSERT INTO "new_ScheduledEntity" ("category", "description", "endTime", "id", "startTime", "userId") SELECT "category", "description", "endTime", "id", "startTime", "userId" FROM "ScheduledEntity";
DROP TABLE "ScheduledEntity";
ALTER TABLE "new_ScheduledEntity" RENAME TO "ScheduledEntity";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
