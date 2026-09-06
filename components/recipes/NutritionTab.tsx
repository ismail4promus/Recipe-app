
import React from 'react';
import { Recipe } from '../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { AlertCircle, Activity, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const COLORS = ['#2A7F72', '#C0A15A', '#7FB6A3', '#C4585F'];

export const NutritionTab: React.FC<{ recipe: Recipe; scaleFactor: number }> = ({ recipe, scaleFactor }) => {
    const nutrition = recipe.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const allergens = recipe.allergens || [];

    const data = [
        { name: 'Protein', value: nutrition.protein * 4, grams: nutrition.protein }, // 4 cal/g
        { name: 'Carbs', value: nutrition.carbs * 4, grams: nutrition.carbs }, // 4 cal/g
        { name: 'Fat', value: nutrition.fat * 9, grams: nutrition.fat }, // 9 cal/g
    ];

    const scaledCalories = nutrition.calories * scaleFactor;
    const hasData = nutrition.calories > 0;

    return (
        <div className="space-y-2">
            {!hasData && (
                <div className="bg-app-muted/10 p-2.5 flex items-center gap-2.5 rounded-xl border border-app-border">
                    <Info className="h-4 w-4 shrink-0 text-app-muted" />
                    <p className="text-xs text-app-muted">Nutrition data has not been added for this recipe.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-app-elevated rounded-xl border border-app-border p-2.5 flex flex-col relative">
                    <h3 className="text-[11px] font-semibold text-app-muted uppercase tracking-wider">Calorie breakdown</h3>
                    <div className="h-36 w-full flex items-center justify-center relative">
                        {hasData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        innerRadius={44}
                                        outerRadius={62}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-24 w-24 border-2 border-app-border flex items-center justify-center">
                                <Activity className="h-6 w-6 text-app-muted opacity-50" />
                            </div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-app-text tabular-nums leading-none">{Math.round(scaledCalories)}</span>
                            <span className="text-[10px] font-medium text-app-muted mt-0.5">Calories</span>
                        </div>
                    </div>
                </div>

                <div className="bg-app-elevated rounded-xl border border-app-border p-2.5 space-y-2.5">
                    <h3 className="text-[11px] font-semibold text-app-muted uppercase tracking-wider">Macronutrients</h3>
                    {[
                        { label: 'Protein', grams: nutrition.protein, calories: nutrition.protein * 4, text: 'text-app-info', bar: 'bg-app-info', track: 'bg-app-info/15' },
                        { label: 'Carbs', grams: nutrition.carbs, calories: nutrition.carbs * 4, text: 'text-app-success', bar: 'bg-app-success', track: 'bg-app-success/15' },
                        { label: 'Fat', grams: nutrition.fat, calories: nutrition.fat * 9, text: 'text-app-warning', bar: 'bg-app-warning', track: 'bg-app-warning/15' },
                    ].map(macro => (
                        <div key={macro.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className={cn("font-semibold", macro.text)}>{macro.label}</span>
                                <span className="font-semibold text-app-text tabular-nums">{Math.round(macro.grams * scaleFactor)}g</span>
                            </div>
                            <div className={cn("h-1.5 w-full overflow-hidden", macro.track)}>
                                <div
                                    className={cn("h-full", macro.bar)}
                                    style={{ width: `${hasData ? Math.min(100, (macro.calories / nutrition.calories) * 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {allergens.length > 0 && (
                <div className="p-2.5 bg-app-danger/10 border border-app-danger/20 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span className="flex items-center gap-1.5 text-app-danger font-semibold text-xs">
                        <AlertCircle className="h-3.5 w-3.5" /> Allergens
                    </span>
                    {allergens.map(allergen => (
                        <span key={allergen} className="px-2 py-0.5 bg-app-danger/15 text-app-danger text-[11px] font-medium">
                            {allergen}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};