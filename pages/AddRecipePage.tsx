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
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-20 px-4 md:px-0 font-sans">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-app-border pb-6">
                <div className="flex items-center gap-4">
                    <button aria-label="Go back" type="button" onClick={() => navigate(-1)} className="h-11 w-11 flex items-center justify-center bg-app-card border border-app-border rounded-full text-app-muted hover:text-app-primary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                             <ChefHat className="h-4 w-4 text-app-primary" />
                             <span className="text-xs font-medium text-app-muted">{recipeId ? 'Edit Recipe' : 'New Recipe'}</span>
                        </div>
                        <input
                            required
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            className="bg-transparent text-3xl font-bold tracking-tight text-app-text outline-none w-full placeholder:text-app-muted"
                            placeholder="Recipe name…"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="bg-app-primary text-primary-foreground min-h-[44px] px-8 rounded-md font-semibold text-sm shadow-soft hover:brightness-105 active:scale-[0.97] transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                >
                    <Save className="h-4 w-4" /> Save Recipe
                </button>
            </div>

            {/* Spec Tabs */}
            <div className="flex border border-app-border bg-app-card rounded-full overflow-x-auto scrollbar-hide shadow-soft sticky top-14 md:top-20 z-30 p-1">
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
                            "flex-1 min-w-[110px] py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all relative rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60",
                            activeTab === tab.id
                                ? "text-primary-foreground"
                                : "text-app-muted hover:text-app-text"
                        )}
                    >
                        {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute inset-0 bg-app-primary rounded-full -z-10" />}
                        <tab.icon className="h-4 w-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'general' && (
                        <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-8 bg-app-card border border-app-border p-6 md:p-5 rounded-lg relative overflow-hidden group shadow-soft">
                                <div className="space-y-5 relative z-10">
                                    <div className="relative aspect-video w-full rounded-md bg-app-elevated overflow-hidden group/img border border-app-border">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity gap-4 p-5">
                                            <div className="flex gap-4">
                                                <button type="button" onClick={() => imageInputRef.current?.click()} className="bg-app-primary text-primary-foreground px-6 min-h-[44px] rounded-md font-semibold text-sm flex items-center gap-2 shadow-soft hover:brightness-105 transition-all">
                                                    <Upload className="h-4 w-4" /> Upload
                                                </button>
                                                <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} className="bg-app-elevated text-app-text px-6 min-h-[44px] rounded-md font-semibold text-sm flex items-center gap-2 border border-app-border hover:bg-app-muted/10 transition-all">
                                                    <LinkIcon className="h-4 w-4" /> Link URL
                                                </button>
                                            </div>
                                            {showUrlInput && (
                                                <input
                                                    type="text"
                                                    value={formData.imageUrl}
                                                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                                                    className="w-full max-w-md h-12 rounded-md px-4 text-sm bg-app-elevated border border-app-primary text-app-text outline-none font-medium"
                                                    placeholder="Paste image URL…"
                                                    autoFocus
                                                />
                                            )}
                                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
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
                            <div className="lg:col-span-4 bg-app-card border border-app-border p-6 md:p-5 rounded-lg h-fit space-y-5 shadow-soft">
                                <div className="space-y-6">
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
                                    <div className="grid grid-cols-3 gap-4 border-t border-app-border pt-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-app-muted text-center block">Prep (min)</label>
                                            <input type="number" value={formData.prepTime} onChange={e => handleChange('prepTime', parseInt(e.target.value))} className="w-full h-11 px-2 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-center text-app-primary tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-app-muted text-center block">Cook (min)</label>
                                            <input type="number" value={formData.cookTime} onChange={e => handleChange('cookTime', parseInt(e.target.value))} className="w-full h-11 px-2 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-center text-app-primary tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-app-muted text-center block">Servings</label>
                                            <input type="number" min="1" value={formData.servings} onChange={e => handleChange('servings', parseInt(e.target.value))} className="w-full h-11 px-2 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-center text-app-success tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ingredients' && (
                        <motion.div key="ingredients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                             <div className="flex items-center gap-4 mb-4 px-2">
                                <h3 className="font-semibold text-base tracking-tight text-app-text">Ingredients</h3>
                                <div className="h-px flex-1 bg-app-border"></div>
                                <button type="button" onClick={addSection} className="text-sm font-semibold text-app-primary bg-app-primary/10 px-4 min-h-[40px] rounded-md border border-app-primary/30 flex items-center gap-2 hover:bg-app-primary hover:text-primary-foreground transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                                    <Plus className="h-4 w-4" /> Add Section
                                </button>
                            </div>
                            <div className="space-y-5">
                                {formData.ingredientSections.map((section, sIdx) => (
                                    <div key={section.id} onDragOver={(e) => onDragOver(e, sIdx)} onDrop={(e) => onDropToSection(e, sIdx)} className={cn("bg-app-card border rounded-lg transition-all relative overflow-hidden shadow-soft", overSectionIdx === sIdx ? "border-app-primary bg-app-primary/5" : "border-app-border")}>
                                        <div className="bg-app-elevated/50 px-6 py-4 border-b border-app-border flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-semibold text-app-primary tabular-nums">Section {(sIdx + 1).toString().padStart(2, '0')}</span>
                                                <input
                                                    value={section.name}
                                                    onChange={(e) => {
                                                        const newSections = [...formData.ingredientSections];
                                                        newSections[sIdx].name = e.target.value;
                                                        handleChange('ingredientSections', newSections);
                                                    }}
                                                    className="bg-transparent font-semibold text-sm tracking-tight text-app-text outline-none border-b border-transparent focus:border-app-primary/30 min-w-[200px]"
                                                    placeholder="Section name…"
                                                />
                                            </div>
                                            <button aria-label="Remove section" type="button" onClick={() => removeSection(sIdx)} className="text-app-muted hover:text-app-danger p-2 transition-all"><Trash2 className="h-4 w-4" /></button>
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
                                            <button type="button" onClick={() => addIngredientToSection(sIdx)} className="w-full py-4 border border-dashed border-app-border hover:border-app-primary/40 hover:bg-app-primary/5 rounded-md text-sm font-semibold text-app-muted hover:text-app-primary transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                                                <Plus className="h-4 w-4" /> Add Ingredient
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'steps' && (
                        <motion.div key="steps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                             <div className="flex items-center gap-4 mb-4 px-2">
                                <h3 className="font-semibold text-base tracking-tight text-app-text">Method</h3>
                                <div className="h-px flex-1 bg-app-border"></div>
                            </div>
                            <div className="bg-app-card border border-app-border p-6 md:p-5 rounded-lg space-y-6 shadow-soft">
                                <AnimatePresence>
                                    {formData.steps.map((step, idx) => (
                                        <motion.div key={step.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-4 relative pb-8 group border-b border-app-border last:border-0 mb-8 last:mb-0">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 rounded-full bg-app-elevated border border-app-primary/30 flex items-center justify-center shadow-soft relative group/step">
                                                    <span className="text-sm font-semibold text-app-primary tabular-nums">{step.stepNumber}</span>
                                                </div>
                                                <div className="w-px h-full bg-app-border group-last:hidden"></div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <textarea
                                                    value={step.instruction}
                                                    onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                                                    placeholder="Describe this step…"
                                                    className="w-full p-4 rounded-md bg-app-elevated border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm font-medium text-app-text min-h-[80px]"
                                                />

                                                <div className="bg-app-elevated/50 p-4 rounded-md border border-app-border">
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
                                                                return <span key={id} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-app-primary/10 text-app-primary text-xs font-medium border border-app-primary/20"><Box className="h-3 w-3" /> {ing.name}</span>;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-3 bg-app-elevated px-4 py-2 rounded-md border border-app-border">
                                                        <Clock className="h-4 w-4 text-app-muted" />
                                                        <input type="number" aria-label="Step duration in minutes" value={step.duration || ''} onChange={(e) => updateStep(idx, 'duration', parseInt(e.target.value))} className="w-12 bg-transparent text-sm font-semibold text-center outline-none tabular-nums text-app-primary" placeholder="0" />
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
                                <button type="button" onClick={addStep} className="w-full py-6 border-2 border-dashed border-app-border hover:border-app-primary/40 hover:bg-app-primary/5 rounded-md text-sm font-semibold text-app-muted hover:text-app-primary transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60">
                                    <Plus className="h-5 w-5" /> Add Step
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'specs' && (
                        <motion.div key="specs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-app-card border border-app-border p-6 md:p-5 rounded-lg space-y-5 relative overflow-hidden shadow-soft">
                                <h3 className="text-base font-semibold text-app-text tracking-tight flex items-center gap-3">
                                    <HeartPulse className="h-5 w-5 text-app-danger" /> Nutrition
                                </h3>
                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-xs font-medium text-app-muted">Total Calories (kcal)</label>
                                        <input type="number" value={formData.nutrition?.calories} onChange={e => handleNutritionChange('calories', parseInt(e.target.value))} className="w-full h-12 px-4 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-app-primary outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                    </div>
                                    {['protein', 'carbs', 'fat'].map(mac => (
                                        <div key={mac} className="space-y-2">
                                            <label className="text-xs font-medium text-app-muted capitalize">{mac} (g)</label>
                                            <input type="number" step="0.1" value={(formData.nutrition as any)?.[mac]} onChange={e => handleNutritionChange(mac as any, parseFloat(e.target.value))} className="w-full h-11 px-4 rounded-md bg-app-elevated border border-app-border text-sm font-semibold text-app-text outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60" />
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-app-border">
                                    <label className="text-sm font-semibold text-app-text mb-4 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-app-danger"/> Allergens</label>
                                    <div className="flex flex-wrap gap-2">
                                        {commonAllergens.map(a => (
                                            <button key={a} type="button" onClick={() => toggleAllergen(a)} className={cn("px-4 py-2 text-xs font-medium rounded-md border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60", formData.allergens?.includes(a) ? "bg-app-danger text-white border-app-danger" : "bg-app-elevated text-app-muted border-app-border hover:border-app-muted")}>
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-app-card border border-app-border p-6 md:p-5 rounded-lg space-y-5 relative overflow-hidden shadow-soft">
                                <h3 className="text-base font-semibold text-app-text tracking-tight flex items-center gap-3">
                                    <Calculator className="h-5 w-5 text-app-success" /> Pricing
                                </h3>
                                <div className="space-y-10 relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-app-muted">Overhead</label>
                                            <span className="text-sm font-semibold text-app-primary">{formData.overheadPercentage}%</span>
                                        </div>
                                        <input type="range" aria-label="Overhead percentage" min="0" max="100" value={formData.overheadPercentage} onChange={e => handleChange('overheadPercentage', parseInt(e.target.value))} className="w-full accent-app-primary bg-app-elevated" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-app-muted">Profit Margin</label>
                                            <span className="text-sm font-semibold text-app-success">{formData.profitMargin}%</span>
                                        </div>
                                        <input type="range" aria-label="Profit margin percentage" min="0" max="200" value={formData.profitMargin} onChange={e => handleChange('profitMargin', parseInt(e.target.value))} className="w-full accent-app-success bg-app-elevated" />
                                    </div>
                                    <div className="p-6 bg-app-elevated rounded-md border border-app-border flex items-center justify-between">
                                        <span className="text-sm font-medium text-app-muted">Difficulty</span>
                                        <div className="flex gap-2">
                                            {(['Easy', 'Medium', 'Hard'] as const).map(lvl => (
                                                <button key={lvl} type="button" onClick={() => handleChange('difficulty', lvl)} className={cn("px-5 py-2 rounded-md text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60", formData.difficulty === lvl ? "bg-app-primary text-primary-foreground border-app-primary" : "bg-app-card text-app-muted border border-app-border hover:border-app-muted")}>
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