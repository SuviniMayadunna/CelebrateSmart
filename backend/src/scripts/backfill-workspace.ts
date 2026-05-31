/**
 * Backfill workspace records (VisionBoard, EventBudget + expenses, GuestList)
 * for existing paid events that were booked before the workspace feature was added.
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/backfill-workspace.ts
 */

import prisma from '../config/database';

const COLOR_THEME_HEX: Record<string, string> = {
  rose: '#FDA4AF', purple: '#C084FC', blue: '#60A5FA', gold: '#FBBF24',
  pink: '#F9A8D4', teal: '#2DD4BF', lavender: '#A78BFA', mint: '#86EFAC',
  coral: '#FCA5A5', amber: '#FCD34D',
};

const EVENT_TYPE_KEYWORDS: Record<string, string[]> = {
  WEDDING:     ['Romantic', 'Elegant', 'Timeless'],
  BIRTHDAY:    ['Festive', 'Fun', 'Vibrant'],
  PROPOSAL:    ['Intimate', 'Romantic', 'Dreamy'],
  BABY_SHOWER: ['Soft', 'Pastel', 'Whimsical'],
  KIDS_PARTY:  ['Colourful', 'Playful', 'Fun'],
};

const PRODUCT_TO_EXPENSE: Record<string, string> = {
  CAKES: 'CATERING', FOOD: 'CATERING', DECORATIONS: 'DECORATIONS',
  VENUE: 'VENUE', PHOTOGRAPHY: 'PHOTOGRAPHY', ENTERTAINMENT: 'ENTERTAINMENT',
  GIFTS: 'MISCELLANEOUS',
};

async function run() {
  console.log('🔍  Finding paid events without workspace records...\n');

  // Find all events that have at least one paid order
  const paidEvents = await prisma.event.findMany({
    where: {
      orders: {
        some: {
          status: { in: ['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
        },
      },
    },
    include: {
      visionBoard: true,
      budget:      true,
      guestList:   true,
      orders: {
        where: {
          status: { in: ['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
        },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  console.log(`Found ${paidEvents.length} paid event(s) total.\n`);

  let boardCreated    = 0;
  let budgetCreated   = 0;
  let guestCreated    = 0;

  for (const event of paidEvents) {
    const order = event.orders[0];
    console.log(`  Event: "${event.name}" (${event.id})`);

    // ── VisionBoard ────────────────────────────────────────────────────────
    if (!event.visionBoard) {
      const palette  = event.colorTheme && COLOR_THEME_HEX[event.colorTheme] ? [COLOR_THEME_HEX[event.colorTheme]] : [];
      const keywords = EVENT_TYPE_KEYWORDS[event.type] ?? [];
      await prisma.visionBoard.create({ data: { eventId: event.id, colorPalette: palette, styleKeywords: keywords } });
      boardCreated++;
      console.log(`    ✅  Created VisionBoard`);
    } else {
      console.log(`    ·   VisionBoard already exists`);
    }

    // ── EventBudget + expenses ─────────────────────────────────────────────
    if (!event.budget) {
      const budget = await prisma.eventBudget.create({ data: { eventId: event.id, totalBudget: 0 } });
      if (order && order.items.length > 0) {
        await prisma.budgetExpense.createMany({
          data: order.items.map(item => ({
            budgetId:    budget.id,
            category:    (PRODUCT_TO_EXPENSE[item.categoryName] ?? 'MISCELLANEOUS') as any,
            description: item.productName,
            amount:      Number(item.unitPrice) * item.quantity,
            paidAt:      new Date(),
            source:      'ORDER' as any,
            orderId:     order.id,
          })),
        });
        console.log(`    ✅  Created EventBudget with ${order.items.length} expense(s) from order`);
      } else {
        console.log(`    ✅  Created EventBudget (no order items to populate)`);
      }
      budgetCreated++;
    } else {
      console.log(`    ·   EventBudget already exists`);
    }

    // ── GuestList ──────────────────────────────────────────────────────────
    if (!event.guestList) {
      await prisma.guestList.create({ data: { eventId: event.id } });
      guestCreated++;
      console.log(`    ✅  Created GuestList`);
    } else {
      console.log(`    ·   GuestList already exists`);
    }

    console.log('');
  }

  console.log('─────────────────────────────────────');
  console.log(`Done.`);
  console.log(`  VisionBoards created : ${boardCreated}`);
  console.log(`  EventBudgets created : ${budgetCreated}`);
  console.log(`  GuestLists created   : ${guestCreated}`);
  console.log('─────────────────────────────────────');

  await prisma.$disconnect();
}

run().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
