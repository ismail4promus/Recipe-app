import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, LogIn } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Writes fall back to local state when Firestore rejects them, which otherwise
 * looks exactly like a successful save until the page is reloaded. This says so.
 */
const SaveStatusBanner: React.FC = () => {
  const { saveError, dismissSaveError } = useData();
  const { user, loading } = useAuth();

  const show = !!saveError;
  const offerSignIn = !user && !loading;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="sticky top-14 z-30 border-b border-app-danger/30 bg-app-danger/10 px-3 py-2.5 md:px-4"
          role="status"
        >
          <div className="mx-auto flex max-w-[1600px] items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-app-danger" />
            <p className="flex-1 text-sm font-medium leading-relaxed text-app-text">
              {saveError}
            </p>
            {offerSignIn && (
              <Link
                to="/signin"
                onClick={dismissSaveError}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 bg-app-primary px-3 text-xs font-semibold text-primary-foreground transition-all hover:brightness-105"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </Link>
            )}
            <button
              aria-label="Dismiss"
              onClick={dismissSaveError}
              className="shrink-0 text-app-muted transition-colors hover:text-app-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SaveStatusBanner;
