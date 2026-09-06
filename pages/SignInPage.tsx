import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChefHat, AlertCircle, ArrowLeft, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Google's mark, inlined so the page stays self-contained.
const GoogleMark = () => (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

export default function SignInPage() {
    const { user, loading, signingIn, error, signInWithGoogle, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from || '/dashboard';

    useEffect(() => {
        if (!loading && user) navigate(from, { replace: true });
    }, [user, loading, navigate, from]);

    return (
        <div className="min-h-screen w-full bg-app-bg flex flex-col items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-app-card rounded-2xl border border-app-border shadow-card"
            >
                <div className="border-b border-app-border p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-11 w-11 rounded-[14px] bg-app-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-soft">
                            <ChefHat className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-app-text leading-tight">Cook Jatra</h1>
                            <p className="text-xs text-app-muted font-medium">Kitchen management</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-app-text mb-2">Sign in</h2>
                    <p className="text-sm text-app-muted leading-relaxed">
                        Sign in to save recipes, inventory and orders to your kitchen's database.
                    </p>
                </div>

                <div className="p-6 md:p-8 space-y-4">
                    {error && (
                        <div className="bg-app-danger/10 border border-app-danger/30 p-3 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-app-danger shrink-0 mt-0.5" />
                            <p className="text-sm text-app-text leading-relaxed">{error}</p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => { clearError(); signInWithGoogle(); }}
                        disabled={signingIn || loading}
                        className="w-full min-h-[52px] bg-app-elevated rounded-xl border border-app-border text-app-text font-semibold text-sm flex items-center justify-center gap-3 hover:border-app-primary/50 hover:bg-app-muted/10 active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                    >
                        {signingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleMark />}
                        {signingIn ? 'Signing in…' : 'Continue with Google'}
                    </button>

                    <div className="flex items-start gap-2 text-xs text-app-muted leading-relaxed">
                        <ShieldCheck className="h-4 w-4 shrink-0 mt-px text-app-success" />
                        <span>Your kitchen data is stored in Firebase and only readable by signed-in accounts.</span>
                    </div>
                </div>

                <div className="border-t border-app-border p-4 flex items-center justify-between">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-medium text-app-muted hover:text-app-text transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to app
                    </Link>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-app-muted">
                        <LogIn className="h-3.5 w-3.5" /> Google only
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
