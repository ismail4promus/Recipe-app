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

const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'INIT_NOW';
    if (diff < 3600) return `${Math.floor(diff / 60)}M_AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H_AGO`;
    return date.toLocaleDateString().toUpperCase();
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
            className="bg-app-card border border-app-border rounded-sm p-6 hover:border-app-primary/40 transition-all group relative overflow-hidden shadow-sm"
        >
            <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-colors", session.status === 'in_progress' ? "bg-app-primary animate-pulse" : "bg-app-muted/20")}></div>
            <Shield className="absolute -bottom-4 -right-4 h-16 w-16 text-white/[0.02] group-hover:scale-110 transition-transform" />
            
            <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center relative z-10">
                <div className="flex-1 min-w-0 md:pl-4">
                    <div className="flex items-center gap-3 mb-2">
                        {isEditing ? (
                            <div className="flex items-center gap-2 w-full max-w-sm">
                                <input 
                                    autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    className="bg-app-bg border border-app-primary/50 rounded-sm px-4 py-1.5 text-xs font-black uppercase tracking-tight w-full outline-none"
                                />
                                <button onClick={handleSave} className="p-2 bg-app-primary text-white rounded-sm shadow-lg active:scale-90"><Check className="h-4 w-4" /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 group/title">
                                <h3 className="text-sm font-black text-app-text uppercase tracking-tight truncate">
                                    {session.sessionName || `EXECUTION_NODE_${session.id.split('_')[1]}`}
                                </h3>
                                <button onClick={() => { setTempName(session.sessionName || ''); setIsEditing(true); }} className="opacity-0 group-hover/title:opacity-100 p-1 text-app-muted hover:text-app-primary transition-all"><Edit className="h-3.5 w-3.5" /></button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-[9px] font-black text-app-muted uppercase tracking-widest">
                            <Calendar className="h-3 w-3 text-app-primary" /> {getRelativeTime(session.startTime)}
                        </div>
                        <div className="h-1 w-1 rounded-full bg-white/10"></div>
                        <div className="flex items-center gap-2 text-[9px] font-black text-app-text uppercase tracking-widest">
                            <Utensils className="h-3 w-3 text-app-success" /> {session.servings} Servings
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-56 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-app-muted tracking-[0.2em]">
                            {session.status === 'in_progress' ? `SEQUENCE: ${session.currentStep + 1}/${recipeStepsCount}` : `ST_LOG: ${session.status.toUpperCase()}`}
                        </span>
                        <span className="text-[10px] font-black text-app-primary tabular-nums">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-app-bg border border-white/5 rounded-none overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            className={cn("h-full transition-all duration-1000", session.status === 'completed' ? "bg-app-success shadow-[0_0_8px_#1cbb8c]" : session.status === 'abandoned' ? "bg-red-500" : "bg-app-primary shadow-[0_0_8px_#3b7ddd]")}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-app-border pt-4 md:pt-0 md:pl-6">
                    {session.status === 'in_progress' ? (
                        <button onClick={() => onResume(session)} className="flex-1 md:flex-none h-11 px-6 bg-app-primary text-white rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Play className="h-4 w-4 fill-current" /> Engage Console
                        </button>
                    ) : (
                         <div className={cn("px-4 py-2 rounded-sm text-[9px] font-black uppercase tracking-[0.2em] border", session.status === 'completed' ? "bg-app-success/10 text-app-success border-app-success/30" : "bg-red-500/10 text-red-500 border-red-500/30")}>
                            {session.status}
                         </div>
                    )}
                    <button onClick={() => onDelete(session.id)} className="h-11 w-11 flex items-center justify-center text-white/5 hover:text-red-500 hover:bg-red-500/5 rounded-sm transition-all"><Trash2 className="h-4 w-4" /></button>
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
        <div className="max-w-7xl mx-auto space-y-6 pb-24 font-sans px-4 md:px-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-app-border pb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/recipes/${recipeId}`)} className="h-12 w-12 flex items-center justify-center bg-app-card border border-app-border rounded-sm hover:text-app-primary transition-all">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <History className="h-6 w-6 text-app-primary" />
                            <h1 className="text-3xl font-black tracking-tighter uppercase text-app-text">Mission History</h1>
                        </div>
                        <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.3em]">Module_Archive: {recipe.name} &bull; Sector_Logs</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-app-card border border-app-border p-3 rounded-sm shadow-lg min-w-[360px]">
                    <div className="text-center px-2">
                        <p className="text-[8px] font-black text-app-muted uppercase mb-1 tracking-widest">SUCCESS_RATE</p>
                        <p className="text-xl font-black text-app-success tabular-nums leading-none">{stats.successRate}%</p>
                    </div>
                    <div className="text-center border-x border-white/5 px-2">
                        <p className="text-[8px] font-black text-app-muted uppercase mb-1 tracking-widest">ACTIVE_UNITS</p>
                        <p className="text-xl font-black text-app-primary tabular-nums leading-none">{stats.active}</p>
                    </div>
                    <div className="text-center px-2">
                        <p className="text-[8px] font-black text-app-muted uppercase mb-1 tracking-widest">TOTAL_LOGS</p>
                        <p className="text-xl font-black text-app-text tabular-nums leading-none">{stats.total}</p>
                    </div>
                </div>
            </div>

            {/* Tactical Launch Pad */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-app-card border-t-2 border-t-app-primary border-app-border p-10 rounded-sm relative overflow-hidden group shadow-2xl">
                <Rocket className="absolute -bottom-8 -right-8 h-48 w-48 text-white/[0.01] rotate-12 transition-transform group-hover:scale-110" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="text-center md:text-left space-y-2">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <span className="h-2 w-2 rounded-full bg-app-success animate-pulse shadow-[0_0_8px_#1cbb8c]" />
                            <span className="text-[10px] font-black text-app-success uppercase tracking-[0.4em]">Ready for Initialization</span>
                        </div>
                        <h2 className="text-3xl font-black text-app-text uppercase tracking-tight leading-none">Execute New Deployment</h2>
                        <p className="text-[10px] text-app-muted font-bold uppercase tracking-[0.2em]">Target Yield: {requestedServings || recipe.servings} Units &bull; Est_Runtime: {recipe.prepTime + recipe.cookTime}M</p>
                    </div>
                    <button onClick={handleLaunchNewService} className="w-full md:w-auto h-16 px-12 bg-app-primary text-white rounded-sm font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4">
                        <Rocket className="h-5 w-5 fill-current" /> Initialize Mission
                    </button>
                </div>
            </motion.div>

            {/* Filter Hub */}
            <div className="bg-app-card border border-app-border p-2 rounded-sm flex flex-col md:flex-row gap-3 shadow-lg sticky top-14 md:top-20 z-30 backdrop-blur-md">
                <div className="flex bg-app-bg p-1 rounded-sm border border-app-border">
                    {(['ongoing', 'history', 'all'] as const).map(tab => (
                        <button
                            key={tab} onClick={() => setActiveTab(tab)}
                            className={cn("flex-1 md:flex-none px-8 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all", activeTab === tab ? "bg-app-primary text-white shadow-xl" : "text-app-muted hover:text-app-text")}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                    <input 
                        placeholder="QUERY MISSION LOGS..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-app-bg border border-app-border rounded-sm text-[11px] font-black uppercase tracking-[0.2em] focus:ring-1 focus:ring-app-primary outline-none transition-all placeholder:text-app-muted/20"
                    />
                </div>
            </div>

            {/* Archive List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredSessions.length > 0 ? (
                        filteredSessions.map(session => (
                            <LogItem key={session.id} session={session} recipeStepsCount={recipe.steps.length} onUpdate={updateCookingSession} onDelete={(id) => { if (window.confirm("Purge Log Entry?")) deleteCookingSession(id); }} onResume={(s) => navigate(`/recipes/${recipeId}/cook?sessionId=${s.id}`)} />
                        ))
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center border border-dashed border-app-border rounded-sm bg-app-card/30">
                            <Activity className="h-12 w-12 text-app-muted opacity-10 mx-auto mb-6" />
                            <p className="text-[11px] font-black text-app-muted uppercase tracking-[0.5em]">Sector_Data_Static: Null Records</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}