-- CreateEnum
CREATE TYPE "PinSection" AS ENUM ('MOOD', 'DECOR', 'OUTFIT', 'LAYOUT', 'FOOD', 'ENTERTAINMENT');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('VENUE', 'CATERING', 'PHOTOGRAPHY', 'DECORATIONS', 'ENTERTAINMENT', 'ATTIRE', 'INVITATIONS', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "ExpenseSource" AS ENUM ('MANUAL', 'ORDER');

-- CreateEnum
CREATE TYPE "GuestStatus" AS ENUM ('INVITED', 'CONFIRMED', 'DECLINED', 'PENDING', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "GuestCategory" AS ENUM ('FAMILY', 'FRIENDS', 'COLLEAGUES', 'VIP', 'KIDS');

-- CreateTable
CREATE TABLE "vision_boards" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "colorPalette" TEXT[],
    "styleKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vision_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vision_pins" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "section" "PinSection" NOT NULL,
    "imageUrl" TEXT,
    "caption" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vision_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_budgets" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "totalBudget" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_expenses" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "receiptNote" TEXT,
    "source" "ExpenseSource" NOT NULL DEFAULT 'MANUAL',
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_lists" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "guestListId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "GuestStatus" NOT NULL DEFAULT 'PENDING',
    "category" "GuestCategory" NOT NULL DEFAULT 'FRIENDS',
    "tableNumber" TEXT,
    "mealPreference" TEXT,
    "dietaryRestrictions" TEXT,
    "plusOnes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "rsvpToken" TEXT,
    "invitationSentAt" TIMESTAMP(3),
    "rsvpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vision_boards_eventId_key" ON "vision_boards"("eventId");

-- CreateIndex
CREATE INDEX "vision_pins_boardId_idx" ON "vision_pins"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "event_budgets_eventId_key" ON "event_budgets"("eventId");

-- CreateIndex
CREATE INDEX "budget_expenses_budgetId_idx" ON "budget_expenses"("budgetId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_lists_eventId_key" ON "guest_lists"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "guests_rsvpToken_key" ON "guests"("rsvpToken");

-- CreateIndex
CREATE INDEX "guests_guestListId_idx" ON "guests"("guestListId");

-- AddForeignKey
ALTER TABLE "vision_boards" ADD CONSTRAINT "vision_boards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vision_pins" ADD CONSTRAINT "vision_pins_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "vision_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_budgets" ADD CONSTRAINT "event_budgets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_expenses" ADD CONSTRAINT "budget_expenses_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "event_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_lists" ADD CONSTRAINT "guest_lists_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_guestListId_fkey" FOREIGN KEY ("guestListId") REFERENCES "guest_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
