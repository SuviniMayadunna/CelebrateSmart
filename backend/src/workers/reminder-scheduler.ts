import prisma from '../config/database';
import { sendMail } from '../lib/mailer';
import { eventReminderEmail, venueConfirmationEmail } from '../lib/email-templates';

interface ReminderSlot {
  key:     string;
  emoji:   string;
  label:   string;
  minDays: number;
  maxDays: number;
}

// Windows: 6.5–7.5 days out = 7-day reminder; 2.5–3.5 = 3-day reminder
const COUNTDOWN_SLOTS: ReminderSlot[] = [
  { key: '7day', emoji: '📅', label: 'One Week to Go',  minDays: 6.5, maxDays: 7.5 },
  { key: '3day', emoji: '⏰', label: '3 Days to Go',    minDays: 2.5, maxDays: 3.5 },
];

// 24-hour venue confirmation window: 22–26 hours before event
const VENUE_CONFIRM_MIN_HOURS = 22;
const VENUE_CONFIRM_MAX_HOURS = 26;

async function runReminders(): Promise<void> {
  const now = new Date();
  const in8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  // Fetch all upcoming active events in the next 8 days
  const events = await prisma.event.findMany({
    where: {
      date:   { gte: now, lte: in8Days },
      status: { in: ['PLANNING', 'READY'] as any[] },
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  for (const event of events) {
    const eventDate   = new Date(event.date);
    const msUntil     = eventDate.getTime() - now.getTime();
    const hoursUntil  = msUntil / (1000 * 60 * 60);
    const daysUntil   = hoursUntil / 24;
    const dateStr     = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // ── Countdown reminders (7-day and 3-day) ──────────────────────────────
    for (const slot of COUNTDOWN_SLOTS) {
      if (daysUntil < slot.minDays || daysUntil > slot.maxDays) continue;

      const marker = `[sched:${slot.key}:${event.id}]`;
      const alreadySent = await prisma.notification.findFirst({
        where: { userId: event.userId, content: { contains: marker } },
      });
      if (alreadySent) continue;

      const daysRounded = Math.round(daysUntil);
      const title   = `${slot.emoji} ${slot.label} — ${event.name}`;
      const content = `Your "${event.name}" is coming up in ${daysRounded} day${daysRounded !== 1 ? 's' : ''} on ${dateStr}. Review your event plan and confirm everything is on track! ${marker}`;

      await prisma.notification.create({ data: { userId: event.userId, title, content } });

      if (event.user?.email) {
        const { subject, html } = eventReminderEmail({
          customerName: event.user.name,
          eventName:    event.name,
          eventType:    event.type,
          eventDate:    dateStr,
          venue:        event.venue,
          daysUntil:    daysRounded,
        });
        await sendMail({ to: event.user.email, subject, html }).catch(err =>
          console.error('[reminder-scheduler] countdown email failed:', err)
        );
      }

      console.log(`[reminder-scheduler] ${slot.key} reminder sent → event "${event.name}" (${event.userId})`);
    }

    // ── 24-hour venue confirmation reminder ────────────────────────────────
    if (hoursUntil >= VENUE_CONFIRM_MIN_HOURS && hoursUntil <= VENUE_CONFIRM_MAX_HOURS) {
      const marker = `[sched:venue-confirm:${event.id}]`;
      const alreadySent = await prisma.notification.findFirst({
        where: { userId: event.userId, content: { contains: marker } },
      });
      if (alreadySent) continue;

      const title   = `📍 Venue Confirmation — ${event.name}`;
      const content = `Your "${event.name}" is tomorrow (${dateStr})! Please confirm your venue "${event.venue || 'venue'}" is fully booked and ready. Check in with your vendors and have a wonderful celebration! ${marker}`;

      await prisma.notification.create({ data: { userId: event.userId, title, content } });

      if (event.user?.email) {
        const { subject, html } = venueConfirmationEmail({
          customerName: event.user.name,
          eventName:    event.name,
          eventType:    event.type,
          eventDate:    dateStr,
          eventTime:    event.time,
          venue:        event.venue,
        });
        await sendMail({ to: event.user.email, subject, html }).catch(err =>
          console.error('[reminder-scheduler] venue confirm email failed:', err)
        );
      }

      console.log(`[reminder-scheduler] venue-confirm reminder sent → event "${event.name}" (${event.userId})`);
    }
  }
}

export function startReminderScheduler(): void {
  console.log('[reminder-scheduler] Started — checking every hour');

  // Run once immediately so reminders fire on server start
  runReminders().catch(err => console.error('[reminder-scheduler] initial run error:', err));

  // Then repeat every hour
  setInterval(() => {
    runReminders().catch(err => console.error('[reminder-scheduler] scheduled run error:', err));
  }, 60 * 60 * 1000);
}
