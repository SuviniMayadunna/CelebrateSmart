import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X, Check, Palette, Tag, Image as ImageIcon, Upload, Loader2, Lock, Package } from 'lucide-react';
import { visionBoardAPI, ordersAPI, type VisionBoard as VisionBoardType, type PinSection, type Order } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

// Map color theme name → 2-3 palette hex colors
const THEME_PALETTES: Record<string, string[]> = {
  'Blush Pink':     ['#f9a8c0', '#fce7ef', '#f472b6'],
  'Lavender':       ['#c4b5fd', '#ede9fe', '#a78bfa'],
  'Royal Blue':     ['#60a5fa', '#dbeafe', '#3b82f6'],
  'Emerald':        ['#34d399', '#d1fae5', '#059669'],
  'Champagne Gold': ['#d4a847', '#fefce8', '#fbbf24'],
  'Coral Peach':    ['#fb7185', '#fff1f2', '#f97316'],
  'Rose Gold':      ['#e8a598', '#fff5f3', '#f9a8d4'],
  'Sage White':     ['#86efac', '#f0fdf4', '#e2e8f0'],
  'Midnight Black': ['#374151', '#1e293b', '#64748b'],
  'Sky Blue':       ['#7dd3fc', '#f0f9ff', '#38bdf8'],
};

// Map product category → vision board section
const CATEGORY_TO_SECTION: Record<string, PinSection> = {
  CAKES:         'FOOD',
  FOOD:          'FOOD',
  DECORATIONS:   'DECOR',
  PHOTOGRAPHY:   'MOOD',
  ENTERTAINMENT: 'ENTERTAINMENT',
  VENUE:         'LAYOUT',
  GIFTS:         'MOOD',
};

const SECTIONS: { id: PinSection; label: string; emoji: string }[] = [
  { id: 'MOOD',          label: 'Mood & Theme',  emoji: '✨' },
  { id: 'DECOR',         label: 'Decor',          emoji: '🌸' },
  { id: 'OUTFIT',        label: 'Outfits',         emoji: '👗' },
  { id: 'LAYOUT',        label: 'Venue Layout',    emoji: '📐' },
  { id: 'FOOD',          label: 'Cake & Food',     emoji: '🎂' },
  { id: 'ENTERTAINMENT', label: 'Entertainment',   emoji: '🎵' },
];

const STYLE_KEYWORDS = [
  'Elegant', 'Romantic', 'Boho', 'Rustic', 'Modern', 'Classic', 'Tropical',
  'Vintage', 'Minimalist', 'Whimsical', 'Glam', 'Casual', 'Outdoor', 'Garden',
];

const PRESET_COLORS = [
  '#FDA4AF','#F9A8D4','#C084FC','#A78BFA','#60A5FA','#2DD4BF',
  '#86EFAC','#FCD34D','#FBBF24','#FCA5A5','#F97316','#1e293b',
];

interface AddPinDialogProps {
  section: PinSection;
  onAdd:   (data: { section: PinSection; imageUrl?: string; caption?: string; notes?: string }) => Promise<void>;
  onClose: () => void;
}

function AddPinDialog({ section, onAdd, onClose }: AddPinDialogProps) {
  const [imageUrl,  setImageUrl]  = useState('');
  const [caption,   setCaption]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      toast({ variant: 'destructive', title: 'Cloudinary not configured' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setImageUrl(data.secure_url);
    } catch {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Please try again or paste a URL.' });
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = async () => {
    if (!imageUrl.trim() && !caption.trim()) return;
    setSaving(true);
    try {
      await onAdd({ section, imageUrl: imageUrl.trim() || undefined, caption: caption.trim() || undefined });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40'>
      <div className='w-full max-w-sm rounded-2xl p-6 space-y-4'
        style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div className='flex items-center justify-between'>
          <h3 className='font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Add Inspiration</h3>
          <button onClick={onClose} className='p-1 rounded-lg hover:bg-slate-100 transition-colors'>
            <X className='w-4 h-4' style={{ color: '#64748b' }} />
          </button>
        </div>

        <div className='space-y-3'>
          <div>
            <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
              Image
            </label>
            {imageUrl && (
              <div className='relative mb-2 rounded-xl overflow-hidden' style={{ aspectRatio: '3/2' }}>
                <img src={imageUrl} alt='Preview' className='w-full h-full object-cover' />
                <button onClick={() => setImageUrl('')}
                  className='absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80'>
                  <X className='w-3 h-3 text-white' />
                </button>
              </div>
            )}
            <input ref={fileInputRef} type='file' accept='image/*' className='hidden'
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className='w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors mb-2'
              style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', color: '#64748b' }}>
              {uploading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Upload className='w-4 h-4' />}
              {uploading ? 'Uploading…' : 'Upload from device'}
            </button>
            <input type='url' placeholder='Or paste an image URL...' value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className='w-full px-3 py-2 rounded-xl text-sm outline-none'
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }} />
          </div>

          <div>
            <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
              Caption
            </label>
            <input type='text' placeholder='Describe this inspiration...' value={caption}
              onChange={e => setCaption(e.target.value)} maxLength={200}
              className='w-full px-3 py-2 rounded-xl text-sm outline-none'
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }} />
          </div>
        </div>

        <div className='flex gap-3 pt-1'>
          <Button variant='ghost' className='flex-1' onClick={onClose} disabled={saving || uploading}>Cancel</Button>
          <Button className='flex-1 font-bold' onClick={handleSubmit} disabled={saving || uploading || (!imageUrl.trim() && !caption.trim())}>
            {saving ? <Spinner className='w-4 h-4' /> : 'Add Pin'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PackagePin {
  productName:  string;
  categoryName: string;
  imageUrl:     string;
  section:      PinSection;
}

interface VisionBoardProps {
  eventId:     string;
  isPast?:     boolean;
  colorTheme?: string | null;
}

export function VisionBoard({ eventId, isPast = false, colorTheme }: VisionBoardProps) {
  const [board,         setBoard]         = useState<VisionBoardType | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState<PinSection>('MOOD');
  const [showAddPin,    setShowAddPin]    = useState(false);
  const [editingColor,  setEditingColor]  = useState(false);
  const [packagePins,   setPackagePins]   = useState<PackagePin[]>([]);

  useEffect(() => {
    Promise.all([
      visionBoardAPI.get(eventId),
      ordersAPI.list(),
    ]).then(([boardRes, ordersRes]) => {
      const loadedBoard = boardRes.data.board;
      setBoard(loadedBoard);

      // Auto-populate palette from color theme if board palette is empty
      if (loadedBoard && loadedBoard.colorPalette.length === 0 && colorTheme) {
        const colors = THEME_PALETTES[colorTheme];
        if (colors) {
          visionBoardAPI.updatePalette(eventId, colors)
            .then(r => setBoard(prev => prev ? { ...prev, colorPalette: r.data.board.colorPalette } : prev))
            .catch(() => {});
        }
      }

      // Extract package item images for the event
      const eventOrders = (ordersRes.data.orders as Order[]).filter(
        o => o.eventId === eventId && ['PAID','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'].includes(o.status)
      );
      const pins: PackagePin[] = [];
      for (const order of eventOrders) {
        for (const item of order.items) {
          if (item.imageUrl) {
            const section = CATEGORY_TO_SECTION[item.categoryName];
            if (section) pins.push({ productName: item.productName, categoryName: item.categoryName, imageUrl: item.imageUrl, section });
          }
        }
      }
      setPackagePins(pins);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activePins       = (board?.pins ?? []).filter(p => p.section === activeSection);
  const activePackagePins = packagePins.filter(p => p.section === activeSection);

  async function handleAddPin(data: { section: PinSection; imageUrl?: string; caption?: string; notes?: string }) {
    const res = await visionBoardAPI.addPin(eventId, data);
    setBoard(prev => prev ? { ...prev, pins: [...prev.pins, res.data.pin] } : prev);
    toast({ title: 'Pin added' });
  }

  async function handleDeletePin(pinId: string) {
    await visionBoardAPI.deletePin(eventId, pinId);
    setBoard(prev => prev ? { ...prev, pins: prev.pins.filter(p => p.id !== pinId) } : prev);
  }

  async function toggleKeyword(kw: string) {
    if (!board || isPast) return;
    const next = board.styleKeywords.includes(kw)
      ? board.styleKeywords.filter(k => k !== kw)
      : [...board.styleKeywords, kw];
    const res = await visionBoardAPI.updateKeywords(eventId, next);
    setBoard(prev => prev ? { ...prev, styleKeywords: res.data.board.styleKeywords } : prev);
  }

  async function toggleColor(hex: string) {
    if (!board || isPast) return;
    const next = board.colorPalette.includes(hex)
      ? board.colorPalette.filter(c => c !== hex)
      : board.colorPalette.length < 5
        ? [...board.colorPalette, hex]
        : board.colorPalette;
    const res = await visionBoardAPI.updatePalette(eventId, next);
    setBoard(prev => prev ? { ...prev, colorPalette: res.data.board.colorPalette } : prev);
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-24'>
        <Spinner className='size-6' style={{ color: 'hsl(43,74%,49%)' }} />
      </div>
    );
  }

  if (!board) {
    return (
      <div className='flex flex-col items-center justify-center py-24 gap-4'>
        <div className='w-14 h-14 rounded-2xl flex items-center justify-center' style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          <Palette className='w-7 h-7' style={{ color: '#cbd5e1' }} />
        </div>
        <div className='text-center'>
          <p className='text-sm font-semibold' style={{ color: '#64748b' }}>Vision board not set up yet</p>
          <p className='text-xs mt-1' style={{ color: '#64748b' }}>Complete your event booking to activate your vision board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      {/* Past read-only notice */}
      {isPast && (
        <div className='flex items-center gap-3 px-4 py-3 rounded-xl'
          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          <Lock className='w-4 h-4 shrink-0' style={{ color: '#64748b' }} />
          <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
            This event has passed — vision board is read-only.
          </p>
        </div>
      )}

      {/* Palette + keywords */}
      <div className='rounded-2xl p-5 space-y-4'
        style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Color palette */}
        <div>
          <div className='flex items-center gap-2 mb-3'>
            <Palette className='w-4 h-4' style={{ color: 'hsl(43,74%,49%)' }} />
            <span className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Color Palette</span>
            <span className='text-xs ml-auto' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
              {board.colorPalette.length}/5
            </span>
            {!isPast && (
              <button onClick={() => setEditingColor(v => !v)}
                className='text-xs px-2 py-0.5 rounded-lg transition-colors'
                style={{ color: 'hsl(43,74%,40%)', background: 'rgba(251,191,36,0.1)', fontFamily: 'Inter, sans-serif' }}>
                {editingColor ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
          {editingColor && !isPast ? (
            <div className='flex flex-wrap gap-2'>
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => toggleColor(c)}
                  className='w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 relative'
                  style={{ background: c, borderColor: board.colorPalette.includes(c) ? '#0f172a' : '#e2e8f0' }}>
                  {board.colorPalette.includes(c) && (
                    <Check className='w-3 h-3 absolute inset-0 m-auto' style={{ color: c === '#1e293b' ? 'white' : '#0f172a' }} />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              {board.colorPalette.length === 0 ? (
                <button onClick={() => !isPast && setEditingColor(true)}
                  className={`flex items-center gap-2 text-sm transition-colors ${isPast ? 'cursor-default' : ''}`}
                  style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                  {!isPast && <Plus className='w-4 h-4' />}
                  {isPast ? 'No colors selected' : 'Pick your palette'}
                </button>
              ) : (
                board.colorPalette.map((c, i) => (
                  <div key={i} className='w-9 h-9 rounded-full border-2 border-white shadow-md' style={{ background: c }} title={c} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Style keywords */}
        <div>
          <div className='flex items-center gap-2 mb-3'>
            <Tag className='w-4 h-4' style={{ color: '#c084fc' }} />
            <span className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Style Keywords</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {STYLE_KEYWORDS.map(kw => {
              const active = board.styleKeywords.includes(kw);
              return (
                <button key={kw} onClick={() => toggleKeyword(kw)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${isPast ? 'cursor-default' : ''}`}
                  style={{
                    background: active ? 'rgba(192,132,252,0.15)' : '#f8fafc',
                    color:      active ? '#9333ea' : '#64748b',
                    border:     `1px solid ${active ? '#c084fc50' : '#e2e8f0'}`,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                  {kw}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
        {SECTIONS.map(sec => {
          const pinCount = board.pins.filter(p => p.section === sec.id).length + packagePins.filter(p => p.section === sec.id).length;
          const isActive = activeSection === sec.id;
          return (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
              className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0'
              style={{
                background: isActive ? 'rgba(251,191,36,0.12)' : 'white',
                color:      isActive ? 'hsl(43,74%,40%)' : '#64748b',
                border:     `1px solid ${isActive ? 'rgba(251,191,36,0.35)' : '#e2e8f0'}`,
                fontFamily: 'Inter, sans-serif',
              }}>
              <span>{sec.emoji}</span>
              <span>{sec.label}</span>
              {pinCount > 0 && (
                <span className='px-1.5 py-0.5 rounded-full text-[10px]'
                  style={{ background: isActive ? 'rgba(251,191,36,0.25)' : '#f1f5f9', color: isActive ? 'hsl(43,74%,40%)' : '#64748b' }}>
                  {pinCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pin grid */}
      <div>
        {activePins.length === 0 && activePackagePins.length === 0 ? (
          <button
            onClick={() => !isPast && setShowAddPin(true)}
            className={`w-full rounded-2xl border-2 border-dashed p-12 flex flex-col items-center gap-3 transition-all ${!isPast ? 'hover:border-slate-300' : 'cursor-default'}`}
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className='w-12 h-12 rounded-full flex items-center justify-center' style={{ background: '#f1f5f9' }}>
              <ImageIcon className='w-5 h-5' style={{ color: '#64748b' }} />
            </div>
            <div className='text-center'>
              <p className='text-sm font-semibold' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                No {SECTIONS.find(s => s.id === activeSection)?.label} pins yet
              </p>
              {!isPast && (
                <p className='text-xs mt-1' style={{ color: '#cbd5e1', fontFamily: 'Inter, sans-serif' }}>
                  Add inspiration images and ideas
                </p>
              )}
            </div>
          </button>
        ) : (
          <div className='space-y-4'>
            {/* Package auto-pins */}
            {activePackagePins.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <Package className='w-3.5 h-3.5' style={{ color: 'hsl(43,60%,48%)' }} />
                  <span className='text-xs font-bold uppercase tracking-wide' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
                    From Your Package
                  </span>
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                  {activePackagePins.map((pin, i) => (
                    <div key={i} className='relative rounded-xl overflow-hidden'
                      style={{ background: '#f8fafc', border: '1px solid hsl(43,60%,80%)', aspectRatio: '3/4' }}>
                      <img src={pin.imageUrl} alt={pin.productName} className='w-full h-full object-cover' />
                      <div className='absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2'>
                        <p className='text-xs font-semibold text-white truncate' style={{ fontFamily: 'Inter, sans-serif' }}>{pin.productName}</p>
                      </div>
                      <div className='absolute top-2 left-2'>
                        <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full'
                          style={{ background: 'rgba(251,191,36,0.9)', color: '#78350f', fontFamily: 'Inter, sans-serif' }}>
                          Package
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User-added pins */}
            {(activePins.length > 0 || !isPast) && (
              <div>
                {activePackagePins.length > 0 && activePins.length > 0 && (
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='text-xs font-bold uppercase tracking-wide' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                      My Inspiration
                    </span>
                  </div>
                )}
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                  {activePins.map(pin => (
                    <div key={pin.id} className='group relative rounded-xl overflow-hidden'
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', aspectRatio: '3/4' }}>
                      {pin.imageUrl ? (
                        <img src={pin.imageUrl} alt={pin.caption ?? ''} className='w-full h-full object-cover'
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <ImageIcon className='w-8 h-8' style={{ color: '#cbd5e1' }} />
                        </div>
                      )}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3'>
                        {pin.caption && (
                          <p className='text-xs font-semibold text-white mb-2' style={{ fontFamily: 'Inter, sans-serif' }}>{pin.caption}</p>
                        )}
                        {!isPast && (
                          <button onClick={() => handleDeletePin(pin.id)}
                            className='self-end p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors'
                            aria-label='Remove pin'>
                            <Trash2 className='w-3.5 h-3.5 text-white' />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!isPast && (
                    <button onClick={() => setShowAddPin(true)}
                      className='rounded-xl border-2 border-dashed flex items-center justify-center transition-all hover:border-slate-300 hover:bg-slate-50'
                      style={{ borderColor: '#e2e8f0', aspectRatio: '3/4' }}>
                      <Plus className='w-6 h-6' style={{ color: '#64748b' }} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB mobile */}
      {!isPast && (
        <div className='fixed bottom-6 right-6 z-30 sm:hidden'>
          <button onClick={() => setShowAddPin(true)}
            className='w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105'
            style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))' }}>
            <Plus className='w-6 h-6 text-white' />
          </button>
        </div>
      )}

      {showAddPin && (
        <AddPinDialog section={activeSection} onAdd={handleAddPin} onClose={() => setShowAddPin(false)} />
      )}
    </div>
  );
}
