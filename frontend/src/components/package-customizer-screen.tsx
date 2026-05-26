import { useState, useMemo } from 'react';
import { AppScreen, EventData } from '@/App';
import { Package, PackageItem, EventPlan, packagesAPI, productsAPI, Product } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { ChevronRight, Check, Minus, Plus, Users, CreditCard, Lock, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

interface PackageCustomizerScreenProps {
  pkg: Package;
  onNavigate: (screen: AppScreen) => void;
  onBooked: (event: EventData, plan: EventPlan) => void;
}

const TIER_CONFIG = {
  BRONZE: { label: 'Bronze', color: 'hsl(30,60%,50%)',  bg: 'hsl(30,60%,97%)',  border: 'hsl(30,50%,80%)',  medal: '🥉' },
  SILVER: { label: 'Silver', color: 'hsl(220,15%,50%)', bg: 'hsl(220,20%,97%)', border: 'hsl(220,15%,80%)', medal: '🥈' },
  GOLD:   { label: 'Gold',   color: 'hsl(43,74%,45%)',  bg: 'hsl(43,74%,97%)',  border: 'hsl(43,70%,75%)',  medal: '🥇' },
} as const;

const COLOR_THEMES = [
  { id: 'Blush Pink',     swatch: '#f9a8c0', bg: '#fdf2f6' },
  { id: 'Lavender',       swatch: '#c4b5fd', bg: '#f5f3ff' },
  { id: 'Royal Blue',     swatch: '#60a5fa', bg: '#eff6ff' },
  { id: 'Emerald',        swatch: '#34d399', bg: '#ecfdf5' },
  { id: 'Champagne Gold', swatch: '#d4a847', bg: '#fefce8' },
  { id: 'Coral Peach',    swatch: '#fb7185', bg: '#fff1f2' },
  { id: 'Rose Gold',      swatch: '#e8a598', bg: '#fff5f3' },
  { id: 'Sage White',     swatch: '#86efac', bg: '#f0fdf4' },
  { id: 'Midnight Black', swatch: '#374151', bg: '#f9fafb' },
  { id: 'Sky Blue',       swatch: '#7dd3fc', bg: '#f0f9ff' },
] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️', GIFTS: '🎁',
  PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️',
};

interface PaymentModalState {
  eventData:    EventData;
  orderId:      string;
  orderNumber:  string;
  totalAmount:  number;
  clientSecret: string;
}

interface PaymentFormProps {
  eventId:     string;
  orderId:     string;
  totalAmount: number;
  onClose:     () => void;
  onSuccess:   (event: EventData, plan: EventPlan) => void;
}

function PaymentForm({ eventId, orderId, totalAmount, onClose, onSuccess }: PaymentFormProps) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying,   setPaying]   = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) {
      toast({ variant: 'destructive', title: 'Stripe not loaded', description: 'Please refresh and try again.' });
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (error) { setPayError(error.message ?? 'Payment failed'); return; }

      const confirmed = await packagesAPI.confirmPayment(eventId, orderId);
      onSuccess(confirmed.data.event, confirmed.data.plan);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Payment failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <div>
        <p className='text-xs uppercase tracking-widest font-semibold mb-2' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
          Payment Details
        </p>
        <div
          className='rounded-xl border-2 p-3 transition-colors'
          style={{ borderColor: payError ? 'hsl(0,65%,55%)' : 'hsl(150,12%,85%)' }}
        >
          <PaymentElement />
        </div>
        {payError && (
          <p className='mt-1.5 text-xs' style={{ color: 'hsl(0,65%,45%)', fontFamily: 'Inter, sans-serif' }}>{payError}</p>
        )}
      </div>

      <div className='flex items-center gap-2 rounded-xl px-3 py-2.5' style={{ background: 'hsl(155,25%,97%)', border: '1px solid hsl(155,18%,88%)' }}>
        <Lock className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,30%,42%)' }} />
        <p className='text-xs' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
          Encrypted & processed securely by Stripe. We never store card data.
        </p>
      </div>

      <div className='flex gap-3'>
        <button
          onClick={onClose}
          disabled={paying}
          className='flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all hover:bg-gray-50 disabled:opacity-50'
          style={{ borderColor: 'hsl(150,12%,85%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}
        >
          Cancel
        </button>
        <button
          onClick={handlePay}
          disabled={paying || !stripe}
          className='flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
          style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,34%))', color: 'white', fontFamily: 'Inter, sans-serif' }}
        >
          {paying ? (
            <span className='size-4 border-2 border-white/40 border-t-white rounded-full animate-spin' />
          ) : (
            <CreditCard className='w-4 h-4' />
          )}
          {paying ? 'Processing…' : `Pay $${totalAmount.toLocaleString()}`}
        </button>
      </div>
    </>
  );
}

function groupByCategory(products: Product[]): Record<string, Product[]> {
  return products.reduce((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {} as Record<string, Product[]>);
}

export function PackageCustomizerScreen({ pkg, onNavigate, onBooked }: PackageCustomizerScreenProps) {
  const tier = TIER_CONFIG[pkg.tier];

  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(() => new Set(pkg.items.map(i => i.productId)));
  const [name,            setName]            = useState('');
  const [date,            setDate]            = useState('');
  const [time,            setTime]            = useState('18:00');
  const [venue,           setVenue]           = useState('');
  const [notes,           setNotes]           = useState('');
  const [guestCount,      setGuestCount]      = useState(50);
  const [colorTheme,      setColorTheme]      = useState('');
  const [booking,         setBooking]         = useState(false);
  const [modal,           setModal]           = useState<PaymentModalState | null>(null);
  const [paymentDone,     setPaymentDone]     = useState<{ event: EventData; plan: EventPlan; amount: number } | null>(null);
  const [showExtras,      setShowExtras]      = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loadingCatalog,  setLoadingCatalog]  = useState(false);
  const [extraItems,      setExtraItems]      = useState<Map<string, number>>(new Map());

  const BASE_GUESTS: Record<string, number> = { BRONZE: 30, SILVER: 40, GOLD: 50 };
  const baseGuests = BASE_GUESTS[pkg.tier] ?? 30;

  const effectivePrice = (item: PackageItem) => {
    const base = item.price * item.quantity;
    if (item.category === 'FOOD') return Math.round(base * (guestCount / baseGuests));
    return base;
  };

  const loadCatalog = async () => {
    if (catalogProducts.length > 0 || loadingCatalog) return;
    setLoadingCatalog(true);
    const pkgProductIds = new Set(pkg.items.map(i => i.productId));
    try {
      const res = await productsAPI.list();
      setCatalogProducts(res.data.products.filter(p => !pkgProductIds.has(p.id)));
    } catch { } finally {
      setLoadingCatalog(false);
    }
  };

  const addExtra = (productId: string) => setExtraItems(prev => {
    const next = new Map(prev);
    next.set(productId, (next.get(productId) ?? 0) + 1);
    return next;
  });

  const removeExtra = (productId: string) => setExtraItems(prev => {
    const next = new Map(prev);
    const qty = next.get(productId) ?? 0;
    if (qty <= 1) next.delete(productId); else next.set(productId, qty - 1);
    return next;
  });

  const extraTotal = useMemo(() => {
    let sum = 0;
    for (const [productId, qty] of extraItems) {
      const product = catalogProducts.find(p => p.id === productId);
      if (product) sum += Number(product.price) * qty;
    }
    return sum;
  }, [extraItems, catalogProducts]);

  const totalPrice = useMemo(() =>
    pkg.items
      .filter(i => selectedIds.has(i.productId))
      .reduce((sum, i) => sum + effectivePrice(i), 0) + extraTotal,
    [pkg.items, selectedIds, guestCount, extraTotal] // eslint-disable-line
  );

  const toggleItem = (item: PackageItem) => {
    if (item.isCore) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(item.productId) ? next.delete(item.productId) : next.add(item.productId);
      return next;
    });
  };

  const handleBook = async () => {
    if (!name.trim()) { toast({ variant: 'destructive', title: 'Event name is required' }); return; }
    if (!date)        { toast({ variant: 'destructive', title: 'Event date is required' }); return; }
    setBooking(true);
    try {
      const res = await packagesAPI.bookPackage({
        packageId: pkg.id, name: name.trim(), date, time, guestCount,
        venue: venue.trim() || undefined, notes: notes.trim() || undefined,
        colorTheme: colorTheme || undefined,
        selectedProductIds: [...selectedIds],
        extraItems: [...extraItems.entries()].map(([productId, quantity]) => ({ productId, quantity })),
      });
      const { event, order, clientSecret } = res.data;

      if (!clientSecret) {
        const confirmed = await packagesAPI.confirmPayment(event.id, order.id);
        toast({ title: 'Booking confirmed!', description: 'Your personalised event plan is ready.' });
        onBooked(confirmed.data.event, confirmed.data.plan);
        return;
      }

      setModal({ eventData: event, orderId: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount, clientSecret });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Booking failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setBooking(false);
    }
  };

  const coreItems      = pkg.items.filter(i => i.isCore);
  const optionalItems  = pkg.items.filter(i => !i.isCore);
  const catalogGroups  = groupByCategory(catalogProducts);
  const hasExtras      = extraItems.size > 0;
  const hasFoodItem    = pkg.items.some(i => i.category === 'FOOD' && selectedIds.has(i.productId));
  const hasFoodScaling = hasFoodItem && guestCount !== baseGuests;
  const scalingFactor  = (guestCount / baseGuests).toFixed(2);

  return (
    <>
      <div className='min-h-screen' style={{ background: 'hsl(150,15%,97%)' }}>
        <main className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>

          {/* Header */}
          <div className='mb-8 animate-fade-in'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='text-xs uppercase tracking-widest font-semibold' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
                Customise Your Package
              </span>
            </div>
            <h1 className='font-serif text-4xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
              {tier.medal} {tier.label} Package
            </h1>
            <p className='mt-3 text-base' style={{ color: 'hsl(150,8%,46%)', fontFamily: 'Inter, sans-serif' }}>
              {pkg.description}
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>

            {/* ── Left: items + form ── */}
            <div className='lg:col-span-2 space-y-6'>

              {/* Core items */}
              <div className='bg-white rounded-3xl border-2 p-6' style={{ borderColor: tier.border }}>
                <h2 className='font-serif text-xl font-bold mb-4' style={{ color: 'hsl(155,45%,13%)' }}>
                  Included in Package
                </h2>
                <div className='space-y-3'>
                  {coreItems.map(item => (
                    <div key={item.id} className='flex items-center gap-3 p-3 rounded-xl' style={{ background: tier.bg }}>
                      <div className='w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0' style={{ background: tier.color }}>
                        <Check className='w-4 h-4 text-white' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-sm font-semibold' style={{ color: 'hsl(155,45%,13%)' }}>
                            {CATEGORY_EMOJI[item.category] ?? '🛍️'} {item.name}
                          </span>
                          <span className='text-xs px-2 py-0.5 rounded-full font-medium' style={{ background: 'hsl(150,12%,93%)', color: 'hsl(155,22%,38%)' }}>
                            Core
                          </span>
                        </div>
                        {item.description && (
                          <p className='text-xs mt-0.5' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>{item.description}</p>
                        )}
                        {item.category === 'FOOD' && (
                          <p className='text-xs mt-0.5 font-medium' style={{ color: 'hsl(43,55%,40%)', fontFamily: 'Inter, sans-serif' }}>
                            Base: {baseGuests} guests · Adjusted for {guestCount} guests
                          </p>
                        )}
                      </div>
                      <span className='text-sm font-bold flex-shrink-0' style={{ color: tier.color }}>
                        ${effectivePrice(item).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional items */}
              {optionalItems.length > 0 && (
                <div className='bg-white rounded-3xl border-2 p-6' style={{ borderColor: 'hsl(150,12%,88%)' }}>
                  <h2 className='font-serif text-xl font-bold mb-1' style={{ color: 'hsl(155,45%,13%)' }}>
                    Optional Extras
                  </h2>
                  <p className='text-sm mb-4' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                    Toggle items on or off to tailor your package
                  </p>
                  <div className='space-y-3'>
                    {optionalItems.map(item => {
                      const on = selectedIds.has(item.productId);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item)}
                          className='w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left'
                          style={{ borderColor: on ? 'hsl(155,35%,32%)' : 'hsl(150,12%,88%)', background: on ? 'hsl(155,25%,97%)' : 'white' }}
                        >
                          <div className='w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all'
                            style={{ borderColor: on ? 'hsl(155,35%,32%)' : 'hsl(150,10%,75%)', background: on ? 'hsl(155,42%,20%)' : 'white' }}>
                            {on && <Check className='w-3.5 h-3.5 text-white' />}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold' style={{ color: 'hsl(155,45%,13%)' }}>
                              {CATEGORY_EMOJI[item.category] ?? '🛍️'} {item.name}
                            </p>
                            {item.description && (
                              <p className='text-xs mt-0.5' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>{item.description}</p>
                            )}
                          </div>
                          <span className='text-sm font-bold flex-shrink-0' style={{ color: on ? 'hsl(155,38%,27%)' : 'hsl(150,10%,52%)' }}>
                            +${effectivePrice(item).toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Add Extra Items from Catalogue ── */}
              <div className='bg-white rounded-3xl border-2 overflow-hidden' style={{ borderColor: 'hsl(150,12%,88%)' }}>
                <button
                  onClick={() => { setShowExtras(v => { if (!v) loadCatalog(); return !v; }); }}
                  className='w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-green-50/20'
                >
                  <div>
                    <h2 className='font-serif text-xl font-bold flex items-center gap-2' style={{ color: 'hsl(155,45%,13%)' }}>
                      Add Extra Items
                      {hasExtras && (
                        <span className='text-sm font-semibold px-2 py-0.5 rounded-full'
                          style={{ background: 'hsl(155,30%,95%)', color: 'hsl(155,38%,27%)', fontFamily: 'Inter, sans-serif' }}>
                          {extraItems.size} added
                        </span>
                      )}
                    </h2>
                    <p className='text-sm mt-0.5' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                      Browse the catalogue and add items beyond your package at full price
                    </p>
                  </div>
                  {showExtras
                    ? <ChevronUp className='w-5 h-5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                    : <ChevronDown className='w-5 h-5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                  }
                </button>

                {showExtras && (
                  <div className='border-t px-6 pb-6 pt-4' style={{ borderColor: 'hsl(150,12%,88%)' }}>
                    {loadingCatalog ? (
                      <div className='flex justify-center py-8'><Spinner className='size-5' /></div>
                    ) : catalogProducts.length === 0 ? (
                      <p className='text-sm text-center py-4' style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>
                        No additional items available
                      </p>
                    ) : (
                      <div className='space-y-5'>
                        {Object.entries(catalogGroups).map(([cat, products]) => (
                          <div key={cat}>
                            <p className='text-xs uppercase tracking-widest font-bold mb-2'
                              style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                              {CATEGORY_EMOJI[cat] ?? '🛍️'} {cat}
                            </p>
                            <div className='space-y-2'>
                              {products.map(product => {
                                const qty = extraItems.get(product.id) ?? 0;
                                return (
                                  <div key={product.id}
                                    className='flex items-center gap-3 p-3 rounded-xl border-2 transition-all'
                                    style={{ borderColor: qty > 0 ? 'hsl(155,35%,32%)' : 'hsl(150,12%,88%)', background: qty > 0 ? 'hsl(155,25%,97%)' : 'white' }}>
                                    <div className='flex-1 min-w-0'>
                                      <p className='text-sm font-semibold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
                                        {product.name}
                                      </p>
                                      {product.description && (
                                        <p className='text-xs mt-0.5 line-clamp-1' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                                          {product.description}
                                        </p>
                                      )}
                                      <p className='text-sm font-bold mt-0.5' style={{ color: 'hsl(43,60%,30%)', fontFamily: 'Inter, sans-serif' }}>
                                        ${Number(product.price).toLocaleString()}
                                      </p>
                                    </div>
                                    {qty === 0 ? (
                                      <button
                                        onClick={() => addExtra(product.id)}
                                        className='w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 shrink-0'
                                        style={{ borderColor: 'hsl(155,35%,32%)', color: 'hsl(155,38%,27%)' }}
                                      >
                                        <Plus className='w-4 h-4' />
                                      </button>
                                    ) : (
                                      <div className='flex items-center gap-2 shrink-0'>
                                        <button onClick={() => removeExtra(product.id)}
                                          className='w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110'
                                          style={{ borderColor: 'hsl(155,35%,32%)', color: 'hsl(155,38%,27%)' }}>
                                          <Minus className='w-3.5 h-3.5' />
                                        </button>
                                        <span className='font-bold w-6 text-center text-sm' style={{ color: 'hsl(155,45%,13%)' }}>{qty}</span>
                                        <button onClick={() => addExtra(product.id)}
                                          className='w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110'
                                          style={{ borderColor: 'hsl(155,35%,32%)', color: 'hsl(155,38%,27%)' }}>
                                          <Plus className='w-3.5 h-3.5' />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Event details form */}
              <div className='bg-white rounded-3xl border-2 p-6' style={{ borderColor: 'hsl(150,12%,88%)' }}>
                <h2 className='font-serif text-xl font-bold mb-4' style={{ color: 'hsl(155,45%,13%)' }}>
                  Event Details
                </h2>
                <div className='space-y-4'>

                  <div>
                    <label className='text-xs uppercase tracking-widest font-semibold block mb-1.5' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                      Event Name *
                    </label>
                    <input
                      type='text'
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Sarah's 30th Birthday"
                      className='w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all'
                      style={{ borderColor: name ? 'hsl(155,35%,32%)' : 'hsl(150,12%,85%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,45%,13%)' }}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-xs uppercase tracking-widest font-semibold block mb-1.5' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                        Date *
                      </label>
                      <input
                        type='date'
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setDate(e.target.value)}
                        className='w-full px-4 py-3 rounded-xl border-2 text-sm outline-none'
                        style={{ borderColor: date ? 'hsl(155,35%,32%)' : 'hsl(150,12%,85%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,45%,13%)' }}
                      />
                    </div>
                    <div>
                      <label className='text-xs uppercase tracking-widest font-semibold block mb-1.5' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                        Start Time
                      </label>
                      <input
                        type='time'
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className='w-full px-4 py-3 rounded-xl border-2 text-sm outline-none'
                        style={{ borderColor: 'hsl(150,12%,85%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,45%,13%)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className='text-xs uppercase tracking-widest font-semibold block mb-1.5' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                      Guest Count
                    </label>
                    <div className='flex items-center gap-4'>
                      <button
                        onClick={() => setGuestCount(g => Math.max(1, g - 5))}
                        className='w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105'
                        style={{ borderColor: 'hsl(150,12%,85%)', color: 'hsl(155,25%,42%)' }}
                      >
                        <Minus className='w-4 h-4' />
                      </button>
                      <div className='flex items-center gap-2'>
                        <Users className='w-4 h-4' style={{ color: 'hsl(155,22%,46%)' }} />
                        <span className='font-serif text-2xl font-bold w-12 text-center' style={{ color: 'hsl(155,45%,13%)' }}>{guestCount}</span>
                      </div>
                      <button
                        onClick={() => setGuestCount(g => g + 5)}
                        className='w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105'
                        style={{ borderColor: 'hsl(150,12%,85%)', color: 'hsl(155,25%,42%)' }}
                      >
                        <Plus className='w-4 h-4' />
                      </button>
                    </div>
                    {hasFoodScaling && (
                      <p className='mt-2 text-xs' style={{ color: 'hsl(43,55%,40%)', fontFamily: 'Inter, sans-serif' }}>
                        🍽️ Food price scaled from {baseGuests} (base) → {guestCount} guests ×{scalingFactor}
                      </p>
                    )}
                  </div>

                  {/* Colour Theme */}
                  <div>
                    <label className='text-xs uppercase tracking-widest font-semibold block mb-1.5' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                      Colour Theme
                      <span className='ml-1.5 normal-case tracking-normal font-normal' style={{ color: 'hsl(150,8%,60%)' }}>(optional)</span>
                    </label>
                    <div className='grid grid-cols-5 gap-2'>
                      {COLOR_THEMES.map(t => {
                        const selected = colorTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            type='button'
                            onClick={() => setColorTheme(selected ? '' : t.id)}
                            title={t.id}
                            className='flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-all hover:scale-[1.05]'
                            style={{
                              borderColor: selected ? 'hsl(155,38%,27%)' : 'hsl(150,12%,88%)',
                              background:  selected ? t.bg : 'white',
                              boxShadow:   selected ? '0 0 0 2px hsl(155,38%,27%,0.15)' : 'none',
                            }}
                          >
                            <span
                              className='w-7 h-7 rounded-full border-2 flex-shrink-0'
                              style={{ background: t.swatch, borderColor: selected ? 'hsl(155,38%,27%)' : 'transparent' }}
                            />
                            <span className='text-center leading-tight' style={{
                              fontSize: '9px', fontFamily: 'Inter, sans-serif',
                              fontWeight: selected ? 700 : 500,
                              color: selected ? 'hsl(155,42%,20%)' : 'hsl(150,8%,50%)',
                            }}>
                              {t.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {colorTheme && (
                      <p className='mt-2 text-xs font-semibold' style={{ color: 'hsl(155,38%,27%)', fontFamily: 'Inter, sans-serif' }}>
                        ✓ {colorTheme} selected
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='text-xs uppercase tracking-widest font-semibold block mb-1.5' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                      Venue (optional)
                    </label>
                    <input
                      type='text'
                      value={venue}
                      onChange={e => setVenue(e.target.value)}
                      placeholder='e.g. Grand Ballroom, Hilton Hotel'
                      className='w-full px-4 py-3 rounded-xl border-2 text-sm outline-none'
                      style={{ borderColor: 'hsl(150,12%,85%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,45%,13%)' }}
                    />
                  </div>

                  <div>
                    <label className='text-xs uppercase tracking-widest font-semibold block mb-1.5' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder='Any special requirements or notes...'
                      rows={3}
                      className='w-full px-4 py-3 rounded-xl border-2 text-sm outline-none resize-none'
                      style={{ borderColor: 'hsl(150,12%,85%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,45%,13%)' }}
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* ── Right: order summary ── */}
            <div className='lg:col-span-1'>
              <div className='sticky top-6 bg-white rounded-3xl border-2 p-6 space-y-5' style={{ borderColor: tier.border }}>
                <h2 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                  Your Order
                </h2>

                {/* Package items */}
                <div className='space-y-2.5'>
                  {pkg.items.filter(i => selectedIds.has(i.productId)).map(item => (
                    <div key={item.id} className='flex items-start justify-between gap-2 text-sm'>
                      <div className='flex-1 min-w-0'>
                        <span style={{ color: 'hsl(150,10%,42%)', fontFamily: 'Inter, sans-serif' }}>
                          {CATEGORY_EMOJI[item.category] ?? '🛍️'} {item.name}
                          {item.quantity > 1 && <span className='opacity-60'> ×{item.quantity}</span>}
                        </span>
                        {item.category === 'FOOD' && guestCount !== baseGuests && (
                          <p className='text-xs mt-0.5' style={{ color: 'hsl(43,55%,40%)', fontFamily: 'Inter, sans-serif' }}>
                            {baseGuests} → {guestCount} guests ×{scalingFactor}
                          </p>
                        )}
                      </div>
                      <span className='font-semibold flex-shrink-0' style={{ color: 'hsl(155,42%,17%)' }}>
                        ${effectivePrice(item).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Extra items */}
                {hasExtras && (
                  <>
                    <div className='h-px' style={{ background: 'hsl(150,12%,90%)' }} />
                    <div className='space-y-2'>
                      <p className='text-xs uppercase tracking-widest font-bold'
                        style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
                        Extra Items
                      </p>
                      {[...extraItems.entries()].map(([productId, qty]) => {
                        const product = catalogProducts.find(p => p.id === productId);
                        if (!product) return null;
                        return (
                          <div key={productId} className='flex items-start justify-between gap-2 text-sm'>
                            <span className='flex-1' style={{ color: 'hsl(150,10%,42%)', fontFamily: 'Inter, sans-serif' }}>
                              {CATEGORY_EMOJI[product.category] ?? '🛍️'} {product.name}
                              {qty > 1 && <span className='opacity-60'> ×{qty}</span>}
                            </span>
                            <span className='font-semibold flex-shrink-0' style={{ color: 'hsl(155,42%,17%)' }}>
                              +${(Number(product.price) * qty).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div style={{ borderTop: '2px solid hsl(150,12%,88%)' }} />

                {/* Price breakdown if food scaling or extras */}
                {(hasFoodScaling || hasExtras) && (
                  <div className='space-y-1 rounded-xl p-3' style={{ background: 'hsl(43,60%,98%)', border: '1px solid hsl(43,50%,88%)' }}>
                    {hasFoodScaling && (
                      <p className='text-xs' style={{ color: 'hsl(43,55%,38%)', fontFamily: 'Inter, sans-serif' }}>
                        🍽️ Food adjusted ×{scalingFactor} for {guestCount} guests
                      </p>
                    )}
                    {hasExtras && (
                      <p className='text-xs' style={{ color: 'hsl(43,55%,38%)', fontFamily: 'Inter, sans-serif' }}>
                        ✦ Extra items: +${extraTotal.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div className='flex items-baseline justify-between'>
                  <span className='text-sm font-semibold uppercase tracking-widest' style={{ color: 'hsl(155,14%,48%)', fontFamily: 'Inter, sans-serif' }}>
                    Total
                  </span>
                  <span className='font-serif text-3xl font-bold' style={{ color: tier.color }}>
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>

                <div className='flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
                  <Users className='w-4 h-4' />
                  {guestCount} guests
                </div>
                {colorTheme && (() => {
                  const t = COLOR_THEMES.find(c => c.id === colorTheme);
                  return (
                    <div className='flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
                      <span className='w-4 h-4 rounded-full flex-shrink-0 border' style={{ background: t?.swatch ?? '#ccc', borderColor: 'hsl(150,12%,82%)' }} />
                      {colorTheme}
                    </div>
                  );
                })()}

                <button
                  onClick={handleBook}
                  disabled={booking || !name || !date}
                  className='w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,34%))', color: 'white', fontFamily: 'Inter, sans-serif' }}
                >
                  {booking ? <Spinner className='size-4' /> : (
                    <>
                      Book & Pay
                      <ChevronRight className='w-4 h-4' />
                    </>
                  )}
                </button>

                <p className='text-xs text-center' style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>
                  Secured by Stripe · Your event plan is ready instantly after payment
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('package-picker')}
            className='mt-10 text-sm font-semibold transition-colors hover:opacity-70'
            style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}
          >
            ← Back to Packages
          </button>
        </main>
      </div>

      {/* ── Payment modal ── */}
      {modal && (
        <div className='fixed inset-0 z-50 overflow-y-auto' style={{ background: 'rgba(10,25,20,0.72)' }}>
          <div className='flex min-h-full items-center justify-center p-4'>
          <div className='w-full max-w-md bg-white rounded-3xl shadow-2xl'>

            {/* Modal header */}
            <div className='px-6 py-5 flex items-center justify-between rounded-t-3xl overflow-hidden' style={{ background: 'linear-gradient(135deg, hsl(155,45%,12%), hsl(155,38%,18%))' }}>
              <div>
                <div className='h-px mb-3 w-16' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%))' }} />
                <h2 className='font-serif text-xl font-bold text-white'>Complete Payment</h2>
                <p className='text-xs mt-0.5' style={{ color: 'hsl(43,60%,65%)', fontFamily: 'Inter, sans-serif' }}>
                  Order #{modal.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                className='w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/15'
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            <div className='p-6 space-y-5'>

              {/* Order summary */}
              <div className='rounded-2xl p-4 space-y-2' style={{ background: 'hsl(150,15%,97%)', border: '1px solid hsl(150,12%,88%)' }}>
                <p className='text-xs uppercase tracking-widest font-semibold mb-3' style={{ color: 'hsl(155,20%,45%)', fontFamily: 'Inter, sans-serif' }}>
                  Order Summary
                </p>
                {pkg.items.filter(i => selectedIds.has(i.productId)).map(item => (
                  <div key={item.id} className='flex justify-between text-sm gap-2'>
                    <div className='flex-1 min-w-0'>
                      <span className='truncate' style={{ color: 'hsl(150,10%,45%)', fontFamily: 'Inter, sans-serif' }}>
                        {CATEGORY_EMOJI[item.category] ?? '🛍️'} {item.name}
                      </span>
                      {item.category === 'FOOD' && guestCount !== baseGuests && (
                        <p className='text-xs' style={{ color: 'hsl(43,55%,40%)', fontFamily: 'Inter, sans-serif' }}>
                          {baseGuests} → {guestCount} guests ×{scalingFactor}
                        </p>
                      )}
                    </div>
                    <span className='font-semibold shrink-0' style={{ color: 'hsl(155,42%,17%)' }}>
                      ${effectivePrice(item).toLocaleString()}
                    </span>
                  </div>
                ))}
                {hasExtras && (
                  <>
                    <div className='h-px my-1' style={{ background: 'hsl(150,12%,90%)' }} />
                    <p className='text-xs font-semibold' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
                      + Extra Items
                    </p>
                    {[...extraItems.entries()].map(([productId, qty]) => {
                      const product = catalogProducts.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className='flex justify-between text-sm gap-2'>
                          <span className='truncate' style={{ color: 'hsl(150,10%,45%)', fontFamily: 'Inter, sans-serif' }}>
                            {CATEGORY_EMOJI[product.category] ?? '🛍️'} {product.name}
                            {qty > 1 && <span className='opacity-60'> ×{qty}</span>}
                          </span>
                          <span className='font-semibold shrink-0' style={{ color: 'hsl(155,42%,17%)' }}>
                            +${(Number(product.price) * qty).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
                <div className='h-px' style={{ background: 'hsl(150,12%,88%)' }} />
                <div className='flex justify-between items-baseline'>
                  <span className='text-sm font-bold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>Total</span>
                  <span className='font-serif text-2xl font-bold' style={{ color: tier.color }}>
                    ${modal.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment form inside its own Elements provider with clientSecret */}
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: modal.clientSecret,
                  appearance: { theme: 'stripe', variables: { colorPrimary: 'hsl(155,42%,20%)' } },
                }}
              >
                <PaymentForm
                  eventId={modal.eventData.id}
                  orderId={modal.orderId}
                  totalAmount={modal.totalAmount}
                  onClose={() => setModal(null)}
                  onSuccess={(event, plan) => { setModal(null); setPaymentDone({ event, plan, amount: modal.totalAmount }); }}
                />
              </Elements>

            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Payment success modal ── */}
      {paymentDone && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4' style={{ background: 'rgba(10,25,20,0.82)' }}>
          <div className='w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden'>

            {/* Success header */}
            <div className='px-8 pt-8 pb-7 text-center' style={{ background: 'linear-gradient(135deg, hsl(155,45%,12%), hsl(155,38%,18%))' }}>
              <div className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
                style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)' }}>
                <Check className='w-8 h-8 text-white' />
              </div>
              <h2 className='font-serif text-2xl font-bold text-white'>Payment Successful!</h2>
              <div className='mt-2 flex items-center justify-center gap-1.5'>
                <div className='h-px w-8' style={{ background: 'hsl(43,74%,49%)' }} />
                <span className='text-sm font-semibold' style={{ color: 'hsl(43,65%,72%)', fontFamily: 'Inter, sans-serif' }}>
                  ${paymentDone.amount.toLocaleString()} charged
                </span>
                <div className='h-px w-8' style={{ background: 'hsl(43,74%,49%)' }} />
              </div>
            </div>

            <div className='px-8 py-6 space-y-5 text-center'>
              <p className='text-sm' style={{ color: 'hsl(150,8%,46%)', fontFamily: 'Inter, sans-serif' }}>
                Your personalised event plan has been created and is ready to view.
              </p>

              <button
                onClick={() => { setPaymentDone(null); onBooked(paymentDone.event, paymentDone.plan); }}
                className='w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02]'
                style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,34%))', color: 'white', fontFamily: 'Inter, sans-serif' }}
              >
                View Your Event Plan
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
