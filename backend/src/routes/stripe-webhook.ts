import { Router, Request, Response } from 'express';
import express from 'express';
import stripe from '../lib/stripe';
import prisma from '../config/database';
import { sendMail } from '../lib/mailer';
import { orderConfirmationEmail, adminNewOrderEmail } from '../lib/email-templates';

const router = Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      res.status(400).json({ error: 'Missing stripe signature or webhook secret' });
      return;
    }

    let event: ReturnType<typeof stripe.webhooks.constructEvent>;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('[Stripe webhook] signature verification failed:', err);
      res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      return;
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object as { id: string; metadata: { orderId?: string } };
          const orderId = pi.metadata?.orderId;
          if (orderId) {
            const existing = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
            // Skip if already confirmed by the confirm-payment endpoint
            if (existing?.status === 'PAID') break;

            await prisma.order.update({
              where: { id: orderId },
              data: { status: 'PAID', paymentStatus: 'SUCCEEDED' },
            });
            await prisma.payment.update({
              where: { orderId },
              data: { status: 'SUCCEEDED', paidAt: new Date() },
            });

            const order = await prisma.order.findUnique({
              where:   { id: orderId },
              include: {
                items: true,
                user:  { select: { name: true, email: true } },
                event: { select: { name: true } },
              },
            });

            // Clear cart now that payment is confirmed
            if (order) {
              await prisma.cartItem.deleteMany({
                where: {
                  userId:    order.userId,
                  productId: { in: order.items.map(i => i.productId) },
                  eventId:   order.eventId ?? null,
                },
              }).catch(() => {});
            }

            if (order?.user?.email) {
              const items = order.items.map(i => ({
                productName: i.productName,
                quantity:    i.quantity,
                unitPrice:   Number(i.unitPrice),
              }));

              const { subject, html } = orderConfirmationEmail({
                customerName:    order.user.name,
                orderNumber:     order.orderNumber,
                totalAmount:     Number(order.totalAmount),
                items,
                eventName:       order.event?.name,
                deliveryAddress: order.deliveryAddress ?? undefined,
              });
              await sendMail({ to: order.user.email, subject, html }).catch(err =>
                console.error('[mailer] confirmation email failed:', err)
              );

              // Admin alert email
              const adminEmail = process.env.ADMIN_EMAIL;
              if (adminEmail) {
                const { subject: aSubject, html: aHtml } = adminNewOrderEmail({
                  orderNumber:   order.orderNumber,
                  customerName:  order.user.name,
                  customerEmail: order.user.email,
                  totalAmount:   Number(order.totalAmount),
                  items,
                  eventName: order.event?.name,
                });
                await sendMail({ to: adminEmail, subject: aSubject, html: aHtml }).catch(err =>
                  console.error('[mailer] admin alert email failed:', err)
                );
              }
            }
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const pi = event.data.object as {
            id: string;
            metadata: { orderId?: string };
            last_payment_error?: { message?: string };
          };
          const orderId = pi.metadata?.orderId;
          if (orderId) {
            await prisma.order.update({
              where: { id: orderId },
              data: { paymentStatus: 'FAILED' },
            });
            await prisma.payment.update({
              where: { orderId },
              data: {
                status: 'FAILED',
                failureReason: pi.last_payment_error?.message ?? 'Payment failed',
              },
            });
          }
          break;
        }

        case 'payment_intent.canceled': {
          const pi = event.data.object as { metadata: { orderId?: string } };
          const orderId = pi.metadata?.orderId;
          if (orderId) {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: 'CANCELED', paymentStatus: 'CANCELED' },
            });
            await prisma.payment.update({
              where: { orderId },
              data: { status: 'CANCELED' },
            });
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[Stripe webhook] handler error:', err);
    }

    res.json({ received: true });
  }
);

export default router;
