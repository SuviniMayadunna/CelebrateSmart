-- CreateEnum
CREATE TYPE "PackageTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "guestCount" INTEGER,
ADD COLUMN     "packageId" TEXT;

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "tier" "PackageTier" NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_plans" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_plan_steps" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "weeksBefore" INTEGER NOT NULL,
    "timeOfDay" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_plan_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "packages_eventType_idx" ON "packages"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "packages_eventType_tier_key" ON "packages"("eventType", "tier");

-- CreateIndex
CREATE INDEX "package_items_packageId_idx" ON "package_items"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "event_plans_eventId_key" ON "event_plans"("eventId");

-- CreateIndex
CREATE INDEX "event_plan_steps_planId_idx" ON "event_plan_steps"("planId");

-- CreateIndex
CREATE INDEX "events_packageId_idx" ON "events"("packageId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_plans" ADD CONSTRAINT "event_plans_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_plan_steps" ADD CONSTRAINT "event_plan_steps_planId_fkey" FOREIGN KEY ("planId") REFERENCES "event_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
