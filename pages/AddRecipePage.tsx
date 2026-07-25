import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Recipe, RecipeIngredient, RecipeStep, Nutrition } from '../types';
import {
    Save, Plus, Trash2, ArrowLeft, Image as ImageIcon,
    LayoutList, Clock, Utensils, HeartPulse, AlertCircle,
    Tag as TagIcon, X, Upload, Link as LinkIcon, Check,
    ChefHat, ListOrdered, Calculator, ShieldAlert, Settings2, Hash,
    Box, Link2, Crosshair, Shield, Activity, Scale, Wand2
} from 'lucide-react';
import { cn, normalizeUnit, isKnownUnit, unitLabel, formatMeasure, baseUnitRatio } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import IngredientRow from '../components/recipes/IngredientRow';

const categories = ["Main Course", "Appetizer", "Dessert", "Side Dish", "Breakfast", "Beverage"];
const cuisines = ["Italian", "Indian", "Chinese", "Bangladeshi", "American", "Mexican", "French", "Mediterranean", "Fusion"];
const commonAllergens = ["Dairy", "Eggs", "Nuts", "Peanuts", "Shellfish", "Wheat", "Soy", "Fish", "Sesame"];

type TabId = 'general' | 'ingredients' | 'steps' | 'specs';

/** Number inputs hand back '' and NaN; neither belongs in the saved recipe. */
const toNum = (raw: string, fallback = 0, min?: number) => {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return fallback;
    return min !== undefined ? Math.max(min, n) : n;
};

const round4 = (n: number) => parseFloat(n.toFixed(4));

export default function AddRecipePage() {
    const { recipeId } = useParams<{ recipeId: string }>();
    const navigate = useNavigate();
    const { addRecipe, updateRecipe, getRecipeById, ingredients: pantryIngredients } = useData();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [tagInput, setTagInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [activeStepLinker, setActiveStepLinker] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [scaleInput, setScaleInput] = useState('2');
    const [isDirty, setIsDirty] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [draggedItem, setDraggedItem] = useState<{ sIdx: number, iIdx: number } | null>(null);
    const [overSectionIdx, setOverSectionIdx] = useState<number | null>(null);

    const [formData, setFormData] = useState<Recipe>({
        id: '',
        name: '',
        category: 'Main Course',
        cuisine: 'Fusion',
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        difficulty: 'Medium',
        isFavorite: false,
        overheadPercentage: 10,
        profitMargin: 30,
        imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
        ingredientSections: [{ id: `sec_${Date.now()}`, name: 'Main Assets', ingredients: [] }],
        steps: [],
        createdAt: new Date(),
        tags: [],
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        allergens: []
    });

    useEffect(() => {
        if (recipeId) {
            const existing = getRecipeById(recipeId);
            if (existing) {
                setFormData({
                    ...existing,
                    nutrition: existing.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
                    allergens: existing.allergens || [],
                    tags: existing.tags || [],
                    steps: existing.steps.map(s => ({ ...s, linkedIngredientIds: s.linkedIngredientIds || [] }))
                });
            } else {
                navigate('/recipes/new'); 
            }
        }
        setLoading(false);
    }, [recipeId, getRecipeById, navigate]);

    // --- Unsaved-changes tracking ---
    const savedSnapshot = useRef<string | null>(null);
    useEffect(() => {
        if (loading) return;
        const snapshot = JSON.stringify(formData);
        if (savedSnapshot.current === null) savedSnapshot.current = snapshot;
        else setIsDirty(snapshot !== savedSnapshot.current);
    }, [formData, loading]);

    useEffect(() => {
        if (!isDirty) return;
        const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    const allIngredientsInRecipe = useMemo(() => {
        return formData.ingredientSections.flatMap(s => s.ingredients);
    }, [formData.ingredientSections]);

    // --- Validation ---
    const issues = useMemo(() => {
        const list: { tab: TabId; message: string }[] = [];

        if (!formData.name.trim()) list.push({ tab: 'general', message: 'Recipe needs a name.' });
        if (!formData.servings || formData.servings < 1) list.push({ tab: 'general', message: 'Servings must be at least 1.' });
        if (formData.prepTime < 0 || formData.cookTime < 0) list.push({ tab: 'general', message: 'Times cannot be negative.' });

        const all = allIngredientsInRecipe;
        if (all.length === 0) {
            list.push({ tab: 'ingredients', message: 'Add at least one ingredient.' });
        } else {
            const unnamed = all.filter(i => !i.name.trim()).length;
            if (unnamed) list.push({ tab: 'ingredients', message: `${unnamed} ingredient${unnamed > 1 ? 's have' : ' has'} no name.` });

            const badQty = all.filter(i => i.name.trim() && (!Number.isFinite(i.quantity) || i.quantity <= 0)).length;
            if (badQty) list.push({ tab: 'ingredients', message: `${badQty} ingredient${badQty > 1 ? 's need' : ' needs'} a quantity above zero.` });

            const badUnits = Array.from(new Set(all.filter(i => !isKnownUnit(i.unit)).map(i => i.unit).filter(Boolean)));
            if (badUnits.length) list.push({ tab: 'ingredients', message: `Unrecognized unit${badUnits.length > 1 ? 's' : ''}: ${badUnits.join(', ')}. Pick one from the unit list.` });

            const needsBridge = all.filter(i => {
                const pantryItem = pantryIngredients.find(p => p.id === i.ingredientId);
                return pantryItem && baseUnitRatio(i, pantryItem.baseUnit) === null;
            }).length;
            if (needsBridge) list.push({ tab: 'ingredients', message: `${needsBridge} linked ingredient${needsBridge > 1 ? 's need a' : ' needs a'} unit conversion before it can be costed.` });
        }

        const written = formData.steps.filter(s => s.instruction.trim());
        if (written.length === 0) list.push({ tab: 'steps', message: 'Add at least one method step.' });
        else if (written.length !== formData.steps.length) list.push({ tab: 'steps', message: `${formData.steps.length - written.length} empty step(s) — write or remove them.` });

        return list;
    }, [formData, allIngredientsInRecipe, pantryIngredients]);

    const issuesByTab = useMemo(() => {
        const map: Record<string, number> = {};
        issues.forEach(i => { map[i.tab] = (map[i.tab] || 0) + 1; });
        return map;
    }, [issues]);

    // Units written in a non-canonical spelling ("KG", "gm", "TBS", "Ea") that we can rewrite.
    const messyUnitCount = useMemo(
        () => allIngredientsInRecipe.filter(i => {
            const canonical = normalizeUnit(i.unit);
            return canonical !== null && canonical !== i.unit;
        }).length,
        [allIngredientsInRecipe]
    );

    const handleChange = useCallback((field: keyof Recipe, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleNutritionChange = useCallback((field: keyof Nutrition, value: number) => {
        setFormData(prev => ({
            ...prev,
            nutrition: { ...prev.nutrition!, [field]: value }
        }));
    }, []);

    const toggleAllergen = useCallback((allergen: string) => {
        setFormData(prev => {
            const current = prev.allergens || [];
            const next = current.includes(allergen) ? current.filter(a => a !== allergen) : [...current, allergen];
            return { ...prev, allergens: next };
        });
    }, []);

    const handleAddTag = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags?.includes(tagInput.trim())) {
                setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
            }
            setTagInput('');
        }
    }, [formData.tags, tagInput]);
    
    const removeTag = useCallback((tagToRemove: string) => {
         setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tagToRemove) }));
    }, []);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                setShowUrlInput(false);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const addSection = useCallback(() => {
        setFormData(prev => ({ ...prev, ingredientSections: [...prev.ingredientSections, { id: `sec_${Date.now()}`, name: 'New Section', ingredients: [] }] }));
    }, []);

    const addIngredientToSection = useCallback((sectionIndex: number) => {
        const newIng: RecipeIngredient = {
            id: `ri_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            ingredientId: '',
            name: '',
            quantity: 1,
            unit: 'g',
            type: 'Whole'
        };
        setFormData(prev => ({
            ...prev,
            ingredientSections: prev.ingredientSections.map((sec, i) =>
                i === sectionIndex ? { ...sec, ingredients: [...sec.ingredients, newIng] } : sec
            )
        }));
    }, []);

    // Immutable down to the ingredient object — IngredientRow is memoized and
    // will not re-render if we mutate the row in place.
    const updateIngredient = useCallback((sIdx: number, iIdx: number, field: keyof RecipeIngredient, value: any) => {
        setFormData(prev => ({
            ...prev,
            ingredientSections: prev.ingredientSections.map((sec, si) =>
                si !== sIdx ? sec : {
                    ...sec,
                    ingredients: sec.ingredients.map((ing, ii) =>
                        ii !== iIdx ? ing : { ...ing, [field]: value }
                    )
                }
            )
        }));
    }, []);

    const removeIngredient = useCallback((sIdx: number, iIdx: number) => {
        setFormData(prev => {
            const targetId = prev.ingredientSections[sIdx]?.ingredients[iIdx]?.id;
            return {
                ...prev,
                ingredientSections: prev.ingredientSections.map((sec, si) =>
                    si !== sIdx ? sec : { ...sec, ingredients: sec.ingredients.filter((_, ii) => ii !== iIdx) }
                ),
                steps: prev.steps.map(s => ({
                    ...s,
                    linkedIngredientIds: (s.linkedIngredientIds || []).filter(id => id !== targetId)
                }))
            };
        });
    }, []);

    const renameSection = useCallback((sIdx: number, name: string) => {
        setFormData(prev => ({
            ...prev,
            ingredientSections: prev.ingredientSections.map((sec, i) => i === sIdx ? { ...sec, name } : sec)
        }));
    }, []);

    /** Rewrite every unit to its canonical spelling — "KG" → kg, "TBS" → tbsp, "Ea" → pc. */
    const normalizeAllUnits = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            ingredientSections: prev.ingredientSections.map(sec => ({
                ...sec,
                ingredients: sec.ingredients.map(ing => {
                    const canonical = normalizeUnit(ing.unit);
                    return canonical && canonical !== ing.unit ? { ...ing, unit: canonical } : ing;
                })
            }))
        }));
    }, []);

    /** Multiply every quantity — keeps a recipe's ratios while changing the yield. */
    const scaleAllQuantities = useCallback((factor: number) => {
        if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return;
        setFormData(prev => ({
            ...prev,
            servings: round4(Math.max(1, (prev.servings || 1) * factor)),
            ingredientSections: prev.ingredientSections.map(sec => ({
                ...sec,
                ingredients: sec.ingredients.map(ing => ({
                    ...ing,
                    quantity: round4((ing.quantity || 0) * factor)
                }))
            }))
        }));
    }, []);

    const removeSection = useCallback((index: number) => {
        const section = formData.ingredientSections[index];
        if (!section || formData.ingredientSections.length <= 1) return;
        if (section.ingredients.length > 0 &&
            !window.confirm(`Remove "${section.name}" and its ${section.ingredients.length} ingredient(s)?`)) return;

        const removedIds = new Set(section.ingredients.map(i => i.id));
        setFormData(prev => ({
            ...prev,
            ingredientSections: prev.ingredientSections.filter((_, i) => i !== index),
            steps: prev.steps.map(s => ({
                ...s,
                linkedIngredientIds: (s.linkedIngredientIds || []).filter(id => !removedIds.has(id))
            }))
        }));
    }, [formData.ingredientSections]);

    const onDragStart = (e: React.DragEvent, sIdx: number, iIdx: number) => {
        setDraggedItem({ sIdx, iIdx });
        e.dataTransfer.effectAllowed = "move";
        const dragImg = new Image();
        dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(dragImg, 0, 0);
    };

    const onDragOver = (e: React.DragEvent, sIdx: number) => {
        e.preventDefault();
        if (overSectionIdx !== sIdx) setOverSectionIdx(sIdx);
    };

    const onDropToSection = (e: React.DragEvent, targetSIdx: number, targetIIdx?: number) => {
        e.preventDefault();
        setOverSectionIdx(null);
        if (draggedItem === null) return;
        const { sIdx: fromSIdx, iIdx: fromIIdx } = draggedItem;
        if (fromSIdx === targetSIdx && fromIIdx === targetIIdx) {
            setDraggedItem(null);
            return;
        }
        setFormData(prev => {
            const newSections = JSON.parse(JSON.stringify(prev.ingredientSections));
            const [movedItem] = newSections[fromSIdx].ingredients.splice(fromIIdx, 1);
            const insertIdx = targetIIdx !== undefined ? targetIIdx : newSections[targetSIdx].ingredients.length;
            newSections[targetSIdx].ingredients.splice(insertIdx, 0, movedItem);
            return { ...prev, ingredientSections: newSections };
        });
        setDraggedItem(null);
    };

    const addStep = useCallback(() => {
        const lastStepNum = formData.steps.length > 0 ? Math.max(...formData.steps.map(s => s.stepNumber)) : 0;
        const newStep: RecipeStep = { id: `step_${Date.now()}`, stepNumber: lastStepNum + 1, instruction: '', duration: 5, linkedIngredientIds: [] };
        setFormData(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
    }, [formData.steps]);

    const updateStep = useCallback((index: number, field: keyof RecipeStep, value: any) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map((s, i) => i === index ? { ...s, [field]: value } : s)
        }));
    }, []);

    const toggleIngredientLink = useCallback((stepIndex: number, ingredientId: string) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map((s, i) => {
                if (i !== stepIndex) return s;
                const links = s.linkedIngredientIds || [];
                return {
                    ...s,
                    linkedIngredientIds: links.includes(ingredientId)
                        ? links.filter(id => id !== ingredientId)
                        : [...links, ingredientId]
                };
            })
        }));
    }, []);

    const removeStep = useCallback((index: number) => {
        setFormData(prev => ({
            ...prev,
            // Renumber so the method never shows "1, 2, 4".
            steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }))
        }));
    }, []);

    const moveStep = useCallback((index: number, direction: -1 | 1) => {
        setFormData(prev => {
            const target = index + direction;
            if (target < 0 || target >= prev.steps.length) return prev;
            const steps = [...prev.steps];
            [steps[index], steps[target]] = [steps[target], steps[index]];
            return { ...prev, steps: steps.map((s, i) => ({ ...s, stepNumber: i + 1 })) };
        });
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (issues.length > 0) {
            setShowErrors(true);
            setActiveTab(issues[0].tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Save canonical units and clean numbers, whatever was typed into the form.
        const finalRecipe: Recipe = {
            ...formData,
            name: formData.name.trim(),
            prepTime: Math.max(0, formData.prepTime || 0),
            cookTime: Math.max(0, formData.cookTime || 0),
            servings: Math.max(1, formData.servings || 1),
            ingredientSections: formData.ingredientSections.map(sec => ({
                ...sec,
                name: sec.name.trim() || 'Section',
                ingredients: sec.ingredients.map(ing => ({
                    ...ing,
                    name: ing.name.trim(),
                    unit: normalizeUnit(ing.unit) ?? ing.unit,
                    quantity: Number.isFinite(ing.quantity) ? ing.quantity : 0
                }))
            })),
            steps: formData.steps.map((s, i) => ({ ...s, stepNumber: i + 1 }))
        };

        if (!recipeId) {
            finalRecipe.id = `rec_${Date.now()}`;
            finalRecipe.createdAt = new Date();
            addRecipe(finalRecipe);
        } else {
            updateRecipe(finalRecipe);
        }
        savedSnapshot.current = JSON.stringify(finalRecipe);
        setIsDirty(false);
        navigate(`/recipes/${finalRecipe.id}`);
    }, [formData, issues, recipeId, addRecipe, updateRecipe, navigate]);

    const handleBack = useCallback(() => {
        if (isDirty && !window.confirm('Discard unsaved changes to this recipe?')) return;
        navigate(-1);
    }, [isDirty, navigate]);

    if (loading) return null;

    return (
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-2.5 md:space-y-3 pb-nav md:pb-10 px-1 md:px-0 font-sans">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-2.5 border-b border-app-border pb-4 md:pb-3">
                <div className="flex items-center gap-3 md:gap-2.5">
                    <button aria-label="Go back" type="button" onClick={handleBack} className="h-11 w-11 shrink-0 flex items-center justify-center bg-app-card border border-app-border text-app-muted hover:text-app-primary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                             <ChefHat className="h-4 w-4 text-app-primary" />
                             <span className="text-xs font-medium text-app-muted">{recipeId ? 'Edit Recipe' : 'New Recipe'}</span>
                             {isDirty && <span className="text-xs font-medium text-app-warning">• unsaved</span>}
                        </div>
                        <input
                            required
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            className="bg-transparent text-2xl md:text-xl font-bold tracking-tight text-app-text outline-none w-full placeholder:text-app-muted"
                            placeholder="Recipe name…"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="bg-app-primary text-primary-foreground min-h-[44px] px-8 rounded-md font-semibold text-sm shadow-soft hover:brightness-105 active:scale-[0.97] transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                >
                    <Save className="h-4 w-4" /> Save Recipe
                    {issues.length > 0 && (
                        <span className="ml-1 h-5 min-w-[20px] px-1 rounded-full bg-white/25 text-[11px] font-bold flex items-center justify-center tabular-nums">{issues.length}</span>
                    )}
                </button>
            </div>

            {/* Validation summary */}
            <AnimatePresence>
                {showErrors && issues.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-app-danger/10 border border-app-danger/30 rounded-lg p-2.5 flex gap-3"
                    >
                        <AlertCircle className="h-5 w-5 text-app-danger shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                            <p className="text-sm font-semibold text-app-text">Fix {issues.length} item{issues.length > 1 ? 's' : ''} before saving</p>
                            <ul className="space-y-1">
                                {issues.map((issue, i) => (
                                    <li key={i}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab(issue.tab)}
                                            className="text-sm text-app-muted hover:text-app-danger text-left transition-colors"
                                        >
                                            • {issue.message}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button type="button" aria-label="Dismiss" onClick={() => setShowErrors(false)} className="text-app-muted hover:text-app-text h-fit">
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spec Tabs */}
            <div className="flex border border-app-border bg-app-card overflow-x-auto scrollbar-hide shadow-soft sticky top-14 md:top-20 z-30">
                {[
                    { id: 'general', label: 'Details', icon: ChefHat },
                    { id: 'ingredients', label: 'Ingredients', icon: ListOrdered },
                    { id: 'steps', label: 'Method', icon: Utensils },
                    { id: 'specs', label: 'Nutrition & Cost', icon: Settings2 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex-1 min-w-[86px] md:min-w-[110px] py-3 px-3 md:px-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap transition-all relative focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60",
                            activeTab === tab.id
                                ? "text-primary-foreground"
                                : "text-app-muted hover:text-app-text"
                        )}
                    >
                        {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute inset-0 bg-app-primary -z-10" />}
                        <tab.icon className="h-4 w-4 shrink-0" /> {tab.label}
                        {showErrors && issuesByTab[tab.id] > 0 && (
                            <span className={cn(
                                "h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums",
                                activeTab === tab.id ? "bg-white/25" : "bg-app-danger/15 text-app-danger"
                            )}>
                                {issuesByTab[tab.id]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'general' && (
                        <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                            <div className="lg:col-span-8 bg-app-card border border-app-border p-3 md:p-2.5 rounded-lg relative overflow-hidden group shadow-soft">
                                <div className="space-y-2.5 relative z-10">
                                    <div className="relative aspect-video w-full bg-app-elevated overflow-hidden group/img border border-app-border">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        {/* Touch devices have no hover — keep the controls visible below md. */}
                                        <div className="absolute inset-x-0 bottom-0 md:inset-0 bg-black/45 flex flex-col items-center justify-center opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity gap-2 md:gap-2.5 p-2 md:p-2.5">
                                            <div className="flex gap-2 md:gap-2.5 w-full md:w-auto">
                                                <button type="button" onClick={() => imageInputRef.current?.click()} className="flex-1 md:flex-none justify-center bg-app-primary text-primary-foreground px-3 md:px-3 min-h-[40px] md:min-h-[44px] font-semibold text-sm flex items-center gap-2 shadow-soft hover:brightness-105 transition-all">
                                                    <Upload className="h-4 w-4" /> Upload
                                                </button>
                                                <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} className="flex-1 md:flex-none justify-center bg-app-elevated text-app-text px-3 md:px-3 min-h-[40px] md:min-h-[44px] font-semibold text-sm flex items-center gap-2 border border-app-border hover:bg-app-muted/10 transition-all">
                                                    <LinkIcon className="h-4 w-4" /> Link URL
                                                </button>
                                            </div>
                                            {showUrlInput && (
                                                <input
                                                    type="text"
                                                    value={formData.imageUrl}
                                                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                                                    className="w-full max-w-md h-11 md:h-12 px-4 text-sm bg-app-elevated border border-app-primary text-app-text outline-none font-medium"
                                                    placeholder="Paste image URL…"
                                                    autoFocus
                                                />
                                            )}
                                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <TagIcon className="h-4 w-4 text-app-primary" />
                                            <span className="text-sm font-semibold text-app-text">Tags</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.tags?.map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/30 rounded-md text-xs font-medium flex items-center gap-2">
                                                    {tag} <button aria-label={`Remove ${tag}`} type="button" onClick={() => removeTag(tag)} className="hover:text-app-danger"><X className="h-3 w-3"/></button>
                                                </span>
                                            ))}
                                            <input
                                                value={tagInput}
                                                onChange={e => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                                className="h-8 bg-transparent border-b border-app-border text-sm text-app-text outline-none px-2 min-w-[150px] placeholder:text-app-muted"
                                                placeholder="Add tag + Enter"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-4 bg-app-card border border-app-border p-3 md:p-2.5 rounded-lg h-fit space-y-2.5 shadow-soft">
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-app-muted">Category</label>
                                        <select value={formData.category} onChange={e => handleChange('category', e.target.value)} className="w-full h-12 px-4 rounded-md bg-app-elevated border border-app-border text-sm font-medium text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 appearance-none cursor-pointer">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-app-muted">Cuisine</label>
                                        <select value={formData.cuisine} onChange={e => handleChange('cuisine', e.target.value)} className="w-full h-12 px-4 rounded-md bg-app-elevated border border-app-border text-sm font-medium text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 appearance-none cursor-pointer">
                                            {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2.5 border-t border-app-border pt-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-app-muted text-center block">Prep (min)</label>
                                            <input type="number" min="0" value={formData.prepTime} onChange={e => handleChange('prepTime', toNum(e.target.value, 0, 0))} className="w-full h-11 px-2 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-center text-app-primary tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-app-muted text-center block">Cook (min)</label>
                                            <input type="number" min="0" value={formData.cookTime} onChange={e => handleChange('cookTime', toNum(e.target.value, 0, 0))} className="w-full h-11 px-2 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-center text-app-primary tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-app-muted text-center block">Servings</label>
                                            <input type="number" min="1" step="any" value={formData.servings} onChange={e => handleChange('servings', toNum(e.target.value, 1, 0))} className="w-full h-11 px-2 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-center text-app-success tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-app-muted text-center">
                                        Total time {formData.prepTime + formData.cookTime} min · {formData.servings > 0 ? `${Math.round((formData.prepTime + formData.cookTime) / formData.servings)} min per serving` : '—'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ingredients' && (
                        <motion.div key="ingredients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                             <div className="flex items-center gap-2.5 mb-2 px-2">
                                <h3 className="font-semibold text-base tracking-tight text-app-text">Ingredients</h3>
                                <span className="text-xs font-medium text-app-muted tabular-nums">{allIngredientsInRecipe.length} total</span>
                                <div className="h-px flex-1 bg-app-border"></div>
                                <button type="button" onClick={addSection} className="text-sm font-semibold text-app-primary bg-app-primary/10 px-4 min-h-[40px] rounded-md border border-app-primary/30 flex items-center gap-2 hover:bg-app-primary hover:text-primary-foreground transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                                    <Plus className="h-4 w-4" /> Add Section
                                </button>
                            </div>

                            {/* Measurement tools */}
                            <div className="bg-app-card border border-app-border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-3 shadow-soft">
                                <div className="flex items-center gap-2 text-sm font-medium text-app-muted md:pr-3 md:border-r md:border-app-border">
                                    <Scale className="h-4 w-4 text-app-primary" /> Measurements
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-app-muted">Scale every quantity</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        aria-label="Scale factor"
                                        value={scaleInput}
                                        onChange={e => setScaleInput(e.target.value)}
                                        className="w-20 h-9 px-2 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-center text-app-text tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => scaleAllQuantities(parseFloat(scaleInput))}
                                        disabled={!(parseFloat(scaleInput) > 0) || parseFloat(scaleInput) === 1}
                                        className="h-9 px-3 rounded-md bg-app-primary/10 border border-app-primary/30 text-sm font-semibold text-app-primary hover:bg-app-primary hover:text-primary-foreground transition-all disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                                    >
                                        ×{parseFloat(scaleInput) > 0 ? scaleInput : '—'}
                                    </button>
                                    <span className="text-xs text-app-muted hidden lg:inline">
                                        → {parseFloat(scaleInput) > 0 ? round4(formData.servings * parseFloat(scaleInput)) : formData.servings} servings
                                    </span>
                                </div>

                                <div className="md:ml-auto flex items-center gap-2">
                                    {messyUnitCount > 0 ? (
                                        <button
                                            type="button"
                                            onClick={normalizeAllUnits}
                                            className="h-9 px-3 rounded-md bg-app-warning/10 border border-app-warning/30 text-sm font-semibold text-app-warning hover:bg-app-warning hover:text-white transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-warning/60"
                                        >
                                            <Wand2 className="h-4 w-4" /> Fix {messyUnitCount} unit{messyUnitCount > 1 ? 's' : ''}
                                        </button>
                                    ) : (
                                        <span className="text-xs font-medium text-app-success flex items-center gap-1.5">
                                            <Check className="h-3.5 w-3.5" /> Units are consistent
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                {formData.ingredientSections.map((section, sIdx) => (
                                    <div key={section.id} onDragOver={(e) => onDragOver(e, sIdx)} onDrop={(e) => onDropToSection(e, sIdx)} className={cn("bg-app-card border rounded-lg transition-all relative overflow-hidden shadow-soft", overSectionIdx === sIdx ? "border-app-primary bg-app-primary/5" : "border-app-border")}>
                                        <div className="bg-app-elevated/50 px-3 md:px-3 py-3 md:py-2.5 border-b border-app-border flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-wrap">
                                                <span className="text-sm font-semibold text-app-primary tabular-nums">Section {(sIdx + 1).toString().padStart(2, '0')}</span>
                                                <input
                                                    value={section.name}
                                                    onChange={(e) => renameSection(sIdx, e.target.value)}
                                                    className="bg-transparent font-semibold text-sm tracking-tight text-app-text outline-none border-b border-transparent focus:border-app-primary/30 w-full sm:w-auto sm:min-w-[200px]"
                                                    placeholder="Section name…"
                                                />
                                                <span className="text-xs text-app-muted tabular-nums">{section.ingredients.length} items</span>
                                            </div>
                                            <button
                                                aria-label="Remove section"
                                                type="button"
                                                onClick={() => removeSection(sIdx)}
                                                disabled={formData.ingredientSections.length <= 1}
                                                title={formData.ingredientSections.length <= 1 ? 'A recipe needs at least one section' : 'Remove section'}
                                                className="text-app-muted hover:text-app-danger p-2 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                            ><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                        <div className="p-2 md:p-2.5 space-y-2 md:space-y-3">
                                            {section.ingredients.map((ing, iIdx) => (
                                                <IngredientRow
                                                    key={ing.id}
                                                    ingredient={ing}
                                                    pantryIngredients={pantryIngredients}
                                                    onUpdate={(field, val) => updateIngredient(sIdx, iIdx, field, val)}
                                                    onRemove={() => removeIngredient(sIdx, iIdx)}
                                                    onDragStart={(e) => onDragStart(e, sIdx, iIdx)}
                                                    onDragOver={(e) => onDragOver(e, sIdx)}
                                                    onDrop={(e) => onDropToSection(e, sIdx, iIdx)}
                                                    isDragging={draggedItem?.sIdx === sIdx && draggedItem?.iIdx === iIdx}
                                                />
                                            ))}
                                            <button type="button" onClick={() => addIngredientToSection(sIdx)} className="w-full py-2.5 border border-dashed border-app-border hover:border-app-primary/40 hover:bg-app-primary/5 rounded-md text-sm font-semibold text-app-muted hover:text-app-primary transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                                                <Plus className="h-4 w-4" /> Add Ingredient
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'steps' && (
                        <motion.div key="steps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2.5">
                             <div className="flex items-center gap-2.5 mb-2 px-2">
                                <h3 className="font-semibold text-base tracking-tight text-app-text">Method</h3>
                                <span className="text-xs font-medium text-app-muted tabular-nums">
                                    {formData.steps.length} step{formData.steps.length === 1 ? '' : 's'} · {formData.steps.reduce((t, s) => t + (s.duration || 0), 0)} min
                                </span>
                                <div className="h-px flex-1 bg-app-border"></div>
                            </div>
                            <div className="bg-app-card border border-app-border p-3 md:p-2.5 rounded-lg space-y-3 shadow-soft">
                                <AnimatePresence>
                                    {formData.steps.map((step, idx) => (
                                        <motion.div key={step.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-2.5 relative pb-8 group border-b border-app-border last:border-0 mb-8 last:mb-0">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 rounded-full bg-app-elevated border border-app-primary/30 flex items-center justify-center shadow-soft relative group/step">
                                                    <span className="text-sm font-semibold text-app-primary tabular-nums">{step.stepNumber}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <button type="button" aria-label="Move step up" disabled={idx === 0} onClick={() => moveStep(idx, -1)} className="h-5 w-6 flex items-center justify-center text-app-muted hover:text-app-primary disabled:opacity-20 disabled:pointer-events-none text-xs">▲</button>
                                                    <button type="button" aria-label="Move step down" disabled={idx === formData.steps.length - 1} onClick={() => moveStep(idx, 1)} className="h-5 w-6 flex items-center justify-center text-app-muted hover:text-app-primary disabled:opacity-20 disabled:pointer-events-none text-xs">▼</button>
                                                </div>
                                                <div className="w-px h-full bg-app-border group-last:hidden"></div>
                                            </div>
                                            <div className="flex-1 space-y-2.5">
                                                <textarea
                                                    value={step.instruction}
                                                    onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                                                    placeholder="Describe this step…"
                                                    className="w-full p-2.5 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm font-medium text-app-text min-h-[80px]"
                                                />

                                                <div className="bg-app-elevated/50 p-2.5 rounded-md border border-app-border">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Box className="h-4 w-4 text-app-muted" />
                                                            <span className="text-sm font-medium text-app-muted">Ingredients used</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveStepLinker(activeStepLinker === step.id ? null : step.id)}
                                                            className={cn("text-xs font-semibold px-3 py-1.5 rounded-md transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60", activeStepLinker === step.id ? "bg-app-primary text-primary-foreground border-app-primary" : "text-app-primary bg-app-primary/5 border-app-primary/30 hover:bg-app-primary/10")}
                                                        >
                                                            {activeStepLinker === step.id ? "Done" : "Link ingredients"}
                                                        </button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {activeStepLinker === step.id && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-4 border-t border-app-border mt-4 max-h-48 overflow-y-auto">
                                                                    {allIngredientsInRecipe.map(ing => (
                                                                        <button key={ing.id} type="button" onClick={() => toggleIngredientLink(idx, ing.id)} className={cn("flex items-center gap-3 p-2 rounded-md text-xs font-medium border transition-all truncate", step.linkedIngredientIds?.includes(ing.id) ? "bg-app-primary text-primary-foreground border-app-primary" : "bg-app-elevated text-app-muted border-app-border hover:border-app-primary/30")}>
                                                                            <div className={cn("h-4 w-4 rounded flex items-center justify-center border", step.linkedIngredientIds?.includes(ing.id) ? "bg-white border-white text-app-primary" : "bg-app-muted/10 border-app-border")}>
                                                                                {step.linkedIngredientIds?.includes(ing.id) && <Check className="h-3 w-3" strokeWidth={3} />}
                                                                            </div>
                                                                            <span className="truncate">{ing.name || 'Unnamed'}</span>
                                                                            <span className={cn("ml-auto text-[10px] tabular-nums shrink-0", step.linkedIngredientIds?.includes(ing.id) ? "text-primary-foreground/70" : "text-app-muted")}>
                                                                                {formatMeasure(ing.quantity || 0, ing.unit)}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                    {!activeStepLinker && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {(step.linkedIngredientIds || []).map(id => {
                                                                const ing = allIngredientsInRecipe.find(i => i.id === id);
                                                                if (!ing) return null;
                                                                return <span key={id} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-app-primary/10 text-app-primary text-xs font-medium border border-app-primary/20"><Box className="h-3 w-3" /> {ing.name} <span className="text-app-muted tabular-nums">{formatMeasure(ing.quantity || 0, ing.unit)}</span></span>;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-3 bg-app-elevated px-4 py-2 rounded-md border border-app-border">
                                                        <Clock className="h-4 w-4 text-app-muted" />
                                                        <input type="number" min="0" aria-label="Step duration in minutes" value={step.duration ?? ''} onChange={(e) => updateStep(idx, 'duration', toNum(e.target.value, 0, 0))} className="w-12 bg-transparent text-sm font-semibold text-center outline-none tabular-nums text-app-primary" placeholder="0" />
                                                        <span className="text-xs text-app-muted font-medium">min</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeStep(idx)} className="text-app-muted hover:text-app-danger text-sm font-semibold flex items-center gap-2 transition-colors">
                                                        <Trash2 className="h-4 w-4" /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button type="button" onClick={addStep} className="w-full py-3 border-2 border-dashed border-app-border hover:border-app-primary/40 hover:bg-app-primary/5 rounded-md text-sm font-semibold text-app-muted hover:text-app-primary transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                                    <Plus className="h-5 w-5" /> Add Step
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'specs' && (
                        <motion.div key="specs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div className="bg-app-card border border-app-border p-3 md:p-2.5 rounded-lg space-y-2.5 relative overflow-hidden shadow-soft">
                                <h3 className="text-base font-semibold text-app-text tracking-tight flex items-center gap-3">
                                    <HeartPulse className="h-5 w-5 text-app-danger" /> Nutrition
                                </h3>
                                <div className="grid grid-cols-2 gap-2.5 relative z-10">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-xs font-medium text-app-muted">Total Calories (kcal)</label>
                                        <input type="number" min="0" value={formData.nutrition?.calories ?? 0} onChange={e => handleNutritionChange('calories', toNum(e.target.value, 0, 0))} className="w-full h-12 px-4 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-app-primary outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                    </div>
                                    {['protein', 'carbs', 'fat'].map(mac => (
                                        <div key={mac} className="space-y-2">
                                            <label className="text-xs font-medium text-app-muted capitalize">{mac} (g)</label>
                                            <input type="number" step="0.1" min="0" value={(formData.nutrition as any)?.[mac] ?? 0} onChange={e => handleNutritionChange(mac as any, toNum(e.target.value, 0, 0))} className="w-full h-11 px-4 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-app-text outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-app-border">
                                    <label className="text-sm font-semibold text-app-text mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-app-danger"/> Allergens</label>
                                    <div className="flex flex-wrap gap-2">
                                        {commonAllergens.map(a => (
                                            <button key={a} type="button" onClick={() => toggleAllergen(a)} className={cn("px-4 py-2 text-xs font-medium rounded-md border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60", formData.allergens?.includes(a) ? "bg-app-danger text-white border-app-danger" : "bg-app-elevated text-app-muted border-app-border hover:border-app-muted")}>
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-app-card border border-app-border p-3 md:p-2.5 rounded-lg space-y-2.5 relative overflow-hidden shadow-soft">
                                <h3 className="text-base font-semibold text-app-text tracking-tight flex items-center gap-3">
                                    <Calculator className="h-5 w-5 text-app-success" /> Pricing
                                </h3>
                                <div className="space-y-10 relative z-10">
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-app-muted">Overhead</label>
                                            <span className="text-sm font-semibold text-app-primary">{formData.overheadPercentage}%</span>
                                        </div>
                                        <input type="range" aria-label="Overhead percentage" min="0" max="100" value={formData.overheadPercentage} onChange={e => handleChange('overheadPercentage', parseInt(e.target.value))} className="w-full accent-app-primary bg-app-elevated" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-app-muted">Profit Margin</label>
                                            <span className="text-sm font-semibold text-app-success">{formData.profitMargin}%</span>
                                        </div>
                                        <input type="range" aria-label="Profit margin percentage" min="0" max="200" value={formData.profitMargin} onChange={e => handleChange('profitMargin', parseInt(e.target.value))} className="w-full accent-app-success bg-app-elevated" />
                                    </div>
                                    <div className="p-2.5 md:p-3 bg-app-elevated border border-app-border flex items-center justify-between gap-3 flex-wrap">
                                        <span className="text-sm font-medium text-app-muted">Difficulty</span>
                                        <div className="flex gap-2">
                                            {(['Easy', 'Medium', 'Hard'] as const).map(lvl => (
                                                <button key={lvl} type="button" onClick={() => handleChange('difficulty', lvl)} className={cn("px-3 py-2 rounded-md text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60", formData.difficulty === lvl ? "bg-app-primary text-primary-foreground border-app-primary" : "bg-app-card text-app-muted border border-app-border hover:border-app-muted")}>
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </form>
    );
}