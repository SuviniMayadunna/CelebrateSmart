import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth';

const router = Router();

const VALID_STATUSES  = ['INVITED','CONFIRMED','DECLINED','PENDING','ATTENDED','NO_SHOW'];
const VALID_CATEGORIES = ['FAMILY','RELATIVES','FRIENDS','COLLEAGUES','VIP','KIDS'];

async function getGuestList(eventId: string, userId: string) {
  return prisma.guestList.findFirst({
    where: { eventId, event: { userId } },
    include: { guests: { orderBy: { createdAt: 'asc' } } },
  });
}

function headcount(guests: any[]) {
  return guests.reduce((s, g) => s + 1 + (g.plusOnes ?? 0), 0);
}

function guestStats(guests: any[]) {
  return {
    total:          headcount(guests),
    invited:        headcount(guests.filter(g => g.status === 'INVITED')),
    confirmed:      headcount(guests.filter(g => g.status === 'CONFIRMED')),
    declined:       headcount(guests.filter(g => g.status === 'DECLINED')),
    pending:        headcount(guests.filter(g => g.status === 'PENDING')),
    attended:       headcount(guests.filter(g => g.status === 'ATTENDED')),
    totalAttending: headcount(guests.filter(g => g.status === 'CONFIRMED')),
  };
}

// GET /api/guests/:eventId
router.get('/:eventId', authenticate, [param('eventId').isUUID()], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
  try {
    const list = await getGuestList(req.params.eventId, req.user!.userId);
    if (!list) { res.status(404).json({ success: false, message: 'Guest list not found' }); return; }
    res.json({ success: true, data: { guests: list.guests, stats: guestStats(list.guests), guestListId: list.id } });
  } catch (err) {
    console.error('GET /guests/:eventId', err);
    res.status(500).json({ success: false, message: 'Failed to load guests' });
  }
});

// POST /api/guests/:eventId — add single guest
router.post(
  '/:eventId',
  authenticate,
  [
    param('eventId').isUUID(),
    body('name').isString().trim().notEmpty(),
    body('email').optional({ nullable: true }).isEmail(),
    body('phone').optional({ nullable: true }).isString(),
    body('category').optional().isIn(VALID_CATEGORIES),
    body('plusOnes').optional().isInt({ min: 0 }),
    body('notes').optional().isString(),
    body('tableNumber').optional().isString(),
    body('mealPreference').optional().isString(),
    body('dietaryRestrictions').optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const list = await getGuestList(req.params.eventId, req.user!.userId);
      if (!list) { res.status(404).json({ success: false, message: 'Guest list not found' }); return; }
      const guest = await prisma.guest.create({
        data: {
          guestListId:         list.id,
          name:                req.body.name,
          email:               req.body.email  ?? null,
          phone:               req.body.phone  ?? null,
          category:            req.body.category ?? 'FRIENDS',
          plusOnes:            req.body.plusOnes ?? 0,
          notes:               req.body.notes ?? null,
          tableNumber:         req.body.tableNumber ?? null,
          mealPreference:      req.body.mealPreference ?? null,
          dietaryRestrictions: req.body.dietaryRestrictions ?? null,
          status:              'PENDING',
          rsvpToken:           crypto.randomBytes(16).toString('hex'),
        },
      });
      res.status(201).json({ success: true, data: { guest } });
    } catch (err) {
      console.error('POST /guests/:eventId', err);
      res.status(500).json({ success: false, message: 'Failed to add guest' });
    }
  }
);

// POST /api/guests/:eventId/import — bulk import from CSV text
router.post(
  '/:eventId/import',
  authenticate,
  [param('eventId').isUUID(), body('csv').isString().notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const list = await getGuestList(req.params.eventId, req.user!.userId);
      if (!list) { res.status(404).json({ success: false, message: 'Guest list not found' }); return; }

      const lines = (req.body.csv as string).trim().split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { res.status(400).json({ success: false, message: 'CSV must have a header row and at least one data row' }); return; }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s-]/g, ''));
      const col = (row: string[], name: string) => {
        const i = headers.indexOf(name);
        return i >= 0 ? (row[i] ?? '').trim().replace(/^"|"$/g, '') : '';
      };

      const rows = lines.slice(1).map(line => {
        // Handle quoted fields containing commas
        const fields: string[] = [];
        let cur = '', inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
          else { cur += ch; }
        }
        fields.push(cur);
        return fields;
      });

      let imported = 0, skipped = 0;
      for (const row of rows) {
        const name = col(row, 'name');
        if (!name) { skipped++; continue; }
        const rawCategory = col(row, 'category').toUpperCase();
        const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'FRIENDS';
        const plusOnes  = parseInt(col(row, 'plusones') || col(row, 'plusones') || '0') || 0;
        await prisma.guest.create({
          data: {
            guestListId:         list.id,
            name,
            email:               col(row, 'email')               || null,
            phone:               col(row, 'phone')               || null,
            category:            category as any,
            plusOnes,
            tableNumber:         col(row, 'tablenumber')         || null,
            mealPreference:      col(row, 'mealpreference')      || null,
            dietaryRestrictions: col(row, 'dietaryrestrictions') || null,
            notes:               col(row, 'notes')               || null,
            status:              'PENDING',
            rsvpToken:           crypto.randomBytes(16).toString('hex'),
          },
        });
        imported++;
      }
      res.json({ success: true, data: { imported, skipped } });
    } catch (err) {
      console.error('POST /guests/:eventId/import', err);
      res.status(500).json({ success: false, message: 'Failed to import guests' });
    }
  }
);

// PUT /api/guests/:eventId/:guestId
router.put(
  '/:eventId/:guestId',
  authenticate,
  [param('eventId').isUUID(), param('guestId').isUUID()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await getGuestList(req.params.eventId, req.user!.userId);
      if (!list) { res.status(404).json({ success: false, message: 'Guest list not found' }); return; }
      const guest = list.guests.find(g => g.id === req.params.guestId);
      if (!guest) { res.status(404).json({ success: false, message: 'Guest not found' }); return; }

      const data: any = {};
      if (req.body.name                !== undefined) data.name                = req.body.name;
      if (req.body.email               !== undefined) data.email               = req.body.email;
      if (req.body.phone               !== undefined) data.phone               = req.body.phone;
      if (req.body.status              !== undefined) data.status              = req.body.status;
      if (req.body.category            !== undefined) data.category            = req.body.category;
      if (req.body.tableNumber         !== undefined) data.tableNumber         = req.body.tableNumber;
      if (req.body.mealPreference      !== undefined) data.mealPreference      = req.body.mealPreference;
      if (req.body.dietaryRestrictions !== undefined) data.dietaryRestrictions = req.body.dietaryRestrictions;
      if (req.body.plusOnes            !== undefined) data.plusOnes            = req.body.plusOnes;
      if (req.body.notes               !== undefined) data.notes               = req.body.notes;
      if (req.body.invitationSentAt    !== undefined) data.invitationSentAt    = req.body.invitationSentAt ? new Date(req.body.invitationSentAt) : null;
      if (req.body.status && !guest.rsvpAt && ['CONFIRMED','DECLINED'].includes(req.body.status)) {
        data.rsvpAt = new Date();
      }

      const updated = await prisma.guest.update({ where: { id: guest.id }, data });
      res.json({ success: true, data: { guest: updated } });
    } catch (err) {
      console.error('PUT /guests/:eventId/:guestId', err);
      res.status(500).json({ success: false, message: 'Failed to update guest' });
    }
  }
);

// DELETE /api/guests/:eventId/:guestId
router.delete('/:eventId/:guestId', authenticate, [param('eventId').isUUID(), param('guestId').isUUID()], async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await getGuestList(req.params.eventId, req.user!.userId);
    if (!list) { res.status(404).json({ success: false, message: 'Guest list not found' }); return; }
    const guest = list.guests.find(g => g.id === req.params.guestId);
    if (!guest) { res.status(404).json({ success: false, message: 'Guest not found' }); return; }
    await prisma.guest.delete({ where: { id: guest.id } });
    res.json({ success: true, message: 'Guest removed' });
  } catch (err) {
    console.error('DELETE /guests/:eventId/:guestId', err);
    res.status(500).json({ success: false, message: 'Failed to remove guest' });
  }
});

// ── Public RSVP endpoint (no auth required) ───────────────────────────────────

// GET /api/guests/rsvp/:token — get event info for RSVP page
router.get('/rsvp/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const guest = await prisma.guest.findUnique({
      where: { rsvpToken: req.params.token },
      include: { guestList: { include: { event: { select: { name: true, date: true, venue: true, type: true } } } } },
    });
    if (!guest) { res.status(404).json({ success: false, message: 'RSVP link not found' }); return; }
    res.json({
      success: true,
      data: {
        guestName: guest.name,
        currentStatus: guest.status,
        event: guest.guestList.event,
      },
    });
  } catch (err) {
    console.error('GET /guests/rsvp/:token', err);
    res.status(500).json({ success: false, message: 'Failed to load RSVP' });
  }
});

// PUT /api/guests/rsvp/:token — guest updates their own status
router.put(
  '/rsvp/:token',
  [body('status').isIn(['CONFIRMED','DECLINED'])],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const guest = await prisma.guest.findUnique({ where: { rsvpToken: req.params.token } });
      if (!guest) { res.status(404).json({ success: false, message: 'RSVP link not found' }); return; }
      await prisma.guest.update({
        where: { id: guest.id },
        data: { status: req.body.status, rsvpAt: new Date() },
      });
      res.json({ success: true, message: req.body.status === 'CONFIRMED' ? 'You are confirmed!' : 'Response recorded.' });
    } catch (err) {
      console.error('PUT /guests/rsvp/:token', err);
      res.status(500).json({ success: false, message: 'Failed to submit RSVP' });
    }
  }
);

export default router;
