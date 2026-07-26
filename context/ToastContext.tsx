import React, { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, Undo2 } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Transient feedback that does not stop the kitchen.
 *
 * `window.alert` blocks the tab and, on a phone, covers the thing the cook just
 * did. Every confirmation, import result and failed action goes through here
 * instead, and destructive actions can hand back an Undo so a mistake costs a
 * tap rather than a re-entry.
 */

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  /** Extra detail shown under the title. Long text wraps rather than truncates. */
  message?: string;
  tone?: ToastTone;
  /** Milliseconds on screen. Errors default to staying until dismissed. */
  duration?: number;
  action?: ToastAction;
}

interface Toast extends ToastOptions {
  id: number;
  tone: ToastTone;
}

interface ToastContextType {
  toast: (options: ToastOptions) => number;
  success: (title: string, message?: string) => number;
  error: (title: string, message?: string) => number;
  info: (title: string, message?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TONE: Record<ToastTone, { icon: typeof CheckCircle2; accent: string; bar: string }> = {
  success: { icon: CheckCircle2, accent: 'text-app-success', bar: 'bg-app-success' },
  error: { icon: AlertTriangle, accent: 'text-app-danger', bar: 'bg-app-danger' },
  info: { icon: Info, accent: 'text-app-info', bar: 'bg-app-info' },
};

/** Errors need reading; a success can leave on its own. */
const defaultDuration = (tone: ToastTone) => (tone === 'error' ? 8000 : 4000);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    const tone = options.tone || 'info';
    const duration = options.duration ?? defaultDuration(tone);

    setToasts(prev => {
      // A burst of writes should not bury the screen — keep the newest few.
      const next = [...prev, { ...options, id, tone }];
      return next.slice(-4);
    });

    if (duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }
    return id;
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ title, message, tone: 'success' }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ title, message, tone: 'error' }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ title, message, tone: 'info' }), [toast]);

  const value = useMemo(
    () => ({ toast, success, error, info, dismiss }),
    [toast, success, error, info, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Bottom-centre on a phone (thumb reach, clear of the header), bottom-right on desktop. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-3 pb-[calc(58px_+_env(safe-area-inset-bottom)_+_0.75rem)] sm:items-end md:p-4 md:pb-4"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map(t => {
            const { icon: Icon, accent, bar } = TONE[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                role={t.tone === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex w-full max-w-md items-start gap-2.5 border border-app-border bg-app-card p-3 shadow-soft"
              >
                <span className={cn('mt-0.5 w-[3px] shrink-0 self-stretch', bar)} />
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', accent)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-app-text">{t.title}</p>
                  {t.message && <p className="mt-0.5 text-xs leading-relaxed text-app-muted">{t.message}</p>}
                </div>
                {t.action && (
                  <button
                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                    className="inline-flex h-7 shrink-0 items-center gap-1.5 border border-app-primary/40 px-2.5 text-xs font-semibold text-app-primary transition-colors hover:bg-app-primary/10"
                  >
                    <Undo2 className="h-3.5 w-3.5" /> {t.action.label}
                  </button>
                )}
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 text-app-muted transition-colors hover:text-app-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
