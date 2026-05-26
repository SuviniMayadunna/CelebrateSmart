import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { ProductCategory } from '@prisma/client';

const router = Router();

function formatProduct(p: any) {
  return {
    id:           p.id,
    sku:          p.sku,
    name:         p.name,
    description:  p.description ?? '',
    category:     p.category,
    imageUrl:     p.imageUrl ?? null,
    venueAddress: p.venueAddress ?? null,
    price:        Number(p.price),
    isActive:     p.isActive,
  };
}

// GET /api/products — list active products, optional ?category=CAKES
router.get(
  '/',
  [query('category').optional().isString()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const categoryParam = req.query.category as string | undefined;
    const categoryFilter = categoryParam
      ? (categoryParam.toUpperCase() as ProductCategory)
      : undefined;

    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(categoryFilter && { category: categoryFilter }),
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      res.json({ success: true, data: { products: products.map(formatProduct) } });
    } catch (err) {
      console.error('GET /products', err);
      res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
  }
);

// GET /api/products/:id — get a single active product
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid product ID')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const product = await prisma.product.findFirst({
        where: { id: req.params.id, isActive: true },
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.json({ success: true, data: { product: formatProduct(product) } });
    } catch (err) {
      console.error('GET /products/:id', err);
      res.status(500).json({ success: false, message: 'Failed to fetch product' });
    }
  }
);

export default router;
