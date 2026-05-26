import { useEffect, useRef, useState } from 'react';
import { AppScreen } from '@/App';
import { packagesAPI } from '@/lib/api';
import type { Package } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { ChevronRight, Check, ChevronLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PackagePickerScreenProps {
  onNavigate:      (screen: AppScreen) => void;
  onSelectPackage: (pkg: Package) => void;
}

const EVENT_TYPES: { key: string; label: string; emoji: string }[] = [
  { key: 'BIRTHDAY',    label: 'Birthday Party',   emoji: '🎂' },
  { key: 'WEDDING',     label: 'Wedding',           emoji: '💒' },
  { key: 'PROPOSAL',    label: 'Proposal',          emoji: '💍' },
  { key: 'BABY_SHOWER', label: 'Baby Shower',       emoji: '🍼' },
  { key: 'KIDS_PARTY',  label: 'Kids Party',        emoji: '🎈' },
];

const TIER_CONFIG = {
  BRONZE: { label: 'Bronze', color: 'hsl(30,60%,50%)',  bg: 'hsl(30,60%,97%)',  border: 'hsl(30,50%,80%)',  medal: '🥉' },
  SILVER: { label: 'Silver', color: 'hsl(220,15%,50%)', bg: 'hsl(220,20%,97%)', border: 'hsl(220,15%,80%)', medal: '🥈' },
  GOLD:   { label: 'Gold',   color: 'hsl(43,74%,45%)',  bg: 'hsl(43,74%,97%)',  border: 'hsl(43,70%,75%)',  medal: '🥇' },
} as const;

const CATEGORY_EMOJI: Record<string, string> = {
  CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️', GIFTS: '🎁',
  PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️',
};

function PhotoCarousel({ photos, tierColor }: { photos: Package['photos']; tierColor: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (photos.length <= 1) return;
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % photos.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [photos.length]);

  const prev = () => { setIndex(i => (i - 1 + photos.length) % photos.length); };
  const next = () => { setIndex(i => (i + 1) % photos.length); };

  if (photos.length === 0) return null;

  return (
    <>
      <div className='relative w-full overflow-hidden' style={{ aspectRatio: '16/9', background: 'hsl(150,12%,92%)' }}>
        <img
          key={photos[index].id}
          src={photos[index].url}
          alt={photos[index].caption ?? 'Package photo'}
          className='w-full h-full object-cover cursor-zoom-in transition-opacity duration-500'
          onClick={() => setLightbox(true)}
        />
        {photos.length > 1 && (
          <>
            <button onClick={prev} className='absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110'
              style={{ background: 'rgba(0,0,0,0.38)', color: 'white' }}>
              <ChevronLeft className='w-4 h-4' />
            </button>
            <button onClick={next} className='absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110'
              style={{ background: 'rgba(0,0,0,0.38)', color: 'white' }}>
              <ChevronRight className='w-4 h-4' />
            </button>
            <div className='absolute bottom-2 left-0 right-0 flex justify-center gap-1.5'>
              {photos.map((_, i) => (
                <button key={i} onClick={() => setIndex(i)}
                  className='rounded-full transition-all'
                  style={{ width: i === index ? '16px' : '6px', height: '6px', background: i === index ? tierColor : 'rgba(255,255,255,0.6)' }} />
              ))}
            </div>
          </>
        )}
        {photos[index].caption && (
          <div className='absolute bottom-0 left-0 right-0 px-3 py-1.5 text-xs text-white'
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', fontFamily: 'Inter, sans-serif' }}>
            {photos[index].caption}
          </div>
        )}
      </div>

      {lightbox && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'
          style={{ background: 'rgba(0,0,0,0.88)' }}
          onClick={() => setLightbox(false)}>
          <img src={photos[index].url} alt={photos[index].caption ?? 'Package photo'}
            className='max-w-full max-h-full object-contain rounded-2xl shadow-2xl' />
          <button onClick={() => setLightbox(false)}
            className='absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white'
            style={{ background: 'rgba(255,255,255,0.15)' }}>✕</button>
        </div>
      )}
    </>
  );
}

export function PackagePickerScreen({ onNavigate, onSelectPackage }: PackagePickerScreenProps) {
  const [selectedType, setSelectedType] = useState<string>('BIRTHDAY');
  const [packages,     setPackages]     = useState<Package[]>([]);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    setLoading(true);
    packagesAPI.list(selectedType)
      .then(res => setPackages(res.data.packages))
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load packages' }))
      .finally(() => setLoading(false));
  }, [selectedType]);

  const tiers = (['BRONZE', 'SILVER', 'GOLD'] as const).map(t =>
    packages.find(p => p.tier === t)
  ).filter(Boolean) as Package[];

  return (
    <div className='min-h-screen' style={{ background: 'hsl(150,15%,97%)' }}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>

        {/* Header */}
        <div className='mb-8 animate-fade-in'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs uppercase tracking-widest font-semibold' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
              Start Planning
            </span>
          </div>
          <h1 className='font-serif text-4xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
            What are we celebrating?
          </h1>
          <p className='mt-3 text-base' style={{ color: 'hsl(150,8%,46%)', fontFamily: 'Inter, sans-serif' }}>
            Choose your event type, then pick a package that fits your vision.
          </p>
        </div>

        {/* Event type selector */}
        <div className='flex flex-wrap gap-3 mb-10'>
          {EVENT_TYPES.map(et => (
            <button
              key={et.key}
              onClick={() => setSelectedType(et.key)}
              className='flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 font-semibold text-sm transition-all'
              style={{
                borderColor: selectedType === et.key ? 'hsl(155,35%,32%)' : 'hsl(150,12%,85%)',
                background:  selectedType === et.key ? 'hsl(155,42%,20%)' : 'white',
                color:       selectedType === et.key ? 'white' : 'hsl(150,10%,42%)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <span>{et.emoji}</span>
              {et.label}
            </button>
          ))}
        </div>

        {/* Package cards */}
        {loading ? (
          <div className='flex items-center justify-center py-24'>
            <Spinner className='size-5 mr-3' />
            <span style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>Loading packages…</span>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {tiers.map((pkg, idx) => {
              const tier = TIER_CONFIG[pkg.tier];
              const isPopular = pkg.tier === 'SILVER';
              return (
                <div
                  key={pkg.id}
                  className='relative bg-white rounded-3xl border-2 overflow-hidden flex flex-col luxury-card animate-fade-in'
                  style={{
                    borderColor:      isPopular ? 'hsl(155,35%,32%)' : tier.border,
                    animationDelay:   `${idx * 0.07}s`,
                  }}
                >
                  {isPopular && (
                    <div className='absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full'
                      style={{ background: 'hsl(155,42%,20%)', color: 'white', fontFamily: 'Inter, sans-serif' }}>
                      Most Popular
                    </div>
                  )}

                  {/* Tier header */}
                  <div className='px-6 pt-7 pb-5' style={{ background: tier.bg }}>
                    <div className='flex items-center gap-2 mb-2'>
                      <span className='text-3xl'>{tier.medal}</span>
                      <h2 className='font-serif text-2xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                        {tier.label}
                      </h2>
                    </div>
                    <p className='text-xs mb-4' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                      {pkg.description}
                    </p>
                    <div className='flex items-baseline gap-1'>
                      <span className='font-serif text-4xl font-bold' style={{ color: tier.color }}>
                        ${pkg.totalPrice.toLocaleString()}
                      </span>
                      <span className='text-sm' style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>
                        base price
                      </span>
                    </div>
                  </div>

                  {/* Photo catalog */}
                  {pkg.photos.length > 0 && (
                    <PhotoCarousel photos={pkg.photos} tierColor={tier.color} />
                  )}

                  <div className='px-6 py-5 flex-1 flex flex-col gap-4'>
                    {/* Highlights */}
                    <ul className='space-y-2'>
                      {pkg.highlights.map((h, i) => (
                        <li key={i} className='flex items-start gap-2 text-sm' style={{ color: 'hsl(150,10%,38%)', fontFamily: 'Inter, sans-serif' }}>
                          <Check className='w-4 h-4 mt-0.5 shrink-0' style={{ color: tier.color }} />
                          {h}
                        </li>
                      ))}
                    </ul>

                    {/* Included items preview */}
                    <div>
                      <p className='text-xs uppercase tracking-widest font-semibold mb-2' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
                        Included
                      </p>
                      <div className='flex flex-wrap gap-1.5'>
                        {pkg.items.map(item => (
                          <span
                            key={item.id}
                            className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium'
                            style={{ background: 'white', borderColor: 'hsl(150,12%,88%)', color: 'hsl(155,14%,40%)', fontFamily: 'Inter, sans-serif' }}
                          >
                            {CATEGORY_EMOJI[item.category] ?? '🛍️'} {item.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => onSelectPackage(pkg)}
                      className='mt-auto w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02]'
                      style={{
                        background: isPopular
                          ? 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,34%))'
                          : pkg.tier === 'BRONZE'
                            ? 'linear-gradient(135deg, hsl(30,60%,50%), hsl(30,50%,42%))'
                            : 'linear-gradient(135deg, hsl(43,74%,45%), hsl(38,65%,38%))',
                        color: pkg.tier === 'GOLD' ? 'hsl(155,45%,10%)' : 'white',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Choose {tier.label}
                      <ChevronRight className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back link */}
        <button
          onClick={() => onNavigate('dashboard')}
          className='mt-10 text-sm font-semibold transition-colors hover:opacity-70'
          style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}
        >
          ← Back to Dashboard
        </button>
      </main>
    </div>
  );
}
