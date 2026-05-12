import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';

const router = Router();

router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalCustomers, totalOrders, pendingOrders, revenueAgg] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: { in: ['PENDING_PAYMENT', 'PROCESSING'] },
        },
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['PAID', 'COMPLETED'] },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalOrders,
        totalRevenue: revenueAgg._sum.totalAmount ?? 0,
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
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
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

router.patch(
  '/orders/:id',
  [body('status').isIn(['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELED'])],
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
        data: {
          status: req.body.status,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      res.json({
        success: true,
        data: {
          order: {
            id: updated.id,
            orderNumber: updated.orderNumber,
            customer: updated.user?.name ?? 'Unknown',
            totalAmount: updated.totalAmount,
            status: updated.status,
            paymentStatus: updated.paymentStatus,
            date: updated.createdAt.toISOString(),
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
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        price: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        products: products.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load products',
    });
  }
});

router.patch(
  '/products/:id',
  [body('isActive').isBoolean()],
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

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data: { isActive: req.body.isActive },
        select: {
          id: true,
          sku: true,
          name: true,
          category: true,
          price: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          product: {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Admin update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
      });
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
  [body('isActive').isBoolean()],
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

      const updated = await prisma.template.update({
        where: { id: req.params.id },
        data: { isActive: req.body.isActive },
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
          template: {
            id: updated.id,
            slug: updated.slug,
            name: updated.name,
            emoji: updated.emoji,
            isActive: updated.isActive,
            steps: updated._count.steps,
            createdAt: updated.createdAt.toISOString(),
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
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { recipientType, title } = req.body as {
        recipientType: string;
        title: string;
        content: string;
      };

      // No Notification model yet; treat this as a "send" action.
      // In a real system you'd enqueue an email/SMS/push job and/or store a record.
      console.log('[admin.notifications] send', { recipientType, title });

      res.status(201).json({
        success: true,
        message: 'Notification queued',
      });
    } catch (error) {
      console.error('Admin notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
      });
    }
  }
);

export default router;
