import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, X, Crosshair, Settings2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BatchUpdateModal: React.FC<{
    count: number;
    onClose: () => void;
    onSave: (operation: 'add' | 'subtract' | 'set', value: number) => void;
}> = ({ count, onClose, onSave }) => {
    const [operation, setOperation] = useState<'add' | 'subtract' | 'set'>('add');
    const [value, setValue] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) {
            onSave(operation, numVal);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }}
                className="bg-app-card rounded-2xl shadow-soft w-full max-w-sm overflow-hidden border border-app-border relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-app-elevated p-6 border-b border-app-border flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-app-text tracking-tight flex items-center gap-3 leading-none">
                            <Layers className="h-5 w-5 text-app-primary" /> Batch Update
                        </h2>
                        <p className="text-xs text-app-muted font-medium mt-1.5">Updating {count} items</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="h-11 w-11 flex items-center justify-center hover:bg-app-muted/10 rounded-full transition-colors text-app-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Settings2 className="h-4 w-4 text-app-primary" />
                            <label className="text-xs text-app-muted font-medium">Operation</label>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['add', 'subtract', 'set'] as const).map(op => (
                                <button
                                    key={op} type="button" onClick={() => setOperation(op)}
                                    className={cn(
                                        "min-h-[44px] rounded-full text-sm font-semibold border transition-all capitalize",
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

                    <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Layers className="h-4 w-4 text-app-primary" />
                            <label className="text-xs text-app-muted font-medium">Amount</label>
                        </div>
                        <div className="relative group">
                            <input
                                type="number" step="any" min="0" autoFocus required value={value} onChange={e => setValue(e.target.value)}
                                className="w-full h-16 px-6 rounded-2xl bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-2xl font-bold text-app-text tabular-nums tracking-tight"
                                placeholder="0"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                <span className="text-xs font-medium text-app-primary bg-app-primary/10 px-3 py-1.5 rounded-full border border-app-primary/20">
                                    Units
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit" disabled={!value}
                        className="w-full min-h-[44px] h-14 rounded-full bg-app-primary text-primary-foreground text-sm font-semibold shadow-soft hover:brightness-105 active:scale-[0.97] transition-all disabled:opacity-50"
                    >
                        Apply Update
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};