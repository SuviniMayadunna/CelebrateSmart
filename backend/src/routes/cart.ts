import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import prisma from '../config/database';

const router = Router();

function formatCartItem(item: any) {
  return {
    id:       item.id,
    quantity: item.quantity,
    eventId:  item.eventId ?? null,
    product: {
      id:          item.product.id,
      name:        item.product.name,
      category:    item.product.category,
      price:       Number(item.product.price),
      imageUrl:    item.product.imageUrl ?? null,
      description: item.product.description ?? '',
    },
  };
}

const CART_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      imageUrl: true,
      description: true,
    },
  },
} as const;

// GET /api/cart — list cart items, optional ?eventId=
router.get(
  '/',
  [query('eventId').optional().isUUID()],
  async (req: Request, res: Response) => {
    const eventId = req.query.eventId as string | undefined;

    try {
      const items = await prisma.cartItem.findMany({
        where: {
          userId: req.user!.userId,
          ...(eventId && { eventId }),
        },
        include: CART_INCLUDE,
        orderBy: { createdAt: 'asc' },
      });

      const total = items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      );

      res.json({
        success: true,
        data: {
          items: items.map(formatCartItem),
          total: Number(total.toFixed(2)),
        },
      });
    } catch (err) {
      console.error('GET /cart', err);
      res.status(500).json({ success: false, message: 'Failed to fetch cart' });
    }
  }
);

// POST /api/cart — add item (or increment existing)
router.post(
  '/',
  [
    body('productId').isUUID().withMessage('Valid product ID required'),
    body('eventId').optional().isUUID(),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be ≥ 1'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { productId, eventId = null, quantity = 1 } = req.body;
    const userId = req.user!.userId;

    try {
      const product = await prisma.product.findFirst({
        where: { id: productId, isActive: true },
      });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Upsert: if same (user, product, event) exists, increment quantity
      const existing = await prisma.cartItem.findFirst({
        where: { userId, productId, eventId: eventId ?? null },
      });

      let item;
      if (existing) {
        item = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
          include: CART_INCLUDE,
        });
      } else {
        item = await prisma.cartItem.create({
          data: { userId, productId, eventId: eventId ?? null, quantity },
          include: CART_INCLUDE,
        });
      }

      res.status(201).json({ success: true, data: { item: formatCartItem(item) } });
    } catch (err) {
      console.error('POST /cart', err);
      res.status(500).json({ success: false, message: 'Failed to add to cart' });
    }
  }
);

// PATCH /api/cart/:itemId — update quantity
router.patch(
  '/:itemId',
  [
    param('itemId').isUUID().withMessage('Invalid cart item ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be ≥ 1'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { quantity } = req.body;

    try {
      const existing = await prisma.cartItem.findFirst({
        where: { id: req.params.itemId, userId: req.user!.userId },
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Cart item not found' });
      }

      const item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
        include: CART_INCLUDE,
      });

      res.json({ success: true, data: { item: formatCartItem(item) } });
    } catch (err) {
      console.error('PATCH /cart/:itemId', err);
      res.status(500).json({ success: false, message: 'Failed to update cart item' });
    }
  }
);

// DELETE /api/cart/:itemId — remove single item
router.delete(
  '/:itemId',
  [param('itemId').isUUID().withMessage('Invalid cart item ID')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const existing = await prisma.cartItem.findFirst({
        where: { id: req.params.itemId, userId: req.user!.userId },
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Cart item not found' });
      }

      await prisma.cartItem.delete({ where: { id: existing.id } });
      res.json({ success: true, message: 'Item removed from cart' });
    } catch (err) {
      console.error('DELETE /cart/:itemId', err);
      res.status(500).json({ success: false, message: 'Failed to remove cart item' });
    }
  }
);

// DELETE /api/cart — clear entire cart (optionally by ?eventId=)
router.delete(
  '/',
  [query('eventId').optional().isUUID()],
  async (req: Request, res: Response) => {
    const eventId = req.query.eventId as string | undefined;

    try {
      await prisma.cartItem.deleteMany({
        where: {
          userId: req.user!.userId,
          ...(eventId && { eventId }),
        },
      });

      res.json({ success: true, message: 'Cart cleared' });
    } catch (err) {
      console.error('DELETE /cart', err);
      res.status(500).json({ success: false, message: 'Failed to clear cart' });
    }
  }
);

export default router;
