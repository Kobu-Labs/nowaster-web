-- CreateTable
CREATE TABLE "ScheduledEntity" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "categoryName" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ScheduledEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordedEntity" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "RecordedEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagToSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagToSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("name")
);

-- AddForeignKey
ALTER TABLE "ScheduledEntity" ADD CONSTRAINT "ScheduledEntity_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "Category"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagToSession" ADD CONSTRAINT "TagToSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScheduledEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagToSession" ADD CONSTRAINT "TagToSession_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
