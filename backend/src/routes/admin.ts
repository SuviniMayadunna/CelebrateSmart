import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { publishNotification } from '../lib/rabbitmq';
import { sendMail } from '../lib/mailer';
import { orderStatusEmail } from '../lib/email-templates';

const PRODUCT_SELECT = {
  id: true, sku: true, name: true, description: true,
  category: true, price: true, imageUrl: true, venueAddress: true,
  isActive: true, createdAt: true,
} as const;

function formatAdminProduct(p: any) {
  return { ...p, price: Number(p.price), createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt) };
}

function generateSku(name: string, category: string): string {
  const prefix   = category.slice(0, 3).toUpperCase();
  const namePart = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const rand     = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${namePart}-${rand}`;
}

const router = Router();

router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const CONFIRMED_STATUSES = ['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] as any;
    const [totalCustomers, totalOrders, pendingOrders, revenueAgg] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      // Only count confirmed orders, not abandoned checkouts
      prisma.order.count({ where: { NOT: { status: 'PENDING_PAYMENT' as any } } }),
      prisma.order.count({
        where: { status: { in: ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] as any } },
      }),
      // Revenue = all confirmed paid orders (not just delivered)
      prisma.order.aggregate({
        where: { status: { in: CONFIRMED_STATUSES } },
        _sum: { totalAmount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalOrders,
        totalRevenue: revenueAgg._sum?.totalAmount ?? 0,
        pendingOrders,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load admin stats',
    });
  }
});

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const limit = Math.min(Math.max(parseInt(limitRaw ?? '20', 10) || 20, 1), 100);

    const orders = await prisma.order.findMany({
      where:   { NOT: { status: 'PENDING_PAYMENT' as any } },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      include: {
        user:  { select: { id: true, name: true, email: true } },
        event: { select: { date: true, time: true, venue: true } },
      },
    });

    res.json({
      success: true,
      data: {
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customer: o.user?.name ?? 'Unknown',
          totalAmount: o.totalAmount,
          status: o.status,
          paymentStatus: o.paymentStatus,
          date: o.createdAt.toISOString(),
          eventDate:  o.event?.date ? (o.event.date instanceof Date ? o.event.date.toISOString() : String(o.event.date)) : null,
          eventTime:  (o.event as any)?.time ?? null,
          eventVenue: (o.event as any)?.venue ?? null,
        })),
      },
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load orders',
    });
  }
});

router.get('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id as string },
      include: {
        user:  { select: { id: true, name: true, email: true } },
        items: { orderBy: { createdAt: 'asc' } },
        event: { select: { id: true, name: true, type: true, date: true, time: true, venue: true, guestCount: true, colorTheme: true } },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        order: {
          id:              order.id,
          orderNumber:     order.orderNumber,
          customer:        order.user?.name ?? 'Unknown',
          customerEmail:   order.user?.email ?? '',
          deliveryAddress: order.deliveryAddress ?? null,
          totalAmount:     Number(order.totalAmount),
          status:          order.status,
          paymentStatus:   order.paymentStatus,
          date:            order.createdAt.toISOString(),
          event:           order.event ? { id: order.event.id, name: order.event.name, type: order.event.type, date: order.event.date, time: (order.event as any).time ?? null, venue: (order.event as any).venue ?? null, guestCount: (order.event as any).guestCount ?? null, colorTheme: (order.event as any).colorTheme ?? null } : null,
          items:         order.items.map(i => ({
            id:           i.id,
            productName:  i.productName,
            categoryName: i.categoryName,
            quantity:     i.quantity,
            unitPrice:    Number(i.unitPrice),
          })),
        },
      },
    });
  } catch (error) {
    console.error('Admin order detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to load order' });
  }
});

router.patch(
  '/orders/:id',
  [body('status').isIn(['PENDING_PAYMENT', 'PAID', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED'])],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: { status: req.body.status },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      // Notify customer on meaningful status transitions
      const STATUS_MESSAGES: Record<string, string> = {
        PAID:             `Your order #${updated.orderNumber} has been confirmed. We're getting things ready!`,
        PREPARING:        `Your order #${updated.orderNumber} is now being prepared. We'll keep you posted!`,
        READY_FOR_PICKUP: `Your order #${updated.orderNumber} is ready! It will be dispatched shortly.`,
        OUT_FOR_DELIVERY: `Your order #${updated.orderNumber} is on its way to you! 🚚`,
        DELIVERED:        `Your order #${updated.orderNumber} has been delivered. Thank you for celebrating with us! 🎉`,
        CANCELED:         `Your order #${updated.orderNumber} has been canceled. Contact us if you need assistance.`,
      };
      const msgContent = STATUS_MESSAGES[updated.status];
      if (msgContent && updated.user) {
        const title = `Order ${updated.status.charAt(0) + updated.status.slice(1).toLowerCase()}: #${updated.orderNumber}`;
        await prisma.notification.create({ data: { userId: updated.user.id, title, content: msgContent } }).catch(() => {});
        await publishNotification({ title, content: msgContent, emails: [updated.user.email], sentAt: new Date().toISOString() }).catch(() => {});

        // Send status update email
        const { subject, html } = orderStatusEmail({
          customerName: updated.user.name,
          orderNumber:  updated.orderNumber,
          status:       updated.status,
          message:      msgContent,
        });
        await sendMail({ to: updated.user.email, subject, html }).catch(err =>
          console.error('[mailer] status email failed:', err)
        );
      }

      res.json({
        success: true,
        data: {
          order: {
            id: updated.id, orderNumber: updated.orderNumber,
            customer: updated.user?.name ?? 'Unknown',
            totalAmount: updated.totalAmount, status: updated.status,
            paymentStatus: updated.paymentStatus, date: updated.createdAt.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Admin update order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order',
      });
    }
  }
);

router.get('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const limit = Math.min(Math.max(parseInt(limitRaw ?? '100', 10) || 100, 1), 500);

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: PRODUCT_SELECT,
    });

    res.json({
      success: true,
      data: { products: products.map(formatAdminProduct) },
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load products',
    });
  }
});

// POST /admin/products — create a new product
router.post(
  '/products',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').isIn(['CAKES','DECORATIONS','FOOD','GIFTS','PHOTOGRAPHY','ENTERTAINMENT','VENUE']).withMessage('Invalid category'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('sku').optional().trim(),
    body('description').optional().trim(),
    body('imageUrl').optional({ nullable: true }).trim(),
    body('venueAddress').optional({ nullable: true }).trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: errors.array()[0].msg });
        return;
      }

      const { name, category, price, description, imageUrl, venueAddress } = req.body;
      const sku = (req.body.sku as string | undefined)?.trim() || generateSku(name, category);

      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        res.status(409).json({ success: false, message: `SKU "${sku}" already exists` });
        return;
      }

      const product = await prisma.product.create({
        data: {
          sku,
          name,
          category,
          price:        parseFloat(price),
          description:  description || null,
          imageUrl:     imageUrl     || null,
          venueAddress: venueAddress || null,
          isActive:     true,
        },
        select: PRODUCT_SELECT,
      });

      res.status(201).json({ success: true, data: { product: formatAdminProduct(product) } });
    } catch (error) {
      console.error('Admin create product error:', error);
      res.status(500).json({ success: false, message: 'Failed to create product' });
    }
  }
);

// PATCH /admin/products/:id — update product fields (including isActive)
router.patch(
  '/products/:id',
  [
    body('isActive').optional().isBoolean(),
    body('name').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('description').optional({ nullable: true }),
    body('imageUrl').optional({ nullable: true }),
    body('venueAddress').optional({ nullable: true }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: errors.array()[0].msg });
        return;
      }

      const { isActive, name, price, description, imageUrl, venueAddress } = req.body;

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data: {
          ...(isActive     !== undefined && { isActive }),
          ...(name         !== undefined && { name }),
          ...(price        !== undefined && { price: parseFloat(price) }),
          ...(description  !== undefined && { description: description  || null }),
          ...(imageUrl     !== undefined && { imageUrl:    imageUrl     || null }),
          ...(venueAddress !== undefined && { venueAddress: venueAddress || null }),
        },
        select: PRODUCT_SELECT,
      });

      res.json({ success: true, data: { product: formatAdminProduct(updated) } });
    } catch (error) {
      console.error('Admin update product error:', error);
      res.status(500).json({ success: false, message: 'Failed to update product' });
    }
  }
);

const TEMPLATE_TASK_CATEGORIES = ['CAKE','DECORATIONS','FOOD','ENTERTAINMENT','PHOTOGRAPHY','GIFTS','VENUE','FLOWERS','CELEBRATION_DINNER','GAMES','PARTY_FAVORS','GAMES_AND_ACTIVITIES'] as const;
const TASK_DISPLAY: Record<string, string> = { CAKE:'Cake', DECORATIONS:'Decorations', FOOD:'Food & Drinks', ENTERTAINMENT:'Entertainment', PHOTOGRAPHY:'Photography', GIFTS:'Gifts', VENUE:'Venue', FLOWERS:'Flowers', CELEBRATION_DINNER:'Celebration Dinner', GAMES:'Games', PARTY_FAVORS:'Party Favors', GAMES_AND_ACTIVITIES:'Games & Activities' };

function formatAdminTemplate(t: any) {
  return { id: t.id, slug: t.slug, name: t.name, emoji: t.emoji, isActive: t.isActive, steps: t._count?.steps ?? t.steps?.length ?? 0, createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt) };
}

// POST /admin/templates — create template with steps
router.post(
  '/templates',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('emoji').optional({ nullable: true }).trim(),
    body('steps').isArray({ min: 1 }).withMessage('At least one step is required'),
    body('steps.*.category').isIn(TEMPLATE_TASK_CATEGORIES).withMessage('Invalid step category'),
    body('steps.*.title').trim().notEmpty().withMessage('Step title is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const { name, description, emoji, steps } = req.body as { name: string; description: string; emoji?: string; steps: { category: string; title: string }[] };
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const base = await prisma.template.findFirst({ where: { slug } });
      const finalSlug = base ? `${slug}-${Date.now()}` : slug;
      const template = await prisma.template.create({
        data: { name, description, emoji: emoji || null, slug: finalSlug, isActive: true, steps: { create: steps.map((s, i) => ({ title: s.title, category: s.category as any, sortOrder: i })) } },
        select: { id: true, slug: true, name: true, emoji: true, isActive: true, createdAt: true, _count: { select: { steps: true } } },
      });
      res.status(201).json({ success: true, data: { template: formatAdminTemplate(template) } });
    } catch (error) {
      console.error('Admin create template error:', error);
      res.status(500).json({ success: false, message: 'Failed to create template' });
    }
  }
);

router.get('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const limit = Math.min(Math.max(parseInt(limitRaw ?? '100', 10) || 100, 1), 500);

    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        emoji: true,
        isActive: true,
        createdAt: true,
        _count: { select: { steps: true } },
      },
    });

    res.json({
      success: true,
      data: {
        templates: templates.map((t) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          emoji: t.emoji,
          isActive: t.isActive,
          steps: t._count.steps,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Admin templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load templates',
    });
  }
});

router.patch(
  '/templates/:id',
  [
    body('isActive').optional().isBoolean(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('emoji').optional({ nullable: true }),
    body('steps').optional().isArray({ min: 1 }),
    body('steps.*.category').optional().isIn(TEMPLATE_TASK_CATEGORIES),
    body('steps.*.title').optional().trim().notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: errors.array()[0].msg });
        return;
      }

      const { isActive, name, description, emoji, steps } = req.body as {
        isActive?: boolean; name?: string; description?: string; emoji?: string | null;
        steps?: { category: string; title: string }[];
      };

      // If steps provided, replace them atomically
      if (steps) {
        await prisma.templateStep.deleteMany({ where: { templateId: req.params.id } });
        await prisma.templateStep.createMany({
          data: steps.map((s, i) => ({ templateId: req.params.id, title: s.title, category: s.category as any, sortOrder: i })),
        });
      }

      const updated = await prisma.template.update({
        where: { id: req.params.id },
        data: {
          ...(isActive    !== undefined && { isActive }),
          ...(name        !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(emoji       !== undefined && { emoji: emoji || null }),
        },
        select: {
          id: true, slug: true, name: true, emoji: true, isActive: true, createdAt: true,
          steps: { orderBy: { sortOrder: 'asc' }, select: { category: true, title: true } },
          _count: { select: { steps: true } },
        },
      });

      res.json({
        success: true,
        data: {
          template: {
            ...formatAdminTemplate(updated),
            stepDetails: updated.steps.map(s => ({ category: s.category, title: TASK_DISPLAY[s.category] ?? s.title })),
          },
        },
      });
    } catch (error) {
      console.error('Admin update template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template',
      });
    }
  }
);

// ── Customers ────────────────────────────────────────────────────────────────

router.get('/customers', async (req: Request, res: Response): Promise<void> => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const limit = Math.min(Math.max(parseInt(limitRaw ?? '100', 10) || 100, 1), 500);

    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true,
        _count: { select: { orders: true, events: true } },
      },
    });

    res.json({
      success: true,
      data: {
        customers: customers.map(c => ({
          id:         c.id,
          name:       c.name,
          email:      c.email,
          phone:      c.phone ?? null,
          orderCount: c._count.orders,
          eventCount: c._count.events,
          joinedAt:   c.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Admin customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to load customers' });
  }
});

// ── Packages ─────────────────────────────────────────────────────────────────

function formatAdminPackage(p: any) {
  return {
    id:          p.id,
    name:        p.name,
    eventType:   p.eventType,
    tier:        p.tier,
    description: p.description,
    highlights:  p.highlights,
    isActive:    p.isActive,
    itemCount:   p.items.length,
    bookedCount: p._count?.events ?? 0,
    items:       p.items.map((i: any) => ({
      id:        i.id,
      productId: i.productId,
      name:      i.product.name,
      price:     Number(i.product.price),
      category:  i.product.category,
      quantity:  i.quantity,
      isCore:    i.isCore,
    })),
    photos: (p.photos ?? []).map((ph: any) => ({
      id:        ph.id,
      url:       ph.url,
      publicId:  ph.publicId,
      caption:   ph.caption ?? null,
      sortOrder: ph.sortOrder,
    })),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  };
}

const ADMIN_PKG_INCLUDE = {
  items: {
    include: { product: { select: { id: true, name: true, price: true, category: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
  photos: { orderBy: { sortOrder: 'asc' as const } },
  _count: { select: { events: true } },
};

router.get('/packages', async (_req: Request, res: Response): Promise<void> => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: [{ eventType: 'asc' }, { tier: 'asc' }],
      include: ADMIN_PKG_INCLUDE,
    });
    res.json({ success: true, data: { packages: packages.map(formatAdminPackage) } });
  } catch (error) {
    console.error('Admin packages list error:', error);
    res.status(500).json({ success: false, message: 'Failed to load packages' });
  }
});

router.patch(
  '/packages/:id',
  [
    body('isActive').optional().isBoolean(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('highlights').optional().isArray(),
    body('items').optional().isArray(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        return;
      }

      const { id } = req.params as { id: string };
      const { isActive, name, description, highlights, items } = req.body as {
        isActive?:    boolean;
        name?:        string;
        description?: string;
        highlights?:  string[];
        items?:       { productId: string; quantity: number; isCore?: boolean }[];
      };

      if (items !== undefined) {
        await prisma.$transaction([
          prisma.packageItem.deleteMany({ where: { packageId: id } }),
          prisma.packageItem.createMany({
            data: items.map((item, idx) => ({
              packageId: id,
              productId: item.productId,
              quantity:  item.quantity,
              isCore:    item.isCore ?? true,
              sortOrder: idx,
            })),
          }),
        ]);
      }

      const updated = await prisma.package.update({
        where: { id },
        data: {
          ...(isActive    !== undefined && { isActive }),
          ...(name                      && { name }),
          ...(description               && { description }),
          ...(highlights                && { highlights }),
        },
        include: ADMIN_PKG_INCLUDE,
      });

      res.json({ success: true, data: { package: formatAdminPackage(updated) } });
    } catch (error) {
      console.error('Admin package update error:', error);
      res.status(500).json({ success: false, message: 'Failed to update package' });
    }
  }
);

// POST /admin/packages/:id/photos — add a Cloudinary photo to a package
router.post(
  '/packages/:id/photos',
  [
    body('url').trim().notEmpty().withMessage('Photo URL is required'),
    body('publicId').trim().notEmpty().withMessage('Public ID is required'),
    body('caption').optional({ nullable: true }).trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const { url, publicId, caption } = req.body as { url: string; publicId: string; caption?: string };
      const existingCount = await (prisma as any).packagePhoto.count({ where: { packageId: req.params.id } });
      const photo = await (prisma as any).packagePhoto.create({
        data: { packageId: req.params.id, url, publicId, caption: caption || null, sortOrder: existingCount },
      });
      res.status(201).json({
        success: true,
        data: {
          photo: { id: photo.id, url: photo.url, publicId: photo.publicId, caption: photo.caption ?? null, sortOrder: photo.sortOrder },
        },
      });
    } catch (error) {
      console.error('Add package photo error:', error);
      res.status(500).json({ success: false, message: 'Failed to add photo' });
    }
  }
);

// DELETE /admin/packages/:id/photos/:photoId
router.delete('/packages/:id/photos/:photoId', async (req: Request, res: Response): Promise<void> => {
  try {
    await (prisma as any).packagePhoto.deleteMany({
      where: { id: req.params.photoId, packageId: req.params.id },
    });
    res.json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete package photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete photo' });
  }
});

// GET /admin/notification-broadcasts — history of all sent broadcasts
router.get('/notification-broadcasts', async (_req: Request, res: Response) => {
  try {
    const broadcasts = await (prisma as any).notificationBroadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({
      success: true,
      data: {
        broadcasts: broadcasts.map((b: any) => ({
          id:             b.id,
          title:          b.title,
          content:        b.content,
          recipientType:  b.recipientType,
          recipientCount: b.recipientCount,
          sentBy:         b.sentBy,
          createdAt:      b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
        })),
      },
    });
  } catch (error) {
    console.error('GET /notification-broadcasts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcast history' });
  }
});

router.post(
  '/notifications',
  [
    body('recipientType').isString().trim().notEmpty(),
    body('title').isString().trim().notEmpty(),
    body('content').isString().trim().notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        return;
      }

      const { recipientType, title, content } = req.body as {
        recipientType: string;
        title: string;
        content: string;
      };

      // Resolve recipient users
      const recipients = await prisma.user.findMany({
        where: recipientType === 'ALL_CUSTOMERS'
          ? { role: 'CUSTOMER' }
          : { role: 'CUSTOMER' },    // extend for SPECIFIC later
        select: { id: true, email: true },
      });

      if (recipients.length === 0) {
        res.status(400).json({ success: false, message: 'No recipients found' });
        return;
      }

      // Persist in-app notifications for each recipient
      await prisma.notification.createMany({
        data: recipients.map(r => ({ userId: r.id, title, content })),
      });

      // Record the broadcast for admin history
      await (prisma as any).notificationBroadcast.create({
        data: {
          title,
          content,
          recipientType,
          recipientCount: recipients.length,
          sentBy: req.user!.userId,
        },
      });

      // Publish email job to RabbitMQ (fire-and-forget — DB records are already saved)
      await publishNotification({
        title,
        content,
        emails:  recipients.map(r => r.email),
        sentAt:  new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: `Notification sent to ${recipients.length} recipient(s)`,
      });
    } catch (error) {
      console.error('Admin notifications error:', error);
      res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
  }
);

// ── Operations (MANAGEMENT plan steps) ──────────────────────────────────────

router.get('/operations', async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({
      where: { plan: { steps: { some: { category: 'MANAGEMENT' } } } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: {
          include: {
            steps: {
              where: { category: 'MANAGEMENT' },
              orderBy: { weeksBefore: 'desc' },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const formatted = events.map(e => ({
      id:   e.id,
      name: e.name,
      type: e.type,
      date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date),
      customer: e.user,
      managementSteps: (e.plan?.steps ?? []).map(s => ({
        id:          s.id,
        title:       s.title,
        description: s.description,
        weeksBefore: s.weeksBefore,
        timeOfDay:   s.timeOfDay,
        isCompleted: s.isCompleted,
        completedAt: s.completedAt,
      })),
    }));

    res.json({ success: true, data: { events: formatted } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch operations' });
  }
});

router.post('/operations/steps/:stepId/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const step = await prisma.eventPlanStep.update({
      where: { id: req.params.stepId },
      data:  { isCompleted: true, completedAt: new Date() },
    });
    res.json({ success: true, data: { step } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to complete step' });
  }
});

router.post('/operations/steps/:stepId/uncomplete', async (req: Request, res: Response): Promise<void> => {
  try {
    const step = await prisma.eventPlanStep.update({
      where: { id: req.params.stepId },
      data:  { isCompleted: false, completedAt: null },
    });
    res.json({ success: true, data: { step } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to uncomplete step' });
  }
});

export default router;
