'use client';

import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  stepTitles: string[];
  isStepEnabled: (step: number) => boolean;
  onStepClick: (step: number) => void;
}

export default function StepIndicator({
  totalSteps,
  currentStep,
  stepTitles,
  isStepEnabled,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isUpcoming = step > currentStep;

        return (
          <div
            key={step}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg transition-all duration-200',
              {
                'cursor-pointer hover:bg-primary/5': isCompleted || (isUpcoming && isStepEnabled(step)),
                'bg-primary/10 border border-primary': isCurrent,
                'cursor-not-allowed opacity-50': isUpcoming && !isStepEnabled(step),
              }
            )}
            onClick={() => isStepEnabled(step) && onStepClick(step)}
          >
            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Circle
                  className={cn('h-5 w-5', {
                    'text-primary': isCurrent,
                    'text-muted-foreground': isUpcoming,
                  })}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {step}
                </span>
                <span
                  className={cn('text-sm font-medium', {
                    'text-foreground': isCurrent || isCompleted,
                    'text-muted-foreground': isUpcoming,
                  })}
                >
                  {stepTitles[index] || `Step ${step}`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
