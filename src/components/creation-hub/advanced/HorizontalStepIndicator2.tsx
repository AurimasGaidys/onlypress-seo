// src/components/creation-hub/advanced/HorizontalStepIndicator.tsx
'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface HorizontalStepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  stepTitles: string[];
  onStepClick?: (stepIndex: number) => void;
}

export default function HorizontalStepIndicator2({
  totalSteps,
  currentStep,
  stepTitles,
  onStepClick,
}: HorizontalStepIndicatorProps) {

  // Define the colors for the steps to match the image gradient
  const stepColors = [
    { bg: 'bg-[#FF7F50]', border: 'border-l-[#FF7F50]' }, // Step 1: Coral/Orange
    { bg: 'bg-[#FC354C]', border: 'border-l-[#FC354C]' }, // Step 2: Red/Pink
    { bg: 'bg-[#A020F0]', border: 'border-l-[#A020F0]' }, // Step 3: Purple
    { bg: 'bg-[#4B0082]', border: 'border-l-[#4B0082]' }, // Step 4: Indigo
  ]

  return (
    <div className="w-full">
      <ol className="flex w-full filter drop-shadow-sm">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const colorSet = stepColors[index % stepColors.length];
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          // const isUpcoming = step > currentStep;

          // Determine styling based on state
          // We default to Gray for upcoming steps to show progress, 
          // or you can remove the 'isUpcoming' check to have them all permanently colored like the static image.
          let colorClass = 'bg-gray-200 text-gray-400';
          let borderClass = 'border-l-gray-200';

          if (isCompleted || isCurrent) {
            // Cycle through the colors array safely
            colorClass = `${colorSet.bg} text-white`;
            borderClass = colorSet.border;
          }

          return (
            <li
              key={step}
              onClick={onStepClick ? () => onStepClick(index) : undefined}
              className={cn(
                'relative flex-1 flex items-center justify-center h-14 transition-all duration-200',
                onStepClick && 'cursor-pointer',
                colorClass,
                // Adjust z-index so the left arrows overlap correctly
                'first:z-40 nth-[2]:z-30 nth-[3]:z-20 nth-[4]:z-10'
              )}
            >
              {/* Left Cutout (White Triangle overlay) - Hidden for first item */}
              {index !== 0 && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-0 h-0 border-t-[28px] border-b-[28px] border-l-[20px] border-t-transparent border-b-transparent border-l-white"
                  aria-hidden="true"
                />
              )}

              {/* Content Container */}
              <div className={cn(
                "flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm",
                // Add left padding to subsequent steps to compensate for the cutout
                index !== 0 ? 'pl-8' : ''
              )}>
                {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <span>{stepTitles[index]}</span>}
                <span className={cn("hidden sm:inline-block font-medium opacity-90 capitalize")}>
                  {/* Optional: Show the actual title (e.g. "Details") next to "STEP 1" */}
                  {/* - {stepTitles[index]} */}
                </span>
              </div>

              {/* Right Arrow Point */}
              <div
                className={cn(
                  "absolute -right-[20px] top-0 bottom-0 w-0 h-0 z-50 border-t-[28px] border-b-[28px] border-l-[20px] border-t-transparent border-b-transparent transition-all duration-200",
                  borderClass
                )}
                aria-hidden="true"
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}