import React, { useRef, useState } from 'react';
import { Recipe } from '../../types';
import { X, Printer, ChefHat, Clock, Flame, Utensils, Minus, Plus } from 'lucide-react';

export const PrintRecipeModal: React.FC<{ recipe: Recipe; onClose: () => void }> = ({ recipe, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [desiredServings, setDesiredServings] = useState(recipe.servings);

    const handlePrint = () => {
        window.print();
    };

    const baseServings = recipe.servings || 1;
    const ratio = desiredServings / baseServings;

    const formatQuantity = (qty: number) => {
        const scaled = qty * ratio;
        // Format to remove unnecessary decimals (e.g. 1.00 -> 1, 1.50 -> 1.5)
        return parseFloat(scaled.toFixed(2));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex justify-center overflow-y-auto p-4 md:p-5 backdrop-blur-sm print:p-0 print:bg-white print:overflow-visible">
            
            {/* Control Bar (Hidden on Print) */}
            <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50 items-center">
                <div className="bg-app-card/90 backdrop-blur-md rounded-full flex items-center p-1 mr-2 border border-app-border shadow-soft">
                    <button
                        aria-label="Decrease servings"
                        onClick={() => setDesiredServings(Math.max(1, desiredServings - 1))}
                        className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-app-muted/10 text-app-text transition-colors"
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                    <div className="px-3 text-center min-w-[3rem]">
                        <span className="text-xs text-app-muted font-medium block leading-none mb-0.5">Servings</span>
                        <span className="text-sm font-semibold text-app-text leading-none">{desiredServings}</span>
                    </div>
                    <button
                        aria-label="Increase servings"
                        onClick={() => setDesiredServings(desiredServings + 1)}
                        className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-app-muted/10 text-app-text transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                <button
                    onClick={handlePrint}
                    className="bg-app-primary text-primary-foreground px-5 min-h-[44px] rounded-md font-semibold shadow-soft hover:brightness-105 transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                >
                    <Printer className="h-4 w-4" /> Print
                </button>
                <button
                    onClick={onClose}
                    className="bg-app-elevated text-app-text px-5 min-h-[44px] rounded-md font-semibold border border-app-border hover:bg-app-muted/10 transition-all backdrop-blur-md flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60"
                >
                    <X className="h-4 w-4" /> Close
                </button>
            </div>

            {/* Printable Content */}
            <div 
                ref={printRef}
                id="printable-area" 
                className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] shadow-2xl p-5 relative print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0"
            >
                <style>
                    {`
                        @media print {
                            @page {
                                size: auto;
                                margin: 5mm;
                            }
                            html, body {
                                height: 100%;
                                margin: 0 !important;
                                padding: 0 !important;
                                overflow: hidden;
                            }
                            body {
                                background: white;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                font-size: 10pt; /* Smaller base font */
                            }
                            body * {
                                visibility: hidden;
                            }
                            #printable-area, #printable-area * {
                                visibility: visible;
                            }
                            #printable-area {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                margin: 0;
                                padding: 5mm; /* Minimal padding */
                            }
                            .no-break {
                                break-inside: avoid;
                            }
                            /* Compact spacing utilities for print */
                            .print-compact-y { margin-bottom: 2px !important; margin-top: 2px !important; }
                            .print-compact-gap { gap: 4px !important; }
                            .print-text-sm { font-size: 9pt !important; }
                            .print-text-xs { font-size: 8pt !important; }
                            
                            /* Force 2 columns for ingredients if many */
                            .ingredients-grid {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 10px;
                            }
                        }
                    `}
                </style>

                {/* Compact Header */}
                <div className="flex justify-between items-center border-b-2 border-black/80 pb-2 mb-4">
                    <div className="flex-1">
                        <h1 className="text-2xl print:text-xl font-black leading-none uppercase tracking-tight">{recipe.name}</h1>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 mt-1">
                            <span className="bg-gray-100 print:bg-transparent print:p-0 px-2 py-0.5 rounded uppercase">{recipe.category}</span>
                            <span>&bull;</span>
                            <span className="uppercase">{recipe.cuisine}</span>
                        </div>
                    </div>
                    <div className="text-right pl-4">
                        <div className="flex items-center justify-end gap-1 text-black mb-0.5">
                            <ChefHat className="h-4 w-4" />
                            <span className="font-bold text-sm tracking-tight">iCooking</span>
                        </div>
                    </div>
                </div>

                {/* Compact Metadata Strip */}
                <div className="flex gap-4 mb-4 border-b border-gray-200 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <div>
                            <span className="font-bold text-gray-500 mr-1">TIME:</span>
                            <span className="font-black">{recipe.prepTime + recipe.cookTime}m</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Utensils className="h-3 w-3 text-gray-400" />
                        <div>
                            <span className="font-bold text-gray-500 mr-1">YIELD:</span>
                            <span className="font-black">{desiredServings}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Flame className="h-3 w-3 text-gray-400" />
                        <div>
                            <span className="font-bold text-gray-500 mr-1">DIFF:</span>
                            <span className="font-black">{recipe.difficulty}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content: Dense Grid */}
                <div className="flex flex-col md:flex-row gap-4 print:gap-4 items-start">
                    
                    {/* Left Column: Ingredients (Narrower) */}
                    <div className="w-full md:w-[35%] print:w-[35%] flex-shrink-0">
                        <h3 className="text-xs font-black border-b border-black pb-0.5 mb-2 uppercase tracking-widest">
                            Ingredients
                        </h3>
                        <div className="space-y-3">
                            {recipe.ingredientSections.map((section, idx) => (
                                <div key={section.id || idx} className="no-break">
                                    <h4 className="font-bold text-[10px] text-gray-500 mb-1 uppercase tracking-wide">{section.name}</h4>
                                    <ul className="space-y-1">
                                        {section.ingredients.map((ing, i) => (
                                            <li key={ing.id} className="flex items-start text-[10px] print:text-[9pt] border-b border-dotted border-gray-200 pb-0.5 last:border-0">
                                                <span className="font-bold text-[9px] mr-1 text-gray-400">{(i + 1).toString().padStart(2, '0')}.</span>
                                                <span className="font-bold whitespace-nowrap mr-2 w-10 text-right">{formatQuantity(ing.quantity)} {ing.unit}</span>
                                                <span className="text-gray-900 font-medium leading-tight">
                                                    {ing.type && <span className="text-gray-500 italic mr-1">{ing.type}</span>}
                                                    {ing.name}
                                                    {ing.notes && <span className="text-gray-500 italic inline ml-1">({ing.notes})</span>}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                         {/* Compact Nutrition */}
                         {recipe.nutrition && (
                            <div className="mt-4 pt-2 border-t border-black no-break">
                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-1">Nutrition</h3>
                                <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
                                    <div className="bg-gray-50 p-1 rounded"><span className="block text-gray-500 text-[8px]">Cal</span><b>{recipe.nutrition.calories}</b></div>
                                    <div className="bg-gray-50 p-1 rounded"><span className="block text-gray-500 text-[8px]">Prot</span><b>{recipe.nutrition.protein}</b></div>
                                    <div className="bg-gray-50 p-1 rounded"><span className="block text-gray-500 text-[8px]">Carb</span><b>{recipe.nutrition.carbs}</b></div>
                                    <div className="bg-gray-50 p-1 rounded"><span className="block text-gray-500 text-[8px]">Fat</span><b>{recipe.nutrition.fat}</b></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vertical Divider */}
                    <div className="hidden md:block print:block w-px bg-gray-200 self-stretch"></div>

                    {/* Right Column: Instructions (Wider) */}
                    <div className="flex-1">
                        <h3 className="text-xs font-black border-b border-black pb-0.5 mb-2 uppercase tracking-widest">
                            Method
                        </h3>
                        <div className="space-y-2 print:space-y-1">
                            {recipe.steps.map((step, index) => (
                                <div key={step.id} className="flex gap-3 no-break print:compact-y">
                                    <div className="flex-shrink-0 w-4 h-4 bg-black text-white rounded flex items-center justify-center font-bold text-[9px] mt-0.5">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs print:text-[10pt] leading-snug text-gray-900 font-medium">{step.instruction}</p>
                                        {step.duration && (
                                            <div className="flex items-center gap-1 mt-0.5 text-[9px] font-bold text-gray-500">
                                                <Clock className="h-2.5 w-2.5" /> {step.duration}m
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded no-break print:hidden">
                            <h4 className="font-bold text-[10px] uppercase text-gray-500 mb-1">Chef's Notes</h4>
                            <div className="h-10 border-b border-gray-300 border-dashed"></div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-auto pt-2 border-t border-gray-200 text-right text-[8px] text-gray-400 uppercase tracking-widest print:absolute print:bottom-2 print:right-2">
                    <p>iCooking &bull; {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};
