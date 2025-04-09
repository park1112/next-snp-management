// src/hooks/useFirestoreCollection.ts
import { useState, useEffect } from 'react';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    getFirestore,
    FirestoreError,
    DocumentData,
    QueryConstraint
} from 'firebase/firestore';

interface FirestoreCollectionHookConfig {
    collectionName: string;
    idField?: string;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    queryConstraints?: QueryConstraint[];
    transformData?: (data: any) => any;
}

interface FirestoreCollectionHookReturn<T> {
    items: T[];
    isLoading: boolean;
    error: Error | null;
    getItem: (id: string) => Promise<T | null>;
    addItem: (data: Omit<T, 'id'>) => Promise<string>;
    updateItem: (id: string, data: Partial<T>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    refreshItems: () => Promise<void>;
}

// Timestamp to Date 변환 함수
const convertTimestampToDate = (data: any): any => {
    if (!data) return data;

    if (data instanceof Timestamp) {
        return data.toDate();
    }

    if (Array.isArray(data)) {
        return data.map(item => convertTimestampToDate(item));
    }

    if (typeof data === 'object') {
        const result: { [key: string]: any } = {};
        for (const key in data) {
            result[key] = convertTimestampToDate(data[key]);
        }
        return result;
    }

    return data;
};

export function useFirestoreCollection<T>({
    collectionName,
    idField = 'id',
    orderByField = 'createdAt',
    orderDirection = 'desc',
    queryConstraints = [],
    transformData
}: FirestoreCollectionHookConfig): FirestoreCollectionHookReturn<T> {
    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const db = getFirestore();

    const fetchItems = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const collectionRef = collection(db, collectionName);
            const constraints = [...queryConstraints];

            if (orderByField) {
                constraints.push(orderBy(orderByField, orderDirection));
            }

            const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
            const snapshot = await getDocs(q);

            const result = snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data();
                const itemWithId = {
                    ...convertTimestampToDate(data),
                    [idField]: docSnapshot.id,
                };

                return transformData ? transformData(itemWithId) : itemWithId;
            });

            setItems(result as T[]);
        } catch (err) {
            console.error(`Error fetching ${collectionName}:`, err);
            setError(err instanceof Error ? err : new Error(`Error fetching ${collectionName}`));
        } finally {
            setIsLoading(false);
        }
    };

    const getItem = async (id: string): Promise<T | null> => {
        try {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const itemWithId = {
                    ...convertTimestampToDate(data),
                    [idField]: docSnap.id,
                };

                return transformData ? transformData(itemWithId) : itemWithId as T;
            }

            return null;
        } catch (err) {
            console.error(`Error getting ${collectionName} item:`, err);
            throw err;
        }
    };

    const addItem = async (data: Omit<T, 'id'>): Promise<string> => {
        try {
            const collectionRef = collection(db, collectionName);

            const docData = {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collectionRef, docData);
            await fetchItems(); // 목록 새로고침

            return docRef.id;
        } catch (err) {
            console.error(`Error adding ${collectionName} item:`, err);
            throw err;
        }
    };

    const updateItem = async (id: string, data: Partial<T>): Promise<void> => {
        try {
            const docRef = doc(db, collectionName, id);

            const updateData = {
                ...data,
                updatedAt: serverTimestamp(),
            };

            await updateDoc(docRef, updateData as DocumentData);
            await fetchItems(); // 목록 새로고침
        } catch (err) {
            console.error(`Error updating ${collectionName} item:`, err);
            throw err;
        }
    };

    const deleteItem = async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
            await fetchItems(); // 목록 새로고침
        } catch (err) {
            console.error(`Error deleting ${collectionName} item:`, err);
            throw err;
        }
    };

    // 초기 데이터 로드
    useEffect(() => {
        fetchItems();
    }, [JSON.stringify(queryConstraints)]); // queryConstraints가 변경될 때 다시 로드

    return {
        items,
        isLoading,
        error,
        getItem,
        addItem,
        updateItem,
        deleteItem,
        refreshItems: fetchItems,
    };
}