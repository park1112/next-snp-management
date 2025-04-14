// useWorkCategories.ts 훅 업데이트 (또는 신규 작성)
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { id } from 'date-fns/locale';

// 카테고리 타입 정의
interface WorkCategory {
    id: string;
    name: string;
    rates: any[];
}

export const useWorkCategories = () => {
    const [categories, setCategories] = useState<WorkCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const db = getFirestore();

    // 카테고리 목록 가져오기
    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const categoriesCol = collection(db, 'categories');
            const snapshot = await getDocs(categoriesCol);

            const categoriesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCategories(categoriesList as WorkCategory[]);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // 카테고리 추가 함수
    const addCategory = async (name: string) => {
        try {
            const categoriesCol = collection(db, 'categories');

            const newDocRef = doc(categoriesCol);
            const newId = newDocRef.id; // 생성된 ID 가져오기

            // 이제 이 ID를 필드로도 저장
            await setDoc(newDocRef, {
                id: newId, // 문서 ID를 id 필드에도 저장
                name,
                rates: [],
                createdAt: serverTimestamp()
            });

            // 상태 업데이트
            setCategories(prev => [...prev, {
                id: newId,
                name,
                rates: []
            }]);

            return newId;
        } catch (err) {
            console.error("Error adding category:", err);
            throw err;
        }
    };

    // 카테고리에 세부 작업 단가 추가 함수
    const addRateToCategory = async (categoryId: string, rateData: any) => {
        try {
            const categoryRef = doc(db, 'categories', categoryId);
            const categoryDoc = await getDoc(categoryRef);

            if (!categoryDoc.exists()) {
                throw new Error("Category not found");
            }

            const categoryData = categoryDoc.data();
            const rates = categoryData.rates || [];

            // Create new rate without serverTimestamp in the array
            const newRate = {
                id: `rate_${Date.now()}`,
                ...rateData,
                createdAt: new Date().toISOString() // Use ISO string instead of serverTimestamp
            };

            rates.push(newRate);

            await updateDoc(categoryRef, { rates });

            // 상태 업데이트
            setCategories(prev =>
                prev.map(cat =>
                    cat.id === categoryId
                        ? { ...cat, rates: [...(cat.rates || []), newRate] }
                        : cat
                )
            );

            return newRate.id;
        } catch (err) {
            console.error("Error adding rate:", err);
            throw err;
        }
    };

    // 카테고리 데이터 새로고침 함수
    const refreshCategories = async () => {
        await fetchCategories();
    };

    return {
        categories,
        isLoading,
        error,
        addCategory,
        addRateToCategory,
        refreshCategories
    };
};

