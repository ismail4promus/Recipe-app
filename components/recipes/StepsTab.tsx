import React from 'react';
import { Recipe } from '../../types';
import { Clock, Check } from 'lucide-react';

export const StepsTab: React.FC<{ steps: Recipe['steps'] }> = ({ steps }) => (
    <div className="relative space-y-1.5 pl-7">
        {/* Timeline rail, aligned to the centre of the step markers */}
        <div className="absolute left-[13px] top-2 bottom-8 w-px bg-app-border"></div>

        {(!steps || steps.length === 0) && (
            <div className="py-10 text-center text-app-muted bg-app-elevated rounded-2xl border border-dashed border-app-border">
                <p className="text-sm font-medium">No steps added yet</p>
            </div>
        )}

        {steps?.map((step, index) => (
            <div key={step.id} className="relative">
                <div className="absolute -left-7 top-1.5 h-[26px] w-[26px] rounded-full bg-app-elevated border border-app-primary/50 flex items-center justify-center z-10">
                    <span className="text-[11px] font-bold text-app-primary tabular-nums">{index + 1}</span>
                </div>

                <div className="bg-app-elevated rounded-xl border border-app-border px-3 py-2 hover:border-app-primary/40 transition-colors">
                    <p className="text-sm text-app-text font-medium leading-relaxed">
                        {step.instruction}
                    </p>
                    {!!step.duration && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-app-primary">
                            <Clock className="h-3 w-3" /> {step.duration} min
                        </span>
                    )}
                </div>
            </div>
        ))}

        {steps.length > 0 && (
            <div className="relative pt-1">
                <div className="absolute -left-7 top-1 h-[26px] w-[26px] bg-app-success flex items-center justify-center z-10 text-white">
                    <Check className="h-4 w-4" strokeWidth={3} />
                </div>
                <p className="py-1.5 text-sm font-bold text-app-success tracking-tight">
                    All done <span className="font-medium text-app-muted">· recipe complete</span>
                </p>
            </div>
        )}
    </div>
);
