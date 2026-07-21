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
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }}
                className="bg-app-card rounded-sm shadow-2xl w-full max-w-sm overflow-hidden border border-app-border relative"
                onClick={e => e.stopPropagation()}
            >
                <Crosshair className="absolute top-4 right-4 h-16 w-16 text-white/[0.02] pointer-events-none" />

                <div className="bg-white/[0.02] p-6 border-b border-app-border flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-xl font-black italic text-app-text uppercase tracking-tighter flex items-center gap-3 leading-none">
                            <Layers className="h-5 w-5 text-app-primary" /> Batch Process
                        </h2>
                        <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.3em] mt-1.5">Processing {count} Active SKUs</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center hover:bg-white/5 rounded-sm transition-colors text-app-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Settings2 className="h-4 w-4 text-app-primary" />
                            <label className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Operation Selector</label>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['add', 'subtract', 'set'] as const).map(op => (
                                <button
                                    key={op} type="button" onClick={() => setOperation(op)}
                                    className={cn(
                                        "h-12 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] border transition-all",
                                        operation === op 
                                            ? "bg-app-primary text-white border-app-primary shadow-lg" 
                                            : "bg-app-bg border-app-border text-app-muted hover:text-app-text"
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
                            <label className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Adjustment Magnitude</label>
                        </div>
                        <div className="relative group">
                            <input 
                                type="number" step="any" min="0" autoFocus required value={value} onChange={e => setValue(e.target.value)}
                                className="w-full h-16 px-6 rounded-sm bg-app-bg border border-app-border focus:border-app-primary text-2xl font-black italic tabular-nums tracking-tighter"
                                placeholder="00.00"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                <span className="text-[10px] font-black uppercase text-app-primary tracking-widest bg-app-primary/10 px-3 py-1.5 rounded-sm border border-app-primary/20">
                                    Units
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" disabled={!value}
                        className="w-full h-16 rounded-sm bg-app-primary text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                    >
                        Execute Process Sequence
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};