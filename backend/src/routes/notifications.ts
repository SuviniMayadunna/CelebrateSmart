import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import prisma from '../config/database';

const router = Router();

function formatNotification(n: any) {
  return {
    id:        n.id,
    title:     n.title,
    content:   n.content,
    isRead:    n.isRead,
    readAt:    n.readAt ? (n.readAt instanceof Date ? n.readAt.toISOString() : String(n.readAt)) : null,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
  };
}

// GET /api/notifications — list for authenticated user (newest first)
router.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where:   { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      data: {
        notifications: notifications.map(formatNotification),
        unreadCount,
      },
    });
  } catch (err) {
    console.error('GET /notifications', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count — lightweight badge count
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('GET /notifications/unread-count', err);
    res.status(500).json({ success: false, message: 'Failed to fetch count' });
  }
});

// PATCH /api/notifications/:id/read — mark single notification as read
router.patch(
  '/:id/read',
  [param('id').isUUID().withMessage('Invalid notification ID')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const existing = await prisma.notification.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      const updated = await prisma.notification.update({
        where: { id: existing.id },
        data:  { isRead: true, readAt: new Date() },
      });

      res.json({ success: true, data: { notification: formatNotification(updated) } });
    } catch (err) {
      console.error('PATCH /notifications/:id/read', err);
      res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
  }
);

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data:  { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('PATCH /notifications/read-all', err);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

export default router;
