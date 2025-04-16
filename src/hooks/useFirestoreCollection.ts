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

const convertTimestampToDate = (
    data: Record<string, unknown>
): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...data };

    if (result.createdAt && result.createdAt instanceof Timestamp) {
        result.createdAt = (result.createdAt as Timestamp).toDate();
    }
    if (result.updatedAt && result.updatedAt instanceof Timestamp) {
        result.updatedAt = (result.updatedAt as Timestamp).toDate();
    }
    if (result.contractDate && result.contractDate instanceof Timestamp) {
        result.contractDate = (result.contractDate as Timestamp).toDate();
    }

    // 예시: downPayment 처리 (필요한 부분만 표시)
    if (result.downPayment && typeof result.downPayment === 'object') {
        const dp = result.downPayment as Record<string, unknown>;
        if (dp.dueDate && dp.dueDate instanceof Timestamp) {
            dp.dueDate = (dp.dueDate as Timestamp).toDate();
        }
        if (dp.paidDate && dp.paidDate instanceof Timestamp) {
            dp.paidDate = (dp.paidDate as Timestamp).toDate();
        }
    }

    if (result.intermediatePayments && Array.isArray(result.intermediatePayments)) {
        result.intermediatePayments = (result.intermediatePayments as Record<string, unknown>[]).map(
            (payment: Record<string, unknown>) => {
                if (payment.dueDate && payment.dueDate instanceof Timestamp) {
                    payment.dueDate = (payment.dueDate as Timestamp).toDate();
                }
                if (payment.paidDate && payment.paidDate instanceof Timestamp) {
                    payment.paidDate = (payment.paidDate as Timestamp).toDate();
                }
                return payment;
            }
        );
    }

    if (result.finalPayment && typeof result.finalPayment === 'object') {
        const fp = result.finalPayment as Record<string, unknown>;
        if (fp.dueDate && fp.dueDate instanceof Timestamp) {
            fp.dueDate = (fp.dueDate as Timestamp).toDate();
        }
        if (fp.paidDate && fp.paidDate instanceof Timestamp) {
            fp.paidDate = (fp.paidDate as Timestamp).toDate();
        }
    }

    if (
        result.contractDetails &&
        typeof result.contractDetails === 'object' &&
        (result.contractDetails as Record<string, unknown>).harvestPeriod
    ) {
        const harvestPeriod = (result.contractDetails as Record<string, unknown>).harvestPeriod as Record<string, unknown>;
        if (harvestPeriod.start && harvestPeriod.start instanceof Timestamp) {
            harvestPeriod.start = (harvestPeriod.start as Timestamp).toDate();
        }
        if (harvestPeriod.end && harvestPeriod.end instanceof Timestamp) {
            harvestPeriod.end = (harvestPeriod.end as Timestamp).toDate();
        }
    }

    if (result.attachments && Array.isArray(result.attachments)) {
        result.attachments = (result.attachments as Record<string, unknown>[]).map(
            (attachment: Record<string, unknown>) => {
                if (attachment.uploadedAt && attachment.uploadedAt instanceof Timestamp) {
                    attachment.uploadedAt = (attachment.uploadedAt as Timestamp).toDate();
                }
                return attachment;
            }
        );
    }

    return result;
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