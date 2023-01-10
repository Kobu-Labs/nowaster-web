-- CreateTable
CREATE TABLE "UserFunction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserFunctionToUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userFunctionId" TEXT NOT NULL,
    CONSTRAINT "UserFunctionToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserFunctionToUser_userFunctionId_fkey" FOREIGN KEY ("userFunctionId") REFERENCES "UserFunction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
