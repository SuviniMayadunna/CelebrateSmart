-- CreateTable
CREATE TABLE "package_photos" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_photos_packageId_idx" ON "package_photos"("packageId");

-- AddForeignKey
ALTER TABLE "package_photos" ADD CONSTRAINT "package_photos_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
