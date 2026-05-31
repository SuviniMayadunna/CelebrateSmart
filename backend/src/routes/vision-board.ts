import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';

const router = Router();

async function getBoard(eventId: string, userId: string) {
  return prisma.visionBoard.findFirst({
    where: { eventId, event: { userId } },
    include: { pins: { orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }] } },
  });
}

// GET /api/vision-board/:eventId
router.get('/:eventId', [param('eventId').isUUID()], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
  try {
    const board = await getBoard(req.params.eventId, req.user!.userId);
    if (!board) { res.status(404).json({ success: false, message: 'Vision board not found' }); return; }
    res.json({ success: true, data: { board } });
  } catch (err) {
    console.error('GET /vision-board/:eventId', err);
    res.status(500).json({ success: false, message: 'Failed to load vision board' });
  }
});

// PUT /api/vision-board/:eventId/palette
router.put(
  '/:eventId/palette',
  [param('eventId').isUUID(), body('colorPalette').isArray({ max: 5 })],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const board = await getBoard(req.params.eventId, req.user!.userId);
      if (!board) { res.status(404).json({ success: false, message: 'Vision board not found' }); return; }
      const updated = await prisma.visionBoard.update({
        where: { id: board.id },
        data: { colorPalette: req.body.colorPalette },
      });
      res.json({ success: true, data: { board: updated } });
    } catch (err) {
      console.error('PUT /vision-board/:eventId/palette', err);
      res.status(500).json({ success: false, message: 'Failed to update palette' });
    }
  }
);

// PUT /api/vision-board/:eventId/keywords
router.put(
  '/:eventId/keywords',
  [param('eventId').isUUID(), body('styleKeywords').isArray()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const board = await getBoard(req.params.eventId, req.user!.userId);
      if (!board) { res.status(404).json({ success: false, message: 'Vision board not found' }); return; }
      const updated = await prisma.visionBoard.update({
        where: { id: board.id },
        data: { styleKeywords: req.body.styleKeywords },
      });
      res.json({ success: true, data: { board: updated } });
    } catch (err) {
      console.error('PUT /vision-board/:eventId/keywords', err);
      res.status(500).json({ success: false, message: 'Failed to update keywords' });
    }
  }
);

// POST /api/vision-board/:eventId/pins
router.post(
  '/:eventId/pins',
  [
    param('eventId').isUUID(),
    body('section').isIn(['MOOD','DECOR','OUTFIT','LAYOUT','FOOD','ENTERTAINMENT']),
    body('imageUrl').optional().isString(),
    body('caption').optional().isString().isLength({ max: 200 }),
    body('notes').optional().isString().isLength({ max: 500 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const board = await getBoard(req.params.eventId, req.user!.userId);
      if (!board) { res.status(404).json({ success: false, message: 'Vision board not found' }); return; }
      const maxSort = board.pins.reduce((m, p) => Math.max(m, p.sortOrder), -1);
      const pin = await prisma.visionPin.create({
        data: {
          boardId:  board.id,
          section:  req.body.section,
          imageUrl: req.body.imageUrl ?? null,
          caption:  req.body.caption ?? null,
          notes:    req.body.notes ?? null,
          sortOrder: maxSort + 1,
        },
      });
      res.status(201).json({ success: true, data: { pin } });
    } catch (err) {
      console.error('POST /vision-board/:eventId/pins', err);
      res.status(500).json({ success: false, message: 'Failed to add pin' });
    }
  }
);

// PUT /api/vision-board/:eventId/pins/:pinId
router.put(
  '/:eventId/pins/:pinId',
  [param('eventId').isUUID(), param('pinId').isUUID()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const board = await getBoard(req.params.eventId, req.user!.userId);
      if (!board) { res.status(404).json({ success: false, message: 'Vision board not found' }); return; }
      const pin = board.pins.find(p => p.id === req.params.pinId);
      if (!pin) { res.status(404).json({ success: false, message: 'Pin not found' }); return; }
      const updated = await prisma.visionPin.update({
        where: { id: pin.id },
        data: {
          caption:  req.body.caption  !== undefined ? req.body.caption  : pin.caption,
          notes:    req.body.notes    !== undefined ? req.body.notes    : pin.notes,
          imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : pin.imageUrl,
          section:  req.body.section  !== undefined ? req.body.section  : pin.section,
        },
      });
      res.json({ success: true, data: { pin: updated } });
    } catch (err) {
      console.error('PUT /vision-board/:eventId/pins/:pinId', err);
      res.status(500).json({ success: false, message: 'Failed to update pin' });
    }
  }
);

// DELETE /api/vision-board/:eventId/pins/:pinId
router.delete('/:eventId/pins/:pinId', [param('eventId').isUUID(), param('pinId').isUUID()], async (req: Request, res: Response): Promise<void> => {
  try {
    const board = await getBoard(req.params.eventId, req.user!.userId);
    if (!board) { res.status(404).json({ success: false, message: 'Vision board not found' }); return; }
    const pin = board.pins.find(p => p.id === req.params.pinId);
    if (!pin) { res.status(404).json({ success: false, message: 'Pin not found' }); return; }
    await prisma.visionPin.delete({ where: { id: pin.id } });
    res.json({ success: true, message: 'Pin removed' });
  } catch (err) {
    console.error('DELETE /vision-board/:eventId/pins/:pinId', err);
    res.status(500).json({ success: false, message: 'Failed to delete pin' });
  }
});

export default router;
