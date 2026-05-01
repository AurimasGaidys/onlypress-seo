import { useEffect, useState } from "react";
import { DataProvider } from "./genericMapStore";

export function useDocumentData<T>(
    collectionName: string,
    documentId: string | undefined
) {
    const dataProvider = DataProvider.Instance

    const [data, setData] = useState<T | undefined>(
        // Get the initial data from the cache, if available
        documentId ? dataProvider.get<T>(collectionName, documentId) : undefined
    );

    useEffect(() => {
        if (!documentId) {
            setData(undefined);
            return;
        }

        // The subscribe method returns its own cleanup function.
        const unsubscribe = dataProvider.subscribe<T>(
            collectionName,
            documentId,
            (newData) => {
                setData(newData);
            }
        );

        // This is the crucial part: when the component unmounts,
        // the cleanup function returned by subscribe is called.
        return () => {
            unsubscribe();
        };
    }, [collectionName, documentId]); // Re-subscribe if the documentId changes

    return data;
}

export function useCollectionData<T>(
    collectionName: string,
    queryConstraints: [string, "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains" | "array-contains-any", any][] = []
) {
    const dataProvider = DataProvider.Instance;
    const [data, setData] = useState<T[]>([]);

    useEffect(() => {
        const unsubscribe = dataProvider.subscribeToCollection<T>(
            collectionName,
            queryConstraints,
            (newData) => {
                setData(newData || []);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [collectionName, JSON.stringify(queryConstraints)]); // Use JSON.stringify for dependency array

    return data;
}
