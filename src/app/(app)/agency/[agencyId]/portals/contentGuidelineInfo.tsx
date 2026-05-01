// components/ContentGuidelineInfo.tsx

"use client";

import * as React from "react";

// Shadcn/ui and Lucide Icons
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Info,
  AlertCircle,
  Dice5,
  Ban,
  Leaf,
  Pill,
  Shapes,
  HandCoins,
} from "lucide-react";

// --- 1. Icon Mapping ---
// We create a map where keys are the topic strings and values are the icon components.
// This makes it easy to add or change icons without touching the component's JSX.
const topicIconMap: Record<string, React.ElementType> = {
  Gambling: Dice5,
  "Adult content": Ban,
  CBD: Leaf,
  "Dietary supplements and pharmacy": Pill,
  Cryptocurrencies: Shapes,
  Loans: HandCoins,
};

// A fallback icon for any topics that aren't in our map.
const DefaultIcon = AlertCircle;

// --- 2. Component Props ---
interface ContentGuidelineInfoProps {
  /** The information to display inside the tooltip on hover. */
  tooltipContent: React.ReactNode;
  /** An optional array of "spicy topics" to display as a list with icons. */
  spicyTopics?: string[];
}

// --- 3. The Component ---
export function ContentGuidelineInfo({
  tooltipContent,
  spicyTopics,
}: ContentGuidelineInfoProps) {
  return (
    // TooltipProvider is necessary for the Tooltip to work.
    <TooltipProvider>
      <div className="flex items-center space-x-2">

        {/* The Info icon with its hover tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex-shrink-0">
              <Info className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              <span className="sr-only">More info</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent || "No information"}</p>
          </TooltipContent>
        </Tooltip>

        {spicyTopics?.map((topic) => {
          const IconComponent = topicIconMap[topic] || DefaultIcon;
          return (
            // Each icon is now wrapped in its own Tooltip
            <Tooltip key={topic}>
              <TooltipTrigger asChild>
                {/* The icon itself is the trigger */}
                <IconComponent className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                {/* The tooltip shows the topic name */}

                <p>We allow: {topic}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}