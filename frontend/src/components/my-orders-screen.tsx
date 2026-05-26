import { useEffect, useState } from 'react';
import { AppScreen } from '@/App';
import { ordersAPI } from '@/lib/api';
import type { Order } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ChevronDown, ChevronUp, ShoppingBag, CalendarCheck, Store, Package, CheckCircle2, Circle, XCircle } from 'lucide-react';

interface MyOrdersScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  PAID:             { label: 'Confirmed',         bg: 'hsl(142,60%,94%)', color: 'hsl(142,65%,22%)' },
  PREPARING:        { label: 'Preparing',         bg: 'hsl(210,80%,94%)', color: 'hsl(210,75%,25%)' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup',  bg: 'hsl(270,60%,94%)', color: 'hsl(270,55%,35%)' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  bg: 'hsl(32,90%,94%)',  color: 'hsl(32,80%,30%)' },
  DELIVERED:        { label: 'Delivered',         bg: 'hsl(155,30%,95%)', color: 'hsl(155,42%,20%)' },
  CANCELED:         { label: 'Canceled',          bg: 'hsl(0,60%,95%)',   color: 'hsl(0,65%,35%)' },
};

const EVENT_EMOJIS: Record<string, string> = {
  BIRTHDAY: '🎂', WEDDING: '💒', PROPOSAL: '💍', BABY_SHOWER: '🍼', KIDS_PARTY: '🎈',
};

const CATEGORY_EMOJI: Record<string, string> = {
  CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️',
  GIFTS: '🎁', PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Delivery pipeline ─────────────────────────────────────────────────────────
const PIPELINE_STEPS: { key: string; label: string; emoji: string }[] = [
  { key: 'PAID',             label: 'Confirmed',   emoji: '✅' },
  { key: 'PREPARING',        label: 'Preparing',   emoji: '🔧' },
  { key: 'READY_FOR_PICKUP', label: 'Ready',       emoji: '📦' },
  { key: 'OUT_FOR_DELIVERY', label: 'On Its Way',  emoji: '🚚' },
  { key: 'DELIVERED',        label: 'Delivered',   emoji: '🎉' },
];
const STEP_INDEX: Record<string, number> = Object.fromEntries(PIPELINE_STEPS.map((s, i) => [s.key, i]));

function OrderPipeline({ status }: { status: string }) {
  if (status === 'CANCELED') {
    return (
      <div className='flex items-center gap-2 py-3 px-4 rounded-xl mt-1'
        style={{ background: 'hsl(0,60%,97%)', border: '1px solid hsl(0,60%,88%)' }}>
        <XCircle className='w-4 h-4 shrink-0' style={{ color: 'hsl(0,65%,45%)' }} />
        <span className='text-xs font-semibold' style={{ color: 'hsl(0,65%,35%)', fontFamily: 'Inter, sans-serif' }}>
          This order has been canceled
        </span>
      </div>
    );
  }

  const currentIdx = STEP_INDEX[status] ?? 0;

  return (
    <div className='pt-3 pb-1'>
      <p className='text-xs uppercase tracking-widest font-bold mb-3'
        style={{ color: 'hsl(155,25%,42%)', fontFamily: 'Inter, sans-serif' }}>
        Order Progress
      </p>
      <div className='relative flex items-start justify-between'>
        {/* Connector line */}
        <div className='absolute top-4 left-0 right-0 h-0.5 mx-4'
          style={{ background: 'hsl(150,12%,88%)' }} />
        <div
          className='absolute top-4 left-0 h-0.5 mx-4 transition-all duration-500'
          style={{
            background: 'linear-gradient(90deg, hsl(155,42%,30%), hsl(155,33%,42%))',
            width: currentIdx === 0 ? '0%' : `${(currentIdx / (PIPELINE_STEPS.length - 1)) * 100}%`,
          }}
        />

        {PIPELINE_STEPS.map((step, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className='relative flex flex-col items-center gap-1.5 z-10' style={{ flex: 1 }}>
              {/* Circle */}
              <div
                className='w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300'
                style={{
                  background: done    ? 'hsl(155,42%,25%)'
                              : active  ? 'white'
                              : 'hsl(150,12%,94%)',
                  border: done    ? '2px solid hsl(155,42%,25%)'
                          : active  ? '2.5px solid hsl(155,42%,25%)'
                          : '2px solid hsl(150,12%,82%)',
                  boxShadow: active ? '0 0 0 3px hsl(155,42%,90%)' : 'none',
                }}
              >
                {done ? (
                  <CheckCircle2 className='w-4 h-4' style={{ color: 'white' }} />
                ) : active ? (
                  <span className='text-sm'>{step.emoji}</span>
                ) : (
                  <Circle className='w-3.5 h-3.5' style={{ color: 'hsl(150,10%,72%)' }} />
                )}
              </div>
              {/* Label */}
              <span
                className='text-center leading-tight'
                style={{
                  fontSize: '10px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: active ? 700 : done ? 600 : 400,
                  color: active    ? 'hsl(155,42%,20%)'
                         : done    ? 'hsl(155,30%,35%)'
                         : 'hsl(150,8%,62%)',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Package booking card ──────────────────────────────────────────────────────
function PackageOrderCard({ order, index }: { order: Order; index: number }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PAID;

  return (
    <div
      className='bg-white rounded-2xl overflow-hidden animate-fade-in'
      style={{ border: '2px solid hsl(43,65%,75%)', animationDelay: `${index * 0.05}s` }}
    >
      {/* Gold top accent */}
      <div className='h-1' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />

      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        className='w-full px-6 py-5 flex items-center gap-4 text-left transition-colors hover:bg-amber-50/40'
      >
        {/* Icon */}
        <div className='w-11 h-11 rounded-xl flex items-center justify-center shrink-0'
          style={{ background: 'hsl(43,74%,95%)', border: '1.5px solid hsl(43,65%,80%)' }}>
          <CalendarCheck className='w-5 h-5' style={{ color: 'hsl(43,60%,35%)' }} />
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-center gap-2 mb-0.5'>
            <span className='text-xs font-bold px-2 py-0.5 rounded-full'
              style={{ background: 'hsl(43,74%,92%)', color: 'hsl(43,60%,25%)', fontFamily: 'Inter, sans-serif' }}>
              📦 Package Booking
            </span>
            <Badge className='text-xs font-semibold px-2 py-0.5'
              style={{ background: status.bg, color: status.color, border: 'none' }}>
              {status.label}
            </Badge>
          </div>
          <p className='font-semibold text-sm mt-1' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
            {order.eventName
              ? <>{EVENT_EMOJIS[order.eventType ?? ''] ?? '🎉'} {order.eventName}</>
              : `Order #${order.orderNumber}`
            }
          </p>
          <p className='text-xs mt-0.5' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
            #{order.orderNumber} · {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Total + chevron */}
        <div className='flex items-center gap-3 shrink-0'>
          <span className='font-serif text-lg font-bold' style={{ color: 'hsl(43,60%,30%)' }}>
            ${order.totalAmount.toLocaleString()}
          </span>
          {open
            ? <ChevronUp className='w-4 h-4' style={{ color: 'hsl(155,22%,46%)' }} />
            : <ChevronDown className='w-4 h-4' style={{ color: 'hsl(155,22%,46%)' }} />
          }
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className='border-t px-6 pb-5 pt-4 space-y-2.5'
          style={{ borderColor: 'hsl(43,50%,85%)', background: 'hsl(43,60%,99%)' }}>
          <OrderPipeline status={order.status} />

          {/* Event details */}
          {(order.eventDate || order.eventTime || order.eventGuestCount || order.eventColorTheme) && (
            <div className='flex flex-wrap gap-2 mt-3'>
              {order.eventDate && (
                <span className='flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full'
                  style={{ background: 'hsl(210,80%,94%)', color: 'hsl(210,75%,28%)', fontFamily: 'Inter, sans-serif' }}>
                  📅 {new Date(order.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
              {order.eventTime && (
                <span className='flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full'
                  style={{ background: 'hsl(270,60%,94%)', color: 'hsl(270,55%,35%)', fontFamily: 'Inter, sans-serif' }}>
                  🕐 {order.eventTime}
                </span>
              )}
              {order.eventGuestCount && (
                <span className='flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full'
                  style={{ background: 'hsl(43,74%,93%)', color: 'hsl(43,60%,28%)', fontFamily: 'Inter, sans-serif' }}>
                  👥 {order.eventGuestCount} guests
                </span>
              )}
              {order.eventColorTheme && (
                <span className='flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full'
                  style={{ background: 'hsl(155,25%,94%)', color: 'hsl(155,38%,22%)', fontFamily: 'Inter, sans-serif' }}>
                  🎨 {order.eventColorTheme}
                </span>
              )}
            </div>
          )}

          <p className='text-xs uppercase tracking-widest font-bold mb-3 mt-4'
            style={{ color: 'hsl(43,60%,35%)', fontFamily: 'Inter, sans-serif' }}>
            Package Items
          </p>
          {order.items.map(item => (
            <div key={item.id} className='flex items-center gap-3'>
              <span className='text-xl w-7 text-center'>{CATEGORY_EMOJI[item.categoryName] ?? '🎉'}</span>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold truncate'
                  style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
                  {item.productName}
                </p>
                <p className='text-xs' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                  Qty {item.quantity} · ${item.unitPrice.toLocaleString()} each
                </p>
              </div>
              <span className='text-sm font-bold shrink-0'
                style={{ color: 'hsl(43,60%,30%)', fontFamily: 'Inter, sans-serif' }}>
                ${(item.unitPrice * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          <div className='mt-3 pt-3 flex justify-between items-center border-t'
            style={{ borderColor: 'hsl(43,50%,85%)' }}>
            <span className='text-sm font-bold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
              Total Paid
            </span>
            <span className='font-serif text-base font-bold' style={{ color: 'hsl(43,60%,30%)' }}>
              ${order.totalAmount.toLocaleString()}
            </span>
          </div>
          {['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) && (
            <p className='text-xs text-center pt-1' style={{ color: 'hsl(155,30%,42%)', fontFamily: 'Inter, sans-serif' }}>
              ✓ Your event plan is active — view it in <strong>My Events</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Regular shop order card ───────────────────────────────────────────────────
function ShopOrderCard({ order, index }: { order: Order; index: number }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <div
      className='bg-white rounded-2xl overflow-hidden animate-fade-in'
      style={{ border: '1px solid hsl(150,12%,88%)', animationDelay: `${index * 0.05}s` }}
    >
      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        className='w-full px-6 py-5 flex items-center gap-4 text-left transition-colors hover:bg-green-50/30'
      >
        <div className='w-11 h-11 rounded-xl flex items-center justify-center shrink-0'
          style={{ background: 'hsl(155,30%,95%)', border: '1.5px solid hsl(150,12%,88%)' }}>
          <ShoppingBag className='w-5 h-5' style={{ color: 'hsl(155,38%,27%)' }} />
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-center gap-2 mb-0.5'>
            <span className='font-semibold text-sm' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
              #{order.orderNumber}
            </span>
            <Badge className='text-xs font-semibold px-2 py-0.5'
              style={{ background: status.bg, color: status.color, border: 'none' }}>
              {status.label}
            </Badge>
          </div>
          <p className='text-xs' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
            {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className='flex items-center gap-3 shrink-0'>
          <span className='font-serif text-lg font-bold' style={{ color: 'hsl(43,60%,30%)' }}>
            ${order.totalAmount.toFixed(2)}
          </span>
          {open
            ? <ChevronUp className='w-4 h-4' style={{ color: 'hsl(155,22%,46%)' }} />
            : <ChevronDown className='w-4 h-4' style={{ color: 'hsl(155,22%,46%)' }} />
          }
        </div>
      </button>

      {open && (
        <div className='border-t px-6 pb-5 pt-4 space-y-2.5'
          style={{ borderColor: 'hsl(150,12%,88%)', background: 'hsl(150,15%,99%)' }}>
          <OrderPipeline status={order.status} />
          <p className='text-xs uppercase tracking-widest font-bold mb-3 mt-4'
            style={{ color: 'hsl(155,25%,42%)', fontFamily: 'Inter, sans-serif' }}>
            Order Items
          </p>
          {order.items.map(item => (
            <div key={item.id} className='flex items-center gap-3'>
              <span className='text-xl w-7 text-center'>{CATEGORY_EMOJI[item.categoryName] ?? '🎉'}</span>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold truncate'
                  style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
                  {item.productName}
                </p>
                <p className='text-xs' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                  Qty {item.quantity} · ${item.unitPrice.toFixed(2)} each
                </p>
              </div>
              <span className='text-sm font-bold shrink-0'
                style={{ color: 'hsl(155,38%,27%)', fontFamily: 'Inter, sans-serif' }}>
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className='mt-4 pt-3 border-t space-y-1' style={{ borderColor: 'hsl(150,12%,88%)' }}>
            <div className='flex justify-between text-xs' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
              <span>Subtotal</span><span>${(order.totalAmount / 1.1).toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-xs' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
              <span>Tax (10%)</span><span>${(order.totalAmount - order.totalAmount / 1.1).toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center pt-1'>
              <span className='text-sm font-bold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>Total</span>
              <span className='font-serif text-base font-bold' style={{ color: 'hsl(43,60%,30%)' }}>
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function MyOrdersScreen({ onNavigate }: MyOrdersScreenProps) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.list()
      .then(res => setOrders(res.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const packageOrders = orders.filter(o => o.eventId !== null);
  const shopOrders    = orders.filter(o => o.eventId === null);

  return (
    <div className='min-h-screen' style={{ background: 'hsl(150,15%,97%)' }}>
      <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>

        {/* Header */}
        <div className='mb-8 animate-fade-in'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs uppercase tracking-widest font-semibold'
              style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
              Purchase History
            </span>
          </div>
          <h1 className='font-serif text-4xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>My Orders</h1>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-24'>
            <Spinner className='size-6' style={{ color: 'hsl(155,38%,27%)' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className='rounded-3xl border-2 border-dashed flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in'
            style={{ borderColor: 'hsl(150,18%,86%)', background: 'hsl(150,12%,99%)' }}>
            <p className='text-5xl mb-4'>📦</p>
            <h3 className='font-serif text-2xl font-bold mb-2' style={{ color: 'hsl(155,42%,17%)' }}>No orders yet</h3>
            <p className='text-sm mb-6' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
              Your package bookings and shop purchases will appear here
            </p>
            <div className='flex gap-3 flex-wrap justify-center'>
              <Button onClick={() => onNavigate('package-picker')}
                className='rounded-xl font-semibold gap-2 transition-all hover:scale-105'
                style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}>
                <Package className='w-4 h-4' />
                Book a Package
              </Button>
              <Button onClick={() => onNavigate('shop')} variant='outline'
                className='rounded-xl font-semibold gap-2 transition-all hover:scale-105'
                style={{ borderColor: 'hsl(150,12%,82%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>
                <Store className='w-4 h-4' />
                Browse Shop
              </Button>
            </div>
          </div>
        ) : (
          <div className='space-y-8'>

            {/* Package Bookings section */}
            {packageOrders.length > 0 && (
              <section>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-8 h-8 rounded-xl flex items-center justify-center'
                    style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))' }}>
                    <CalendarCheck className='w-4 h-4' style={{ color: 'hsl(155,45%,10%)' }} />
                  </div>
                  <div>
                    <h2 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                      Package Bookings
                    </h2>
                    <p className='text-xs' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                      Full-service event packages handled by CelebrateSmart
                    </p>
                  </div>
                </div>
                <div className='space-y-4'>
                  {packageOrders.map((order, i) => (
                    <PackageOrderCard key={order.id} order={order} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Shop Orders section */}
            {shopOrders.length > 0 && (
              <section>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-8 h-8 rounded-xl flex items-center justify-center'
                    style={{ background: 'hsl(155,30%,95%)', border: '1.5px solid hsl(150,12%,85%)' }}>
                    <ShoppingBag className='w-4 h-4' style={{ color: 'hsl(155,38%,27%)' }} />
                  </div>
                  <div>
                    <h2 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                      Shop Orders
                    </h2>
                    <p className='text-xs' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                      Individual items purchased from the shop
                    </p>
                  </div>
                </div>
                <div className='space-y-4'>
                  {shopOrders.map((order, i) => (
                    <ShopOrderCard key={order.id} order={order} index={i} />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
