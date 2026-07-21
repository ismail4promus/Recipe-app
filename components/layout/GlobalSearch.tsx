import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UtensilsCrossed, Package, ClipboardList, User, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useData } from '../../context/DataContext';

interface Result {
  id: string;
  label: string;
  sub?: string;
  to: string;
  group: 'Recipes' | 'Ingredients' | 'Orders' | 'Customers';
}

const GROUP_ICON = {
  Recipes: UtensilsCrossed,
  Ingredients: Package,
  Orders: ClipboardList,
  Customers: User,
} as const;

const GlobalSearch: React.FC<{ className?: string; autoFocus?: boolean; onNavigate?: () => void }> = ({ className, autoFocus, onNavigate }) => {
  const { recipes, ingredients, orders } = useData();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: Result[] = [];

    recipes.filter(r => r.name.toLowerCase().includes(term)).slice(0, 4).forEach(r =>
      out.push({ id: `r-${r.id}`, label: r.name, sub: r.category, to: `/recipes/${r.id}`, group: 'Recipes' }));

    ingredients.filter(i => i.name.toLowerCase().includes(term)).slice(0, 4).forEach(i =>
      out.push({ id: `i-${i.id}`, label: i.name, sub: i.category, to: `/pantry?q=${encodeURIComponent(i.name)}`, group: 'Ingredients' }));

    orders.filter(o => o.orderNumber.toLowerCase().includes(term)).slice(0, 4).forEach(o =>
      out.push({ id: `o-${o.id}`, label: `#${o.orderNumber}`, sub: o.customerName, to: `/orders?q=${encodeURIComponent(o.orderNumber)}`, group: 'Orders' }));

    const seenCustomers = new Set<string>();
    orders.filter(o => o.customerName.toLowerCase().includes(term)).forEach(o => {
      const key = o.customerName.toLowerCase();
      if (seenCustomers.has(key)) return;
      seenCustomers.add(key);
      if (seenCustomers.size <= 4) out.push({ id: `c-${key}`, label: o.customerName, sub: 'Customer', to: `/orders?q=${encodeURIComponent(o.customerName)}`, group: 'Customers' });
    });

    return out;
  }, [q, recipes, ingredients, orders]);

  const grouped = useMemo(() => {
    const g: Record<string, Result[]> = {};
    results.forEach(r => { (g[r.group] ||= []).push(r); });
    return g;
  }, [results]);

  useEffect(() => { setActive(0); }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (r: Result) => {
    navigate(r.to);
    setQ('');
    setOpen(false);
    onNavigate?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); return; }
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
  };

  let flatIndex = -1;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="flex h-10 items-center rounded-lg border border-app-border bg-app-bg px-3 transition-colors focus-within:border-app-primary/50">
        <Search className="mr-2 h-4 w-4 shrink-0 text-app-muted" />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search recipes, inventory, orders, or customers…"
          aria-label="Global search"
          className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted"
        />
        {q && (
          <button onClick={() => { setQ(''); setOpen(false); }} aria-label="Clear search" className="ml-2 text-app-muted hover:text-app-text">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-app-border bg-app-card p-2 shadow-2xl">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-app-muted">No matches for “{q}”.</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => {
              const Icon = GROUP_ICON[group as keyof typeof GROUP_ICON];
              return (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-app-muted">{group}</p>
                  {items.map(r => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <button
                        key={r.id}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(r)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                          idx === active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-app-muted" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-app-text">{r.label}</span>
                          {r.sub && <span className="block truncate text-xs text-app-muted">{r.sub}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
