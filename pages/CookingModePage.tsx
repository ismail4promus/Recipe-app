import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
    Play, Pause, RotateCcw, PartyPopper, ArrowLeft, 
    Check, BookOpen, Utensils, CheckSquare, Clock, ChevronRight,
    Users, Plus, Minus, Timer, ListChecks,
    Lock, AlertCircle, Volume2, VolumeX, FastForward, Activity,
    Save, History, LogOut, RefreshCw, X, Tag, Crosshair, Shield, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { CookingSession } from '../types';

const playTimerStartSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
};

const CompactTimer: React.FC<{ timeLeft: number; totalTime: number; isRunning: boolean; onToggle: () => void; onReset: () => void; }> = ({ timeLeft, totalTime, isRunning, onToggle, onReset }) => {
    const progress = totalTime > 0 ? timeLeft / totalTime : 0;
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${((s % 60) || 0).toString().padStart(2, '0')}`;
    
    return (
        <div className="flex flex-col items-center bg-app-card border border-app-border p-6 rounded-sm shadow-2xl w-full relative overflow-hidden">
             <Crosshair className="absolute -bottom-4 -right-4 h-24 w-24 text-white/[0.02] pointer-events-none" />
             <div className="relative h-32 w-32 md:h-40 md:w-40 flex items-center justify-center mb-6">
                 <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                    <circle cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                    <motion.circle
                        cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="3" strokeLinecap="square"
                        initial={{ strokeDashoffset: 400 }}
                        animate={{ strokeDashoffset: 400 - (400 * progress) }}
                        transition={{ duration: 0.5, ease: "linear" }}
                        style={{ strokeDasharray: 400 }}
                        className="text-app-primary"
                    />
                </svg>
                <div className="flex flex-col items-center relative z-10">
                    <span className="text-3xl md:text-5xl font-black tabular-nums tracking-tighter text-app-text leading-none">{formatTime(timeLeft)}</span>
                    <span className="text-[7px] font-black uppercase text-app-muted tracking-[0.4em] mt-2">Chronometer</span>
                </div>
             </div>
             <div className="flex gap-2 w-full max-w-[280px] relative z-10">
                <button 
                    onClick={onReset} 
                    className="h-12 w-12 rounded-sm bg-app-bg border border-app-border text-app-muted hover:text-app-primary transition-all active:scale-90"
                >
                    <RotateCcw className="h-5 w-5 mx-auto"/>
                </button>
                <button 
                    onClick={() => {
                        if (!isRunning) playTimerStartSound();
                        onToggle();
                    }} 
                    className={cn(
                        "flex-1 h-12 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg", 
                        isRunning 
                            ? "bg-red-900/20 text-red-500 border border-red-500/30" 
                            : "bg-app-primary text-white"
                    )}
                >
                    {isRunning ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4 fill-current"/>}
                    <span>{isRunning ? 'Halt Sequence' : 'Init Process'}</span>
                </button>
             </div>
        </div>
    );
};

export default function CookingModePage() {
    const { recipeId } = useParams<{ recipeId: string }>();
    const [searchParams] = useSearchParams();
    const initialServings = searchParams.get('servings') ? parseInt(searchParams.get('servings')!) : 1;
    const requestedSessionId = searchParams.get('sessionId');
    const { getRecipeById, cookingSessions, addCookingSession, updateCookingSession } = useData();
    const navigate = useNavigate();
    const recipe = getRecipeById(recipeId || '');
    const activeStepRef = useRef<HTMLDivElement>(null);

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [localServings, setLocalServings] = useState(initialServings);
    const [isFinished, setIsFinished] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [completedIngs, setCompletedIngs] = useState<Set<string>>(new Set());
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showSaveNamingModal, setShowSaveNamingModal] = useState(false);
    const [sessionNameInput, setSessionNameInput] = useState('');

    const steps = recipe?.steps || [];
    const scaleFactor = recipe ? localServings / recipe.servings : 1;

    useEffect(() => {
        if (!recipeId) return;
        if (requestedSessionId) {
            const specificSession = cookingSessions.find(s => s.id === requestedSessionId);
            if (specificSession) {
                setActiveSessionId(specificSession.id);
                setCurrentStepIndex(specificSession.currentStep || 0);
                setCompletedIngs(new Set(specificSession.completedIngredients || []));
                setLocalServings(specificSession.servings || initialServings);
                setSessionNameInput(specificSession.sessionName || '');
                return;
            }
        }
        const activeSession = cookingSessions.find(s => s.recipeId === recipeId && s.status === 'in_progress');
        if (activeSession) {
            setShowResumeModal(true);
        } else {
            createNewSession();
        }
    }, [recipeId, requestedSessionId]);

    const createNewSession = async () => {
        const id = `sess_${Date.now()}`;
        const defaultName = `Station @ ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}`;
        const newSession: CookingSession = {
            id,
            recipeId: recipeId!,
            servings: localServings,
            currentStep: 0,
            completedIngredients: [],
            startTime: new Date(),
            status: 'in_progress',
            sessionName: defaultName
        };
        setActiveSessionId(id);
        setSessionNameInput(defaultName);
        addCookingSession(newSession);
    };

    const handleResume = () => {
        const activeSession = cookingSessions.find(s => s.recipeId === recipeId && s.status === 'in_progress');
        if (activeSession) {
            setActiveSessionId(activeSession.id);
            setCurrentStepIndex(activeSession.currentStep || 0);
            setCompletedIngs(new Set(activeSession.completedIngredients || []));
            setLocalServings(activeSession.servings || initialServings);
            setSessionNameInput(activeSession.sessionName || '');
        }
        setShowResumeModal(false);
    };

    const handleStartFresh = () => {
        const activeSession = cookingSessions.find(s => s.recipeId === recipeId && s.status === 'in_progress');
        if (activeSession) updateCookingSession(activeSession.id, { status: 'abandoned', endTime: new Date() });
        createNewSession();
        setShowResumeModal(false);
    };

    useEffect(() => {
        if (!activeSessionId) return;
        const saveProgress = async () => {
            setIsSaving(true);
            try {
                await updateCookingSession(activeSessionId, {
                    currentStep: currentStepIndex,
                    completedIngredients: Array.from(completedIngs),
                    servings: localServings
                });
            } finally {
                setTimeout(() => setIsSaving(false), 500);
            }
        };
        const timer = setTimeout(saveProgress, 1000);
        return () => clearTimeout(timer);
    }, [currentStepIndex, completedIngs, localServings, activeSessionId]);

    const currentStepIngredients = useMemo(() => {
        if (!recipe) return [];
        const currentStepData = steps[currentStepIndex];
        if (currentStepData?.linkedIngredientIds?.length) {
            const allIngredients = recipe.ingredientSections.flatMap(s => s.ingredients);
            return allIngredients.filter(ing => currentStepData.linkedIngredientIds!.includes(ing.id));
        }
        const stepNum = currentStepData?.stepNumber || (currentStepIndex + 1);
        return recipe.ingredientSections[stepNum - 1]?.ingredients || [];
    }, [recipe, currentStepIndex, steps]);

    const isCurrentStepTasksCompleted = useMemo(() => {
        if (currentStepIngredients.length === 0) return true;
        return currentStepIngredients.every(ing => completedIngs.has(ing.id));
    }, [currentStepIngredients, completedIngs]);

    const speakInstruction = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(steps[currentStepIndex].instruction);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        if (steps[currentStepIndex]?.duration) setTimeLeft(steps[currentStepIndex].duration! * 60);
        else setTimeLeft(0);
        setIsTimerRunning(false);
        activeStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentStepIndex, steps]);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning && timeLeft > 0) interval = setInterval(() => setTimeLeft(p => p - 1), 1000);
        else if (timeLeft === 0) setIsTimerRunning(false);
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const toggleIngredient = (id: string) => {
        setCompletedIngs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleFinish = async () => {
        if (activeSessionId) await updateCookingSession(activeSessionId, { status: 'completed', endTime: new Date() });
        setIsFinished(true);
    };

    if (!recipe) return null;

    if (isFinished) {
        return (
            <div className="fixed inset-0 bg-app-bg z-[200] flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-app-card p-10 rounded-sm border border-app-border shadow-2xl text-center relative overflow-hidden">
                    <Crosshair className="absolute top-4 right-4 h-12 w-12 text-white/[0.02]" />
                    <div className="h-20 w-20 bg-app-success/10 text-app-success rounded-sm border border-app-success/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_20px_rgba(28,187,140,0.1)]">
                        <PartyPopper className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black text-app-text mb-4 tracking-tighter uppercase leading-none">Module Complete</h1>
                    <p className="text-[10px] text-app-muted mb-10 font-bold leading-relaxed uppercase tracking-[0.4em]">{recipe.name} IS READY FOR DEPLOYMENT.</p>
                    <button onClick={() => navigate(`/recipes/${recipeId}`)} className="w-full py-5 bg-app-primary text-white rounded-sm font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-[0.99] transition-all">Terminate Process</button>
                </motion.div>
            </div>
        );
    }

    const progressPercent = Math.round(((currentStepIndex + 1) / (steps.length || 1)) * 100);

    return (
        <div className="fixed inset-0 bg-app-bg z-[150] flex flex-col font-sans overflow-hidden text-app-text">
            {/* Deployment Header */}
            <div className="bg-app-card border-b border-app-border h-16 flex items-center justify-between px-6 shadow-md z-30">
                <div className="flex items-center gap-6 min-w-0">
                    <button onClick={() => setShowSaveNamingModal(true)} className="h-10 w-10 flex items-center justify-center bg-app-bg border border-app-border rounded-sm text-app-muted hover:text-app-primary transition-all">
                        <ArrowLeft className="h-5 w-5"/>
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-app-text tracking-tight truncate uppercase leading-tight">{recipe.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-app-primary animate-pulse shadow-[0_0_8px_#3b7ddd]" />
                            <span className="text-[8px] font-black uppercase text-app-muted tracking-[0.3em]">
                                EXEC_ID: {activeSessionId?.split('_')[1]} // PHASE {currentStepIndex + 1}/{steps.length} 
                                {isSaving && <span className="ml-3 text-app-primary opacity-50 font-normal tracking-normal">(COMMIT_SYNCING...)</span>}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1 bg-app-bg p-1 rounded-sm border border-app-border">
                        <button onClick={() => setLocalServings(Math.max(1, localServings - 1))} className="h-9 w-9 rounded-sm bg-app-card border border-white/5 flex items-center justify-center text-app-muted hover:text-app-primary transition-all active:scale-90 font-black">-</button>
                        <div className="px-4 text-center">
                            <input type="number" min="1" value={localServings} onChange={(e) => setLocalServings(Math.max(1, parseInt(e.target.value) || 1))} className="w-10 bg-transparent text-center text-sm font-black tabular-nums text-app-text outline-none border-none" />
                            <span className="block text-[6px] font-black uppercase text-app-muted tracking-widest leading-none mt-0.5">Yield</span>
                        </div>
                        <button onClick={() => setLocalServings(localServings + 1)} className="h-9 w-9 rounded-sm bg-app-primary text-white flex items-center justify-center transition-all active:scale-90 font-black">+</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Protocol Sequence Timeline */}
                <div className="w-full md:w-3/5 overflow-y-auto p-6 md:p-10 md:border-r border-app-border bg-app-bg scrollbar-hide">
                    <div className="max-w-3xl mx-auto space-y-8 pb-32">
                        <div className="flex items-center gap-3 px-2">
                            <ListChecks className="h-5 w-5 text-app-primary" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-app-muted">Directive Sequence</h3>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                {steps.map((step, idx) => {
                                    const isActive = currentStepIndex === idx;
                                    const isDone = currentStepIndex > idx;
                                    if (!isActive && !isDone) return null;

                                    return (
                                        <motion.div 
                                            key={step.id} ref={isActive ? activeStepRef : null}
                                            initial={isActive ? { scale: 0.98, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }}
                                            className={cn("p-8 rounded-sm border transition-all relative overflow-hidden", isActive ? "bg-app-card border-app-primary shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-10" : "bg-white/[0.02] border-app-border opacity-30 grayscale blur-[0.5px]")}
                                        >
                                            {isActive && <Shield className="absolute -top-4 -right-4 h-24 w-24 text-white/[0.02]" />}
                                            <div className="flex gap-6 items-start relative z-10">
                                                <div className={cn("h-10 w-10 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all shadow-lg", isActive ? "bg-app-primary border-app-primary text-white scale-110" : "bg-app-bg border-app-border text-app-muted")}>
                                                    {isDone ? <Check className="h-6 w-6" strokeWidth={4} /> : <span className="text-[12px] font-black">{idx + 1}</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isActive && (
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="h-2 w-2 rounded-full bg-app-primary animate-pulse" />
                                                                <span className="text-[9px] font-black text-app-primary uppercase tracking-[0.3em]">Operational Node</span>
                                                            </div>
                                                            <button onClick={speakInstruction} className={cn("h-9 w-9 rounded-sm flex items-center justify-center transition-all", isSpeaking ? "bg-app-primary text-white scale-110" : "bg-app-bg text-app-muted hover:text-app-text")}>
                                                                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <p className={cn("font-black leading-tight transition-all uppercase tracking-tight", isActive ? "text-xl md:text-3xl text-app-text" : "text-lg text-app-muted", isDone && "line-through opacity-40")}>
                                                        {step.instruction}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Logistics Command Sidebar */}
                <div className="w-full md:w-2/5 overflow-y-auto p-6 md:p-10 bg-app-card/30 scrollbar-hide border-l border-white/5">
                    <div className="max-w-xl mx-auto space-y-10">
                        {/* Flow Control Section */}
                        <div className="animate-in fade-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <Timer className="h-4 w-4 text-app-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-app-muted">Flow Control</h3>
                            </div>
                            {steps[currentStepIndex]?.duration ? (
                                <CompactTimer timeLeft={timeLeft} totalTime={steps[currentStepIndex].duration! * 60} isRunning={isTimerRunning} onToggle={() => setIsTimerRunning(!isTimerRunning)} onReset={() => setTimeLeft(steps[currentStepIndex].duration! * 60)} />
                            ) : (
                                <div className="bg-app-bg border border-dashed border-app-border p-12 rounded-sm w-full flex flex-col items-center justify-center opacity-30 grayscale">
                                    <Zap className="h-10 w-10 mb-4" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.5em]">System Free Flow</span>
                                </div>
                            )}
                        </div>

                        {/* Component Audit Section */}
                        <div className="animate-in fade-in slide-in-from-right duration-500">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-3">
                                    <Utensils className="h-4 w-4 text-app-primary" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-app-muted">Component Audit</h3>
                                </div>
                                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-sm border", isCurrentStepTasksCompleted ? "bg-app-success/10 text-app-success border-app-success/20" : "bg-app-primary/5 text-app-primary border-app-primary/20")}>
                                    {completedIngs.size}/{currentStepIngredients.length} LOADED
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                {currentStepIngredients.length > 0 ? (
                                    currentStepIngredients.map((ing, idx) => {
                                        const isDone = completedIngs.has(ing.id);
                                        return (
                                            <div key={ing.id} onClick={() => toggleIngredient(ing.id)} className={cn("p-4 rounded-sm border transition-all cursor-pointer select-none group relative overflow-hidden", isDone ? "bg-app-success/5 border-app-success/30" : "bg-app-bg border-white/5 hover:border-app-primary/40")}>
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={cn("h-9 w-9 rounded-sm border flex items-center justify-center shrink-0 transition-all", isDone ? "bg-app-success border-app-success text-white" : "bg-app-card border-white/10 text-app-muted")}>
                                                        {isDone ? <Check className="h-5 w-5 stroke-[4]" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={cn("text-[11px] font-black uppercase tracking-tight truncate", isDone ? "line-through text-app-muted" : "text-app-text")}>{ing.name}</p>
                                                        <p className={cn("text-[9px] font-black uppercase tracking-widest mt-1", isDone ? "text-app-success/50" : "text-app-primary")}>{(ing.quantity * scaleFactor).toFixed(1)} {ing.unit.toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 text-center text-app-muted flex flex-col items-center gap-4 border border-dashed border-app-border rounded-sm opacity-20">
                                        <Shield className="h-10 w-10" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Active Assets Required</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Array (HUD Footer) */}
            <div className="bg-app-card border-t border-app-border h-20 flex items-center px-8 shadow-2xl z-40 relative">
                 <div className="absolute top-0 left-0 h-1 bg-white/5 w-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-app-primary shadow-[0_0_15px_#3b7ddd]" />
                 </div>
                
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-8">
                    <button disabled={currentStepIndex === 0} onClick={() => setCurrentStepIndex(c => c - 1)} className="h-12 px-8 rounded-sm border border-app-border flex items-center gap-3 text-app-muted hover:text-app-text hover:bg-white/5 disabled:opacity-5 transition-all">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Prior</span>
                    </button>

                    <div className="flex flex-col items-center gap-2">
                         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-app-primary">Deployment Progress: {progressPercent}%</span>
                         <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <div key={i} className={cn("h-1 rounded-none transition-all duration-500", i === currentStepIndex ? "w-12 bg-app-primary" : i < currentStepIndex ? "w-4 bg-app-success" : "w-4 bg-white/5")} />
                            ))}
                         </div>
                    </div>

                    <button 
                        disabled={!isCurrentStepTasksCompleted}
                        onClick={() => currentStepIndex === steps.length - 1 ? handleFinish() : setCurrentStepIndex(c => c + 1)}
                        className={cn(
                            "h-12 px-12 rounded-sm font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-2xl disabled:opacity-20 disabled:grayscale", 
                            currentStepIndex === steps.length - 1 
                                ? "bg-app-success text-white shadow-app-success/20" 
                                : "bg-app-primary text-white"
                        )}
                    >
                        <span>{currentStepIndex === steps.length - 1 ? "End Mission" : "Engage Next"}</span>
                        {isCurrentStepTasksCompleted ? <ChevronRight className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}