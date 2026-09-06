import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Download, Copy, PackageCheck, Minus, Plus,
  AlertTriangle, CheckCircle2, ClipboardList, PackageX, PackageMinus, Info,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { buildShoppingList, shoppingListToCsv, shoppingListToText, ShoppingReason } from '../lib/shoppingList';
import { download } from '../lib/csv';
import { formatCurrency, cn, ANIMATION_VARIANTS, unitLabel } from '../lib/utils';
import { Button, Chip } from '../components/ui/kit';
import { StickyToolbar } from '../components/ui/StickyToolbar';

const REASON_META: Record<ShoppingReason, { label: string; icon: typeof PackageX; tone: string }> = {
  'order-demand': { label: 'Needed for orders', icon: ClipboardList, tone: 'text-app-danger' },
  'out-of-stock': { label: 'Out of stock', icon: PackageX, tone: 'text-app-danger' },
  'low-stock': { label: 'Running low', icon: PackageMinus, tone: 'text-app-warning' },
};

type Filter = 'all' | ShoppingReason;

export default function ShoppingListPage() {
  const { orders, recipes, ingredients, updateIngredient } = useData();
  const toast = useToast();
  const confirm = useConfirm();

  const [filter, setFilter] = useState<Filter>('all');
  /** Per-item overrides of the suggested package count. */
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  /** Items already in the basket — these are what "Receive" puts into inventory. */
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [receiving, setReceiving] = useState(false);

  const list = useMemo(
    () => buildShoppingList(orders, recipes, ingredients),
    [orders, recipes, ingredients]
  );

  const qtyOf = useCallback(
    (id: string, fallback: number) => quantities[id] ?? fallback,
    [quantities]
  );

  const setQty = useCallback((id: string, value: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, Math.round(value * 100) / 100) }));
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? list.lines : list.lines.filter(l => l.reason === filter)),
    [list.lines, filter]
  );

  const counts = useMemo(() => ({
    all: list.lines.length,
    'order-demand': list.lines.filter(l => l.reason === 'order-demand').length,
    'out-of-stock': list.lines.filter(l => l.reason === 'out-of-stock').length,
    'low-stock': list.lines.filter(l => l.reason === 'low-stock').length,
  }), [list.lines]);

  // The running total follows whatever quantities are actually on screen.
  const estimatedTotal = useMemo(
    () => list.lines.reduce((sum, l) => sum + qtyOf(l.item.id, l.packagesToBuy) * (Number(l.item.costPerPackage) || 0), 0),
    [list.lines, qtyOf]
  );

  const pickedLines = useMemo(() => list.lines.filter(l => picked.has(l.item.id)), [list.lines, picked]);
  const pickedTotal = pickedLines.reduce(
    (sum, l) => sum + qtyOf(l.item.id, l.packagesToBuy) * (Number(l.item.costPerPackage) || 0), 0
  );

  const togglePicked = useCallback((id: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const resolvedQuantities = useMemo(() => {
    const out: Record<string, number> = {};
    list.lines.forEach(l => { out[l.item.id] = qtyOf(l.item.id, l.packagesToBuy); });
    return out;
  }, [list.lines, qtyOf]);

  const handleCopy = useCallback(async () => {
    const source = pickedLines.length ? pickedLines : visible;
    if (!source.length) {
      toast.info('Nothing to copy', 'The list is empty.');
      return;
    }
    try {
      await navigator.clipboard.writeText(shoppingListToText(source, resolvedQuantities));
      toast.success(`Copied ${source.length} item${source.length === 1 ? '' : 's'}`, 'Paste it into notes or a message.');
    } catch {
      toast.error('Could not copy', 'Your browser blocked clipboard access — use Export instead.');
    }
  }, [pickedLines, visible, resolvedQuantities, toast]);

  const handleExport = useCallback(() => {
    const source = pickedLines.length ? pickedLines : visible;
    if (!source.length) {
      toast.info('Nothing to export', 'The list is empty.');
      return;
    }
    download(`shopping-list-${new Date().toISOString().slice(0, 10)}.csv`, shoppingListToCsv(source, resolvedQuantities));
    toast.success(`Exported ${source.length} item${source.length === 1 ? '' : 's'}`);
  }, [pickedLines, visible, resolvedQuantities, toast]);

  /**
   * Turn the basket into stock. Each picked line adds its packages to the
   * pantry item and re-derives `quantityInStock` so cost and low-stock alerts
   * stay consistent with the package count.
   */
  const handleReceive = useCallback(async () => {
    if (!pickedLines.length) return;

    const ok = await confirm({
      title: `Add ${pickedLines.length} item${pickedLines.length === 1 ? '' : 's'} to inventory?`,
      message: 'This records the shopping run as received stock.',
      details: pickedLines
        .slice(0, 6)
        .map(l => `${l.item.name}: +${resolvedQuantities[l.item.id]} ${l.item.packageUnit}`)
        .concat(pickedLines.length > 6 ? [`…and ${pickedLines.length - 6} more`] : []),
      confirmLabel: 'Add to inventory',
    });
    if (!ok) return;

    setReceiving(true);
    const before = pickedLines.map(l => l.item);
    let failed = 0;

    for (const line of pickedLines) {
      const add = resolvedQuantities[line.item.id] || 0;
      if (add <= 0) continue;
      const packageSize = line.item.packageSize > 0 ? line.item.packageSize : 1;
      const packagesInStock = (Number(line.item.packagesInStock) || 0) + add;
      const saved = await updateIngredient({
        ...line.item,
        packagesInStock: parseFloat(packagesInStock.toFixed(4)),
        quantityInStock: parseFloat((packagesInStock * packageSize).toFixed(4)),
        last_verified: new Date(),
      });
      if (!saved) failed++;
    }

    setReceiving(false);
    setPicked(new Set());

    if (failed) {
      toast.error(`${failed} item${failed === 1 ? '' : 's'} not saved`, 'The rest were added to inventory.');
      return;
    }

    toast.toast({
      title: `Added ${pickedLines.length} item${pickedLines.length === 1 ? '' : 's'} to inventory`,
      message: `About ${formatCurrency(pickedTotal)} of stock received.`,
      tone: 'success',
      duration: 10000,
      action: {
        label: 'Undo',
        onClick: () => {
          before.forEach(item => updateIngredient(item));
          toast.info('Stock restored', 'Inventory was rolled back to before the shopping run.');
        },
      },
    });
  }, [pickedLines, resolvedQuantities, updateIngredient, confirm, toast, pickedTotal]);

  return (
    <motion.div
      initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
      className="mx-auto max-w-5xl space-y-2.5 pb-20"
    >
      {/* Header */}
      <motion.div variants={ANIMATION_VARIANTS.item} className="flex items-center justify-between gap-2.5 border-b border-app-border pb-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-app-primary/10">
            <ShoppingCart className="h-4 w-4 text-app-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight tracking-tight text-app-text md:text-xl">Shopping List</h1>
            <p className="truncate text-xs text-app-muted">
              {list.lines.length
                ? `${list.lines.length} item${list.lines.length === 1 ? '' : 's'} · about ${formatCurrency(estimatedTotal)}`
                : 'Everything is stocked'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" icon={Copy} onClick={handleCopy}>
            <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </motion.div>

      {list.lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-card py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-app-success" />
          <p className="mt-3 text-sm font-semibold text-app-text">Nothing to buy</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-app-muted">
            Inventory covers every committed order and nothing is running low.
          </p>
          <Link to="/orders" className="mt-4 text-sm font-semibold text-app-primary hover:underline">View orders</Link>
        </div>
      ) : (
        <>
          {/* Why the list looks like this */}
          {list.demandCount > 0 && (
            <motion.p variants={ANIMATION_VARIANTS.item} className="flex items-start gap-2 rounded-xl border border-app-border bg-app-card px-2.5 py-2 text-xs leading-relaxed text-app-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-app-info" />
              <span>
                <span className="font-semibold text-app-text">{list.demandCount}</span> item
                {list.demandCount === 1 ? ' is' : 's are'} short of what your pending, approved and in-progress
                orders need. The rest are simply low or out of stock.
              </span>
            </motion.p>
          )}

          {/* Filters */}
          <StickyToolbar innerClassName="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {([
              ['all', `All (${counts.all})`],
              ['order-demand', `For orders (${counts['order-demand']})`],
              ['out-of-stock', `Out of stock (${counts['out-of-stock']})`],
              ['low-stock', `Low (${counts['low-stock']})`],
            ] as [Filter, string][]).map(([value, label]) => (
              <Chip key={value} active={filter === value} onClick={() => setFilter(value)}>{label}</Chip>
            ))}
          </StickyToolbar>

          {/* Lines */}
          <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col gap-1.5">
            {visible.map(line => {
              const meta = REASON_META[line.reason];
              const Icon = meta.icon;
              const qty = qtyOf(line.item.id, line.packagesToBuy);
              const isPicked = picked.has(line.item.id);

              return (
                <div
                  key={line.item.id}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border bg-app-card p-2.5 transition-colors',
                    isPicked ? 'border-app-success/50 bg-app-success/5' : 'border-app-border'
                  )}
                >
                  <label className="flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={isPicked}
                      onChange={() => togglePicked(line.item.id)}
                      aria-label={`Mark ${line.item.name} as bought`}
                      className="h-5 w-5 accent-[rgb(var(--c-success))]"
                    />
                  </label>

                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-semibold text-app-text', isPicked && 'line-through opacity-60')}>
                      {line.item.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-app-muted">
                      <span className={cn('inline-flex items-center gap-1 font-medium', meta.tone)}>
                        <Icon className="h-3 w-3" />{meta.label}
                      </span>
                      {line.shortfallLabel && <span>short {line.shortfallLabel}</span>}
                      {line.orderNumbers.length > 0 && (
                        <span className="truncate">
                          for {line.orderNumbers.slice(0, 2).map(n => `#${n.slice(-5)}`).join(', ')}
                          {line.orderNumbers.length > 2 ? ` +${line.orderNumbers.length - 2}` : ''}
                        </span>
                      )}
                      <span>
                        have {Number((Number(line.item.packagesInStock) || 0).toFixed(2))} {line.item.packageUnit}
                      </span>
                    </div>
                  </div>

                  {/* Quantity in packages — the unit the shop actually sells */}
                  <div className="flex shrink-0 items-center rounded-xl border border-app-border">
                    <button
                      onClick={() => setQty(line.item.id, qty - 1)}
                      aria-label={`One less ${line.item.packageUnit} of ${line.item.name}`}
                      className="flex h-8 w-8 items-center justify-center text-app-muted transition-colors hover:bg-app-muted/10 hover:text-app-text"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={qty}
                      onChange={e => setQty(line.item.id, Number(e.target.value) || 0)}
                      aria-label={`Packages of ${line.item.name} to buy`}
                      className="h-8 w-12 border-x border-app-border bg-app-elevated text-center text-sm font-semibold tabular-nums text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                    />
                    <button
                      onClick={() => setQty(line.item.id, qty + 1)}
                      aria-label={`One more ${line.item.packageUnit} of ${line.item.name}`}
                      className="flex h-8 w-8 items-center justify-center text-app-muted transition-colors hover:bg-app-muted/10 hover:text-app-text"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="hidden w-24 shrink-0 text-right sm:block">
                    <p className="text-sm font-bold tabular-nums text-app-text">
                      {formatCurrency(qty * (Number(line.item.costPerPackage) || 0))}
                    </p>
                    <p className="text-[11px] text-app-muted">
                      {line.item.packageSize} {unitLabel(line.item.baseUnit)} / {line.item.packageUnit}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </>
      )}

      {/* Ingredients we could not price or match — say so rather than omit them */}
      {list.unresolved.length > 0 && (
        <motion.div variants={ANIMATION_VARIANTS.item} className="border border-app-warning/30 bg-app-warning/5 p-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-app-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            {list.unresolved.length} ingredient{list.unresolved.length === 1 ? '' : 's'} could not be counted
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {list.unresolved.slice(0, 8).map((u, i) => (
              <li key={i} className="text-[11px] leading-relaxed text-app-muted">
                <span className="font-medium text-app-text">{u.name}</span> in {u.recipeName} —{' '}
                {u.reason === 'unlinked'
                  ? 'not linked to an inventory item'
                  : 'its unit cannot be converted to the inventory unit'}
              </li>
            ))}
            {list.unresolved.length > 8 && (
              <li className="text-[11px] text-app-muted">…and {list.unresolved.length - 8} more</li>
            )}
          </ul>
          <Link to="/pantry" className="mt-2 inline-block text-xs font-semibold text-app-primary hover:underline">
            Fix in Inventory
          </Link>
        </motion.div>
      )}

      {/* Basket bar — appears only once something is ticked */}
      {pickedLines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-app-border bg-app-card px-3 py-2.5 pb-[calc(62px_+_env(safe-area-inset-bottom)_+_0.625rem)] shadow-soft md:pb-2.5">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-app-text">
                {pickedLines.length} item{pickedLines.length === 1 ? '' : 's'} bought
              </p>
              <p className="text-xs text-app-muted">About {formatCurrency(pickedTotal)}</p>
            </div>
            <button
              onClick={() => setPicked(new Set())}
              className="shrink-0 px-2 text-sm font-medium text-app-muted transition-colors hover:text-app-text"
            >
              Clear
            </button>
            <Button icon={PackageCheck} onClick={handleReceive} disabled={receiving} className="shrink-0">
              {receiving ? 'Adding…' : 'Add to Inventory'}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
