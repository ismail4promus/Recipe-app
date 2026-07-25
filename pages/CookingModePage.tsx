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

const playAlarm = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [0, 0.4, 0.8].forEach(t => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime + t);
            g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
            g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
            osc.start(ctx.currentTime + t);
            osc.stop(ctx.currentTime + t + 0.32);
        });
    } catch (e) {}
};

const CompactTimer: React.FC<{ timeLeft: number; totalTime: number; isRunning: boolean; ended: boolean; onToggle: () => void; onReset: () => void; }> = ({ timeLeft, totalTime, isRunning, ended, onToggle, onReset }) => {
    const progress = totalTime > 0 ? timeLeft / totalTime : 0;
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${((s % 60) || 0).toString().padStart(2, '0')}`;

    return (
        <div className={cn("flex flex-col items-center bg-app-card border p-6 rounded-lg shadow-soft w-full relative overflow-hidden transition-colors", ended ? "border-app-danger" : "border-app-border")}>
             <div className="relative h-32 w-32 md:h-40 md:w-40 flex items-center justify-center mb-6">
                 <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                    <circle cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="3" className="text-app-muted/15" />
                    <motion.circle
                        cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                        initial={{ strokeDashoffset: 400 }}
                        animate={{ strokeDashoffset: 400 - (400 * progress) }}
                        transition={{ duration: 0.5, ease: "linear" }}
                        style={{ strokeDasharray: 400 }}
                        className={ended ? "text-app-danger" : "text-app-primary"}
                    />
                </svg>
                <div className="flex flex-col items-center relative z-10">
                    <span className={cn("text-3xl md:text-5xl font-bold tabular-nums tracking-tight leading-none", ended ? "text-app-danger" : "text-app-text")}>{formatTime(timeLeft)}</span>
                    <span className={cn("text-xs font-medium mt-2", ended ? "text-app-danger" : "text-app-muted")}>
                        {ended ? "Time's up!" : "Timer"}
                    </span>
                </div>
             </div>
             <div className="flex gap-2 w-full max-w-[280px] relative z-10">
                <button
                    aria-label="Reset timer"
                    onClick={onReset}
                    className="h-12 w-12 rounded-md bg-app-elevated border border-app-border text-app-muted hover:text-app-primary transition-all active:scale-90"
                >
                    <RotateCcw className="h-5 w-5 mx-auto"/>
                </button>
                <button
                    onClick={() => {
                        if (ended) { onReset(); return; }
                        if (!isRunning) playTimerStartSound();
                        onToggle();
                    }}
                    className={cn(
                        "flex-1 min-h-[44px] rounded-md font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-soft",
                        ended
                            ? "bg-app-danger text-white"
                            : isRunning
                                ? "bg-app-danger/10 text-app-danger border border-app-danger/30"
                                : "bg-app-primary text-primary-foreground"
                    )}
                >
                    {ended ? <RotateCcw className="h-4 w-4"/> : isRunning ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4 fill-current"/>}
                    <span>{ended ? 'Restart' : isRunning ? 'Pause' : 'Start Timer'}</span>
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
    const [timerEnded, setTimerEnded] = useState(false);
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
        const defaultName = `Session at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
        setTimerEnded(false);
        activeStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentStepIndex, steps]);

    // Countdown — alarm + vibrate when it reaches zero while running.
    useEffect(() => {
        if (!isTimerRunning) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsTimerRunning(false);
                    setTimerEnded(true);
                    playAlarm();
                    try { (navigator as any).vibrate?.([200, 100, 200, 100, 400]); } catch (e) {}
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // Keep the screen awake while cooking.
    useEffect(() => {
        let lock: any = null;
        const request = async () => {
            try { lock = await (navigator as any).wakeLock?.request('screen'); } catch (e) {}
        };
        request();
        const onVis = () => { if (document.visibilityState === 'visible') request(); };
        document.addEventListener('visibilitychange', onVis);
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            try { lock?.release?.(); } catch (e) {}
        };
    }, []);

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
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-app-card p-10 rounded-lg border border-app-border shadow-soft text-center relative overflow-hidden">
                    <div className="h-20 w-20 bg-app-success/10 text-app-success rounded-full border border-app-success/20 flex items-center justify-center mx-auto mb-8">
                        <PartyPopper className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-app-text mb-4 tracking-tight leading-tight">All Done!</h1>
                    <p className="text-base text-app-muted mb-10 leading-relaxed">{recipe.name} is ready to serve.</p>
                    <button onClick={() => navigate(`/recipes/${recipeId}`)} className="w-full min-h-[44px] py-4 bg-app-primary text-primary-foreground rounded-full font-semibold text-base shadow-soft hover:brightness-105 active:scale-[0.99] transition-all">Finish</button>
                </motion.div>
            </div>
        );
    }

    const progressPercent = Math.round(((currentStepIndex + 1) / (steps.length || 1)) * 100);

    return (
        <div className="fixed inset-0 bg-app-bg z-[150] flex flex-col font-sans overflow-hidden text-app-text">
            {/* Header */}
            <div className="bg-app-card border-b border-app-border h-16 flex items-center justify-between gap-2 px-3 md:px-6 shadow-soft z-30 pt-safe">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <button aria-label="Back" onClick={() => setShowSaveNamingModal(true)} className="h-10 w-10 shrink-0 flex items-center justify-center bg-app-elevated border border-app-border text-app-muted hover:text-app-primary transition-all">
                        <ArrowLeft className="h-5 w-5"/>
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-app-text tracking-tight truncate leading-tight">{recipe.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-app-primary animate-pulse" />
                            <span className="text-xs text-app-muted font-medium">
                                Step {currentStepIndex + 1} of {steps.length}
                                {isSaving && <span className="ml-3 text-app-primary opacity-70">Saving...</span>}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center shrink-0">
                     <div className="flex items-center bg-app-elevated border border-app-border">
                        <button aria-label="Fewer servings" onClick={() => setLocalServings(Math.max(1, localServings - 1))} className="h-10 w-9 md:w-10 flex items-center justify-center text-app-muted hover:text-app-primary transition-all active:scale-90 font-semibold text-lg">−</button>
                        <div className="px-2 text-center border-x border-app-border">
                            <input aria-label="Servings" type="number" min="1" value={localServings} onChange={(e) => setLocalServings(Math.max(1, parseInt(e.target.value) || 1))} className="w-9 bg-transparent text-center text-sm font-semibold tabular-nums text-app-text outline-none border-none" />
                            <span className="block text-[10px] text-app-muted font-medium leading-none mb-1">Serves</span>
                        </div>
                        <button aria-label="More servings" onClick={() => setLocalServings(localServings + 1)} className="h-10 w-9 md:w-10 bg-app-primary text-primary-foreground flex items-center justify-center transition-all active:scale-90 font-semibold text-lg">+</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Steps Timeline */}
                <div className="w-full md:w-3/5 overflow-y-auto p-3 md:p-10 md:border-r border-app-border bg-app-bg scrollbar-hide">
                    <div className="max-w-3xl mx-auto space-y-5 pb-20">
                        <div className="flex items-center gap-3 px-2">
                            <ListChecks className="h-5 w-5 text-app-primary" />
                            <h3 className="text-xs text-app-muted font-medium">Steps</h3>
                            <div className="h-px flex-1 bg-app-border"></div>
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
                                            className={cn("p-5 rounded-lg border transition-all relative overflow-hidden", isActive ? "bg-app-card border-app-primary shadow-soft z-10" : "bg-app-muted/10 border-app-border opacity-50")}
                                        >
                                            <div className="flex gap-4 items-start relative z-10">
                                                <div className={cn("h-10 w-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all shadow-soft", isActive ? "bg-app-primary border-app-primary text-primary-foreground scale-110" : "bg-app-bg border-app-border text-app-muted")}>
                                                    {isDone ? <Check className="h-6 w-6" strokeWidth={4} /> : <span className="text-sm font-semibold">{idx + 1}</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isActive && (
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="h-2 w-2 rounded-full bg-app-primary animate-pulse" />
                                                                <span className="text-xs text-app-primary font-medium">Current step</span>
                                                            </div>
                                                            <button aria-label="Read step aloud" onClick={speakInstruction} className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-all", isSpeaking ? "bg-app-primary text-primary-foreground scale-110" : "bg-app-elevated text-app-muted hover:text-app-text")}>
                                                                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <p className={cn("font-semibold leading-snug transition-all tracking-tight", isActive ? "text-xl md:text-3xl text-app-text" : "text-lg text-app-muted", isDone && "line-through opacity-50")}>
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

                {/* Sidebar */}
                <div className="w-full md:w-2/5 overflow-y-auto p-3 md:p-10 bg-app-card/30 scrollbar-hide border-l border-app-border">
                    <div className="max-w-xl mx-auto space-y-10">
                        {/* Timer Section */}
                        <div className="animate-in fade-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <Timer className="h-4 w-4 text-app-primary" />
                                <h3 className="text-xs text-app-muted font-medium">Timer</h3>
                            </div>
                            {steps[currentStepIndex]?.duration ? (
                                <CompactTimer
                                    timeLeft={timeLeft}
                                    totalTime={steps[currentStepIndex].duration! * 60}
                                    isRunning={isTimerRunning}
                                    ended={timerEnded}
                                    onToggle={() => { setTimerEnded(false); setIsTimerRunning(r => !r); }}
                                    onReset={() => { setTimerEnded(false); setIsTimerRunning(false); setTimeLeft(steps[currentStepIndex].duration! * 60); }}
                                />
                            ) : (
                                <div className="bg-app-bg border border-dashed border-app-border p-12 rounded-lg w-full flex flex-col items-center justify-center opacity-60 text-app-muted">
                                    <Zap className="h-10 w-10 mb-4" />
                                    <span className="text-sm font-medium">No timer for this step</span>
                                </div>
                            )}
                        </div>

                        {/* Ingredients Section */}
                        <div className="animate-in fade-in slide-in-from-right duration-500">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-3">
                                    <Utensils className="h-4 w-4 text-app-primary" />
                                    <h3 className="text-xs text-app-muted font-medium">Ingredients</h3>
                                </div>
                                <span className={cn("text-xs font-semibold px-3 py-1 rounded-md border", isCurrentStepTasksCompleted ? "bg-app-success/10 text-app-success border-app-success/20" : "bg-app-primary/10 text-app-primary border-app-primary/20")}>
                                    {completedIngs.size}/{currentStepIngredients.length} ready
                                </span>
                            </div>

                            <div className="space-y-2">
                                {currentStepIngredients.length > 0 ? (
                                    currentStepIngredients.map((ing, idx) => {
                                        const isDone = completedIngs.has(ing.id);
                                        return (
                                            <div key={ing.id} onClick={() => toggleIngredient(ing.id)} className={cn("p-4 rounded-md border transition-all cursor-pointer select-none group relative overflow-hidden", isDone ? "bg-app-success/10 border-app-success/30" : "bg-app-bg border-app-border hover:border-app-primary/40")}>
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={cn("h-9 w-9 rounded-full border flex items-center justify-center shrink-0 transition-all", isDone ? "bg-app-success border-app-success text-white" : "bg-app-card border-app-border text-app-muted")}>
                                                        {isDone ? <Check className="h-5 w-5 stroke-[4]" /> : <span className="text-xs font-semibold">{idx + 1}</span>}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={cn("text-sm font-semibold tracking-tight truncate", isDone ? "line-through text-app-muted" : "text-app-text")}>{ing.name}</p>
                                                        <p className={cn("text-xs font-medium mt-1", isDone ? "text-app-success/60" : "text-app-primary")}>{(ing.quantity * scaleFactor).toFixed(1)} {ing.unit}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 text-center text-app-muted flex flex-col items-center gap-4 border border-dashed border-app-border rounded-lg opacity-60">
                                        <Utensils className="h-10 w-10" />
                                        <p className="text-sm font-medium">No ingredients for this step</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="bg-app-card border-t border-app-border h-20 flex items-center px-3 md:px-8 pb-safe shadow-soft z-40 relative">
                 <div className="absolute top-0 left-0 h-1 bg-app-muted/10 w-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-app-primary" />
                 </div>

                <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 md:gap-4">
                    <button disabled={currentStepIndex === 0} onClick={() => setCurrentStepIndex(c => c - 1)} className="min-h-[44px] px-4 md:px-8 border border-app-border flex items-center gap-2 md:gap-3 text-app-muted hover:text-app-text hover:bg-app-muted/10 disabled:opacity-30 transition-all">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-semibold hidden sm:inline">Back</span>
                    </button>

                    <div className="flex flex-col items-center gap-2 min-w-0">
                         <span className="text-xs text-app-primary font-medium whitespace-nowrap">{progressPercent}% done</span>
                         {/* Dots only where there is room; the bar at the top carries it on phones. */}
                         <div className="hidden sm:flex gap-1.5 max-w-full overflow-hidden">
                            {steps.map((_, i) => (
                                <div key={i} className={cn("h-1.5 transition-all duration-500 shrink-0", i === currentStepIndex ? "w-12 bg-app-primary" : i < currentStepIndex ? "w-4 bg-app-success" : "w-4 bg-app-muted/20")} />
                            ))}
                         </div>
                    </div>

                    <button
                        disabled={!isCurrentStepTasksCompleted}
                        onClick={() => currentStepIndex === steps.length - 1 ? handleFinish() : setCurrentStepIndex(c => c + 1)}
                        className={cn(
                            "min-h-[44px] px-5 md:px-12 font-semibold text-sm flex items-center gap-2 md:gap-3 transition-all shadow-soft disabled:opacity-40",
                            currentStepIndex === steps.length - 1
                                ? "bg-app-success text-white"
                                : "bg-app-primary text-primary-foreground"
                        )}
                    >
                        <span>{currentStepIndex === steps.length - 1 ? "Finish" : "Next"}</span>
                        {isCurrentStepTasksCompleted ? <ChevronRight className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}