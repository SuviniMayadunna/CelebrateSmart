import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

const TASK_DISPLAY: Record<string, string> = {
  CAKE:                'Cake',
  DECORATIONS:         'Decorations',
  FOOD:                'Food & Drinks',
  ENTERTAINMENT:       'Entertainment',
  PHOTOGRAPHY:         'Photography',
  GIFTS:               'Gifts',
  VENUE:               'Venue',
  FLOWERS:             'Flowers',
  CELEBRATION_DINNER:  'Celebration Dinner',
  GAMES:               'Games',
  PARTY_FAVORS:        'Party Favors',
  GAMES_AND_ACTIVITIES:'Games & Activities',
};

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      include: {
        steps: {
          orderBy: { sortOrder: 'asc' },
          select: { title: true, category: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: {
        templates: templates.map(t => ({
          id:          t.id,
          slug:        t.slug,
          name:        t.name,
          emoji:       t.emoji,
          description: t.description,
          steps:       t.steps.map(s => TASK_DISPLAY[s.category] ?? s.title),
        })),
      },
    });
  } catch (error) {
    console.error('GET /templates', error);
    res.status(500).json({ success: false, message: 'Failed to load templates' });
  }
});

export default router;
