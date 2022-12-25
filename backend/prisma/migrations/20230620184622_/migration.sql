-- CreateTable
CREATE TABLE "GroupInvites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    CONSTRAINT "GroupInvites_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "inviteOnly" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Group" ("creatorId", "groupName", "id") SELECT "creatorId", "groupName", "id" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
