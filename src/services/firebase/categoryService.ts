// src/services/firebase/categoryService.ts
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { Category } from '@/types';

// Firestore 인스턴스
const db = getFirestore();
const categoriesCollection = collection(db, 'categories');

// 모든 카테고리 조회
export const getCategories = async (): Promise<Category[]> => {
    try {
        const q = query(categoriesCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);

        const categories = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
            } as Category;
        });

        return categories;
    } catch (error) {
        console.error("Error getting categories:", error);
        throw error;
    }
};

// 카테고리 상세 조회
export const getCategoryById = async (id: string): Promise<Category | null> => {
    try {
        const docRef = doc(categoriesCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
            } as Category;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting category:", error);
        throw error;
    }
};

// 카테고리 생성
export const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const newCategory = {
            ...categoryData,
            nextCategoryId: categoryData.nextCategoryId || null,
            rates: categoryData.rates || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(categoriesCollection, newCategory);
        return docRef.id;
    } catch (error) {
        console.error("Error creating category:", error);
        throw error;
    }
};

// 카테고리 수정
export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<void> => {
    try {
        const categoryRef = doc(categoriesCollection, id);

        const updateData = {
            ...categoryData,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(categoryRef, updateData);
    } catch (error) {
        console.error("Error updating category:", error);
        throw error;
    }
};

// 카테고리 삭제
export const deleteCategory = async (id: string): Promise<void> => {
    try {
        // 먼저 해당 카테고리를 다음 단계로 가지고 있는 카테고리를 찾아서 연결 해제
        const q = query(categoriesCollection, where('nextCategoryId', '==', id));
        const querySnapshot = await getDocs(q);

        // 연결 해제 작업 실행
        const promises = querySnapshot.docs.map(doc => {
            return updateDoc(doc.ref, { nextCategoryId: null });
        });

        await Promise.all(promises);

        // 카테고리 삭제
        const categoryRef = doc(categoriesCollection, id);
        await deleteDoc(categoryRef);
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
};

// 카테고리 세부 작업 추가
export const addRateToCategory = async (categoryId: string, rateData: {
    name: string;
    description: string;
    defaultPrice: number;
    unit: string;
}): Promise<string> => {
    try {
        const categoryRef = doc(categoriesCollection, categoryId);

        // 카테고리 문서 가져오기
        const categoryDoc = await getDoc(categoryRef);

        if (!categoryDoc.exists()) {
            throw new Error("Category not found");
        }

        // 기존 rates 배열 가져오기
        const categoryData = categoryDoc.data();
        const rates = categoryData.rates || [];

        // 새 rate 객체 생성
        const newRate = {
            id: `rate_${Date.now()}`, // 유니크 ID 생성
            ...rateData,
            createdAt: serverTimestamp()
        };

        // rates 배열에 새 rate 추가
        rates.push(newRate);

        // 카테고리 문서 업데이트
        await updateDoc(categoryRef, {
            rates,
            updatedAt: serverTimestamp()
        });

        return newRate.id;
    } catch (error) {
        console.error("Error adding rate to category:", error);
        throw error;
    }
};

// 카테고리 세부 작업 수정
export const updateRateInCategory = async (
    categoryId: string,
    rateId: string,
    rateData: Partial<{
        name: string;
        description: string;
        defaultPrice: number;
        unit: string;
    }>
): Promise<void> => {
    try {
        const categoryRef = doc(categoriesCollection, categoryId);

        // 카테고리 문서 가져오기
        const categoryDoc = await getDoc(categoryRef);

        if (!categoryDoc.exists()) {
            throw new Error("Category not found");
        }

        // 기존 rates 배열 가져오기
        const categoryData = categoryDoc.data();
        const rates = categoryData.rates || [];

        // 해당 rate 찾기
        const rateIndex = rates.findIndex((rate: any) => rate.id === rateId);

        if (rateIndex === -1) {
            throw new Error("Rate not found");
        }

        // rate 업데이트
        rates[rateIndex] = {
            ...rates[rateIndex],
            ...rateData,
        };

        // 카테고리 문서 업데이트
        await updateDoc(categoryRef, {
            rates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating rate in category:", error);
        throw error;
    }
};

// 카테고리 세부 작업 삭제
export const deleteRateFromCategory = async (categoryId: string, rateId: string): Promise<void> => {
    try {
        const categoryRef = doc(categoriesCollection, categoryId);

        // 카테고리 문서 가져오기
        const categoryDoc = await getDoc(categoryRef);

        if (!categoryDoc.exists()) {
            throw new Error("Category not found");
        }

        // 기존 rates 배열 가져오기
        const categoryData = categoryDoc.data();
        const rates = categoryData.rates || [];

        // 해당 rate 제외하기
        const updatedRates = rates.filter((rate: any) => rate.id !== rateId);

        // 카테고리 문서 업데이트
        await updateDoc(categoryRef, {
            rates: updatedRates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error deleting rate from category:", error);
        throw error;
    }
};

// 카테고리 다음 단계 설정
export const setNextCategory = async (categoryId: string, nextCategoryId: string | null): Promise<void> => {
    try {
        const categoryRef = doc(categoriesCollection, categoryId);

        await updateDoc(categoryRef, {
            nextCategoryId,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error setting next category:", error);
        throw error;
    }
};

// 카테고리 순서 변경
export const reorderCategories = async (reorderedCategories: Category[]): Promise<void> => {
    try {
        // 각 카테고리의 순서를 업데이트
        const updatePromises = reorderedCategories.map((category, index) => {
            const categoryRef = doc(categoriesCollection, category.id);
            return updateDoc(categoryRef, {
                order: index,
                updatedAt: serverTimestamp()
            });
        });

        await Promise.all(updatePromises);
    } catch (error) {
        console.error("Error reordering categories:", error);
        throw error;
    }
};

// 카테고리 위치 이동 (위/아래)
export const moveCategoryPosition = async (categoryId: string, direction: 'up' | 'down'): Promise<void> => {
    try {
        // 모든 카테고리 가져오기
        const categories = await getCategories();

        // 현재 카테고리 인덱스 찾기
        const currentIndex = categories.findIndex(c => c.id === categoryId);

        if (currentIndex === -1) {
            throw new Error("Category not found");
        }

        // 이동할 위치 계산
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // 유효한 범위인지 확인
        if (newIndex < 0 || newIndex >= categories.length) {
            return; // 이동할 수 없는 경우 무시
        }

        // 카테고리 순서 변경
        const reorderedCategories = [...categories];
        const [movedCategory] = reorderedCategories.splice(currentIndex, 1);
        reorderedCategories.splice(newIndex, 0, movedCategory);

        // 순서 업데이트
        await reorderCategories(reorderedCategories);
    } catch (error) {
        console.error(`Error moving category ${direction}:`, error);
        throw error;
    }
};