"use client";

import { Context, createContext, ReactNode, useMemo } from "react";
import { PublishOrder } from "@/types/publishOrder";
import { useCollectionData } from "../useGenericMapStore";
import { DatabaseTables } from "@/lib/constants/databaseTables";
import { useAuth } from "../AuthContext";
import { useWorkspace } from "../WorkspaceContext";
// import { ApiSendMessageClient } from "@/data-context/api/api-mamanger";

interface OrderProps {
  initializing: boolean;
  myOrders: PublishOrder[];
  myOrdersActive: PublishOrder[];
  myOrdersCompleted: PublishOrder[];
  getOrder: (id: string) => PublishOrder | undefined;
  sendChatMessage: (orderId: string, sender: string, message: string) => void
}

const OrderContext: Context<OrderProps> = createContext<OrderProps>({
  initializing: false,
  myOrders: [],
  myOrdersActive: [],
  myOrdersCompleted: [],
  getOrder: () => undefined,
  sendChatMessage: () => { }
});

interface ProviderProps {
  children: ReactNode;
}

const OrderProvider: React.FC<ProviderProps> = ({ children }) => {

  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  console.log("=====> OrderProvider rendered with user:", user?.uid);

  let filter: any[] = [];

  console.log("OrderProvideractiveWorkspace", activeWorkspace)

  if (!activeWorkspace?.id || activeWorkspace?.id == "personal") {
    filter = [['buyerId', '==', user?.uid]]
  } else {
    filter = [['agencyId', '==', activeWorkspace.id]]
  }
  const myOrders: PublishOrder[] = useCollectionData<PublishOrder>(
    DatabaseTables.publishOrder,
    filter
  );

  console.log("=====> myOrders in OrderProvider:", myOrders);

  // Use React.useMemo to efficiently filter the orders into myOrdersActive and myOrdersCompleted.
  const myOrdersActive = useMemo(() => myOrders.filter(order => order.status === "Created" || order.status === "Paid" || order.status === "Rejected").sort((a, b) => b.dateUpdated - a.dateUpdated), [myOrders]);
  const myOrdersCompleted = useMemo(() => myOrders.filter(order => order.status === "Completed" || order.status === "Paid").sort((a, b) => a.dateUpdated - b.dateUpdated), [myOrders]);

  // The hook handles loading, so 'initializing' can be simplified.
  const initializing = !user?.uid || myOrders === undefined;

  const getOrder = (id: string) => {
    return myOrders?.find((d) => d.id === id);
  }

  const sendChatMessage = (orderId: string, sender: string, message: string) => {
    alert("nepadaryta")
    console.log("sendChatMessage called with:", { orderId, sender, message });
    // ApiSendMessageClient({ orderId, sender, message })
  }

  return (
    <OrderContext.Provider
      value={{
        initializing,
        myOrders,
        getOrder,
        sendChatMessage,
        myOrdersActive,
        myOrdersCompleted,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
export { OrderContext };
