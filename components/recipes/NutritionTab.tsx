
import React from 'react';
import { Recipe } from '../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { AlertCircle, Activity, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!hasData && (
                <div className="bg-app-muted/10 rounded-2xl p-4 flex items-center gap-3 border border-app-border">
                    <Info className="h-5 w-5 text-app-muted" />
                    <p className="text-sm text-app-muted">Nutrition data has not been added for this recipe.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-app-card border border-app-border shadow-soft p-6 rounded-2xl flex flex-col justify-center items-center relative">
                    <h3 className="absolute top-4 left-4 text-sm font-semibold text-app-muted">Calorie Breakdown</h3>
                    <div className="h-48 w-full flex items-center justify-center relative">
                        {hasData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
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
                            <div className="h-32 w-32 rounded-full border-4 border-app-border flex items-center justify-center">
                                <Activity className="h-8 w-8 text-app-muted opacity-50" />
                            </div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-app-text">{Math.round(scaledCalories)}</span>
                            <span className="text-xs font-medium text-app-muted">Calories</span>
                        </div>
                    </div>
                </div>

                <div className="bg-app-card border border-app-border shadow-soft p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-semibold text-app-muted">Macronutrients</h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold text-app-info">Protein</span>
                                <span className="font-semibold text-app-text">{Math.round(nutrition.protein * scaleFactor)}g</span>
                            </div>
                            <div className="h-2 w-full bg-app-info/15 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-app-info"
                                    style={{ width: `${hasData ? (nutrition.protein * 4 / nutrition.calories) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold text-app-success">Carbs</span>
                                <span className="font-semibold text-app-text">{Math.round(nutrition.carbs * scaleFactor)}g</span>
                            </div>
                            <div className="h-2 w-full bg-app-success/15 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-app-success"
                                    style={{ width: `${hasData ? (nutrition.carbs * 4 / nutrition.calories) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold text-app-warning">Fat</span>
                                <span className="font-semibold text-app-text">{Math.round(nutrition.fat * scaleFactor)}g</span>
                            </div>
                            <div className="h-2 w-full bg-app-warning/15 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-app-warning"
                                    style={{ width: `${hasData ? (nutrition.fat * 9 / nutrition.calories) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {allergens.length > 0 && (
                <div className="p-4 bg-app-danger/10 border border-app-danger/20 rounded-2xl">
                    <h4 className="flex items-center gap-2 text-app-danger font-semibold text-sm mb-2">
                        <AlertCircle className="h-4 w-4" /> Allergen Warning
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {allergens.map(allergen => (
                            <span key={allergen} className="px-3 py-1 bg-app-danger/15 text-app-danger rounded-full text-xs font-medium">
                                {allergen}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};