import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * A confirmation the app controls.
 *
 * `window.confirm` is unstyled, unreadable on a phone, cannot show a list of
 * consequences, and freezes the tab while it is open. This keeps the same
 * await-a-boolean shape so call sites stay one line, but the dialog can say
 * what is actually about to be lost.
 */

export interface ConfirmOptions {
  title: string;
  /** One or two sentences on what happens. Keep it concrete. */
  message?: string;
  /** Extra consequences, listed. e.g. "3 cooking sessions will be orphaned". */
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button. Use for anything that destroys data. */
  destructive?: boolean;
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<Pending | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>(resolve => {
        setPending({ ...options, resolve });
      }),
    []
  );

  const close = useCallback((ok: boolean) => {
    setPending(current => {
      current?.resolve(ok);
      return null;
    });
  }, []);

  // Escape cancels, Enter confirms — the same reflexes window.confirm trained.
  useEffect(() => {
    if (!pending) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Enter') { e.preventDefault(); close(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending, close]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
            onClick={() => close(false)}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className="w-full max-w-md border border-app-border bg-app-card p-4 shadow-soft"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center',
                    pending.destructive ? 'bg-app-danger/10 text-app-danger' : 'bg-app-primary/10 text-app-primary'
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="confirm-title" className="text-base font-bold leading-snug text-app-text">
                    {pending.title}
                  </h2>
                  {pending.message && (
                    <p className="mt-1 text-sm leading-relaxed text-app-muted">{pending.message}</p>
                  )}
                  {!!pending.details?.length && (
                    <ul className="mt-2 space-y-1 border-l-2 border-app-border pl-3">
                      {pending.details.map((d, i) => (
                        <li key={i} className="text-xs leading-relaxed text-app-muted">{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => close(false)}
                  className="inline-flex min-h-[40px] items-center justify-center border border-app-border bg-app-elevated px-4 text-sm font-semibold text-app-text transition-colors hover:bg-app-muted/10"
                >
                  {pending.cancelLabel || 'Cancel'}
                </button>
                <button
                  ref={confirmRef}
                  onClick={() => close(true)}
                  className={cn(
                    'inline-flex min-h-[40px] items-center justify-center px-4 text-sm font-semibold text-white shadow-soft transition-all hover:brightness-105 active:scale-[0.98]',
                    pending.destructive ? 'bg-app-danger' : 'bg-app-primary text-primary-foreground'
                  )}
                >
                  {pending.confirmLabel || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
