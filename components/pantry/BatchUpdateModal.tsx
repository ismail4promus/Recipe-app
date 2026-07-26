import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, X, Crosshair, Settings2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BatchUpdateModal: React.FC<{
    count: number;
    scope?: 'selected' | 'all';
    onClose: () => void;
    onSave: (operation: 'add' | 'subtract' | 'set', value: number) => void;
}> = ({ count, scope = 'selected', onClose, onSave }) => {
    const [operation, setOperation] = useState<'add' | 'subtract' | 'set'>('set');
    const [value, setValue] = useState<string>('');

    const numVal = parseFloat(value);
    const valid = Number.isFinite(numVal) && numVal >= 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (valid) onSave(operation, numVal);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-2.5 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }}
                className="bg-app-card rounded-lg shadow-soft w-full max-w-sm overflow-hidden border border-app-border relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-app-elevated p-3 border-b border-app-border flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-app-text tracking-tight flex items-center gap-3 leading-none">
                            <Layers className="h-5 w-5 text-app-primary" /> Batch Update
                        </h2>
                        <p className="text-xs text-app-muted font-medium mt-1.5">
                            {scope === 'all' ? `All ${count} item${count === 1 ? '' : 's'} in view` : `${count} selected item${count === 1 ? '' : 's'}`}
                        </p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="h-11 w-11 flex items-center justify-center hover:bg-app-muted/10 rounded-full transition-colors text-app-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-2.5 space-y-2.5 relative z-10">
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                            <Settings2 className="h-4 w-4 text-app-primary" />
                            <label className="text-xs text-app-muted font-medium">Operation</label>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['add', 'subtract', 'set'] as const).map(op => (
                                <button
                                    key={op} type="button" onClick={() => setOperation(op)}
                                    className={cn(
                                        "min-h-[40px] text-sm font-semibold border transition-all capitalize",
                                        operation === op
                                            ? "bg-app-primary text-primary-foreground border-app-primary shadow-soft"
                                            : "bg-app-elevated border-app-border text-app-muted hover:text-app-text"
                                    )}
                                >
                                    {op}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2.5">
                         <div className="flex items-center gap-3">
                            <Layers className="h-4 w-4 text-app-primary" />
                            <label className="text-xs text-app-muted font-medium">Packages in stock</label>
                        </div>
                        <div className="relative group">
                            <input
                                type="number" step="any" min="0" autoFocus required value={value} onChange={e => setValue(e.target.value)}
                                className="w-full h-14 px-3 bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-2xl font-bold text-app-text tabular-nums tracking-tight"
                                placeholder="0"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                <span className="text-xs font-medium text-app-primary bg-app-primary/10 px-2 py-1 border border-app-primary/20">
                                    packages
                                </span>
                            </div>
                        </div>
                        {/* Stock is held per package; the base quantity follows from package size. */}
                        <p className="text-[11px] text-app-muted leading-relaxed">
                            {valid
                                ? operation === 'set'
                                    ? `Each item will hold ${numVal} package(s). Its quantity in base units is recalculated from its own package size (a 5,000 g bag × ${numVal} = ${(5000 * numVal).toLocaleString()} g).`
                                    : `${operation === 'add' ? 'Adds' : 'Removes'} ${numVal} package(s) on every item, with base quantities recalculated.`
                                : 'Counted in packages — the same unit shown on each inventory card.'}
                        </p>
                    </div>

                    <button
                        type="submit" disabled={!valid || count === 0}
                        className="w-full min-h-[44px] bg-app-primary text-primary-foreground text-sm font-semibold shadow-soft hover:brightness-105 active:scale-[0.97] transition-all disabled:opacity-50"
                    >
                        {operation === 'set' ? 'Set' : operation === 'add' ? 'Add' : 'Subtract'} stock on {count} item{count === 1 ? '' : 's'}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};