import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';

const router = Router();

const VALID_CATEGORIES = ['VENUE','CATERING','PHOTOGRAPHY','DECORATIONS','ENTERTAINMENT','ATTIRE','INVITATIONS','MISCELLANEOUS'];

async function getBudget(eventId: string, userId: string) {
  return prisma.eventBudget.findFirst({
    where: { eventId, event: { userId } },
    include: { expenses: { orderBy: { createdAt: 'asc' } }, event: { select: { name: true } } },
  });
}

async function checkBudgetThresholds(budgetId: string, userId: string, eventId: string, eventName: string) {
  const budget = await prisma.eventBudget.findUnique({
    where: { id: budgetId },
    include: { expenses: { select: { amount: true } } },
  });
  if (!budget || Number(budget.totalBudget) <= 0) return;

  const total = Number(budget.totalBudget);
  const spent = budget.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const pct   = spent / total;

  for (const threshold of [100, 80] as const) {
    if (pct * 100 < threshold) continue;
    const marker = `[budget-alert:${eventId}:${threshold}]`;
    const existing = await prisma.notification.findFirst({ where: { userId, content: { contains: marker } } });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        title:   threshold === 100 ? `⚠️ Budget exceeded for "${eventName}"` : `💸 80% of budget used for "${eventName}"`,
        content: threshold === 100
          ? `You've spent $${spent.toFixed(2)} of your $${total.toFixed(2)} budget — you're over budget. Review your expenses. ${marker}`
          : `You've used 80% ($${spent.toFixed(2)} of $${total.toFixed(2)}) of your event budget. ${marker}`,
      },
    });
  }
}

// GET /api/budget/:eventId
router.get('/:eventId', [param('eventId').isUUID()], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
  try {
    const budget = await getBudget(req.params.eventId, req.user!.userId);
    if (!budget) { res.status(404).json({ success: false, message: 'Budget not found' }); return; }
    const totalSpent = budget.expenses.reduce((s, e) => s + Number(e.amount), 0);
    res.json({
      success: true,
      data: {
        budget: {
          ...budget,
          totalBudget: Number(budget.totalBudget),
          totalSpent,
          remaining:   Number(budget.totalBudget) > 0 ? Number(budget.totalBudget) - totalSpent : null,
          expenses: budget.expenses.map(e => ({ ...e, amount: Number(e.amount) })),
        },
      },
    });
  } catch (err) {
    console.error('GET /budget/:eventId', err);
    res.status(500).json({ success: false, message: 'Failed to load budget' });
  }
});

// PUT /api/budget/:eventId — set total budget
router.put(
  '/:eventId',
  [param('eventId').isUUID(), body('totalBudget').isFloat({ min: 0 })],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const budget = await getBudget(req.params.eventId, req.user!.userId);
      if (!budget) { res.status(404).json({ success: false, message: 'Budget not found' }); return; }
      const updated = await prisma.eventBudget.update({
        where: { id: budget.id },
        data: { totalBudget: req.body.totalBudget },
      });
      res.json({ success: true, data: { budget: { ...updated, totalBudget: Number(updated.totalBudget) } } });
    } catch (err) {
      console.error('PUT /budget/:eventId', err);
      res.status(500).json({ success: false, message: 'Failed to update budget' });
    }
  }
);

// POST /api/budget/:eventId/expenses — add manual expense
router.post(
  '/:eventId/expenses',
  [
    param('eventId').isUUID(),
    body('description').isString().trim().notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('category').isIn(VALID_CATEGORIES),
    body('paidAt').optional().isISO8601(),
    body('receiptNote').optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, message: errors.array()[0].msg }); return; }
    try {
      const budget = await getBudget(req.params.eventId, req.user!.userId);
      if (!budget) { res.status(404).json({ success: false, message: 'Budget not found' }); return; }
      const expense = await prisma.budgetExpense.create({
        data: {
          budgetId:    budget.id,
          description: req.body.description,
          amount:      req.body.amount,
          category:    req.body.category,
          paidAt:      req.body.paidAt ? new Date(req.body.paidAt) : null,
          receiptNote: req.body.receiptNote ?? null,
          source:      'MANUAL',
        },
      });
      checkBudgetThresholds(budget.id, req.user!.userId, req.params.eventId, (budget as any).event?.name ?? 'your event').catch(() => {});
      res.status(201).json({ success: true, data: { expense: { ...expense, amount: Number(expense.amount) } } });
    } catch (err) {
      console.error('POST /budget/:eventId/expenses', err);
      res.status(500).json({ success: false, message: 'Failed to add expense' });
    }
  }
);

// PUT /api/budget/:eventId/expenses/:expenseId
router.put(
  '/:eventId/expenses/:expenseId',
  [param('eventId').isUUID(), param('expenseId').isUUID()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const budget = await getBudget(req.params.eventId, req.user!.userId);
      if (!budget) { res.status(404).json({ success: false, message: 'Budget not found' }); return; }
      const expense = budget.expenses.find(e => e.id === req.params.expenseId);
      if (!expense) { res.status(404).json({ success: false, message: 'Expense not found' }); return; }
      const updated = await prisma.budgetExpense.update({
        where: { id: expense.id },
        data: {
          description: req.body.description ?? expense.description,
          amount:      req.body.amount      ?? expense.amount,
          category:    req.body.category    ?? expense.category,
          paidAt:      req.body.paidAt !== undefined ? (req.body.paidAt ? new Date(req.body.paidAt) : null) : expense.paidAt,
          receiptNote: req.body.receiptNote !== undefined ? req.body.receiptNote : expense.receiptNote,
        },
      });
      if (req.body.amount !== undefined) {
        checkBudgetThresholds(budget.id, req.user!.userId, req.params.eventId, (budget as any).event?.name ?? 'your event').catch(() => {});
      }
      res.json({ success: true, data: { expense: { ...updated, amount: Number(updated.amount) } } });
    } catch (err) {
      console.error('PUT /budget/:eventId/expenses/:expenseId', err);
      res.status(500).json({ success: false, message: 'Failed to update expense' });
    }
  }
);

// DELETE /api/budget/:eventId/expenses/:expenseId
router.delete('/:eventId/expenses/:expenseId', [param('eventId').isUUID(), param('expenseId').isUUID()], async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await getBudget(req.params.eventId, req.user!.userId);
    if (!budget) { res.status(404).json({ success: false, message: 'Budget not found' }); return; }
    const expense = budget.expenses.find(e => e.id === req.params.expenseId);
    if (!expense) { res.status(404).json({ success: false, message: 'Expense not found' }); return; }
    await prisma.budgetExpense.delete({ where: { id: expense.id } });
    res.json({ success: true, message: 'Expense removed' });
  } catch (err) {
    console.error('DELETE /budget/:eventId/expenses/:expenseId', err);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
});

export default router;
