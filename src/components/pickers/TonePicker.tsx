'use client';

import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type ToneValue = 'professional' | 'casual' | 'formal';

interface TonePickerProps {
  value: ToneValue;
  onChange: (value: ToneValue) => void;
  className?: string;
  layout?: 'horizontal' | 'stacked';
  idPrefix?: string;
}

const TONE_OPTIONS: Array<{
  value: ToneValue;
  label: string;
  description: string;
}> = [
  { value: 'professional', label: 'Professional', description: 'Clear, confident, and business-ready.' },
  { value: 'casual', label: 'Casual', description: 'Conversational tone with approachable wording.' },
  { value: 'formal', label: 'Formal', description: 'Structured and polished, suitable for reports.' },
];

export function TonePicker({
  value,
  onChange,
  className,
  layout = 'horizontal',
  idPrefix = 'tone',
}: TonePickerProps) {
  const groupClass =
    layout === 'horizontal'
      ? 'flex flex-col gap-3 sm:flex-row sm:flex-wrap'
      : 'grid gap-3';

  return (
    <RadioGroup value={value} onValueChange={onChange} className={cn(groupClass, className)}>
      {TONE_OPTIONS.map((option) => (
        <label
          key={option.value}
          htmlFor={`${idPrefix}-${option.value}`}
          className="relative flex min-w-[200px] flex-1 cursor-pointer flex-col rounded-xl border border-border/70 bg-background/80 p-4 text-left shadow-sm transition hover:border-primary/60 hover:shadow-md"
        >
          <RadioGroupItem
            value={option.value}
            id={`${idPrefix}-${option.value}`}
            className="absolute right-3 top-3"
          />
          <span className="text-sm font-semibold text-foreground">{option.label}</span>
          <span className="mt-2 text-sm text-muted-foreground">{option.description}</span>
        </label>
      ))}
    </RadioGroup>
  );
}
