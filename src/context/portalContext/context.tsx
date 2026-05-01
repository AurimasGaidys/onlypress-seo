"use client";

import { Context, createContext, ReactNode, useEffect, useState } from "react";
import { DataProvider } from "./getData";
import { PortalPublic } from "@/types/portalPublic";
import { useCustomPricesContext } from "../customPriceContext/CustomPriceContext";

interface Props {
  initializing: boolean;
  portals: PortalPublic[];
  getPortal: (id: string) => PortalPublic | undefined;
}

const PortalsContext: Context<Props> = createContext<Props>({
  initializing: false,
  portals: [],
  getPortal: () => undefined
});

interface ProviderProps {
  children: ReactNode;
}

const PortalProvider: React.FC<ProviderProps> = ({ children }) => {
  const { customPrices, loading } = useCustomPricesContext();
  const [initializing, setInitializing] = useState(true);
  const [portals, setdata] = useState<PortalPublic[]>([]);
  const dataProxy = DataProvider.Instance;

  useEffect(() => {
    setdata(dataProxy.data);
    if (dataProxy.data?.length > 0) {
      setInitializing(false);
    }

    dataProxy.GetData().then((d) => {
      setdata(d);
      setInitializing(false);
    });

  }, [dataProxy]);

  useEffect(() => {

  }, [loading, customPrices])


  const getPortal = (id: string) => {
    return portals.find((d) => d.id === id);
  }

  return (
    <PortalsContext.Provider
      value={{
        initializing,
        portals,
        getPortal
      }}
    >
      {children}
    </PortalsContext.Provider>
  );
};

export default PortalProvider;
export { PortalsContext };
