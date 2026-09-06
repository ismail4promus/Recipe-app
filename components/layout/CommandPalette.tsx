import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, CornerDownLeft, ArrowUp, ArrowDown, Plus, ClipboardPlus,
  UtensilsCrossed, Package, ClipboardList, User, ArrowRight, Command as CommandIcon,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { NAV_ITEMS } from './navConfig';
import { cn, formatCurrency } from '../../lib/utils';

/**
 * Keyboard-first navigation.
 *
 * A kitchen manager types the dish name far faster than they can find it
 * through three taps of a menu. Cmd/Ctrl-K opens this from anywhere; with an
 * empty query it lists the places you can go, and as soon as you type it
 * searches recipes, inventory, orders and customers together.
 */

type Group = 'Actions' | 'Go to' | 'Recipes' | 'Inventory' | 'Orders' | 'Customers';

interface Command {
  id: string;
  label: string;
  sub?: string;
  group: Group;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Extra text matched against the query but not shown. */
  keywords?: string;
}

const GROUP_ORDER: Group[] = ['Actions', 'Go to', 'Recipes', 'Inventory', 'Orders', 'Customers'];

const isTypingTarget = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
};

const CommandPalette: React.FC = () => {
  const { recipes, ingredients, orders } = useData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Cmd/Ctrl-K anywhere; "/" only when the user is not already typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
        return;
      }
      if (e.key === '/' && !isTypingTarget(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      // Wait for the panel to mount before stealing focus.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const term = q.trim().toLowerCase();
    const out: Command[] = [];

    // Actions and destinations are always offered; they are what an empty
    // palette is for.
    const actions: Command[] = [
      { id: 'a-recipe', label: 'Add a recipe', group: 'Actions', to: '/recipes/new', icon: Plus, keywords: 'new create dish' },
      { id: 'a-order', label: 'Create an order', group: 'Actions', to: '/orders?new=1', icon: ClipboardPlus, keywords: 'new customer sale' },
      { id: 'a-stock', label: 'Update low stock', group: 'Actions', to: '/pantry?filter=low', icon: Package, keywords: 'inventory restock' },
      { id: 'a-shop', label: 'Open shopping list', group: 'Actions', to: '/shopping', icon: ClipboardList, keywords: 'buy purchase market' },
    ];
    const destinations: Command[] = NAV_ITEMS.map(n => ({
      id: `n-${n.to}`, label: n.label, sub: n.to, group: 'Go to' as Group, to: n.to, icon: n.icon,
    }));

    const matches = (c: Command) =>
      !term ||
      c.label.toLowerCase().includes(term) ||
      c.keywords?.includes(term) ||
      c.sub?.toLowerCase().includes(term);

    out.push(...actions.filter(matches), ...destinations.filter(matches));

    if (!term) return out;

    recipes
      .filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.category?.toLowerCase().includes(term) ||
        r.cuisine?.toLowerCase().includes(term) ||
        r.tags?.some(t => t.toLowerCase().includes(term)))
      .slice(0, 6)
      .forEach(r => out.push({
        id: `r-${r.id}`, label: r.name, sub: [r.category, r.cuisine].filter(Boolean).join(' · '),
        group: 'Recipes', to: `/recipes/${r.id}`, icon: UtensilsCrossed,
      }));

    ingredients
      .filter(i => i.name.toLowerCase().includes(term) || i.category?.toLowerCase().includes(term))
      .slice(0, 6)
      .forEach(i => out.push({
        id: `i-${i.id}`, label: i.name,
        sub: `${Number((Number(i.packagesInStock) || 0).toFixed(2))} ${i.packageUnit} in stock`,
        group: 'Inventory', to: `/pantry?q=${encodeURIComponent(i.name)}`, icon: Package,
      }));

    orders
      .filter(o => o.orderNumber.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term))
      .slice(0, 6)
      .forEach(o => out.push({
        id: `o-${o.id}`, label: `#${o.orderNumber}`,
        sub: `${o.customerName} · ${formatCurrency(o.totalAmount)}`,
        group: 'Orders', to: `/orders?q=${encodeURIComponent(o.orderNumber)}`, icon: ClipboardList,
      }));

    const seen = new Set<string>();
    orders
      .filter(o => o.customerName.toLowerCase().includes(term))
      .forEach(o => {
        const key = o.customerName.toLowerCase();
        if (seen.has(key) || seen.size >= 4) return;
        seen.add(key);
        out.push({
          id: `c-${key}`, label: o.customerName, sub: 'Customer',
          group: 'Customers', to: `/orders?q=${encodeURIComponent(o.customerName)}`, icon: User,
        });
      });

    return out;
  }, [q, recipes, ingredients, orders]);

  useEffect(() => { setActive(0); }, [q]);

  const run = useCallback((c: Command) => {
    setOpen(false);
    navigate(c.to);
  }, [navigate]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!commands.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % commands.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + commands.length) % commands.length); }
    if (e.key === 'Enter') { e.preventDefault(); run(commands[active]); }
  };

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const grouped = useMemo(() => {
    const map = new Map<Group, { command: Command; index: number }[]>();
    commands.forEach((command, index) => {
      const bucket = map.get(command.group) || [];
      bucket.push({ command, index });
      map.set(command.group, bucket);
    });
    return GROUP_ORDER.filter(g => map.has(g)).map(g => [g, map.get(g)!] as const);
  }, [commands]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 p-3 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-2xl"
          >
            <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-app-border px-3">
              <Search className="h-4 w-4 shrink-0 text-app-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search recipes, inventory, orders — or jump to a page…"
                aria-label="Search or run a command"
                className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted"
              />
              <kbd className="hidden shrink-0 rounded-md border border-app-border px-1.5 py-0.5 text-[10px] font-semibold text-app-muted sm:block">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-1.5">
              {commands.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-app-muted">No matches for “{q}”.</p>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="mb-1 last:mb-0">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-app-muted">{group}</p>
                    {items.map(({ command, index }) => {
                      const Icon = command.icon;
                      const isActive = index === active;
                      return (
                        <button
                          key={command.id}
                          data-active={isActive}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => run(command)}
                          className={cn(
                            'flex w-full items-center gap-2.5 px-2 py-2 text-left transition-colors',
                            isActive ? 'bg-app-primary/10' : 'hover:bg-app-muted/10'
                          )}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-app-primary' : 'text-app-muted')} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-app-text">{command.label}</span>
                            {command.sub && <span className="block truncate text-xs text-app-muted">{command.sub}</span>}
                          </span>
                          {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-app-primary" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="hidden shrink-0 items-center gap-3 border-t border-app-border px-3 py-1.5 text-[11px] text-app-muted sm:flex">
              <span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
              <span className="inline-flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
              <span className="ml-auto inline-flex items-center gap-1"><CommandIcon className="h-3 w-3" />K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
