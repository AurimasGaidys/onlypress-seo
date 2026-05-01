// src/components/creation-hub/advanced/HorizontalStepIndicator.tsx
'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalStepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  stepTitles: string[];
  onStepClick?: (stepIndex: number) => void
}

export default function HorizontalStepIndicator({
  totalSteps,
  currentStep,
  stepTitles,
  onStepClick
}: HorizontalStepIndicatorProps) {
  return (
    <div className="w-full">
      <ol className="flex items-center w-full">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isLastStep = step === totalSteps;

          return (
            <li
              onClick={onStepClick ? () => onStepClick(index) : undefined}
              key={step}
              className={cn('flex w-full items-center', !isLastStep && "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block", {
                'after:border-primary': isCompleted,
                'after:border-border': !isCompleted,
              })}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 transition-colors',
                    {
                      'bg-primary text-primary-foreground': isCurrent,
                      'bg-green-600 text-white': isCompleted,
                      'bg-muted border-2 text-muted-foreground': !isCurrent && !isCompleted,
                    }
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step}
                </span>
                <span className={cn('text-xs text-center mt-1 w-24', {
                  'font-semibold text-primary': isCurrent,
                  'text-muted-foreground': !isCurrent,
                })}>
                  {stepTitles[index]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
