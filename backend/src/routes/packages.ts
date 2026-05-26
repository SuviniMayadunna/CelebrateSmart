import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

const PRODUCT_SELECT = {
  id: true, sku: true, name: true, description: true,
  category: true, imageUrl: true, venueAddress: true, price: true,
};

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
      sku:       item.product.sku,
      name:      item.product.name,
      description: item.product.description,
      category:  item.product.category,
      imageUrl:  item.product.imageUrl,
      price:     Number(item.product.price),
      quantity:  item.quantity,
      isCore:    item.isCore,
    })),
    photos: (pkg.photos ?? []).map((ph: any) => ({
      id:       ph.id,
      url:      ph.url,
      caption:  ph.caption ?? null,
      sortOrder: ph.sortOrder,
    })),
  };
}

const PKG_INCLUDE = {
  items: { include: { product: { select: PRODUCT_SELECT } }, orderBy: { sortOrder: 'asc' as const } },
  photos: { orderBy: { sortOrder: 'asc' as const } },
} as const;

// GET /api/packages?eventType=BIRTHDAY
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventType = req.query.eventType as string | undefined;
    const packages = await prisma.package.findMany({
      where: { isActive: true, ...(eventType && { eventType: eventType.toUpperCase() }) },
      include: PKG_INCLUDE,
      orderBy: { tier: 'asc' },
    });
    res.json({ success: true, data: { packages: packages.map(formatPackage) } });
  } catch (err) {
    console.error('Get packages error:', err);
    res.status(500).json({ success: false, message: 'Failed to load packages' });
  }
});

// GET /api/packages/event-types — distinct event types that have active packages
router.get('/event-types', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.package.findMany({
      where: { isActive: true }, select: { eventType: true }, distinct: ['eventType'],
    });
    res.json({ success: true, data: { eventTypes: rows.map(r => r.eventType) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load event types' });
  }
});

// GET /api/packages/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: req.params.id },
      include: PKG_INCLUDE,
    });
    if (!pkg || !pkg.isActive) { res.status(404).json({ success: false, message: 'Package not found' }); return; }
    res.json({ success: true, data: { package: formatPackage(pkg) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load package' });
  }
});

export default router;
