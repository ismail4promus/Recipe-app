import React from 'react';
import { Recipe } from '../../types';
import { Clock, Check, Target, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const StepsTab: React.FC<{ steps: Recipe['steps'] }> = ({ steps }) => (
    <div className="space-y-6 relative pl-6 md:pl-10">
        <div className="absolute left-6 md:left-10 top-4 bottom-12 w-0.5 bg-app-border border-l-2 border-dashed border-app-primary/20"></div>

        {(!steps || steps.length === 0) && (
            <div className="text-center py-20 text-app-muted bg-app-bg rounded-sm border border-dashed border-app-border">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Directive sequence null</p>
            </div>
        )}

        {steps?.map((step, index) => (
            <div key={step.id} className="relative">
                <div className="absolute -left-[14px] md:-left-[18px] top-1 h-6 w-6 rounded-sm bg-app-bg border-2 border-app-primary flex items-center justify-center z-10 shadow-lg">
                    <span className="text-[10px] font-black text-app-primary">{index + 1}</span>
                </div>

                <div className="bg-app-bg border border-app-border p-6 rounded-sm hover:border-app-primary/30 transition-all group shadow-md ml-4">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                             <Target className="h-3 w-3 text-app-muted" />
                             <span className="text-[9px] font-black uppercase text-app-muted tracking-[0.3em]">Mission Phase {index + 1}</span>
                        </div>
                        {step.duration && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-app-primary/5 text-app-primary border border-app-primary/20">
                                <Clock className="h-3 w-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">{step.duration} MINS</span>
                            </div>
                        )}
                    </div>
                    <p className="text-base md:text-lg text-app-text font-medium leading-relaxed uppercase tracking-tight font-sans">
                        {step.instruction}
                    </p>
                </div>
            </div>
        ))}
        
        {steps.length > 0 && (
             <div className="relative pt-8">
                 <div className="absolute -left-[18px] md:-left-[22px] top-8 h-8 w-8 rounded-sm bg-app-success flex items-center justify-center z-10 shadow-[0_0_15px_rgba(28,187,140,0.4)] text-white">
                    <Check className="h-5 w-5" strokeWidth={3} />
                </div>
                 <div className="ml-10">
                    <h4 className="font-black text-lg text-app-success uppercase tracking-[0.3em] leading-none mb-1">Operational End</h4>
                    <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Recipe protocol successfully executed</p>
                 </div>
             </div>
        )}
    </div>
);