"use client";

import { Context, createContext, ReactNode } from "react";
import { useCollectionData } from "../useGenericMapStore";
import React from "react";
import { PortalCategory } from "@/types/portalCategory";

interface Props {
  initializing: boolean;
  textIndustries: PortalCategory[];
  getTextIndustry: (id: string) => PortalCategory | undefined;
}

const TextIndustryContext: Context<Props> = createContext<Props>({
  initializing: false,
  textIndustries: [],
  getTextIndustry: () => undefined
});

interface ProviderProps {
  children: ReactNode;
}

const TextIndustryProvider: React.FC<ProviderProps> = ({ children }) => {
  // Use the generic hook to fetch all active industries
  const textIndustries = useCollectionData<PortalCategory>(
    "industries",
    [['active', '==', true]]
  );

  const getTextIndustry = (id: string) => {
    return textIndustries.find((d) => d.id === id);
  }

  return (
    <TextIndustryContext.Provider
      value={{
        initializing: false, // Real-time data, no initialization needed
        textIndustries,
        getTextIndustry
      }
      }
    >
      {children}
    </TextIndustryContext.Provider>
  );
};

export default TextIndustryProvider;

export function usePortaCategoryContext() {
  return React.useContext(TextIndustryContext)
}
