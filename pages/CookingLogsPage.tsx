import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { CookingSession } from '../types';
import { 
    History, ArrowLeft, Search, Trash2, Edit, Play, 
    CheckCircle2, XCircle, Clock, Save, Check, Filter, 
    MoreHorizontal, BarChart3, ListChecks, Calendar, Utensils,
    Plus, Rocket, Activity, Zap, ChevronRight, User, Crosshair, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button, Segmented, IconButton } from '../components/ui/kit';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
};

const LogItem: React.FC<{
    session: CookingSession;
    recipeStepsCount: number;
    onUpdate: (id: string, updates: Partial<CookingSession>) => void;
    onDelete: (id: string) => void;
    onResume: (session: CookingSession) => void;
}> = ({ session, recipeStepsCount, onUpdate, onDelete, onResume }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(session.sessionName || '');
    const progress = Math.round(((session.currentStep + 1) / (recipeStepsCount || 1)) * 100);

    const handleSave = () => {
        onUpdate(session.id, { sessionName: tempName });
        setIsEditing(false);
    };

    return (
        <motion.div
            layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-app-card border border-app-border rounded-lg p-3 hover:border-app-primary/40 transition-all group relative overflow-hidden shadow-soft"
        >
            <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-colors", session.status === 'in_progress' ? "bg-app-primary" : "bg-app-muted/20")}></div>

            <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center relative z-10">
                <div className="flex-1 min-w-0 md:pl-4">
                    <div className="flex items-center gap-3 mb-2">
                        {isEditing ? (
                            <div className="flex items-center gap-2 w-full max-w-sm">
                                <input
                                    autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    className="bg-app-bg border border-app-primary/50 rounded-md px-4 py-1.5 text-sm font-medium text-app-text tracking-tight w-full outline-none focus:ring-2 focus:ring-app-primary"
                                />
                                <button aria-label="Save name" onClick={handleSave} className="p-2 bg-app-primary text-primary-foreground rounded-full shadow-soft active:scale-90"><Check className="h-4 w-4" /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 group/title">
                                <h3 className="text-base font-bold text-app-text tracking-tight truncate">
                                    {session.sessionName || `Session ${session.id.split('_')[1]}`}
                                </h3>
                                <button aria-label="Rename session" onClick={() => { setTempName(session.sessionName || ''); setIsEditing(true); }} className="opacity-100 md:opacity-0 md:group-hover/title:opacity-100 p-1 text-app-muted hover:text-app-primary transition-all"><Edit className="h-3.5 w-3.5" /></button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2 text-xs text-app-muted font-medium">
                            <Calendar className="h-3.5 w-3.5 text-app-primary" /> {getRelativeTime(session.startTime)}
                        </div>
                        <div className="h-1 w-1 rounded-full bg-app-muted/30"></div>
                        <div className="flex items-center gap-2 text-xs text-app-text font-medium">
                            <Utensils className="h-3.5 w-3.5 text-app-success" /> {session.servings} Servings
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-56 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-app-muted font-medium">
                            {session.status === 'in_progress' ? `Step ${session.currentStep + 1}/${recipeStepsCount}` : (session.status === 'completed' ? 'Completed' : session.status === 'abandoned' ? 'Stopped' : 'In Progress')}
                        </span>
                        <span className="text-sm font-semibold text-app-primary tabular-nums">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-app-bg border border-app-border rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            className={cn("h-full rounded-full transition-all duration-1000", session.status === 'completed' ? "bg-app-success" : session.status === 'abandoned' ? "bg-app-danger" : "bg-app-primary")}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-app-border pt-4 md:pt-0 md:pl-6">
                    {session.status === 'in_progress' ? (
                        <Button onClick={() => onResume(session)} icon={Play} className="flex-1 md:flex-none">
                            Continue
                        </Button>
                    ) : (
                         <div className={cn("px-4 py-2 rounded-md text-xs font-semibold border", session.status === 'completed' ? "bg-app-success/10 text-app-success border-app-success/30" : "bg-app-danger/10 text-app-danger border-app-danger/30")}>
                            {session.status === 'completed' ? 'Completed' : session.status === 'abandoned' ? 'Stopped' : session.status}
                         </div>
                    )}
                    <IconButton icon={Trash2} label="Delete session" onClick={() => onDelete(session.id)} className="text-app-muted hover:text-app-danger" />
                </div>
            </div>
        </motion.div>
    );
};

export default function CookingLogsPage() {
    const { recipeId } = useParams<{ recipeId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { getRecipeById, getSessionsByRecipeId, updateCookingSession, deleteCookingSession, addCookingSession } = useData();
    const confirm = useConfirm();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState<'ongoing' | 'history' | 'all'>('ongoing');
    const [searchQuery, setSearchQuery] = useState('');

    const requestedServings = parseInt(searchParams.get('servings') || '1');
    const recipe = useMemo(() => getRecipeById(recipeId || ''), [recipeId, getRecipeById]);
    const sessions = useMemo(() => getSessionsByRecipeId(recipeId || ''), [recipeId, getSessionsByRecipeId]);

    const handleLaunchNewService = async () => {
        if (!recipeId) return;
        const id = `sess_${Date.now()}`;
        const newSession: CookingSession = { id, recipeId: recipeId, servings: requestedServings || recipe?.servings || 1, currentStep: 0, completedIngredients: [], startTime: new Date(), status: 'in_progress' };
        await addCookingSession(newSession);
        navigate(`/recipes/${recipeId}/cook?sessionId=${id}`);
    };

    const filteredSessions = useMemo(() => {
        let list = sessions;
        if (activeTab === 'ongoing') list = list.filter(s => s.status === 'in_progress');
        if (activeTab === 'history') list = list.filter(s => s.status !== 'in_progress');
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => (s.sessionName?.toLowerCase().includes(q)) || s.startTime.toLocaleDateString().includes(q));
        }
        return list;
    }, [sessions, activeTab, searchQuery]);

    const stats = useMemo(() => {
        const completed = sessions.filter(s => s.status === 'completed');
        const active = sessions.filter(s => s.status === 'in_progress');
        return { total: sessions.length, completed: completed.length, active: active.length, successRate: sessions.length ? Math.round((completed.length / sessions.length) * 100) : 0 };
    }, [sessions]);

    if (!recipe) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-2.5 md:space-y-3 pb-nav md:pb-10 font-sans px-1 md:px-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-2.5 border-b border-app-border pb-4 md:pb-3">
                <div className="flex items-center gap-3 md:gap-2.5 min-w-0">
                    <IconButton icon={ArrowLeft} label="Back to recipe" onClick={() => navigate(`/recipes/${recipeId}`)} className="h-11 w-11 md:h-12 md:w-12 shrink-0" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                            <History className="h-5 w-5 md:h-6 md:w-6 text-app-primary shrink-0" />
                            <h1 className="text-xl md:text-xl font-bold tracking-tight text-app-text truncate">Cooking History</h1>
                        </div>
                        <p className="text-xs md:text-sm text-app-muted font-medium truncate">{recipe.name} &bull; Past sessions</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-3 bg-app-card rounded-xl border border-app-border p-3 md:p-2.5 shadow-soft w-full md:w-auto md:min-w-[340px]">
                    <div className="text-center px-1">
                        <p className="text-[11px] md:text-xs text-app-muted font-medium mb-1 truncate">Success</p>
                        <p className="text-lg md:text-xl font-bold text-app-success tabular-nums leading-none">{stats.successRate}%</p>
                    </div>
                    <div className="text-center border-x border-app-border px-1">
                        <p className="text-[11px] md:text-xs text-app-muted font-medium mb-1 truncate">Active</p>
                        <p className="text-lg md:text-xl font-bold text-app-primary tabular-nums leading-none">{stats.active}</p>
                    </div>
                    <div className="text-center px-1">
                        <p className="text-[11px] md:text-xs text-app-muted font-medium mb-1 truncate">Total</p>
                        <p className="text-lg md:text-xl font-bold text-app-text tabular-nums leading-none">{stats.total}</p>
                    </div>
                </div>
            </div>

            {/* Start cooking */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-app-card border border-app-border p-2.5 md:p-10 rounded-lg relative overflow-hidden group shadow-soft">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-2.5">
                    <div className="text-center md:text-left space-y-2">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <span className="h-2 w-2 rounded-full bg-app-success animate-pulse" />
                            <span className="text-xs text-app-success font-medium">Ready to go</span>
                        </div>
                        <h2 className="text-2xl md:text-xl font-bold text-app-text tracking-tight leading-tight">Start cooking</h2>
                        <p className="text-sm text-app-muted font-medium">Serves {requestedServings || recipe.servings} &bull; About {recipe.prepTime + recipe.cookTime} min</p>
                    </div>
                    <Button onClick={handleLaunchNewService} icon={Rocket} className="w-full md:w-auto min-h-[56px] px-10 text-base">
                        Start cooking
                    </Button>
                </div>
            </motion.div>

            {/* Filter Hub */}
            <div className="bg-app-card rounded-xl border border-app-border p-1.5 flex flex-col md:flex-row md:items-center gap-2 shadow-soft sticky top-14 md:top-20 z-30 backdrop-blur-md">
                <Segmented
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'ongoing', label: 'Ongoing' },
                        { value: 'history', label: 'History' },
                        { value: 'all', label: 'All' },
                    ]}
                />
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                    <input
                        placeholder="Search sessions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-app-bg border border-app-border rounded-md text-sm text-app-text focus:ring-2 focus:ring-app-primary outline-none transition-all placeholder:text-app-muted"
                    />
                </div>
            </div>

            {/* Archive List */}
            <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                    {filteredSessions.length > 0 ? (
                        filteredSessions.map(session => (
                            <LogItem key={session.id} session={session} recipeStepsCount={recipe.steps.length} onUpdate={updateCookingSession} onDelete={async (id) => {
                                const ok = await confirm({
                                    title: 'Delete this cooking session?',
                                    message: 'Its timings and step progress are removed from this recipe’s history.',
                                    confirmLabel: 'Delete',
                                    destructive: true,
                                });
                                if (!ok) return;
                                const deleted = await deleteCookingSession(id);
                                if (!deleted) return;
                                toast.toast({
                                    title: 'Session deleted',
                                    tone: 'success',
                                    duration: 10000,
                                    action: { label: 'Undo', onClick: () => { addCookingSession(session); } },
                                });
                            }} onResume={(s) => navigate(`/recipes/${recipeId}/cook?sessionId=${s.id}`)} />
                        ))
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center border border-dashed border-app-border rounded-lg bg-app-card/30">
                            <Activity className="h-12 w-12 text-app-muted opacity-20 mx-auto mb-3" />
                            <p className="text-sm text-app-muted font-medium">No sessions yet</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}