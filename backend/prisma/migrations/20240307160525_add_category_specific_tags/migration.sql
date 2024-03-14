-- CreateTable
CREATE TABLE "TagToCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryName" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "TagToCategory_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "Category" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TagToCategory_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
