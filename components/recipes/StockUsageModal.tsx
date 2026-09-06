import React, { useMemo, useState } from 'react';
import { Recipe, Ingredient } from '../../types';
import { X, PackageMinus, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, unitLabel, formatQuantity } from '../../lib/utils';
import { planStockUsage, applyStockUsage } from '../../lib/stockUsage';

/**
 * Confirms what cooking this recipe takes out of inventory before writing it.
 * Deducting stock silently would leave a cook unable to explain where it went.
 */
export const StockUsageModal: React.FC<{
    recipe: Recipe;
    servings: number;
    pantryIngredients: Ingredient[];
    onApply: (updated: Ingredient[]) => Promise<boolean> | boolean;
    onClose: () => void;
}> = ({ recipe, servings, pantryIngredients, onApply, onClose }) => {
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const plan = useMemo(
        () => planStockUsage(recipe, servings, pantryIngredients),
        [recipe, servings, pantryIngredients]
    );

    const shortCount = plan.deductions.filter(d => d.short).length;

    const handleApply = async () => {
        setBusy(true);
        try {
            const ok = await onApply(applyStockUsage(plan));
            if (ok) {
                setDone(true);
                setTimeout(onClose, 900);
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-app-border bg-app-card shadow-card"
            >
                <header className="flex items-center gap-2 border-b border-app-border px-3 py-2">
                    <PackageMinus className="h-4 w-4 text-app-primary" />
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-bold text-app-text">Update stock</h2>
                        <p className="truncate text-[11px] text-app-muted">
                            {recipe.name} · {formatQuantity(servings)} serving{servings === 1 ? '' : 's'}
                        </p>
                    </div>
                    <button aria-label="Close" onClick={onClose} className="text-app-muted hover:text-app-text">
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {plan.deductions.length === 0 ? (
                        <p className="p-4 text-center text-xs text-app-muted">
                            Nothing can be deducted — none of this recipe's ingredients are linked to inventory with a usable unit.
                        </p>
                    ) : (
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-app-elevated text-[11px] uppercase tracking-wider text-app-muted">
                                <tr>
                                    <th className="px-2.5 py-1.5 text-left font-semibold">Ingredient</th>
                                    <th className="px-2.5 py-1.5 text-right font-semibold">Used</th>
                                    <th className="px-2.5 py-1.5 text-right font-semibold">Stock after</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-app-border">
                                {plan.deductions.map(d => (
                                    <tr key={d.item.id} className={cn(d.short && 'bg-app-danger/5')}>
                                        <td className="px-2.5 py-1.5">
                                            <span className="font-medium text-app-text">{d.item.name}</span>
                                            {d.short && (
                                                <span className="ml-1.5 text-[10px] font-semibold text-app-danger">not enough in stock</span>
                                            )}
                                        </td>
                                        <td className="px-2.5 py-1.5 text-right tabular-nums text-app-text">
                                            {formatQuantity(d.amountBase, d.item.baseUnit)} {unitLabel(d.item.baseUnit)}
                                        </td>
                                        <td className="px-2.5 py-1.5 text-right tabular-nums">
                                            <span className="text-app-muted">{formatQuantity(d.stockBefore, d.item.baseUnit)}</span>
                                            <span className="mx-1 text-app-muted">→</span>
                                            <span className={cn('font-semibold', d.stockAfter === 0 ? 'text-app-danger' : 'text-app-text')}>
                                                {formatQuantity(d.stockAfter, d.item.baseUnit)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {plan.skipped.length > 0 && (
                        <div className="m-2.5 border border-app-warning/30 bg-app-warning/10 p-2.5">
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-app-warning">
                                <AlertTriangle className="h-3.5 w-3.5" /> {plan.skipped.length} ingredient{plan.skipped.length === 1 ? '' : 's'} skipped
                            </p>
                            <ul className="mt-1 space-y-0.5">
                                {plan.skipped.slice(0, 6).map((s, i) => (
                                    <li key={i} className="text-[11px] text-app-muted">
                                        {s.name} — {s.reason === 'unlinked' ? 'not linked to inventory' : 'no unit conversion set'}
                                    </li>
                                ))}
                                {plan.skipped.length > 6 && (
                                    <li className="text-[11px] text-app-muted">…and {plan.skipped.length - 6} more</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                <footer className="flex items-center gap-2 border-t border-app-border p-2.5">
                    <p className="flex-1 text-[11px] text-app-muted">
                        {shortCount > 0
                            ? `${shortCount} item${shortCount === 1 ? '' : 's'} will drop to zero.`
                            : 'Stock is reduced by the amounts above.'}
                    </p>
                    <button onClick={onClose} className="h-8 rounded-xl border border-app-border bg-app-elevated px-3 text-xs font-semibold text-app-text hover:border-app-primary/40">
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={busy || done || plan.deductions.length === 0}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-app-primary px-3.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-105 disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : <PackageMinus className="h-3.5 w-3.5" />}
                        {done ? 'Stock updated' : `Deduct ${plan.deductions.length} item${plan.deductions.length === 1 ? '' : 's'}`}
                    </button>
                </footer>
            </motion.div>
        </div>
    );
};

export default StockUsageModal;
