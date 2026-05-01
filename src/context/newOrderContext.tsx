"use client";

import { Context, createContext, ReactNode, useEffect, useMemo, useState, useCallback, useContext } from "react";
import { useAuth } from "./AuthContext";
import { PublishOrder } from "@/types/publishOrder";
import { usePortalsContext } from "./portalContext/usePortalsContext";

// --- Data Interfaces ---
interface ArticleDto {
    title: string;
    content: string;
}

interface SeoDto {
    featuredImage: string;
    title: string;
    description: string;
}

interface NewOrderContextType {
    // State
    initializing: boolean;
    order: PublishOrder | undefined;
    orderTotalPrice: number;

    // Actions / Setters
    setCategories: (categoryIds: string[]) => void; // PX
    setPublishDate: (date: number, offsetInMinutes: number) => void; // IMPORTANT

    updateArticleInfo: (data: ArticleDto) => void; // IMPORTANT
    updateSeoInfo: (data: SeoDto) => void; // IMPORTANT

    togglePortal: (portalId: string) => void; 

    // specific helper if you want to bulk set portals (e.g. "Select All")
    setPortals: (portalIds: string[]) => void;

    // Utility to check if order is valid for submission
    validateOrder: () => { isValid: boolean; errors: string[] };
}

// --- Default Context ---
const NewOrderContext: Context<NewOrderContextType> = createContext<NewOrderContextType>({
    initializing: true,
    order: undefined,
    orderTotalPrice: 0,
    setCategories: () => { },
    setPublishDate: () => { },
    updateArticleInfo: () => { },
    updateSeoInfo: () => { },
    togglePortal: () => { },
    setPortals: () => { },
    validateOrder: () => ({ isValid: false, errors: [] }),
});

interface ProviderProps {
    children: ReactNode;
}

const NewOrderProvider: React.FC<ProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const isAuthorized = !!user;
    const uid = user?.uid || null;

    const { portals } = usePortalsContext();

    const [initializing, setInitializing] = useState(true);
    const [order, setOrder] = useState<PublishOrder | undefined>(undefined);

    // 1. Calculate Total Price dynamically (Derived State)
    // We do not store this in state to avoid synchronization bugs
    const orderTotalPrice = useMemo(() => {
        if (!order || !portals.length) return 0;

        return order.publishers.reduce((total = 0, portalId: string) => {
            const portal = portals.find((p) => p.id === portalId);
            return total + (portal ? portal.price : 0);
        }, 0);
    }, [order?.publishers, portals]);

    // 2. Initialize Order on Auth
    useEffect(() => {
        if (isAuthorized && uid && !order) {
            const now = Date.now();
            setOrder({
                id: "",
                buyerId: uid,
                publishers: [],
                prices: [],
                publisherCategories: [],
                publishDate: 0,
                price: 0, // Initial price
                textInfo: {
                    title: "",
                    content: "",
                    seo: { featuredImage: "", title: "", description: "" }
                },
                status: "Created",
                paymentId: "",
                dateCreated: now,
                dateUpdated: now,
                dateToPublish: now,
                publishTasks: [],
                offsetInMinutes: 0,
                createPublicReloease: false,
            });
            setInitializing(false);
        } else if (isAuthorized && order) {
            setInitializing(false);
        }
    }, [isAuthorized, uid]);

    // --- Setters ---

    const setCategories = useCallback((categoryIds: string[]) => {
        setOrder((prev) => prev ? { ...prev, publisherCategories: categoryIds } : prev);
    }, []);

    const setPublishDate = useCallback((date: number, offsetInMinutes: number) => {
        setOrder((prev) => prev ? { ...prev, dateToPublish: date, offsetInMinutes } : prev);
    }, []);

    const updateArticleInfo = useCallback((data: ArticleDto) => {
        setOrder((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                textInfo: {
                    ...prev.textInfo,
                    title: data.title,
                    content: data.content,
                    // Optional: Sync SEO title with Article title if SEO is empty
                    seo: {
                        ...prev.textInfo.seo,
                        title: prev.textInfo.seo.title || data.title,
                    }
                },
                dateUpdated: Date.now(),
            };
        });
    }, []);

    const updateSeoInfo = useCallback((data: SeoDto) => {
        setOrder((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                textInfo: {
                    ...prev.textInfo,
                    seo: data
                },
                dateUpdated: Date.now(),
            };
        });
    }, []);

    const togglePortal = useCallback((portalId: string) => {
        setOrder((prev) => {
            if (!prev) return prev;
            const isSelected = prev.publishers.includes(portalId);
            const newPublishers = isSelected
                ? prev.publishers.filter(id => id !== portalId)
                : [...prev.publishers, portalId];

            return {
                ...prev,
                publishers: newPublishers,
                dateUpdated: Date.now(),
            };
        });
    }, []);

    const setPortals = useCallback((portalIds: string[]) => {
        setOrder((prev) => prev ? { ...prev, publishers: portalIds, dateUpdated: Date.now() } : prev);
    }, []);

    // --- Validation Helper ---
    // Call this from your UI before submitting
    const validateOrder = useCallback(() => {
        const errors: string[] = [];
        if (!order) return { isValid: false, errors: ["Order not initialized"] };

        if (order.publisherCategories.length === 0) errors.push("Please select a category.");
        if (order.publishers.length === 0) errors.push("Please select at least one portal.");
        if (!order.textInfo.title) errors.push("Article title is required.");
        if (!order.textInfo.content) errors.push("Article content is required.");

        // URL Check
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        if (order.textInfo.content && !urlPattern.test(order.textInfo.content)) {
            errors.push("Warning: The content does not contain any links (URL).");
        }

        return {
            isValid: errors.length === 0 || (errors.length === 1 && errors[0].startsWith("Warning")),
            errors
        };
    }, [order]);

    // --- Memoized Value ---
    const value = useMemo(() => ({
        initializing,
        order: order ? { ...order, price: orderTotalPrice } : undefined, // Inject live price calculation
        orderTotalPrice,
        setCategories,
        setPublishDate,
        updateArticleInfo,
        updateSeoInfo,
        togglePortal,
        setPortals,
        validateOrder
    }), [
        initializing,
        order,
        orderTotalPrice,
        setCategories,
        setPublishDate,
        updateArticleInfo,
        updateSeoInfo,
        togglePortal,
        setPortals,
        validateOrder
    ]);

    return (
        <NewOrderContext.Provider value={value}>
            {children}
        </NewOrderContext.Provider>
    );
};

export default NewOrderProvider;
export { NewOrderContext };

export const useNewOrderContext = () => {
  const context = useContext(NewOrderContext);
  if (context === undefined) {
    throw new Error('NewOrderContext must be used within a NewOrderContext.Provider');
  }
  return context;
};
