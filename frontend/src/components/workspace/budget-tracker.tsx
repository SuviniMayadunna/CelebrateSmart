import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, DollarSign, TrendingDown, AlertTriangle, Lock } from 'lucide-react';
import { budgetAPI, type EventBudget, type BudgetExpense, type ExpenseCategory } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

const CATEGORIES: { id: ExpenseCategory; label: string; color: string }[] = [
  { id: 'CATERING',      label: 'Catering',       color: '#f97316' },
  { id: 'VENUE',         label: 'Venue',           color: '#60a5fa' },
  { id: 'PHOTOGRAPHY',   label: 'Photography',     color: '#c084fc' },
  { id: 'DECORATIONS',   label: 'Decorations',     color: '#f9a8d4' },
  { id: 'ENTERTAINMENT', label: 'Entertainment',   color: '#fbbf24' },
  { id: 'ATTIRE',        label: 'Attire',          color: '#2dd4bf' },
  { id: 'INVITATIONS',   label: 'Invitations',     color: '#86efac' },
  { id: 'MISCELLANEOUS', label: 'Miscellaneous',   color: '#64748b' },
];

function categoryColor(cat: ExpenseCategory) {
  return CATEGORIES.find(c => c.id === cat)?.color ?? '#94a3b8';
}
function categoryLabel(cat: ExpenseCategory) {
  return CATEGORIES.find(c => c.id === cat)?.label ?? cat;
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category: ExpenseCategory;
  paidAt: string;
  receiptNote: string;
}

function defaultForm(): ExpenseFormData {
  return { description: '', amount: '', category: 'MISCELLANEOUS', paidAt: '', receiptNote: '' };
}

interface BudgetTrackerProps {
  eventId:     string;
  packageCost: number | null;
  isPast?:     boolean;
}

export function BudgetTracker({ eventId, packageCost, isPast = false }: BudgetTrackerProps) {
  const [budget,       setBudget]       = useState<EventBudget | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [showSetBudget,setShowSetBudget]= useState(false);
  const [showAddExp,   setShowAddExp]   = useState(false);
  const [editingExp,   setEditingExp]   = useState<BudgetExpense | null>(null);
  const [newBudgetVal, setNewBudgetVal] = useState('');
  const [form,         setForm]         = useState<ExpenseFormData>(defaultForm());
  const [saving,       setSaving]       = useState(false);
  const [filterCat,    setFilterCat]    = useState<ExpenseCategory | 'ALL'>('ALL');

  useEffect(() => {
    budgetAPI.get(eventId)
      .then(res => setBudget(res.data.budget))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleSetBudget() {
    const val = parseFloat(newBudgetVal);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    try {
      await budgetAPI.setTotal(eventId, val);
      setBudget(prev => prev ? { ...prev, totalBudget: val, remaining: val - (prev.totalSpent ?? 0) } : prev);
      setShowSetBudget(false);
      toast({ title: 'Budget updated' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveExpense() {
    const amount = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try {
      if (editingExp) {
        const res = await budgetAPI.updateExpense(eventId, editingExp.id, {
          description: form.description,
          amount,
          category: form.category,
          paidAt: form.paidAt || null,
          receiptNote: form.receiptNote || undefined,
        });
        setBudget(prev => {
          if (!prev) return prev;
          const expenses = prev.expenses.map(e => e.id === editingExp.id ? res.data.expense : e);
          const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
          return { ...prev, expenses, totalSpent, remaining: prev.totalBudget > 0 ? prev.totalBudget - totalSpent : null };
        });
      } else {
        const res = await budgetAPI.addExpense(eventId, {
          description: form.description,
          amount,
          category: form.category,
          paidAt: form.paidAt || undefined,
          receiptNote: form.receiptNote || undefined,
        });
        setBudget(prev => {
          if (!prev) return prev;
          const expenses = [...prev.expenses, res.data.expense];
          const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
          return { ...prev, expenses, totalSpent, remaining: prev.totalBudget > 0 ? prev.totalBudget - totalSpent : null };
        });
      }
      setShowAddExp(false);
      setEditingExp(null);
      setForm(defaultForm());
      toast({ title: editingExp ? 'Expense updated' : 'Expense added' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    await budgetAPI.deleteExpense(eventId, id);
    setBudget(prev => {
      if (!prev) return prev;
      const expenses = prev.expenses.filter(e => e.id !== id);
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      return { ...prev, expenses, totalSpent, remaining: prev.totalBudget > 0 ? prev.totalBudget - totalSpent : null };
    });
    toast({ title: 'Expense removed' });
  }

  function openEdit(exp: BudgetExpense) {
    setEditingExp(exp);
    setForm({
      description: exp.description,
      amount:      String(exp.amount),
      category:    exp.category,
      paidAt:      exp.paidAt ? exp.paidAt.split('T')[0] : '',
      receiptNote: exp.receiptNote ?? '',
    });
    setShowAddExp(true);
  }

  if (loading) {
    return <div className='flex items-center justify-center py-24'><Spinner className='size-6' style={{ color: 'hsl(43,74%,49%)' }} /></div>;
  }
  if (!budget) {
    return (
      <div className='flex flex-col items-center justify-center py-24 gap-4'>
        <div className='w-14 h-14 rounded-2xl flex items-center justify-center' style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          <TrendingDown className='w-7 h-7' style={{ color: '#cbd5e1' }} />
        </div>
        <div className='text-center'>
          <p className='text-sm font-semibold' style={{ color: '#64748b' }}>Budget not set up yet</p>
          <p className='text-xs mt-1' style={{ color: '#64748b' }}>Complete your event booking to activate budget tracking.</p>
        </div>
      </div>
    );
  }

  const totalBudget  = budget.totalBudget;
  const totalSpent   = budget.totalSpent;
  const remaining    = budget.remaining;
  const spentPct     = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const healthColor  = spentPct >= 100 ? '#ef4444' : spentPct >= 80 ? '#f59e0b' : '#22c55e';

  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    spent: budget.expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.spent > 0);

  const filtered = filterCat === 'ALL' ? budget.expenses : budget.expenses.filter(e => e.category === filterCat);

  return (
    <div className='space-y-5'>
      {/* Past event read-only notice */}
      {isPast && (
        <div className='flex items-center gap-3 px-4 py-3 rounded-xl'
          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          <Lock className='w-4 h-4 shrink-0' style={{ color: '#64748b' }} />
          <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
            This event has passed — budget is read-only.
          </p>
        </div>
      )}

      {/* Overview card */}
      <div className='rounded-2xl p-6' style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className='flex items-start justify-between mb-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-widest mb-1' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
              Event Budget
            </p>
            {totalBudget > 0 ? (
              <p className='text-3xl font-black' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                ${totalBudget.toLocaleString()}
              </p>
            ) : (
              <p className='text-lg' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Not set yet</p>
            )}
          </div>
          {!isPast && (
            <button
              onClick={() => { setNewBudgetVal(String(totalBudget || '')); setShowSetBudget(true); }}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-80'
              style={{ background: 'rgba(251,191,36,0.12)', color: 'hsl(43,74%,40%)', border: '1px solid rgba(251,191,36,0.25)', fontFamily: 'Inter, sans-serif' }}
            >
              <Pencil className='w-3 h-3' />
              {totalBudget > 0 ? 'Edit' : 'Set Budget'}
            </button>
          )}
        </div>

        {totalBudget > 0 && (
          <>
            <div className='w-full h-3 rounded-full overflow-hidden mb-3' style={{ background: '#f1f5f9' }}>
              <div className='h-full rounded-full transition-all duration-700' style={{ width: `${spentPct}%`, background: healthColor }} />
            </div>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Spent</p>
                <p className='text-lg font-black' style={{ color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>${totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Remaining</p>
                <p className='text-lg font-black' style={{ color: healthColor, fontFamily: 'Inter, sans-serif' }}>
                  {remaining !== null ? `$${remaining.toLocaleString()}` : '—'}
                </p>
              </div>
              <div>
                <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Used</p>
                <p className='text-lg font-black' style={{ color: healthColor, fontFamily: 'Inter, sans-serif' }}>{spentPct}%</p>
              </div>
            </div>
            {spentPct >= 80 && (
              <div className='mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold'
                style={{ background: spentPct >= 100 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', color: healthColor, border: `1px solid ${healthColor}30`, fontFamily: 'Inter, sans-serif' }}>
                <AlertTriangle className='w-3.5 h-3.5' />
                {spentPct >= 100 ? 'Budget exceeded!' : 'Approaching budget limit (80%)'}
              </div>
            )}
          </>
        )}

        {packageCost && packageCost > 0 && (
          <div className='mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-xl'
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
            <DollarSign className='w-3.5 h-3.5' />
            Package cost: ${packageCost.toLocaleString()} (included in tracked expenses)
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className='rounded-2xl p-5 space-y-3' style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>By Category</p>
          {byCategory.map(cat => (
            <div key={cat.id}>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-xs font-semibold' style={{ color: cat.color, fontFamily: 'Inter, sans-serif' }}>{cat.label}</span>
                <span className='text-xs font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>${cat.spent.toLocaleString()}</span>
              </div>
              <div className='w-full h-2 rounded-full overflow-hidden' style={{ background: '#f1f5f9' }}>
                <div className='h-full rounded-full' style={{ width: totalBudget > 0 ? `${Math.min(100, (cat.spent / totalBudget) * 100)}%` : '0%', background: cat.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expense list */}
      <div className='rounded-2xl p-5 space-y-4' style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className='flex items-center justify-between'>
          <p className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Expenses</p>
          {!isPast && (
            <Button size='sm' className='gap-1.5 text-xs font-bold h-7' onClick={() => { setEditingExp(null); setForm(defaultForm()); setShowAddExp(true); }}>
              <Plus className='w-3 h-3' />
              Add
            </Button>
          )}
        </div>

        {/* Category filter */}
        <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
          <button
            onClick={() => setFilterCat('ALL')}
            className='px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0'
            style={{
              background: filterCat === 'ALL' ? 'rgba(251,191,36,0.12)' : '#f1f5f9',
              color:      filterCat === 'ALL' ? 'hsl(43,74%,40%)' : '#64748b',
              border:     filterCat === 'ALL' ? '1px solid rgba(251,191,36,0.3)' : '1px solid #e2e8f0',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            All
          </button>
          {CATEGORIES.filter(c => budget.expenses.some(e => e.category === c.id)).map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id)}
              className='px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0'
              style={{
                background: filterCat === cat.id ? `${cat.color}15` : '#f1f5f9',
                color:      filterCat === cat.id ? cat.color : '#64748b',
                border:     filterCat === cat.id ? `1px solid ${cat.color}30` : '1px solid #e2e8f0',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className='py-8 text-center'>
            <TrendingDown className='w-8 h-8 mx-auto mb-2' style={{ color: '#cbd5e1' }} />
            <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>No expenses yet</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {filtered.map(exp => (
              <div key={exp.id} className='flex items-center gap-3 p-3 rounded-xl group'
                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className='w-2 h-2 rounded-full shrink-0' style={{ background: categoryColor(exp.category) }} />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold truncate' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{exp.description}</p>
                  <p className='text-xs' style={{ color: categoryColor(exp.category), fontFamily: 'Inter, sans-serif' }}>
                    {categoryLabel(exp.category)}
                    {exp.source === 'ORDER' && <span style={{ color: '#64748b' }}> · from order</span>}
                  </p>
                </div>
                <span className='text-sm font-black shrink-0' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                  ${Number(exp.amount).toLocaleString()}
                </span>
                {!isPast && (
                  <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0'>
                    {exp.source === 'MANUAL' && (
                      <button onClick={() => openEdit(exp)} className='p-1.5 rounded-lg hover:bg-slate-100 transition-colors'>
                        <Pencil className='w-3 h-3' style={{ color: '#64748b' }} />
                      </button>
                    )}
                    <button onClick={() => handleDeleteExpense(exp.id)} className='p-1.5 rounded-lg hover:bg-red-50 transition-colors'>
                      <Trash2 className='w-3 h-3 text-red-400' />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set budget dialog */}
      {showSetBudget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40'>
          <div className='w-full max-w-sm rounded-2xl p-6 space-y-4' style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className='flex items-center justify-between'>
              <h3 className='font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Set Total Budget</h3>
              <button onClick={() => setShowSetBudget(false)} className='p-1 rounded-lg hover:bg-slate-100'>
                <X className='w-4 h-4' style={{ color: '#64748b' }} />
              </button>
            </div>
            <div>
              <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Total budget ($)</label>
              <input
                type='number' min='0' step='100'
                value={newBudgetVal}
                onChange={e => setNewBudgetVal(e.target.value)}
                placeholder='e.g. 10000'
                className='w-full px-3 py-2 rounded-xl text-sm outline-none'
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}
              />
            </div>
            <div className='flex gap-3 pt-1'>
              <Button variant='ghost' className='flex-1' onClick={() => setShowSetBudget(false)} disabled={saving}>Cancel</Button>
              <Button className='flex-1 font-bold' onClick={handleSetBudget} disabled={saving}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/edit expense dialog */}
      {showAddExp && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40'>
          <div className='w-full max-w-sm rounded-2xl p-6 space-y-4' style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className='flex items-center justify-between'>
              <h3 className='font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{editingExp ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={() => { setShowAddExp(false); setEditingExp(null); }} className='p-1 rounded-lg hover:bg-slate-100'>
                <X className='w-4 h-4' style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className='space-y-3'>
              {[
                { label: 'Description', key: 'description', type: 'text', placeholder: 'e.g. Floral centerpieces' },
                { label: 'Amount ($)', key: 'amount', type: 'number', placeholder: '0.00' },
              ].map(field => (
                <div key={field.key}>
                  <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className='w-full px-3 py-2 rounded-xl text-sm outline-none'
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              ))}
              <div>
                <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                  className='w-full px-3 py-2 rounded-xl text-sm outline-none'
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className='flex gap-3 pt-1'>
              <Button variant='ghost' className='flex-1' onClick={() => { setShowAddExp(false); setEditingExp(null); }} disabled={saving}>Cancel</Button>
              <Button className='flex-1 font-bold' onClick={handleSaveExpense} disabled={saving || !form.description.trim() || !form.amount}>
                {saving ? <Spinner className='w-4 h-4' /> : editingExp ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
