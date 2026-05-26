import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import stripe from '../lib/stripe';

const router = Router();

function formatOrder(order: any) {
  return {
    id:            order.id,
    orderNumber:   order.orderNumber,
    status:        order.status,
    totalAmount:   Number(order.totalAmount),
    currency:      order.currency,
    paymentStatus: order.paymentStatus,
    eventId:         order.eventId ?? null,
    eventName:       order.event?.name ?? null,
    eventType:       order.event?.type ?? null,
    eventDate:       order.event?.date ? (order.event.date instanceof Date ? order.event.date.toISOString() : String(order.event.date)) : null,
    eventTime:       order.event?.time ?? null,
    eventGuestCount: order.event?.guestCount ?? null,
    eventColorTheme: order.event?.colorTheme ?? null,
    createdAt:     order.createdAt instanceof Date
                     ? order.createdAt.toISOString()
                     : String(order.createdAt),
    items: (order.items ?? []).map((item: any) => ({
      id:           item.id,
      productId:    item.productId,
      productName:  item.productName,
      categoryName: item.categoryName,
      unitPrice:    Number(item.unitPrice),
      quantity:     item.quantity,
    })),
  };
}

// POST /api/orders — create order from current cart (optionally scoped to an event)
router.post(
  '/',
  [
    body('eventId').optional().isUUID(),
    body('deliveryAddress').optional().trim().isLength({ max: 500 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { eventId = null, deliveryAddress = null } = req.body;
    const userId = req.user!.userId;

    try {
      // Fetch cart items (scoped to event if provided)
      const cartItems = await prisma.cartItem.findMany({
        where: {
          userId,
          eventId: eventId ?? null,
        },
        include: {
          product: {
            select: { id: true, name: true, category: true, price: true, isActive: true },
          },
        },
      });

      if (cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      // Verify all products still active
      const inactive = cartItems.filter(ci => !ci.product.isActive);
      if (inactive.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Some items are no longer available: ${inactive.map(ci => ci.product.name).join(', ')}`,
        });
      }

      const totalAmount = cartItems.reduce(
        (sum, ci) => sum + Number(ci.product.price) * ci.quantity,
        0
      );

      // Create order + items — cart is NOT cleared here.
      // It is cleared only after payment succeeds (stripe-webhook or confirm-payment),
      // so the customer's cart is never lost if payment is abandoned or fails.
      const order = await prisma.order.create({
        data: {
          userId,
          eventId:         eventId ?? null,
          deliveryAddress: deliveryAddress ?? null,
          totalAmount,
          status:          'PENDING_PAYMENT',
          paymentStatus:   'PENDING',
          items: {
            create: cartItems.map(ci => ({
              productId:    ci.productId,
              productName:  ci.product.name,
              unitPrice:    ci.product.price,
              quantity:     ci.quantity,
              categoryName: ci.product.category,
            })),
          },
        },
        include: { items: true },
      });

      res.status(201).json({ success: true, data: { order: formatOrder(order) } });
    } catch (err) {
      console.error('POST /orders', err);
      res.status(500).json({ success: false, message: 'Failed to create order' });
    }
  }
);

// GET /api/orders — list user orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where:   { userId: req.user!.userId, NOT: { status: 'PENDING_PAYMENT' as any } },
      include: { items: true, event: { select: { name: true, type: true, date: true, time: true, guestCount: true, colorTheme: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { orders: orders.map(formatOrder) } });
  } catch (err) {
    console.error('GET /orders', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// POST /api/orders/:id/pay — create Stripe PaymentIntent for a pending order
router.post(
  '/:id/pay',
  [param('id').isUUID().withMessage('Invalid order ID')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ success: false, message: 'Payment service not configured' });
    }

    try {
      const order = await prisma.order.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.status !== 'PENDING_PAYMENT') {
        return res.status(400).json({ success: false, message: 'Order is not awaiting payment' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount:                  Math.round(Number(order.totalAmount) * 100),
        currency:                order.currency,
        automatic_payment_methods: { enabled: true },
        metadata:                { orderId: order.id, orderNumber: order.orderNumber },
      });

      await prisma.payment.upsert({
        where:  { orderId: order.id },
        create: {
          orderId:         order.id,
          paymentIntentId: paymentIntent.id,
          clientSecret:    paymentIntent.client_secret!,
          amount:          order.totalAmount,
          currency:        order.currency,
        },
        update: {
          paymentIntentId: paymentIntent.id,
          clientSecret:    paymentIntent.client_secret!,
          status:          'PENDING',
        },
      });

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          orderId:      order.id,
        },
      });
    } catch (err) {
      console.error('POST /orders/:id/pay', err);
      res.status(500).json({ success: false, message: 'Failed to create payment intent' });
    }
  }
);

// GET /api/orders/:id — get a single order
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid order ID')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const order = await prisma.order.findFirst({
        where:   { id: req.params.id, userId: req.user!.userId },
        include: { items: true },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.json({ success: true, data: { order: formatOrder(order) } });
    } catch (err) {
      console.error('GET /orders/:id', err);
      res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
  }
);

export default router;
