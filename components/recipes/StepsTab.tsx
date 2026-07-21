import React from 'react';
import { Recipe } from '../../types';
import { Clock, Check, Target, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const StepsTab: React.FC<{ steps: Recipe['steps'] }> = ({ steps }) => (
    <div className="space-y-6 relative pl-6 md:pl-10">
        <div className="absolute left-6 md:left-10 top-4 bottom-12 w-0.5 bg-app-border border-l-2 border-dashed border-app-primary/20"></div>

        {(!steps || steps.length === 0) && (
            <div className="text-center py-20 text-app-muted bg-app-elevated rounded-2xl border border-dashed border-app-border">
                <p className="text-sm font-medium">No steps added yet</p>
            </div>
        )}

        {steps?.map((step, index) => (
            <div key={step.id} className="relative">
                <div className="absolute -left-[14px] md:-left-[18px] top-1 h-7 w-7 rounded-full bg-app-elevated border-2 border-app-primary flex items-center justify-center z-10 shadow-soft">
                    <span className="text-xs font-semibold text-app-primary">{index + 1}</span>
                </div>

                <div className="bg-app-elevated border border-app-border p-6 rounded-2xl hover:border-app-primary/30 transition-all group shadow-soft ml-4">
                    <div className="flex items-center justify-between mb-3 border-b border-app-border pb-3">
                        <div className="flex items-center gap-2">
                             <Target className="h-3.5 w-3.5 text-app-muted" />
                             <span className="text-xs font-medium text-app-muted">Step {index + 1}</span>
                        </div>
                        {step.duration && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-primary/10 text-app-primary border border-app-primary/20">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs font-medium">{step.duration} min</span>
                            </div>
                        )}
                    </div>
                    <p className="text-base md:text-lg text-app-text font-medium leading-relaxed tracking-tight font-sans">
                        {step.instruction}
                    </p>
                </div>
            </div>
        ))}

        {steps.length > 0 && (
             <div className="relative pt-8">
                 <div className="absolute -left-[18px] md:-left-[22px] top-8 h-9 w-9 rounded-full bg-app-success flex items-center justify-center z-10 shadow-soft text-white">
                    <Check className="h-5 w-5" strokeWidth={3} />
                </div>
                 <div className="ml-10">
                    <h4 className="font-bold text-lg text-app-success tracking-tight leading-none mb-1">All done</h4>
                    <p className="text-sm font-medium text-app-muted">Recipe complete</p>
                 </div>
             </div>
        )}
    </div>
);