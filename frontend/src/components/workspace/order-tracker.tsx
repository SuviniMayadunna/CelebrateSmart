import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Package, Truck, Warehouse, CreditCard, Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { ordersAPI, type Order, type OrderItem } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

const STATUS_STEPS = [
  { key: 'PAID',               label: 'Order Confirmed',   icon: CreditCard   },
  { key: 'PREPARING',          label: 'Being Prepared',    icon: Warehouse    },
  { key: 'READY_FOR_PICKUP',   label: 'Ready',             icon: Package      },
  { key: 'OUT_FOR_DELIVERY',   label: 'On the Way',        icon: Truck        },
  { key: 'DELIVERED',          label: 'Delivered',         icon: CheckCircle2 },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  CAKES:         '#f9a8d4',
  FOOD:          '#fb923c',
  DECORATIONS:   '#c084fc',
  PHOTOGRAPHY:   '#a78bfa',
  ENTERTAINMENT: '#fbbf24',
  VENUE:         '#2dd4bf',
  GIFTS:         '#86efac',
};

const CATEGORY_LABELS: Record<string, string> = {
  CAKES: 'Cake', FOOD: 'Catering', DECORATIONS: 'Decorations',
  PHOTOGRAPHY: 'Photography', ENTERTAINMENT: 'Entertainment',
  VENUE: 'Venue', GIFTS: 'Gifts',
};

function statusIndex(status: string) {
  return STATUS_STEPS.findIndex(s => s.key === status);
}

function StatusStepper({ status }: { status: string }) {
  const current = statusIndex(status);
  if (current === -1) return null;

  return (
    <div className='flex items-center gap-0 w-full'>
      {STATUS_STEPS.map((step, i) => {
        const Icon   = step.icon;
        const done   = i < current;
        const active = i === current;
        const isLast = i === STATUS_STEPS.length - 1;

        return (
          <div key={step.key} className='flex items-center flex-1 min-w-0'>
            <div className='flex flex-col items-center shrink-0'>
              <div className='w-8 h-8 rounded-full flex items-center justify-center transition-all'
                style={{
                  background: done || active ? 'hsl(43,74%,49%)' : '#f1f5f9',
                  boxShadow:  active ? '0 0 0 3px rgba(251,191,36,0.25)' : undefined,
                }}>
                {done ? (
                  <CheckCircle2 className='w-4 h-4 text-white' />
                ) : (
                  <Icon className='w-4 h-4' style={{ color: active ? 'white' : '#94a3b8' }} />
                )}
              </div>
              <span className='text-center mt-1.5 leading-tight'
                style={{
                  fontSize:   '0.6rem',
                  color:      done || active ? 'hsl(43,74%,40%)' : '#94a3b8',
                  fontWeight: active ? 700 : 400,
                  maxWidth:   '56px',
                  wordBreak:  'break-word',
                }}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className='h-0.5 flex-1 mx-1 mt-[-16px]'
                style={{ background: i < current ? 'hsl(43,74%,49%)' : '#e2e8f0' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ItemRow({ item }: { item: OrderItem }) {
  const color = CATEGORY_COLORS[item.categoryName] ?? '#94a3b8';
  const label = CATEGORY_LABELS[item.categoryName] ?? item.categoryName;

  return (
    <div className='flex items-center gap-3 py-3 border-b last:border-0' style={{ borderColor: '#f1f5f9' }}>
      <div className='w-2 h-10 rounded-full shrink-0' style={{ background: color }} />
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold truncate' style={{ color: '#0f172a' }}>{item.productName}</p>
        <p className='text-xs mt-0.5' style={{ color }}>{label}</p>
      </div>
      <div className='text-right shrink-0'>
        <p className='text-sm font-semibold' style={{ color: '#0f172a' }}>
          ${(item.unitPrice * item.quantity).toFixed(2)}
        </p>
        {item.quantity > 1 && (
          <p className='text-xs' style={{ color: '#64748b' }}>
            {item.quantity} × ${item.unitPrice.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded,  setExpanded]  = useState(true);
  const isCanceled = order.status === 'CANCELED';

  return (
    <div className='rounded-2xl overflow-hidden'
      style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className='h-0.5' style={{
        background: isCanceled
          ? '#fca5a5'
          : 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))',
      }} />

      <div className='p-5'>
        <div className='flex items-start justify-between gap-3 mb-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-widest mb-0.5'
              style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
              Order #{order.orderNumber}
            </p>
            <p className='text-xs' style={{ color: '#64748b' }}>
              Placed {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className='text-xs font-bold px-2.5 py-1 rounded-full shrink-0'
            style={{
              background: isCanceled ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.12)',
              color:      isCanceled ? '#ef4444'              : 'hsl(43,74%,40%)',
            }}>
            {isCanceled ? 'Canceled' : order.status.replace(/_/g, ' ')}
          </span>
        </div>

        {!isCanceled && (
          <div className='mb-5'>
            <StatusStepper status={order.status} />
          </div>
        )}

        {isCanceled && (
          <div className='flex items-center gap-2.5 p-3 rounded-xl mb-4'
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <Ban className='w-4 h-4 text-red-400 shrink-0' />
            <p className='text-xs text-red-500'>
              This order was canceled.
              {order.refundAmount != null && order.refundAmount > 0
                ? ` A refund of $${order.refundAmount.toFixed(2)} has been processed.`
                : ''}
            </p>
          </div>
        )}

        <button onClick={() => setExpanded(v => !v)}
          className='flex items-center justify-between w-full py-2 text-sm font-semibold transition-colors'
          style={{ color: '#475569' }}>
          <span>{order.items.length} booked item{order.items.length !== 1 ? 's' : ''}</span>
          {expanded ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
        </button>

        {expanded && (
          <div>
            {order.items.map(item => <ItemRow key={item.id} item={item} />)}
            <div className='flex items-center justify-between pt-3'>
              <span className='text-sm font-semibold' style={{ color: '#64748b' }}>Total</span>
              <span className='text-base font-black' style={{ color: '#0f172a' }}>
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderTrackerProps {
  eventId: string;
}

export function OrderTracker({ eventId }: OrderTrackerProps) {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    ordersAPI.list()
      .then(res => {
        setOrders(res.data.orders.filter(o => o.eventId === eventId));
      })
      .catch(() => setError('Failed to load order details.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-24'>
        <Spinner className='w-6 h-6' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-24'>
        <p className='text-sm' style={{ color: '#64748b' }}>{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-24 gap-3'>
        <Package className='w-10 h-10' style={{ color: '#cbd5e1' }} />
        <p className='text-sm font-semibold' style={{ color: '#64748b' }}>No orders found for this event.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 mb-2'>
        <Clock className='w-4 h-4' style={{ color: 'hsl(43,60%,48%)' }} />
        <h2 className='text-sm font-bold uppercase tracking-widest' style={{ color: 'hsl(43,60%,48%)' }}>
          Order Status
        </h2>
      </div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
