'use client';

import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeywordsInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  suggestions?: string[];
}

const normalize = (keyword: string) => keyword.trim().replace(/\s+/g, ' ');

export function KeywordsInput({
  value,
  onChange,
  placeholder,
  helperText,
  disabled,
  className,
  label,
  suggestions = [],
}: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.style.width = `${Math.max(4, inputValue.length + 1)}ch`;
    }
  }, [inputValue, disabled]);

  const handleAdd = (rawValue: string) => {
    if (disabled) return;
    const keyword = normalize(rawValue);
    if (!keyword) return;
    const exists = value.some((item) => item.toLowerCase() === keyword.toLowerCase());
    if (exists) {
      setInputValue('');
      return;
    }
    onChange([...value, keyword]);
    setInputValue('');
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleAdd(inputValue);
    }

    if (event.key === 'Backspace' && !inputValue) {
      event.preventDefault();
      const last = value[value.length - 1];
      if (last) {
        handleRemove(value.length - 1);
        setInputValue(last);
      }
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      handleAdd(inputValue);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (disabled) return;
    const pasted = event.clipboardData.getData('text');
    const nextKeywords = pasted
      .split(/,|\n/) // allow commas or new lines
      .map(normalize)
      .filter(Boolean);
    if (!nextKeywords.length) return;
    const merged = [...value];
    nextKeywords.forEach((keyword) => {
      const exists = merged.some((item) => item.toLowerCase() === keyword.toLowerCase());
      if (!exists) merged.push(keyword);
    });
    onChange(merged);
    setInputValue('');
  };

  const renderSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion &&
      !value.some((item) => item.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <div className="text-sm font-medium text-foreground">{label}</div> : null}
      <div
        className={cn(
          'flex min-h-[3.25rem] w-full flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-background/95 px-3 py-2 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60',
          disabled && 'bg-muted'
        )}
      >
        {value.map((keyword, index) => (
          <span
            key={`${keyword}-${index}`}
            className="group flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
          >
            {keyword}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-primary/20"
                aria-label={`Remove keyword ${keyword}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          disabled={disabled}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          className="flex-1 min-w-[6ch] bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={value.length === 0 ? placeholder : undefined}
          aria-label="Add keyword"
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => handleAdd(inputValue)}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-secondary px-3 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80"
            disabled={!inputValue.trim()}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      {renderSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {renderSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleAdd(suggestion)}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
