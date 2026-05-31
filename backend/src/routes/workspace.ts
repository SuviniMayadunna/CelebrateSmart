import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import prisma from '../config/database';

const router = Router();

// GET /api/workspace/:eventId/dashboard — aggregated summary + readiness score
router.get(
  '/:eventId/dashboard',
  [param('eventId').isUUID()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }

    try {
      const event = await prisma.event.findFirst({
        where: { id: req.params.eventId, userId: req.user!.userId },
        include: {
          plan: { include: { steps: { select: { id: true, isCompleted: true, category: true, weeksBefore: true, title: true, timeOfDay: true } } } },
          orders: {
            where: { status: { in: ['PAID','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'] as any } },
            select: { id: true, totalAmount: true, originalGuestCount: true },
            take: 1,
          },
          budget: { include: { expenses: { select: { amount: true, category: true } } } },
          guestList: { include: { guests: { select: { id: true, status: true } } } },
          visionBoard: { include: { pins: { select: { id: true } } } },
          package: { select: { name: true, tier: true } },
        },
      });

      if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

      const paidOrder   = event.orders[0] ?? null;
      const planSteps   = event.plan?.steps ?? [];
      const allSteps    = planSteps.length;
      const doneSteps   = planSteps.filter((s: any) => s.isCompleted).length;
      const vendorSteps = planSteps.filter((s: any) => s.category !== 'GENERAL').length;
      const doneVendor  = planSteps.filter((s: any) => s.category !== 'GENERAL' && s.isCompleted).length;

      const guests      = event.guestList?.guests ?? [];
      const totalGuests = guests.length;
      const confirmedGuests = guests.filter((g: any) => g.status === 'CONFIRMED').length;

      const totalBudget   = Number(event.budget?.totalBudget ?? 0);
      const totalSpent    = (event.budget?.expenses ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const budgetSet     = totalBudget > 0;
      const pinCount      = event.visionBoard?.pins.length ?? 0;

      // Readiness score components
      const taskScore    = allSteps > 0 ? Math.round((doneSteps / allSteps) * 30) : 0;
      const vendorScore  = vendorSteps > 0 ? Math.round((doneVendor / vendorSteps) * 30) : 0;
      const targetGuests = event.guestCount ?? 1;
      const guestScore   = totalGuests > 0 ? Math.min(20, Math.round((totalGuests / targetGuests) * 20)) : 0;
      const budgetScore  = budgetSet ? 10 : 0;
      const boardScore   = pinCount >= 3 ? 10 : pinCount >= 1 ? 5 : 0;
      const readiness    = taskScore + vendorScore + guestScore + budgetScore + boardScore;

      // Next 5 upcoming plan steps (not complete, sorted)
      const today        = new Date();
      const eventDate    = new Date(event.date);
      const upcomingSteps = planSteps
        .filter((s: any) => !s.isCompleted && s.timeOfDay === null)
        .sort((a: any, b: any) => b.weeksBefore - a.weeksBefore)
        .slice(0, 5)
        .map((s: any) => ({
          id:          s.id,
          title:       s.title,
          weeksBefore: s.weeksBefore,
          dueDate:     new Date(eventDate.getTime() - s.weeksBefore * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }));

      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      res.json({
        success: true,
        data: {
          event: {
            id:         event.id,
            name:       event.name,
            type:       event.type,
            date:       event.date,
            time:       event.time,
            venue:      event.venue,
            guestCount: event.guestCount,
            colorTheme: event.colorTheme,
            packageName: event.package ? `${event.package.name} (${event.package.tier})` : null,
            daysUntil,
          },
          readiness: {
            score:       readiness,
            tasks:       { score: taskScore,   done: doneSteps,     total: allSteps },
            vendors:     { score: vendorScore, done: doneVendor,    total: vendorSteps },
            guests:      { score: guestScore,  confirmed: confirmedGuests, total: totalGuests, target: event.guestCount ?? 0 },
            budget:      { score: budgetScore, isSet: budgetSet },
            visionBoard: { score: boardScore,  pinCount },
          },
          budget: {
            total:     totalBudget,
            spent:     totalSpent,
            remaining: totalBudget > 0 ? totalBudget - totalSpent : null,
            packageCost: paidOrder ? Number(paidOrder.totalAmount) : null,
          },
          guests: {
            total:     totalGuests,
            confirmed: confirmedGuests,
            declined:  guests.filter((g: any) => g.status === 'DECLINED').length,
            pending:   guests.filter((g: any) => g.status === 'PENDING').length,
            invited:   guests.filter((g: any) => g.status === 'INVITED').length,
          },
          upcomingSteps,
          visionBoard: {
            pinCount,
            colorPalette:  event.visionBoard?.colorPalette ?? [],
            styleKeywords: event.visionBoard?.styleKeywords ?? [],
          },
        },
      });
    } catch (err) {
      console.error('GET /workspace/:eventId/dashboard', err);
      res.status(500).json({ success: false, message: 'Failed to load workspace' });
    }
  }
);

export default router;
