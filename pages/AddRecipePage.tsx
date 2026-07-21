import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Recipe, RecipeIngredient, RecipeStep, Nutrition } from '../types';
import { 
    Save, Plus, Trash2, ArrowLeft, Image as ImageIcon, 
    LayoutList, Clock, Utensils, HeartPulse, AlertCircle, 
    Tag as TagIcon, X, Upload, Link as LinkIcon, Check,
    ChefHat, ListOrdered, Calculator, ShieldAlert, Settings2, Hash,
    Box, Link2, Crosshair, Shield, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import IngredientRow from '../components/recipes/IngredientRow';

const categories = ["Main Course", "Appetizer", "Dessert", "Side Dish", "Breakfast", "Beverage"];
const cuisines = ["Italian", "Indian", "Chinese", "Bangladeshi", "American", "Mexican", "French", "Mediterranean", "Fusion"];
const commonAllergens = ["Dairy", "Eggs", "Nuts", "Peanuts", "Shellfish", "Wheat", "Soy", "Fish", "Sesame"];

export default function AddRecipePage() {
    const { recipeId } = useParams<{ recipeId: string }>();
    const navigate = useNavigate();
    const { addRecipe, updateRecipe, getRecipeById, ingredients: pantryIngredients } = useData();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'ingredients' | 'steps' | 'specs'>('general');
    const [tagInput, setTagInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [activeStepLinker, setActiveStepLinker] = useState<string | null>(null);
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

    const allIngredientsInRecipe = useMemo(() => {
        return formData.ingredientSections.flatMap(s => s.ingredients);
    }, [formData.ingredientSections]);

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
            id: `ri_${Date.now()}_${Math.random().toString(36).substr(2,5)}`, 
            ingredientId: '', 
            name: '', 
            quantity: 1, 
            unit: 'g',
            type: 'Whole' 
        };
        setFormData(prev => {
            const newSections = [...prev.ingredientSections];
            newSections[sectionIndex].ingredients.push(newIng);
            return { ...prev, ingredientSections: newSections };
        });
    }, []);

    const updateIngredient = useCallback((sIdx: number, iIdx: number, field: keyof RecipeIngredient, value: any) => {
        setFormData(prev => {
            const newSections = [...prev.ingredientSections];
            (newSections[sIdx].ingredients[iIdx] as any)[field] = value;
            return { ...prev, ingredientSections: newSections };
        });
    }, []);

    const removeIngredient = useCallback((sIdx: number, iIdx: number) => {
        const targetId = formData.ingredientSections[sIdx].ingredients[iIdx].id;
        setFormData(prev => {
            const newSections = [...prev.ingredientSections];
            newSections[sIdx].ingredients.splice(iIdx, 1);
            const newSteps = prev.steps.map(s => ({
                ...s,
                linkedIngredientIds: (s.linkedIngredientIds || []).filter(id => id !== targetId)
            }));
            return { ...prev, ingredientSections: newSections, steps: newSteps };
        });
    }, [formData.ingredientSections]);

    const removeSection = useCallback((index: number) => {
        setFormData(prev => {
            if (prev.ingredientSections.length <= 1) return prev;
            const newSections = [...prev.ingredientSections];
            newSections.splice(index, 1);
            return { ...prev, ingredientSections: newSections };
        });
    }, []);

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
        setFormData(prev => {
            const newSteps = [...prev.steps];
            (newSteps[index] as any)[field] = value;
            return { ...prev, steps: newSteps };
        });
    }, []);

    const toggleIngredientLink = useCallback((stepIndex: number, ingredientId: string) => {
        setFormData(prev => {
            const newSteps = [...prev.steps];
            const currentLinks = newSteps[stepIndex].linkedIngredientIds || [];
            newSteps[stepIndex].linkedIngredientIds = currentLinks.includes(ingredientId) ? currentLinks.filter(id => id !== ingredientId) : [...currentLinks, ingredientId];
            return { ...prev, steps: newSteps };
        });
    }, []);

    const removeStep = useCallback((index: number) => {
        setFormData(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const finalRecipe = { ...formData };
        if (!recipeId) {
            finalRecipe.id = `rec_${Date.now()}`;
            finalRecipe.createdAt = new Date();
            addRecipe(finalRecipe);
        } else {
            updateRecipe(finalRecipe);
        }
        navigate(`/recipes/${finalRecipe.id}`);
    }, [formData, recipeId, addRecipe, updateRecipe, navigate]);

    if (loading) return null;

    return (
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-24 px-4 md:px-0 font-sans">
            {/* Mission Specification Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-app-border pb-6">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center bg-app-card border border-app-border rounded-sm text-app-muted hover:text-app-primary transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                             <Crosshair className="h-5 w-5 text-app-primary" />
                             <span className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em]">Recipe Module {recipeId ? 'UPDATE' : 'INITIALIZATION'}</span>
                        </div>
                        <input 
                            required
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            className="bg-transparent text-3xl font-black tracking-tighter uppercase text-app-text outline-none w-full placeholder:text-white/5"
                            placeholder="NAME_SPECIFICATION..."
                        />
                    </div>
                </div>
                <button 
                    type="submit" 
                    className="bg-app-primary text-white h-12 px-10 rounded-sm font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                >
                    <Save className="h-4 w-4" /> Commit Module
                </button>
            </div>

            {/* Tactical Spec Tabs */}
            <div className="flex border border-app-border bg-app-card rounded-sm overflow-hidden shadow-xl sticky top-14 md:top-20 z-30">
                {[
                    { id: 'general', label: 'Primary Config', icon: ChefHat },
                    { id: 'ingredients', label: 'Prep Map', icon: ListOrdered },
                    { id: 'steps', label: 'Method Sequence', icon: Utensils },
                    { id: 'specs', label: 'Telemetry', icon: Settings2 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex-1 py-4 px-6 text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all relative border-r border-app-border last:border-r-0",
                            activeTab === tab.id 
                                ? "bg-white/5 text-app-primary" 
                                : "text-app-muted hover:text-app-text hover:bg-white/[0.02]"
                        )}
                    >
                        {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-app-primary" />}
                        <tab.icon className="h-4 w-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'general' && (
                        <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-8 bg-app-card border border-app-border p-8 rounded-sm relative overflow-hidden group">
                                <Shield className="absolute -bottom-8 -right-8 h-48 w-48 text-white/[0.02]" />
                                <div className="space-y-8 relative z-10">
                                    <div className="relative aspect-video w-full rounded-sm bg-app-bg overflow-hidden group/img border border-white/5 shadow-inner">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover opacity-60" />
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity gap-4 p-8">
                                            <div className="flex gap-4">
                                                <button type="button" onClick={() => imageInputRef.current?.click()} className="bg-white text-black px-6 py-2.5 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                                    <Upload className="h-4 w-4" /> Manual Upload
                                                </button>
                                                <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} className="bg-app-card text-white px-6 py-2.5 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-white/20">
                                                    <LinkIcon className="h-4 w-4" /> Link URL
                                                </button>
                                            </div>
                                            {showUrlInput && (
                                                <input 
                                                    type="text"
                                                    value={formData.imageUrl}
                                                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                                                    className="w-full max-w-md h-12 rounded-sm px-4 text-xs bg-app-bg border border-app-primary text-white outline-none font-bold"
                                                    placeholder="PASTE SOURCE URL..."
                                                    autoFocus
                                                />
                                            )}
                                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <TagIcon className="h-4 w-4 text-app-primary" />
                                            <span className="text-[10px] font-black uppercase text-app-muted tracking-widest">Metadata Tags</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.tags?.map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-app-primary/10 text-app-primary border border-app-primary/30 rounded-sm text-[9px] font-black uppercase tracking-wider flex items-center gap-2">
                                                    {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:text-white"><X className="h-3 w-3"/></button>
                                                </span>
                                            ))}
                                            <input 
                                                value={tagInput}
                                                onChange={e => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                                className="h-7 bg-transparent border-b border-app-border text-[10px] font-bold uppercase tracking-widest outline-none px-2 min-w-[150px] placeholder:text-app-muted/30"
                                                placeholder="ADD TAG + ENTER"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-4 bg-app-card border border-app-border p-8 rounded-sm h-fit space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em]">Module Sector</label>
                                        <select value={formData.category} onChange={e => handleChange('category', e.target.value)} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border text-xs font-black uppercase tracking-widest focus:ring-1 focus:ring-app-primary appearance-none cursor-pointer">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em]">Culinary Origin</label>
                                        <select value={formData.cuisine} onChange={e => handleChange('cuisine', e.target.value)} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border text-xs font-black uppercase tracking-widest focus:ring-1 focus:ring-app-primary appearance-none cursor-pointer">
                                            {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-app-muted uppercase tracking-widest text-center block">Prep (M)</label>
                                            <input type="number" value={formData.prepTime} onChange={e => handleChange('prepTime', parseInt(e.target.value))} className="w-full h-11 px-2 rounded-sm bg-app-bg border border-app-border text-xs font-black text-center text-app-primary tabular-nums outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-app-muted uppercase tracking-widest text-center block">Cook (M)</label>
                                            <input type="number" value={formData.cookTime} onChange={e => handleChange('cookTime', parseInt(e.target.value))} className="w-full h-11 px-2 rounded-sm bg-app-bg border border-app-border text-xs font-black text-center text-app-primary tabular-nums outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-app-muted uppercase tracking-widest text-center block">Yield</label>
                                            <input type="number" min="1" value={formData.servings} onChange={e => handleChange('servings', parseInt(e.target.value))} className="w-full h-11 px-2 rounded-sm bg-app-bg border border-app-border text-xs font-black text-center text-app-success tabular-nums outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ingredients' && (
                        <motion.div key="ingredients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                             <div className="flex items-center gap-4 mb-4 px-2">
                                <h3 className="font-black text-xs uppercase tracking-[0.4em] text-app-muted">Asset Allocation Matrix</h3>
                                <div className="h-px flex-1 bg-app-border"></div>
                                <button type="button" onClick={addSection} className="text-[10px] font-black text-app-primary uppercase tracking-widest bg-white/5 px-4 py-2 rounded-sm border border-app-primary/30 flex items-center gap-2 hover:bg-app-primary hover:text-white transition-all">
                                    <Plus className="h-3.5 w-3.5" /> Initialize Phase
                                </button>
                            </div>
                            <div className="space-y-8">
                                {formData.ingredientSections.map((section, sIdx) => (
                                    <div key={section.id} onDragOver={(e) => onDragOver(e, sIdx)} onDrop={(e) => onDropToSection(e, sIdx)} className={cn("bg-app-card border rounded-sm transition-all relative overflow-hidden", overSectionIdx === sIdx ? "border-app-primary bg-app-primary/5" : "border-app-border shadow-md")}>
                                        <div className="bg-white/[0.02] px-6 py-4 border-b border-app-border flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-app-primary uppercase tracking-[0.2em]">Phase {(sIdx + 1).toString().padStart(2, '0')}</span>
                                                <input 
                                                    value={section.name} 
                                                    onChange={(e) => {
                                                        const newSections = [...formData.ingredientSections];
                                                        newSections[sIdx].name = e.target.value;
                                                        handleChange('ingredientSections', newSections);
                                                    }}
                                                    className="bg-transparent font-black text-sm uppercase tracking-tight outline-none border-b border-transparent focus:border-app-primary/30 min-w-[200px]"
                                                    placeholder="SECTION_LABEL..."
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeSection(sIdx)} className="text-app-muted hover:text-red-500 p-2 transition-all"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                        <div className="p-6 space-y-3">
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
                                            <button type="button" onClick={() => addIngredientToSection(sIdx)} className="w-full py-4 border border-dashed border-app-border hover:border-app-primary/40 hover:bg-app-primary/5 rounded-sm text-[10px] font-black uppercase tracking-widest text-app-muted hover:text-app-primary transition-all flex items-center justify-center gap-3">
                                                <Plus className="h-4 w-4" /> Append Asset
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'steps' && (
                        <motion.div key="steps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                             <div className="flex items-center gap-4 mb-4 px-2">
                                <h3 className="font-black text-xs uppercase tracking-[0.4em] text-app-muted">Deployment Sequence</h3>
                                <div className="h-px flex-1 bg-app-border"></div>
                            </div>
                            <div className="bg-app-card border border-app-border p-8 rounded-sm space-y-6">
                                <AnimatePresence>
                                    {formData.steps.map((step, idx) => (
                                        <motion.div key={step.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-6 relative pb-8 group border-b border-white/5 last:border-0 mb-8 last:mb-0">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 rounded-sm bg-app-bg border border-app-primary/30 flex items-center justify-center shadow-lg relative group/step">
                                                    <span className="text-[10px] font-black text-app-primary tabular-nums">{step.stepNumber}</span>
                                                    <div className="absolute inset-0 bg-app-primary opacity-0 group-hover/step:opacity-5 transition-opacity" />
                                                </div>
                                                <div className="w-px h-full bg-app-border/40 group-last:hidden"></div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <textarea 
                                                    value={step.instruction}
                                                    onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                                                    placeholder="SPECIFY DIRECTIVE..."
                                                    className="w-full p-4 rounded-sm bg-app-bg border border-app-border focus:ring-1 focus:ring-app-primary text-sm font-medium min-h-[80px] outline-none"
                                                />
                                                
                                                <div className="bg-app-bg/50 p-4 rounded-sm border border-app-border">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <Box className="h-4 w-4 text-app-muted" />
                                                            <span className="text-[10px] font-black text-app-muted uppercase tracking-widest">Required Components</span>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setActiveStepLinker(activeStepLinker === step.id ? null : step.id)}
                                                            className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-sm transition-all border", activeStepLinker === step.id ? "bg-app-primary text-white border-app-primary" : "text-app-primary bg-app-primary/5 border-app-primary/30 hover:bg-app-primary/10")}
                                                        >
                                                            {activeStepLinker === step.id ? "Seal Data" : "Attach Components"}
                                                        </button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {activeStepLinker === step.id && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-4 border-t border-white/5 mt-4 max-h-48 overflow-y-auto">
                                                                    {allIngredientsInRecipe.map(ing => (
                                                                        <button key={ing.id} type="button" onClick={() => toggleIngredientLink(idx, ing.id)} className={cn("flex items-center gap-3 p-2 rounded-sm text-[9px] font-black uppercase tracking-tighter border transition-all truncate", step.linkedIngredientIds?.includes(ing.id) ? "bg-app-primary text-white border-app-primary" : "bg-app-bg text-app-muted border-white/5 hover:border-app-primary/30")}>
                                                                            <div className={cn("h-4 w-4 rounded-sm flex items-center justify-center border", step.linkedIngredientIds?.includes(ing.id) ? "bg-white border-white text-app-primary" : "bg-black/20 border-white/10")}>
                                                                                {step.linkedIngredientIds?.includes(ing.id) && <Check className="h-3 w-3" strokeWidth={3} />}
                                                                            </div>
                                                                            <span className="truncate">{ing.name || 'UNNAMED_ID'}</span>
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
                                                                return <span key={id} className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-app-primary/10 text-app-primary text-[8px] font-black uppercase tracking-widest border border-app-primary/20"><Box className="h-3 w-3" /> {ing.name}</span>;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-3 bg-app-bg px-4 py-2 rounded-sm border border-app-border">
                                                        <Clock className="h-4 w-4 text-app-muted" />
                                                        <input type="number" value={step.duration || ''} onChange={(e) => updateStep(idx, 'duration', parseInt(e.target.value))} className="w-12 bg-transparent text-xs font-black text-center outline-none tabular-nums text-app-primary" placeholder="0" />
                                                        <span className="text-[9px] text-app-muted font-black uppercase tracking-widest">MIN</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeStep(idx)} className="text-app-muted hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                                                        <Trash2 className="h-4 w-4" /> Purge Step
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button type="button" onClick={addStep} className="w-full py-6 border-2 border-dashed border-app-border hover:border-app-primary/40 hover:bg-app-primary/5 rounded-sm text-[11px] font-black uppercase tracking-[0.3em] text-app-muted hover:text-app-primary transition-all flex items-center justify-center gap-3 shadow-inner">
                                    <Plus className="h-5 w-5" /> Append Protocol Step
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'specs' && (
                        <motion.div key="specs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-app-card border border-app-border p-8 rounded-sm space-y-8 relative overflow-hidden">
                                <Activity className="absolute -bottom-8 -right-8 h-32 w-32 text-white/[0.01]" />
                                <h3 className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em] flex items-center gap-3">
                                    <HeartPulse className="h-5 w-5 text-pink-500" /> Vitality Parameters
                                </h3>
                                <div className="grid grid-cols-2 gap-6 relative z-10">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-app-muted uppercase tracking-widest">Total Caloric Yield (KCAL)</label>
                                        <input type="number" value={formData.nutrition?.calories} onChange={e => handleNutritionChange('calories', parseInt(e.target.value))} className="w-full h-12 px-4 rounded-sm bg-app-bg border border-app-border text-sm font-black text-app-primary outline-none" />
                                    </div>
                                    {['protein', 'carbs', 'fat'].map(mac => (
                                        <div key={mac} className="space-y-2">
                                            <label className="text-[9px] font-black text-app-muted uppercase tracking-widest">{mac.toUpperCase()} (G)</label>
                                            <input type="number" step="0.1" value={(formData.nutrition as any)?.[mac]} onChange={e => handleNutritionChange(mac as any, parseFloat(e.target.value))} className="w-full h-11 px-4 rounded-sm bg-app-bg border border-app-border text-sm font-black outline-none" />
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <label className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500"/> Allergen Audit</label>
                                    <div className="flex flex-wrap gap-2">
                                        {commonAllergens.map(a => (
                                            <button key={a} type="button" onClick={() => toggleAllergen(a)} className={cn("px-4 py-2 text-[9px] font-black rounded-sm border transition-all uppercase tracking-widest", formData.allergens?.includes(a) ? "bg-red-500 text-white border-red-500 shadow-lg" : "bg-app-bg text-app-muted border-app-border hover:border-app-muted")}>
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-app-card border border-app-border p-8 rounded-sm space-y-8 relative overflow-hidden">
                                <Calculator className="absolute -bottom-8 -right-8 h-32 w-32 text-white/[0.01]" />
                                <h3 className="text-[10px] font-black uppercase text-app-muted tracking-[0.4em] flex items-center gap-3">
                                    <Calculator className="h-5 w-5 text-app-success" /> Fiscal Yield Logistics
                                </h3>
                                <div className="space-y-10 relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest">Operational Overhead</label>
                                            <span className="text-sm font-black text-app-primary">{formData.overheadPercentage}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={formData.overheadPercentage} onChange={e => handleChange('overheadPercentage', parseInt(e.target.value))} className="w-full accent-app-primary bg-app-bg" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest">Net Profit Margin</label>
                                            <span className="text-sm font-black text-app-success">{formData.profitMargin}%</span>
                                        </div>
                                        <input type="range" min="0" max="200" value={formData.profitMargin} onChange={e => handleChange('profitMargin', parseInt(e.target.value))} className="w-full accent-app-success bg-app-bg" />
                                    </div>
                                    <div className="p-6 bg-app-bg rounded-sm border border-app-border flex items-center justify-between">
                                        <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em]">Complexity Rating</span>
                                        <div className="flex gap-2">
                                            {(['Easy', 'Medium', 'Hard'] as const).map(lvl => (
                                                <button key={lvl} type="button" onClick={() => handleChange('difficulty', lvl)} className={cn("px-5 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all", formData.difficulty === lvl ? "bg-app-primary text-white border-app-primary shadow-lg" : "bg-app-card text-app-muted border border-white/5 hover:border-app-muted")}>
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