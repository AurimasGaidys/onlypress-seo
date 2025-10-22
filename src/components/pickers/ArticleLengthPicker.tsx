'use client';

import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type ArticleLengthValue = 'short' | 'medium' | 'long';

interface ArticleLengthPickerProps {
  value: string;
  onChange: (value: ArticleLengthValue) => void;
  className?: string;
  layout?: 'horizontal' | 'stacked';
  idPrefix?: string;
}

const LENGTH_OPTIONS: Array<{
  value: ArticleLengthValue;
  label: string;
  description: string;
}> = [
  { value: 'short', label: 'Short', description: 'Under 500 words' },
  { value: 'medium', label: 'Medium', description: '800 – 1,200 words' },
  { value: 'long', label: 'Long', description: '1,500+ words' },
];

export function ArticleLengthPicker({
  value,
  onChange,
  className,
  layout = 'horizontal',
  idPrefix = 'article-length',
}: ArticleLengthPickerProps) {
  const groupClass =
    layout === 'horizontal'
      ? 'flex flex-col gap-3 sm:flex-row sm:flex-wrap'
      : 'grid gap-3';

  return (
    <RadioGroup value={value} onValueChange={onChange} className={cn(groupClass, className)}>
      {LENGTH_OPTIONS.map((option) => (
        <label
          key={option.value}
          htmlFor={`${idPrefix}-${option.value}`}
          className="relative flex min-w-[200px] flex-1 cursor-pointer flex-col gap-1 rounded-lg border border-border/60 bg-background p-3 text-left shadow-sm transition hover:border-primary/60"
        >
          <RadioGroupItem
            value={option.value}
            id={`${idPrefix}-${option.value}`}
            className="absolute right-3 top-3"
          />
          <span className="text-sm font-semibold text-foreground">{option.label}</span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </label>
      ))}
    </RadioGroup>
  );
}
