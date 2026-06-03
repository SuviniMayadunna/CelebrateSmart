import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import { TaskCategory } from '@prisma/client';
import { generateEventPlan, generatePackagePlan } from '../lib/event-plan-generator';
import stripe from '../lib/stripe';
import { sendMail } from '../lib/mailer';
import { orderConfirmationEmail, adminNewOrderEmail } from '../lib/email-templates';

const router = Router();

// Frontend task IDs → Prisma TaskCategory enum
const TASK_ID_TO_CATEGORY: Record<string, TaskCategory> = {
  cake:          TaskCategory.CAKE,
  decorations:   TaskCategory.DECORATIONS,
  food:          TaskCategory.FOOD,
  entertainment: TaskCategory.ENTERTAINMENT,
  photography:   TaskCategory.PHOTOGRAPHY,
  venue:         TaskCategory.VENUE,
  gifts:         TaskCategory.GIFTS,
};

const CATEGORY_TO_TASK_ID: Record<string, string> = {
  CAKE:          'cake',
  DECORATIONS:   'decorations',
  FOOD:          'food',
  ENTERTAINMENT: 'entertainment',
  PHOTOGRAPHY:   'photography',
  VENUE:         'venue',
  GIFTS:         'gifts',
};

const DEFAULT_TASKS: { title: string; category: TaskCategory }[] = [
  { title: 'Cake',            category: TaskCategory.CAKE          },
  { title: 'Decorations',     category: TaskCategory.DECORATIONS   },
  { title: 'Food & Drinks',   category: TaskCategory.FOOD          },
  { title: 'Entertainment',   category: TaskCategory.ENTERTAINMENT },
  { title: 'Photography',     category: TaskCategory.PHOTOGRAPHY   },
  { title: 'Venue',           category: TaskCategory.VENUE         },
];

function formatEvent(event: any) {
  const completedTasks = (event.tasks ?? [])
    .filter((t: any) => t.isCompleted)
    .map((t: any) => CATEGORY_TO_TASK_ID[t.category] ?? t.category.toLowerCase());

  const planSteps     = event.plan?.steps ?? [];
  const planStepsTotal = planSteps.length;
  const planStepsDone  = planSteps.filter((s: any) => s.isCompleted).length;

  return {
    id:             event.id,
    name:           event.name,
    type:           event.type,
    date:           event.date instanceof Date
                      ? event.date.toISOString().split('T')[0]
                      : String(event.date).split('T')[0],
    time:           event.time,
    venue:          event.venue,
    venueBooked:    event.venueBooked ?? undefined,
    guestCount:     event.guestCount ?? null,
    packageId:      event.packageId ?? null,
    notes:          event.notes ?? '',
    status:         event.status,
    completedTasks,
    planStepsTotal,
    planStepsDone,
    hasPaidOrder:           Array.isArray(event.orders) && event.orders.length > 0,
    paidOrderId:            Array.isArray(event.orders) && event.orders.length > 0 ? event.orders[0].id : null,
    orderTotalAmount:       Array.isArray(event.orders) && event.orders.length > 0 ? Number(event.orders[0].totalAmount) : null,
    orderOriginalGuestCount: Array.isArray(event.orders) && event.orders.length > 0 ? (event.orders[0].originalGuestCount ?? null) : null,
    colorTheme:             (event as any).colorTheme ?? null,
  };
}

function formatPlan(plan: any) {
  if (!plan) return null;
  return {
    id: plan.id,
    steps: (plan.steps ?? [])
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((s: any) => ({
        id:          s.id,
        weeksBefore: s.weeksBefore,
        timeOfDay:   s.timeOfDay,
        title:       s.title,
        description: s.description,
        category:    s.category,
        isCompleted: s.isCompleted,
        completedAt: s.completedAt,
        sortOrder:   s.sortOrder,
      })),
  };
}

const COLOR_THEME_HEX: Record<string, string> = {
  // short legacy keys
  rose: '#FDA4AF', purple: '#C084FC', blue: '#60A5FA', gold: '#FBBF24',
  pink: '#F9A8D4', teal: '#2DD4BF', lavender: '#A78BFA', mint: '#86EFAC',
  coral: '#FCA5A5', amber: '#FCD34D',
  // full-name keys used by the package-customizer colour picker
  'Blush Pink':     '#f9a8c0',
  'Lavender':       '#c4b5fd',
  'Royal Blue':     '#60a5fa',
  'Emerald':        '#34d399',
  'Champagne Gold': '#d4a847',
  'Coral Peach':    '#fb7185',
  'Rose Gold':      '#e8a598',
  'Sage White':     '#86efac',
  'Midnight Black': '#374151',
  'Sky Blue':       '#7dd3fc',
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

async function bootstrapWorkspace(
  eventId: string,
  colorTheme: string | null,
  eventType: string,
  orderId: string,
  orderItems: { productName: string; categoryName: string; unitPrice: any; quantity: number }[],
) {
  const [existingBoard, existingBudget, existingList] = await Promise.all([
    prisma.visionBoard.findUnique({ where: { eventId } }),
    prisma.eventBudget.findUnique({ where: { eventId } }),
    prisma.guestList.findUnique({ where: { eventId } }),
  ]);

  if (!existingBoard) {
    const palette = colorTheme && COLOR_THEME_HEX[colorTheme] ? [COLOR_THEME_HEX[colorTheme]] : [];
    const keywords = EVENT_TYPE_KEYWORDS[eventType] ?? [];
    await prisma.visionBoard.create({ data: { eventId, colorPalette: palette, styleKeywords: keywords } });
  }

  if (!existingBudget) {
    const budget = await prisma.eventBudget.create({ data: { eventId, totalBudget: 0 } });
    if (orderItems.length > 0) {
      await prisma.budgetExpense.createMany({
        data: orderItems.map(item => ({
          budgetId:    budget.id,
          category:    (PRODUCT_TO_EXPENSE[item.categoryName] ?? 'MISCELLANEOUS') as any,
          description: item.productName,
          amount:      Number(item.unitPrice) * item.quantity,
          paidAt:      new Date(),
          source:      'ORDER' as any,
          orderId,
        })),
      });
    }
  }

  if (!existingList) {
    await prisma.guestList.create({ data: { eventId } });
  }
}

const PLAN_INCLUDE = { steps: { orderBy: { sortOrder: 'asc' as const } } };

const PAID_ORDERS_INCLUDE = {
  orders: {
    where:  { status: { in: ['PAID','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'] as any[] } },
    select: { id: true, totalAmount: true, originalGuestCount: true } as any,
    take:   1,
  },
};

// POST /api/events/book-package — create event from a package, auto-add items to cart, generate plan
router.post(
  '/book-package',
  [
    body('packageId').notEmpty().withMessage('packageId is required'),
    body('name').trim().notEmpty().withMessage('Event name is required'),
    body('date').trim().notEmpty().withMessage('Date is required'),
    body('time').trim().notEmpty().withMessage('Time is required'),
    body('guestCount').isInt({ min: 1 }).withMessage('Guest count must be at least 1'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg });
      return;
    }

    const { packageId, name, date, time, guestCount, venue, notes, colorTheme, selectedProductIds } = req.body;

    try {
      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
        include: { items: { include: { product: true }, orderBy: { sortOrder: 'asc' } } },
      });
      if (!pkg || !pkg.isActive) {
        res.status(404).json({ success: false, message: 'Package not found' });
        return;
      }

      // Determine which items are selected (default = all core items)
      const selected: string[] = Array.isArray(selectedProductIds) && selectedProductIds.length > 0
        ? (selectedProductIds as string[])
        : pkg.items.filter(i => i.isCore).map(i => i.productId);

      const selectedItems = pkg.items.filter(i => selected.includes(i.productId));
      const categories: string[] = [...new Set(selectedItems.map(i => i.product.category as string))];

      // Resolve venue name
      const venueItem  = selectedItems.find(i => i.product.category === 'VENUE');
      const venueName  = venue?.trim() || venueItem?.product.venueAddress || venueItem?.product.name || 'To be determined';

      // Build tasks from package item categories
      const taskCategories = categories
        .map((cat: string) => {
          const map: Record<string, TaskCategory> = {
            CAKES: TaskCategory.CAKE, DECORATIONS: TaskCategory.DECORATIONS,
            FOOD: TaskCategory.FOOD, ENTERTAINMENT: TaskCategory.ENTERTAINMENT,
            PHOTOGRAPHY: TaskCategory.PHOTOGRAPHY, VENUE: TaskCategory.VENUE,
            GIFTS: TaskCategory.GIFTS,
          };
          return map[cat] ?? null;
        })
        .filter((c): c is TaskCategory => c !== null);

      const uniqueTaskCategories = [...new Set(taskCategories)];

      // Create event
      const event = await prisma.event.create({
        data: {
          userId:     req.user!.userId,
          packageId,
          name,
          type:       pkg.eventType,
          date:       new Date(date),
          time,
          venue:      venueName,
          guestCount:  Number(guestCount),
          notes:       notes?.trim() ?? '',
          colorTheme:  (colorTheme?.trim() || null) as any,
          status:      'PLANNING',
          tasks: {
            create: uniqueTaskCategories.map(category => ({
              title: category.charAt(0) + category.slice(1).toLowerCase(),
              category,
            })),
          },
        },
        include: { tasks: true },
      });

      // Auto-add selected items to cart (skip duplicates)
      for (const item of selectedItems) {
        await prisma.cartItem.upsert({
          where: { userId_productId_eventId: { userId: req.user!.userId, productId: item.productId, eventId: event.id } },
          update: { quantity: item.quantity },
          create: { userId: req.user!.userId, productId: item.productId, eventId: event.id, quantity: item.quantity },
        });
      }

      // Handle extra items (catalogue products added outside the package)
      const extraItemsRaw: { productId: string; quantity: number }[] =
        Array.isArray(req.body.extraItems) ? req.body.extraItems : [];
      const extraProducts = extraItemsRaw.length > 0
        ? await prisma.product.findMany({ where: { id: { in: extraItemsRaw.map(i => i.productId) }, isActive: true } })
        : [];
      const extraProductMap = new Map(extraProducts.map(p => [p.id, p]));

      for (const item of extraItemsRaw) {
        const product = extraProductMap.get(item.productId);
        if (!product) continue;
        await prisma.cartItem.upsert({
          where:  { userId_productId_eventId: { userId: req.user!.userId, productId: item.productId, eventId: event.id } },
          update: { quantity: item.quantity },
          create: { userId: req.user!.userId, productId: item.productId, eventId: event.id, quantity: item.quantity },
        });
      }

      // Calculate total with FOOD guest-count scaling + extra items
      const BASE_GUESTS: Record<string, number> = { BRONZE: 30, SILVER: 40, GOLD: 50 };
      const baseGuests = BASE_GUESTS[pkg.tier] ?? 30;
      const packageTotal = selectedItems.reduce((sum, item) => {
        const base = Number(item.product.price) * item.quantity;
        return sum + (item.product.category === 'FOOD' ? Math.round(base * (Number(guestCount) / baseGuests)) : base);
      }, 0);
      const extraTotal = extraItemsRaw.reduce((sum, item) => {
        const product = extraProductMap.get(item.productId);
        return sum + (product ? Number(product.price) * item.quantity : 0);
      }, 0);
      const totalAmount = packageTotal + extraTotal;

      // Create pending order
      const order = await (prisma.order.create as any)({
        data: {
          userId:             req.user!.userId,
          eventId:            event.id,
          totalAmount,
          originalGuestCount: Number(guestCount),
          status:             'PENDING_PAYMENT',
          paymentStatus:      'PENDING',
          items: {
            create: [
              ...selectedItems.map(item => ({
                productId:    item.productId,
                productName:  item.product.name,
                unitPrice:    item.product.category === 'FOOD'
                  ? Math.round(Number(item.product.price) * (Number(guestCount) / baseGuests))
                  : item.product.price,
                quantity:     item.quantity,
                categoryName: item.product.category,
              })),
              ...extraItemsRaw
                .filter(item => extraProductMap.has(item.productId))
                .map(item => {
                  const product = extraProductMap.get(item.productId)!;
                  return {
                    productId:    item.productId,
                    productName:  product.name,
                    unitPrice:    product.price,
                    quantity:     item.quantity,
                    categoryName: product.category as string,
                  };
                }),
            ],
          },
        },
      });

      // Create Stripe payment intent (requires STRIPE_SECRET_KEY to be set)
      let clientSecret: string | null = null;
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_YOUR_SECRET_KEY_HERE') {
        const paymentIntent = await stripe.paymentIntents.create({
          amount:                  Math.round(totalAmount * 100),
          currency:                'usd',
          automatic_payment_methods: { enabled: true },
          metadata:                { orderId: order.id, eventId: event.id, orderNumber: order.orderNumber },
        });
        await prisma.payment.upsert({
          where:  { orderId: order.id },
          create: { orderId: order.id, paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret!, amount: order.totalAmount, currency: order.currency },
          update: { paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret!, status: 'PENDING' },
        });
        clientSecret = paymentIntent.client_secret;
      }

      const fullEvent = await prisma.event.findUnique({
        where:   { id: event.id },
        include: { tasks: true },
      });

      res.status(201).json({
        success: true,
        data: {
          event:        formatEvent(fullEvent),
          order:        { id: order.id, orderNumber: order.orderNumber, totalAmount },
          clientSecret,
        },
      });
    } catch (err) {
      console.error('POST /events/book-package', err);
      res.status(500).json({ success: false, message: 'Failed to book package' });
    }
  }
);

// POST /api/events/:id/confirm-payment — mark order paid, generate plan
router.post(
  '/:id/confirm-payment',
  [
    param('id').isUUID().withMessage('Invalid event ID'),
    body('orderId').isUUID().withMessage('Invalid order ID'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg });
      return;
    }

    const { orderId } = req.body;

    try {
      const event = await prisma.event.findFirst({
        where:   { id: req.params.id, userId: req.user!.userId },
        include: { tasks: true },
      });
      if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

      const order = await prisma.order.findFirst({
        where: { id: orderId, eventId: event.id, userId: req.user!.userId },
      });
      if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

      if (!['PENDING_PAYMENT', 'PAID'].includes(order.status)) {
        res.status(400).json({ success: false, message: 'Order cannot be confirmed' });
        return;
      }

      // Mark order and payment record as paid
      await prisma.order.update({
        where: { id: order.id },
        data:  { status: 'PAID', paymentStatus: 'SUCCEEDED' },
      });
      await prisma.payment.updateMany({
        where: { orderId: order.id },
        data:  { status: 'SUCCEEDED', paidAt: new Date() },
      });

      // Send confirmation + admin alert emails
      const paidOrder = await prisma.order.findUnique({
        where:   { id: order.id },
        include: {
          items: true,
          user:  { select: { name: true, email: true } },
          event: { select: { name: true } },
        },
      });
      if (paidOrder?.user?.email) {
        const emailItems = paidOrder.items.map(i => ({
          productName: i.productName,
          quantity:    i.quantity,
          unitPrice:   Number(i.unitPrice),
        }));
        const { subject, html } = orderConfirmationEmail({
          customerName:    paidOrder.user.name,
          orderNumber:     paidOrder.orderNumber,
          totalAmount:     Number(paidOrder.totalAmount),
          items:           emailItems,
          eventName:       paidOrder.event?.name,
          deliveryAddress: paidOrder.deliveryAddress ?? undefined,
        });
        await sendMail({ to: paidOrder.user.email, subject, html }).catch(err =>
          console.error('[mailer] confirmation email failed:', err)
        );
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          const { subject: aSubject, html: aHtml } = adminNewOrderEmail({
            orderNumber:   paidOrder.orderNumber,
            customerName:  paidOrder.user.name,
            customerEmail: paidOrder.user.email,
            totalAmount:   Number(paidOrder.totalAmount),
            items:         emailItems,
            eventName:     paidOrder.event?.name,
          });
          await sendMail({ to: adminEmail, subject: aSubject, html: aHtml }).catch(err =>
            console.error('[mailer] admin alert email failed:', err)
          );
        }
      }

      // Get product categories from cart items to drive plan generation
      const cartItems = await prisma.cartItem.findMany({
        where:   { eventId: event.id, userId: req.user!.userId },
        include: { product: { select: { category: true } } },
      });
      const categories = [...new Set(cartItems.map(ci => ci.product.category as string))];

      // Clear cart now that payment is confirmed
      await prisma.cartItem.deleteMany({
        where: { eventId: event.id, userId: req.user!.userId },
      }).catch(() => {});

      // Generate plan (skip if already exists)
      const existing = await prisma.eventPlan.findUnique({ where: { eventId: event.id } });
      if (!existing) {
        const planSteps = event.packageId
          ? generatePackagePlan(event.type as string, event.guestCount ?? 50, categories, event.time ?? '18:00')
          : generateEventPlan(event.type as string, event.guestCount ?? 50, categories);
        await prisma.eventPlan.create({
          data: { eventId: event.id, steps: { create: planSteps } },
        });
      }

      // Bootstrap workspace records (idempotent — skip if already exist)
      await bootstrapWorkspace(event.id, event.colorTheme, event.type, order.id, paidOrder?.items ?? []);


      const fullEvent = await prisma.event.findUnique({
        where:   { id: event.id },
        include: { tasks: true, plan: { include: PLAN_INCLUDE }, ...PAID_ORDERS_INCLUDE },
      });

      res.json({ success: true, data: { event: formatEvent(fullEvent), plan: formatPlan(fullEvent?.plan) } });
    } catch (err) {
      console.error('POST /events/:id/confirm-payment', err);
      res.status(500).json({ success: false, message: 'Failed to confirm payment' });
    }
  }
);

// GET /api/events — list events for the authenticated user (only paid or canceled)
router.get('/', async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        userId: req.user!.userId,
        OR: [
          {
            orders: {
              some: {
                status: { in: ['PAID','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'] as any[] },
              },
            },
          },
          { status: 'CANCELED' as any },
        ],
      },
      include: {
        tasks: true,
        plan:  { include: { steps: { select: { id: true, isCompleted: true } } } },
        ...PAID_ORDERS_INCLUDE,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { events: events.map(formatEvent) } });
  } catch (err) {
    console.error('GET /events', err);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// POST /api/events — create a new event and seed default tasks
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Event name is required'),
    body('type').trim().notEmpty().withMessage('Event type is required'),
    body('date').trim().notEmpty().withMessage('Date is required'),
    body('time').trim().notEmpty().withMessage('Time is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, type, date, time, venue, notes } = req.body;

    try {
      const event = await prisma.event.create({
        data: {
          userId: req.user!.userId,
          name,
          type,
          date:  new Date(date),
          time,
          venue: venue?.trim() || 'To be determined',
          notes: notes?.trim() ?? '',
          status: 'PLANNING',
          tasks: {
            create: DEFAULT_TASKS,
          },
        },
        include: { tasks: true },
      });

      res.status(201).json({ success: true, data: { event: formatEvent(event) } });
    } catch (err) {
      console.error('POST /events', err);
      res.status(500).json({ success: false, message: 'Failed to create event' });
    }
  }
);

// GET /api/events/:id — get a single event (must belong to user)
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid event ID')],
  async (req: Request, res: Response) => {
    try {
      const event = await prisma.event.findFirst({
        where:   { id: req.params.id, userId: req.user!.userId },
        include: { tasks: true, ...PAID_ORDERS_INCLUDE },
      });
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      res.json({ success: true, data: { event: formatEvent(event) } });
    } catch (err) {
      console.error('GET /events/:id', err);
      res.status(500).json({ success: false, message: 'Failed to fetch event' });
    }
  }
);

// PATCH /api/events/:id — update event details
router.patch(
  '/:id',
  [param('id').isUUID().withMessage('Invalid event ID')],
  async (req: Request, res: Response) => {
    const { name, type, date, time, venue, venueBooked, notes, status } = req.body;

    try {
      const existing = await prisma.event.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!existing) return res.status(404).json({ success: false, message: 'Event not found' });

      const event = await prisma.event.update({
        where: { id: req.params.id },
        data: {
          ...(name        !== undefined && { name }),
          ...(type        !== undefined && { type }),
          ...(date        !== undefined && { date: new Date(date) }),
          ...(time        !== undefined && { time }),
          ...(venue       !== undefined && { venue }),
          ...(venueBooked !== undefined && { venueBooked }),
          ...(notes       !== undefined && { notes }),
          ...(status      !== undefined && { status }),
        },
        include: { tasks: true, ...PAID_ORDERS_INCLUDE },
      });

      res.json({ success: true, data: { event: formatEvent(event) } });
    } catch (err) {
      console.error('PATCH /events/:id', err);
      res.status(500).json({ success: false, message: 'Failed to update event' });
    }
  }
);

// DELETE /api/events/:id
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid event ID')],
  async (req: Request, res: Response) => {
    try {
      const existing = await prisma.event.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
        include: {
          orders: { select: { id: true, status: true, orderNumber: true } },
        },
      });
      if (!existing) return res.status(404).json({ success: false, message: 'Event not found' });

      // Block deletion if a payment has been collected for this event
      const paidOrder = existing.orders.find(o =>
        ['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
      );
      if (paidOrder) {
        return res.status(409).json({
          success: false,
          message: `This event has a paid order (${paidOrder.orderNumber}). Please contact support to request a cancellation and refund.`,
        });
      }

      await prisma.event.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Event deleted' });
    } catch (err) {
      console.error('DELETE /events/:id', err);
      res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
  }
);

// PATCH /api/events/:id/tasks/:taskId/complete — mark a task complete
// taskId is the frontend string (cake, decorations, etc.) OR a UUID
router.patch(
  '/:id/tasks/:taskId/complete',
  async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { venueBooked } = req.body;

    try {
      const event = await prisma.event.findFirst({
        where:   { id: req.params.id, userId: req.user!.userId },
        include: { tasks: true },
      });
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      // Resolve to DB TaskCategory
      const category = TASK_ID_TO_CATEGORY[taskId];
      if (!category) {
        return res.status(400).json({ success: false, message: `Unknown task: ${taskId}` });
      }

      const task = event.tasks.find(t => t.category === category);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found in this event' });

      // Mark the task complete
      await prisma.eventTask.update({
        where: { id: task.id },
        data:  { isCompleted: true, completedAt: new Date() },
      });

      // If it's the venue task and a venue was booked, save it on the event
      if (taskId === 'venue' && venueBooked) {
        await prisma.event.update({
          where: { id: event.id },
          data:  { venueBooked },
        });
      }

      // Return fresh event
      const updated = await prisma.event.findFirst({
        where:   { id: event.id },
        include: { tasks: true, ...PAID_ORDERS_INCLUDE },
      });

      res.json({ success: true, data: { event: formatEvent(updated) } });
    } catch (err) {
      console.error('PATCH /events/:id/tasks/:taskId/complete', err);
      res.status(500).json({ success: false, message: 'Failed to complete task' });
    }
  }
);

// PATCH /api/events/:id/tasks/:taskId/uncomplete — undo task completion
router.patch(
  '/:id/tasks/:taskId/uncomplete',
  async (req: Request, res: Response) => {
    const { taskId } = req.params;

    try {
      const event = await prisma.event.findFirst({
        where:   { id: req.params.id, userId: req.user!.userId },
        include: { tasks: true },
      });
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      const category = TASK_ID_TO_CATEGORY[taskId];
      if (!category) return res.status(400).json({ success: false, message: `Unknown task: ${taskId}` });

      const task = event.tasks.find(t => t.category === category);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      await prisma.eventTask.update({
        where: { id: task.id },
        data:  { isCompleted: false, completedAt: null },
      });

      const updated = await prisma.event.findFirst({
        where:   { id: event.id },
        include: { tasks: true, ...PAID_ORDERS_INCLUDE },
      });

      res.json({ success: true, data: { event: formatEvent(updated) } });
    } catch (err) {
      console.error('PATCH /events/:id/tasks/:taskId/uncomplete', err);
      res.status(500).json({ success: false, message: 'Failed to uncomplete task' });
    }
  }
);

// GET /api/events/:id/plan
router.get('/:id/plan', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    const plan = await prisma.eventPlan.findUnique({
      where:   { eventId: req.params.id },
      include: PLAN_INCLUDE,
    });
    if (!plan) { res.status(404).json({ success: false, message: 'No plan found for this event' }); return; }

    res.json({ success: true, data: { plan: formatPlan(plan) } });
  } catch (err) {
    console.error('GET /events/:id/plan', err);
    res.status(500).json({ success: false, message: 'Failed to fetch plan' });
  }
});

// PATCH /api/events/:id/plan/steps/:stepId/complete
router.patch('/:id/plan/steps/:stepId/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    const step = await prisma.eventPlanStep.update({
      where: { id: req.params.stepId },
      data:  { isCompleted: true, completedAt: new Date() },
    });
    res.json({ success: true, data: { step } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update step' });
  }
});

// PATCH /api/events/:id/plan/steps/:stepId/uncomplete
router.patch('/:id/plan/steps/:stepId/uncomplete', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    const step = await prisma.eventPlanStep.update({
      where: { id: req.params.stepId },
      data:  { isCompleted: false, completedAt: null },
    });
    res.json({ success: true, data: { step } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update step' });
  }
});

// POST /api/events/:id/plan/steps — add a custom user-defined step to the plan
router.post(
  '/:id/plan/steps',
  [
    param('id').isUUID(),
    body('title').isString().trim().notEmpty(),
    body('weeksBefore').isInt({ min: 0 }).withMessage('weeksBefore must be a non-negative integer'),
    body('description').optional().isString(),
    body('category').optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const event = await prisma.event.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
      if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

      let plan = await prisma.eventPlan.findUnique({ where: { eventId: event.id } });
      if (!plan) {
        plan = await prisma.eventPlan.create({ data: { eventId: event.id } });
      }

      const maxSort = await prisma.eventPlanStep.aggregate({ where: { planId: plan.id }, _max: { sortOrder: true } });
      const step = await prisma.eventPlanStep.create({
        data: {
          planId:      plan.id,
          title:       req.body.title,
          weeksBefore: req.body.weeksBefore,
          description: req.body.description ?? null,
          category:    req.body.category    ?? 'CUSTOM',
          timeOfDay:   null,
          sortOrder:   (maxSort._max.sortOrder ?? 0) + 1,
        },
      });
      res.status(201).json({ success: true, data: { step } });
    } catch (err) {
      console.error('POST /events/:id/plan/steps', err);
      res.status(500).json({ success: false, message: 'Failed to add step' });
    }
  }
);

// DELETE /api/events/:id/plan/steps/:stepId — delete a custom step
router.delete('/:id/plan/steps/:stepId', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    const plan = await prisma.eventPlan.findUnique({ where: { eventId: event.id } });
    if (!plan) { res.status(404).json({ success: false, message: 'Plan not found' }); return; }

    const step = await prisma.eventPlanStep.findFirst({ where: { id: req.params.stepId, planId: plan.id } });
    if (!step) { res.status(404).json({ success: false, message: 'Step not found' }); return; }

    if (step.category !== 'CUSTOM') {
      res.status(400).json({ success: false, message: 'Only custom steps can be deleted' }); return;
    }

    await prisma.eventPlanStep.delete({ where: { id: step.id } });
    res.json({ success: true, message: 'Step removed' });
  } catch (err) {
    console.error('DELETE /events/:id/plan/steps/:stepId', err);
    res.status(500).json({ success: false, message: 'Failed to delete step' });
  }
});

// POST /api/events/:id/adjust-guests — reprice a paid event when guest count changes
router.post(
  '/:id/adjust-guests',
  [
    param('id').isUUID().withMessage('Invalid event ID'),
    body('newGuestCount').isInt({ min: 1 }).withMessage('newGuestCount must be at least 1'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg });
      return;
    }

    const newGuestCount = Number(req.body.newGuestCount);

    try {
      const event = await prisma.event.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
      if (event.status === 'CANCELED') {
        res.status(400).json({ success: false, message: 'Cannot modify a cancelled event' }); return;
      }
      if (event.guestCount === newGuestCount) {
        res.status(400).json({ success: false, message: 'Guest count has not changed' }); return;
      }

      // Find the paid order for this event
      const paidOrder = await prisma.order.findFirst({
        where:   { eventId: event.id, userId: req.user!.userId, status: 'PAID' },
        include: { payment: true },
      }) as any;

      // No paid order — just update the event guest count directly
      if (!paidOrder) {
        await prisma.event.update({ where: { id: event.id }, data: { guestCount: newGuestCount } });
        res.json({ success: true, data: { type: 'UPDATED', newGuestCount } });
        return;
      }

      if (!paidOrder.originalGuestCount || paidOrder.originalGuestCount === 0) {
        res.status(400).json({ success: false, message: 'Cannot calculate adjustment: original guest count not recorded' });
        return;
      }

      const originalTotal    = Number(paidOrder.totalAmount);
      const perGuestRate     = originalTotal / paidOrder.originalGuestCount;
      const rawAdjustment    = (newGuestCount - paidOrder.originalGuestCount) * perGuestRate;
      const adjustmentAmount = Math.round(rawAdjustment * 100) / 100; // 2 dp

      if (adjustmentAmount === 0) {
        await prisma.event.update({ where: { id: event.id }, data: { guestCount: newGuestCount } });
        res.json({ success: true, data: { type: 'UPDATED', newGuestCount } });
        return;
      }

      if (adjustmentAmount < 0) {
        // Fewer guests — issue a partial Stripe refund
        const refundAmountCents = Math.round(Math.abs(adjustmentAmount) * 100);
        const paymentIntentId   = paidOrder.payment?.paymentIntentId;
        if (!paymentIntentId) {
          res.status(400).json({ success: false, message: 'No payment record found for this order' }); return;
        }

        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount:         refundAmountCents,
        });

        await prisma.$transaction([
          prisma.event.update({ where: { id: event.id }, data: { guestCount: newGuestCount } }),
          prisma.order.update({
            where: { id: paidOrder.id },
            data:  { totalAmount: { decrement: Math.abs(adjustmentAmount) } },
          }),
        ]);

        res.json({
          success: true,
          data: {
            type:           'REFUNDED',
            newGuestCount,
            refundAmount:   Math.abs(adjustmentAmount),
            stripeRefundId: refund.id,
          },
        });
        return;
      }

      // More guests — create a new Stripe PaymentIntent for the extra charge
      if (!process.env.STRIPE_SECRET_KEY) {
        res.status(503).json({ success: false, message: 'Payment service not configured' }); return;
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount:                    Math.round(adjustmentAmount * 100),
        currency:                  paidOrder.currency,
        automatic_payment_methods: { enabled: true },
        metadata:                  {
          orderId:      paidOrder.id,
          eventId:      event.id,
          adjustmentFor: 'GUEST_COUNT',
          newGuestCount: String(newGuestCount),
        },
      });

      res.json({
        success: true,
        data: {
          type:             'CHARGE',
          adjustmentAmount,
          newGuestCount,
          clientSecret:     paymentIntent.client_secret,
          paymentIntentId:  paymentIntent.id,
        },
      });
    } catch (err) {
      console.error('POST /events/:id/adjust-guests', err);
      res.status(500).json({ success: false, message: 'Failed to adjust guest count' });
    }
  }
);

// POST /api/events/:id/confirm-guest-adjustment — finalise a guest count increase after payment
router.post(
  '/:id/confirm-guest-adjustment',
  [
    param('id').isUUID().withMessage('Invalid event ID'),
    body('newGuestCount').isInt({ min: 1 }).withMessage('newGuestCount is required'),
    body('paymentIntentId').notEmpty().withMessage('paymentIntentId is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg });
      return;
    }

    const { newGuestCount, paymentIntentId } = req.body;

    try {
      const event = await prisma.event.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

      // Verify Stripe PaymentIntent succeeded
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        res.status(400).json({ success: false, message: 'Payment not completed' }); return;
      }

      const adjustmentAmount = intent.amount / 100;

      const paidOrder = await prisma.order.findFirst({
        where: { eventId: event.id, userId: req.user!.userId, status: 'PAID' },
      });

      await prisma.$transaction([
        prisma.event.update({ where: { id: event.id }, data: { guestCount: Number(newGuestCount) } }),
        ...(paidOrder ? [prisma.order.update({
          where: { id: paidOrder.id },
          data:  { totalAmount: { increment: adjustmentAmount } },
        })] : []),
      ]);

      res.json({ success: true, data: { newGuestCount: Number(newGuestCount) } });
    } catch (err) {
      console.error('POST /events/:id/confirm-guest-adjustment', err);
      res.status(500).json({ success: false, message: 'Failed to confirm guest adjustment' });
    }
  }
);

// POST /api/events/:id/reminders — create notification reminders for upcoming plan steps
router.post('/:id/reminders', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    const plan = await prisma.eventPlan.findUnique({
      where:   { eventId: event.id },
      include: { steps: true },
    });
    if (!plan) { res.json({ success: true, data: { created: 0 } }); return; }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.date); eventDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((eventDate.getTime() - today.getTime()) / 86400000);

    // Only process events in the next 30 days
    if (daysUntil < 0 || daysUntil > 30) { res.json({ success: true, data: { created: 0 } }); return; }

    const userId = req.user!.userId;
    let created = 0;

    // Collect all step IDs that qualify for a reminder this run
    const eligibleSteps: typeof plan.steps = [];
    for (const step of plan.steps) {
      if (step.isCompleted) continue;
      const stepDueDays  = step.weeksBefore * 7;
      const daysUntilDue = daysUntil - stepDueDays;
      if (daysUntilDue > 3 || daysUntilDue < -1) continue;
      eligibleSteps.push(step);
    }

    if (eligibleSteps.length === 0) { res.json({ success: true, data: { created: 0 } }); return; }

    // Bulk-fetch all existing markers for this user to avoid N+1 and race conditions
    const existing = await prisma.notification.findMany({
      where: { userId, content: { contains: `[event-reminder:` } },
      select: { content: true },
    });
    const sentMarkers = new Set(existing.map(n => {
      const m = n.content.match(/\[event-reminder:[^\]]+\]/);
      return m ? m[0] : '';
    }));

    for (const step of eligibleSteps) {
      const marker = `[event-reminder:${step.id}]`;
      if (sentMarkers.has(marker)) continue;

      const daysText = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
      const stepDueLabel = step.weeksBefore === 0
        ? 'Event day'
        : step.weeksBefore === 1 ? '1 week before your event' : `${step.weeksBefore} weeks before your event`;

      await prisma.notification.create({
        data: {
          userId,
          title: step.weeksBefore === 0
            ? `📅 Today: ${step.title}`
            : `⏰ ${stepDueLabel}: ${step.title}`,
          content: `Your event "${event.name}" is ${daysText}.\n\n${step.description ?? ''}\n\n${marker}`,
        },
      });
      created++;
      sentMarkers.add(marker); // prevent in-loop duplication if called concurrently
    }

    res.json({ success: true, data: { created } });
  } catch (err) {
    console.error('POST /events/:id/reminders', err);
    res.status(500).json({ success: false, message: 'Failed to generate reminders' });
  }
});

export default router;
