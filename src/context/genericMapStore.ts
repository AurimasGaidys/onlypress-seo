/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, Unsubscribe, query, where } from "firebase/firestore";

// Helper type to make it clear what we're returning
export type UnsubscribeFunc = () => void;

/**
 * A singleton class to manage real-time Firestore document subscriptions.
 * It ensures that only one listener is attached per document, even if multiple
 * components subscribe to the same data.
 */
export class DataProvider {
    private static _instance: DataProvider;

    // Stores the actual document data, keyed by a unique identifier (e.g., "userPrivate:some-uid")
    private dataStore: Map<string, any> = new Map();

    // Stores the Firestore unsubscribe functions, keyed by the same unique identifier.
    private firestoreUnsubscribers: Map<string, Unsubscribe> = new Map();

    // Stores all component-level callbacks, grouped by the data source key.
    private listeners: Map<string, Map<string, (data: any) => void>> = new Map();

    private constructor() {
        // Private constructor to enforce singleton pattern
    }

    /**
     * Gets the singleton instance of the DataProvider.
     */
    public static get Instance(): DataProvider {
        return this._instance || (this._instance = new this());
    }

    /**
     * Subscribes a component to real-time updates for a specific Firestore document.
     * @param collectionName The name of the collection (e.g., DatabaseTables.userPrivate).
     * @param documentId The ID of the document to listen to.
     * @param callback The function to call with the new data whenever it updates.
     * @returns An unsubscribe function that the component MUST call on unmount.
     */
    public subscribe<T>(
        collectionName: string,
        documentId: string,
        callback: (data: T | undefined) => void
    ): UnsubscribeFunc {
        if (!documentId) {
            console.warn("DataProvider: subscribe called with an empty documentId.");
            return () => { }; // Return a no-op function
        }

        const key = `${collectionName}:${documentId}`;
        const listenerId = Math.random().toString(36).substring(2, 9);

        // If this is the first component subscribing to this specific document,
        // create a new real-time listener with Firestore.
        if (!this.firestoreUnsubscribers.has(key)) {
            const docRef = doc(collection(db, collectionName), documentId);

            const firestoreUnsubscriber = onSnapshot(docRef, (snapshot) => {
                const data = snapshot.data() as T | undefined;
                console.log(`DataProvider: Data updated for key "${key}"`, data);

                // Store the latest data
                this.dataStore.set(key, data);

                // Notify all subscribed components about the update
                this.listeners.get(key)?.forEach((listenerCallback) => {
                    listenerCallback(data);
                });
            }, (error) => {
                console.error(`DataProvider: Error listening to document ${key}`, error);
            });

            this.firestoreUnsubscribers.set(key, firestoreUnsubscriber);
            this.listeners.set(key, new Map());
        }

        // Add the new component's callback to the list of listeners for this document.
        this.listeners.get(key)?.set(listenerId, callback);

        // Immediately provide the last known value to the new subscriber, if it exists.
        if (this.dataStore.has(key)) {
            callback(this.dataStore.get(key) as T | undefined);
        }

        // Return a cleanup function for the component to call.
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                keyListeners.delete(listenerId);

                // If this was the last component listening to this data,
                // unsubscribe from Firestore to save resources.
                if (keyListeners.size === 0) {
                    console.log(`DataProvider: All listeners unsubscribed for key "${key}". Cleaning up Firestore subscription.`);
                    this.firestoreUnsubscribers.get(key)?.();
                    this.firestoreUnsubscribers.delete(key);
                    this.listeners.delete(key);
                    this.dataStore.delete(key);
                }
            }
        };
    }

    /**
     * Subscribes to real-time updates for a Firestore collection query.
     * @param collectionName The name of the collection (e.g., DatabaseTables.industries).
     * @param queryConstraints Array of where clauses, e.g., [['active', '==', true]].
     * @param callback The function to call with the new data whenever it updates.
     * @returns An unsubscribe function that the component MUST call on unmount.
     */
    public subscribeToCollection<T>(
        collectionName: string,
        queryConstraints: [string, "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains" | "array-contains-any", any][] = [],
        callback: (data: T[]) => void
    ): UnsubscribeFunc {
        // Create a unique key for this collection with specific query
        const queryKey = JSON.stringify(queryConstraints);
        const key = `collection:${collectionName}:${queryKey}`;
        const listenerId = Math.random().toString(36).substring(2, 9);

        // If this is the first component subscribing to this specific collection query,
        // create a new real-time listener with Firestore.
        if (!this.firestoreUnsubscribers.has(key)) {
            const collectionRef = collection(db, collectionName);
            let firestoreQueryObj = query(collectionRef);

            // Apply query constraints
            queryConstraints.forEach(([field, operator, value]) => {
                firestoreQueryObj = query(firestoreQueryObj, where(field, operator, value));
            });

            const firestoreUnsubscriber = onSnapshot(firestoreQueryObj, (snapshot: any) => {
                const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as T));
                console.log(`DataProvider: Collection data updated for key "${key}"`, data);

                // Store the latest data
                this.dataStore.set(key, data);

                // Notify all subscribed components about the update
                this.listeners.get(key)?.forEach((listenerCallback) => {
                    listenerCallback(data);
                });
            }, (error: any) => {
                console.error(`DataProvider: Error listening to collection ${key}`, error);
            });

            this.firestoreUnsubscribers.set(key, firestoreUnsubscriber);
            this.listeners.set(key, new Map());
        }

        // Add the new component's callback to the list of listeners for this collection.
        this.listeners.get(key)?.set(listenerId, callback);

        // Immediately provide the last known value to the new subscriber, if it exists.
        if (this.dataStore.has(key)) {
            callback(this.dataStore.get(key) as T[]);
        }

        // Return a cleanup function for the component to call.
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                keyListeners.delete(listenerId);

                // If this was the last component listening to this collection query,
                // unsubscribe from Firestore to save resources.
                if (keyListeners.size === 0) {
                    console.log(`DataProvider: All listeners unsubscribed for collection key "${key}". Cleaning up Firestore subscription.`);
                    this.firestoreUnsubscribers.get(key)?.();
                    this.firestoreUnsubscribers.delete(key);
                    this.listeners.delete(key);
                    this.dataStore.delete(key);
                }
            }
        };
    }

    /**
     * Provides the current value of a document from the local cache without subscribing.
     * @param collectionName The name of the collection.
     * @param documentId The ID of the document.
     * @returns The cached data or undefined if not available.
     */
    public get<T>(collectionName: string, documentId: string): T | undefined {
        const key = `${collectionName}:${documentId}`;
        return this.dataStore.get(key) as T | undefined;
    }

    /**
     * Cleans up all active Firestore listeners.
     * Should be called when the user logs out.
     */
    public cleanup(): void {
        console.log("DataProvider: Cleaning up all subscriptions.");
        this.firestoreUnsubscribers.forEach((unsubscribe) => unsubscribe());
        this.firestoreUnsubscribers.clear();
        this.listeners.clear();
        this.dataStore.clear();
    }
}
