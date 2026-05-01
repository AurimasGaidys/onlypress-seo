"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  size = "md",
  label,
  fullPage = false,
  className,
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 stroke-[2.5px]",
    md: "h-8 w-8 stroke-[2px]",
    lg: "h-12 w-12 stroke-[1.5px]",
    xl: "h-16 w-16 stroke-[1px]",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-4 p-8",
    fullPage && "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
    className
  );

  return (
    <div className={containerClasses} {...props}>
      <div className="relative flex items-center justify-center">
        <Loader2 className={cn("animate-spin text-primary relative z-10", sizeClasses[size])} />
        <div className={cn("absolute inset-0 rounded-full border-2 border-primary/20", sizeClasses[size])} />
      </div>
      {label && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
