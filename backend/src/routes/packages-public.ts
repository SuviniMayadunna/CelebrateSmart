import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

const PRODUCT_SELECT = {
  id: true, sku: true, name: true, description: true,
  category: true, imageUrl: true, venueAddress: true, price: true,
};

const PKG_INCLUDE = {
  items: { include: { product: { select: PRODUCT_SELECT } }, orderBy: { sortOrder: 'asc' as const } },
  photos: { orderBy: { sortOrder: 'asc' as const } },
} as const;

function formatPackage(pkg: any) {
  const totalPrice = pkg.items.reduce((sum: number, item: any) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);
  return {
    id:          pkg.id,
    name:        pkg.name,
    eventType:   pkg.eventType,
    tier:        pkg.tier,
    description: pkg.description,
    highlights:  pkg.highlights,
    totalPrice,
    items: pkg.items.map((item: any) => ({
      id:        item.id,
      productId: item.product.id,
      name:      item.product.name,
      category:  item.product.category,
      imageUrl:  item.product.imageUrl,
      price:     Number(item.product.price),
      quantity:  item.quantity,
      isCore:    item.isCore,
    })),
    photos: (pkg.photos ?? []).map((ph: any) => ({
      id:        ph.id,
      url:       ph.url,
      caption:   ph.caption ?? null,
      sortOrder: ph.sortOrder,
    })),
  };
}

// GET /api/packages-public — list all active packages (no auth required)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const packages = await prisma.package.findMany({
      where:   { isActive: true },
      include: PKG_INCLUDE,
      orderBy: [{ eventType: 'asc' }, { tier: 'asc' }],
    });
    res.json({ success: true, data: { packages: packages.map(formatPackage) } });
  } catch (err) {
    console.error('GET /api/packages-public error:', err);
    res.status(500).json({ success: false, message: 'Failed to load packages' });
  }
});

export default router;
