import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, UserCheck, UserX, Clock, Users, ChevronDown, LayoutGrid, List, Upload, Lock } from 'lucide-react';
import { guestsAPI, type Guest, type GuestStatus, type GuestCategory, type GuestStats } from '@/lib/api';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

const STATUS_CONFIG: Record<GuestStatus, { label: string; color: string; icon: React.ElementType }> = {
  INVITED:   { label: 'Invited',   color: '#60a5fa', icon: Users },
  CONFIRMED: { label: 'Confirmed', color: '#22c55e', icon: UserCheck },
  DECLINED:  { label: 'Declined',  color: '#ef4444', icon: UserX },
  PENDING:   { label: 'Pending',   color: '#f59e0b', icon: Clock },
  ATTENDED:  { label: 'Attended',  color: '#2dd4bf', icon: UserCheck },
  NO_SHOW:   { label: 'No Show',   color: '#64748b', icon: UserX },
};

const CATEGORIES: GuestCategory[] = ['FAMILY','RELATIVES','FRIENDS','COLLEAGUES','VIP','KIDS'];

const MEAL_OPTIONS = [
  'No Preference',
  'Chicken',
  'Fish',
  'Beef',
  'Lamb',
  'Pork',
  'Vegetarian',
  'Vegan',
];

const DIETARY_OPTIONS = [
  'Nut Allergy',
  'Gluten-Free',
  'Dairy-Free',
  'Shellfish Allergy',
  'Egg-Free',
  'Halal',
  'Kosher',
  'Diabetic',
];

interface GuestFormData {
  name:                string;
  email:               string;
  phone:               string;
  category:            GuestCategory;
  plusOnes:            number;
  tableNumber:         string;
  mealPreference:      string;
  dietaryRestrictions: string;
  notes:               string;
}

function defaultForm(g?: Guest): GuestFormData {
  return {
    name:                g?.name                ?? '',
    email:               g?.email               ?? '',
    phone:               g?.phone               ?? '',
    category:            g?.category            ?? 'FRIENDS',
    plusOnes:            g?.plusOnes             ?? 0,
    tableNumber:         g?.tableNumber         ?? '',
    mealPreference:      g?.mealPreference      ?? '',
    dietaryRestrictions: g?.dietaryRestrictions ?? '',
    notes:               g?.notes               ?? '',
  };
}

interface GuestManagerProps {
  eventId:          string;
  targetGuestCount: number;
  isPast?:          boolean;
}

export function GuestManager({ eventId, targetGuestCount, isPast = false }: GuestManagerProps) {
  const [guests,      setGuests]      = useState<Guest[]>([]);
  const [stats,       setStats]       = useState<GuestStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filterStatus,setFilterStatus]= useState<GuestStatus | 'ALL'>('ALL');
  const [showForm,    setShowForm]    = useState(false);
  const [editGuest,   setEditGuest]   = useState<Guest | null>(null);
  const [form,        setForm]        = useState<GuestFormData>(defaultForm());
  const [saving,      setSaving]      = useState(false);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [view,        setView]        = useState<'list' | 'tables'>('list');
  const [manualTables, setManualTables] = useState<string[]>([]);
  const [newTableInput, setNewTableInput] = useState('');
  const [assigningGuest, setAssigningGuest] = useState<string | null>(null);
  const [showImport,   setShowImport]   = useState(false);
  const [importing,    setImporting]    = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    guestsAPI.list(eventId)
      .then(res => { setGuests(res.data.guests); setStats(res.data.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editGuest) {
        const res = await guestsAPI.update(eventId, editGuest.id, {
          name: form.name, email: form.email || null, phone: form.phone || null,
          category: form.category, plusOnes: form.plusOnes,
          tableNumber: form.tableNumber || null, mealPreference: form.mealPreference || null,
          dietaryRestrictions: form.dietaryRestrictions || null, notes: form.notes || null,
        } as any);
        setGuests(prev => prev.map(g => g.id === editGuest.id ? res.data.guest : g));
      } else {
        const res = await guestsAPI.add(eventId, {
          name: form.name, email: form.email || undefined, phone: form.phone || undefined,
          category: form.category, plusOnes: form.plusOnes,
          tableNumber: form.tableNumber || undefined, mealPreference: form.mealPreference || undefined,
          dietaryRestrictions: form.dietaryRestrictions || undefined, notes: form.notes || undefined,
        });
        setGuests(prev => [...prev, res.data.guest]);
      }
      const statsRes = await guestsAPI.list(eventId);
      setStats(statsRes.data.stats);
      setShowForm(false);
      setEditGuest(null);
      setForm(defaultForm());
      toast({ title: editGuest ? 'Guest updated' : 'Guest added' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await guestsAPI.remove(eventId, id);
    setGuests(prev => prev.filter(g => g.id !== id));
    const statsRes = await guestsAPI.list(eventId);
    setStats(statsRes.data.stats);
    toast({ title: 'Guest removed' });
  }

  async function handleStatusChange(guest: Guest, status: GuestStatus) {
    const res = await guestsAPI.update(eventId, guest.id, { status } as any);
    setGuests(prev => prev.map(g => g.id === guest.id ? res.data.guest : g));
    const statsRes = await guestsAPI.list(eventId);
    setStats(statsRes.data.stats);
  }

  async function handleCSVImport(file: File) {
    setImporting(true);
    try {
      const csv = await file.text();
      const res = await guestsAPI.importCSV(eventId, csv);
      const refreshed = await guestsAPI.list(eventId);
      setGuests(refreshed.data.guests);
      setStats(refreshed.data.stats);
      setShowImport(false);
      toast({ title: `Imported ${res.data.imported} guest${res.data.imported !== 1 ? 's' : ''}${res.data.skipped > 0 ? `, ${res.data.skipped} skipped` : ''}` });
    } catch {
      toast({ variant: 'destructive', title: 'Import failed', description: 'Check your CSV format and try again.' });
    } finally {
      setImporting(false);
    }
  }

  async function handleAssignTable(guestId: string, tableNumber: string | null) {
    const res = await guestsAPI.update(eventId, guestId, { tableNumber } as any);
    setGuests(prev => prev.map(g => g.id === guestId ? res.data.guest : g));
    setAssigningGuest(null);
  }

  function allTableNumbers(): string[] {
    const fromGuests = guests.filter(g => g.tableNumber).map(g => g.tableNumber!);
    return [...new Set([...fromGuests, ...manualTables])].sort((a, b) => {
      const na = parseFloat(a), nb = parseFloat(b);
      return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
    });
  }

  const filtered = guests.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || (g.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || g.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <div className='flex items-center justify-center py-24'><Spinner className='size-6' style={{ color: 'hsl(43,74%,49%)' }} /></div>;
  }

  return (
    <div className='space-y-5'>
      {/* Past event read-only notice */}
      {isPast && (
        <div className='flex items-center gap-3 px-4 py-3 rounded-xl'
          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          <Lock className='w-4 h-4 shrink-0' style={{ color: '#64748b' }} />
          <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
            This event has passed — guest list is read-only.
          </p>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3'>
          {([
            { label: 'Total',     value: stats.total,          color: '#0f172a' },
            { label: 'Confirmed', value: stats.confirmed,      color: '#22c55e' },
            { label: 'Pending',   value: stats.pending,        color: '#f59e0b' },
            { label: 'Invited',   value: stats.invited,        color: '#60a5fa' },
            { label: 'Declined',  value: stats.declined,       color: '#ef4444' },
            { label: 'Attending', value: stats.totalAttending, color: '#2dd4bf' },
          ] as const).map(s => (
            <div key={s.label} className='rounded-xl p-3 text-center'
              style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <p className='text-2xl font-black' style={{ color: s.color, fontFamily: 'Inter, sans-serif' }}>{s.value}</p>
              <p className='text-xs mt-0.5' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {targetGuestCount > 0 && stats && stats.confirmed > 0 && Math.abs(stats.confirmed - targetGuestCount) > 5 && (
        <div className='flex items-center gap-2 px-4 py-3 rounded-xl text-sm'
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706', fontFamily: 'Inter, sans-serif' }}>
          ⚠️ {stats.confirmed} guests confirmed vs {targetGuestCount} in your package.
        </div>
      )}

      {/* Controls row */}
      <div className='flex flex-col sm:flex-row gap-3'>
        {/* View toggle */}
        <div className='flex rounded-xl overflow-hidden shrink-0' style={{ border: '1px solid #e2e8f0' }}>
          {(['list', 'tables'] as const).map(v => {
            const Icon     = v === 'list' ? List : LayoutGrid;
            const isActive = view === v;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className='flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all'
                style={{
                  background: isActive ? 'hsl(43,74%,49%)' : 'white',
                  color:      isActive ? 'white' : '#64748b',
                }}
              >
                <Icon className='w-3.5 h-3.5' />
                {v === 'list' ? 'List' : 'Tables'}
              </button>
            );
          })}
        </div>
        <div className='relative flex-1'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2' style={{ color: '#64748b' }} />
          <input
            type='text'
            placeholder='Search by name or email...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none'
            style={{ background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as GuestStatus | 'ALL')}
          className='px-3 py-2 rounded-xl text-sm outline-none'
          style={{ background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}
        >
          <option value='ALL'>All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {!isPast && (
          <>
            <Button variant='outline' className='gap-1.5 font-bold shrink-0' onClick={() => setShowImport(true)}>
              <Upload className='w-4 h-4' />
              Import CSV
            </Button>
            <Button className='gap-1.5 font-bold shrink-0' onClick={() => { setEditGuest(null); setForm(defaultForm()); setShowForm(true); }}>
              <Plus className='w-4 h-4' />
              Add Guest
            </Button>
          </>
        )}
      </div>

      {/* TABLE VIEW */}
      {view === 'tables' && (() => {
        const tables         = allTableNumbers();
        const unassigned     = guests.filter(g => !g.tableNumber);
        const guestsForTable = (t: string) => guests.filter(g => g.tableNumber === t);

        return (
          <div className='space-y-4'>
            {!isPast && (
              <div className='flex gap-2'>
                <input
                  type='text'
                  placeholder='New table number (e.g. 5)'
                  value={newTableInput}
                  onChange={e => setNewTableInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTableInput.trim()) {
                      if (!tables.includes(newTableInput.trim())) setManualTables(prev => [...prev, newTableInput.trim()]);
                      setNewTableInput('');
                    }
                  }}
                  className='flex-1 px-3 py-2 rounded-xl text-sm outline-none'
                  style={{ background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}
                />
                <Button className='shrink-0 gap-1.5 font-bold' disabled={!newTableInput.trim()}
                  onClick={() => {
                    if (newTableInput.trim() && !tables.includes(newTableInput.trim())) {
                      setManualTables(prev => [...prev, newTableInput.trim()]);
                    }
                    setNewTableInput('');
                  }}>
                  <Plus className='w-4 h-4' /> Add Table
                </Button>
              </div>
            )}

            {tables.length === 0 && unassigned.length === 0 && (
              <div className='rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-3'
                style={{ borderColor: '#e2e8f0' }}>
                <LayoutGrid className='w-8 h-8' style={{ color: '#cbd5e1' }} />
                <p className='text-sm font-semibold' style={{ color: '#64748b' }}>No guests or tables yet</p>
              </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {tables.map(tableNum => {
                const seated = guestsForTable(tableNum);
                return (
                  <div key={tableNum} className='rounded-2xl overflow-hidden'
                    style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div className='flex items-center justify-between px-4 py-3 border-b'
                      style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}>
                      <p className='text-sm font-black' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                        Table {tableNum}
                      </p>
                      <span className='text-xs font-semibold px-2 py-0.5 rounded-full'
                        style={{ background: 'rgba(251,191,36,0.12)', color: 'hsl(43,74%,40%)', fontFamily: 'Inter, sans-serif' }}>
                        {seated.length} seated
                      </span>
                    </div>
                    <div className='p-3 space-y-1.5'>
                      {seated.length === 0 && (
                        <p className='text-xs text-center py-3' style={{ color: '#64748b' }}>Empty</p>
                      )}
                      {seated.map(g => {
                        const sc = STATUS_CONFIG[g.status];
                        return (
                          <div key={g.id} className='flex items-center gap-2 px-2 py-1.5 rounded-lg'
                            style={{ background: '#f8fafc' }}>
                            <div className='w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold'
                              style={{ background: `${sc.color}20`, color: sc.color }}>
                              {g.name.charAt(0).toUpperCase()}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-xs font-semibold truncate' style={{ color: '#0f172a' }}>{g.name}</p>
                              {g.plusOnes > 0 && (
                                <p className='text-xs' style={{ color: '#64748b' }}>+{g.plusOnes} plus-one{g.plusOnes > 1 ? 's' : ''}</p>
                              )}
                            </div>
                            {!isPast && (
                              <button onClick={() => handleAssignTable(g.id, null)}
                                className='p-1 rounded hover:bg-red-50 transition-colors shrink-0' title='Remove from table'>
                                <X className='w-3 h-3 text-red-400' />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {!isPast && unassigned.length > 0 && (
                        <div className='pt-1'>
                          {assigningGuest === tableNum ? (
                            <div className='space-y-1.5'>
                              {unassigned.map(g => (
                                <button key={g.id} onClick={() => handleAssignTable(g.id, tableNum)}
                                  className='w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-100'
                                  style={{ color: '#475569' }}>
                                  + {g.name}
                                </button>
                              ))}
                              <button onClick={() => setAssigningGuest(null)}
                                className='w-full text-center text-xs py-1' style={{ color: '#64748b' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setAssigningGuest(tableNum)}
                              className='w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-50'
                              style={{ color: '#64748b', border: '1px dashed #e2e8f0' }}>
                              <Plus className='w-3 h-3' /> Seat guest
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {unassigned.length > 0 && (
              <div className='rounded-2xl overflow-hidden'
                style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div className='flex items-center justify-between px-4 py-3 border-b'
                  style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}>
                  <p className='text-sm font-black' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Unassigned</p>
                  <span className='text-xs font-semibold px-2 py-0.5 rounded-full'
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', fontFamily: 'Inter, sans-serif' }}>
                    {unassigned.length} guest{unassigned.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className='p-3 space-y-1.5'>
                  {unassigned.map(g => {
                    const sc = STATUS_CONFIG[g.status];
                    return (
                      <div key={g.id} className='flex items-center gap-2 px-2 py-1.5 rounded-lg'
                        style={{ background: '#f8fafc' }}>
                        <div className='w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold'
                          style={{ background: `${sc.color}20`, color: sc.color }}>
                          {g.name.charAt(0).toUpperCase()}
                        </div>
                        <p className='flex-1 text-xs font-semibold truncate' style={{ color: '#0f172a' }}>{g.name}</p>
                        {!isPast && tables.length > 0 && (
                          <select value='' onChange={e => { if (e.target.value) handleAssignTable(g.id, e.target.value); }}
                            className='text-xs rounded-lg px-2 py-1 outline-none'
                            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontFamily: 'Inter, sans-serif' }}>
                            <option value=''>Seat at…</option>
                            {tables.map(t => <option key={t} value={t}>Table {t}</option>)}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* LIST VIEW */}
      {view === 'list' && (filtered.length === 0 ? (
        <div className='rounded-2xl border-2 border-dashed p-12 flex flex-col items-center gap-3'
          style={{ borderColor: '#e2e8f0' }}>
          <Users className='w-10 h-10' style={{ color: '#cbd5e1' }} />
          <div className='text-center'>
            <p className='text-sm font-semibold' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
              {guests.length === 0 ? 'No guests yet' : 'No guests match your filter'}
            </p>
            {guests.length === 0 && (
              <p className='text-xs mt-1' style={{ color: '#cbd5e1', fontFamily: 'Inter, sans-serif' }}>
                {isPast ? 'No guests were added for this event.' : 'Start building your guest list'}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className='space-y-2'>
          {filtered.map(guest => {
            const sc         = STATUS_CONFIG[guest.status];
            const StatusIcon = sc.icon;
            const isExpanded = expandedId === guest.id;
            return (
              <div key={guest.id} className='rounded-xl overflow-hidden'
                style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div className='flex items-center gap-3 p-3 cursor-pointer'
                  onClick={() => setExpandedId(isExpanded ? null : guest.id)}>
                  <div className='w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold'
                    style={{ background: `${sc.color}15`, color: sc.color }}>
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-semibold truncate' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{guest.name}</p>
                      {guest.plusOnes > 0 && (
                        <span className='text-xs px-1.5 rounded-full' style={{ background: '#f1f5f9', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                          +{guest.plusOnes}
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2 mt-0.5'>
                      <span className='text-xs font-semibold flex items-center gap-1' style={{ color: sc.color, fontFamily: 'Inter, sans-serif' }}>
                        <StatusIcon className='w-3 h-3' />
                        {sc.label}
                      </span>
                      {guest.category !== 'FRIENDS' && (
                        <span className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>· {guest.category}</span>
                      )}
                      {guest.tableNumber && (
                        <span className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>· Table {guest.tableNumber}</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className='w-4 h-4 shrink-0 transition-transform'
                    style={{ color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : '' }} />
                </div>

                {isExpanded && (
                  <div className='px-3 pb-3 pt-0 border-t' style={{ borderColor: '#f1f5f9' }}>
                    <div className='pt-3 space-y-2'>
                      {guest.email && <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>✉️ {guest.email}</p>}
                      {guest.phone && <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>📞 {guest.phone}</p>}
                      {guest.mealPreference && <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>🍽️ Meal: {guest.mealPreference}</p>}
                      {guest.dietaryRestrictions && <p className='text-xs' style={{ color: '#d97706', fontFamily: 'Inter, sans-serif' }}>⚠️ Dietary: {guest.dietaryRestrictions}</p>}
                      {guest.notes && <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>📝 {guest.notes}</p>}

                      <div className='flex flex-wrap gap-2 pt-2'>
                        {!isPast && (['INVITED','CONFIRMED','DECLINED','PENDING'] as GuestStatus[]).map(s => {
                          const cfg = STATUS_CONFIG[s];
                          const active = guest.status === s;
                          return (
                            <button key={s} onClick={() => handleStatusChange(guest, s)}
                              className='px-2.5 py-1 rounded-full text-xs font-semibold transition-all'
                              style={{
                                background: active ? `${cfg.color}15` : '#f1f5f9',
                                color:      active ? cfg.color : '#64748b',
                                border:     `1px solid ${active ? cfg.color + '40' : '#e2e8f0'}`,
                                fontFamily: 'Inter, sans-serif',
                              }}>
                              {cfg.label}
                            </button>
                          );
                        })}
                        {!isPast && (
                          <div className='ml-auto flex gap-2'>
                            <button onClick={() => { setEditGuest(guest); setForm(defaultForm(guest)); setShowForm(true); }}
                              className='p-1.5 rounded-lg hover:bg-slate-100 transition-colors'>
                              <Pencil className='w-3.5 h-3.5' style={{ color: '#64748b' }} />
                            </button>
                            <button onClick={() => handleDelete(guest.id)}
                              className='p-1.5 rounded-lg hover:bg-red-50 transition-colors'>
                              <Trash2 className='w-3.5 h-3.5 text-red-400' />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* CSV import dialog */}
      {showImport && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40'>
          <div className='w-full max-w-md rounded-2xl p-6 space-y-4'
            style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className='flex items-center justify-between'>
              <h3 className='font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Import Guests from CSV</h3>
              <button onClick={() => setShowImport(false)} className='p-1 rounded-lg hover:bg-slate-100'>
                <X className='w-4 h-4' style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className='rounded-xl p-4 space-y-1.5' style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p className='text-xs font-semibold uppercase tracking-wide' style={{ color: 'hsl(43,60%,48%)' }}>Expected columns</p>
              <p className='text-xs font-mono' style={{ color: '#64748b' }}>
                name, email, phone, category, plusOnes,<br />
                tableNumber, mealPreference, dietaryRestrictions, notes
              </p>
              <p className='text-xs mt-2' style={{ color: '#64748b' }}>
                Only <strong style={{ color: '#475569' }}>name</strong> is required.
              </p>
            </div>
            <input ref={csvInputRef} type='file' accept='.csv,text/csv' className='hidden'
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVImport(f); }} />
            <div className='flex gap-3'>
              <Button variant='ghost' className='flex-1' onClick={() => setShowImport(false)} disabled={importing}>Cancel</Button>
              <Button className='flex-1 font-bold gap-2' disabled={importing} onClick={() => csvInputRef.current?.click()}>
                {importing ? <Spinner className='w-4 h-4' /> : <Upload className='w-4 h-4' />}
                {importing ? 'Importing…' : 'Choose CSV file'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/edit guest dialog */}
      {showForm && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40'>
          <div className='w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto'
            style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className='flex items-center justify-between sticky top-0 pb-2' style={{ background: 'white' }}>
              <h3 className='font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{editGuest ? 'Edit Guest' : 'Add Guest'}</h3>
              <button onClick={() => { setShowForm(false); setEditGuest(null); }} className='p-1 rounded-lg hover:bg-slate-100'>
                <X className='w-4 h-4' style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className='space-y-3'>
              {[
                { label: 'Full Name *', key: 'name',        type: 'text',  placeholder: 'Guest name' },
                { label: 'Email',       key: 'email',       type: 'email', placeholder: 'email@example.com' },
                { label: 'Phone',       key: 'phone',       type: 'tel',   placeholder: '+1 555 000 0000' },
                { label: 'Table Number',key: 'tableNumber', type: 'text',  placeholder: 'e.g. 3' },
              ].map(field => (
                <div key={field.key}>
                  <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block'
                    style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>{field.label}</label>
                  <input
                    type={field.type} placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className='w-full px-3 py-2 rounded-xl text-sm outline-none'
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              ))}

              {/* Meal Preference — single select */}
              <div>
                <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block'
                  style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Meal Preference</label>
                <select value={form.mealPreference || 'No Preference'}
                  onChange={e => setForm(f => ({ ...f, mealPreference: e.target.value === 'No Preference' ? '' : e.target.value }))}
                  className='w-full px-3 py-2 rounded-xl text-sm outline-none'
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                  {MEAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Dietary Restrictions — multi-select chips */}
              <div>
                <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block'
                  style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Dietary Restrictions</label>
                <div className='flex flex-wrap gap-2'>
                  {DIETARY_OPTIONS.map(opt => {
                    const selected = (form.dietaryRestrictions || '').split(',').map(s => s.trim()).filter(Boolean).includes(opt);
                    return (
                      <button
                        key={opt}
                        type='button'
                        onClick={() => {
                          const current = (form.dietaryRestrictions || '').split(',').map(s => s.trim()).filter(Boolean);
                          const next = selected ? current.filter(s => s !== opt) : [...current, opt];
                          setForm(f => ({ ...f, dietaryRestrictions: next.join(', ') }));
                        }}
                        className='px-3 py-1.5 rounded-full text-xs font-semibold transition-all'
                        style={{
                          background: selected ? 'rgba(239,68,68,0.1)' : '#f1f5f9',
                          color:      selected ? '#dc2626' : '#475569',
                          border:     `1px solid ${selected ? 'rgba(239,68,68,0.3)' : '#e2e8f0'}`,
                          fontFamily: 'Inter, sans-serif',
                        }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {form.dietaryRestrictions && (
                  <p className='text-xs mt-1.5' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                    Selected: {form.dietaryRestrictions}
                  </p>
                )}
              </div>

              <div>
                <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as GuestCategory }))}
                  className='w-full px-3 py-2 rounded-xl text-sm outline-none'
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Plus-ones</label>
                <input type='number' min='0' max='10' value={form.plusOnes}
                  onChange={e => setForm(f => ({ ...f, plusOnes: parseInt(e.target.value) || 0 }))}
                  className='w-full px-3 py-2 rounded-xl text-sm outline-none'
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }} />
              </div>
              <div>
                <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Notes</label>
                <textarea placeholder='Any notes...' value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className='w-full px-3 py-2 rounded-xl text-sm outline-none resize-none'
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>
            <div className='flex gap-3 pt-1'>
              <Button variant='ghost' className='flex-1' onClick={() => { setShowForm(false); setEditGuest(null); }} disabled={saving}>Cancel</Button>
              <Button className='flex-1 font-bold' onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? <Spinner className='w-4 h-4' /> : editGuest ? 'Update' : 'Add Guest'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
