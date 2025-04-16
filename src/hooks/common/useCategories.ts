// src/hooks/useCategories.ts
import { useState, useEffect } from 'react';
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    addRateToCategory,
    updateRateInCategory,
    deleteRateFromCategory,
    setNextCategory,
    reorderCategories,
    moveCategoryPosition
} from '@/services/firebase/categoryService';
import { Category } from '@/types';

// 카테고리 데이터를 위한 커스텀 훅
export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // 카테고리 데이터 로드
    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const categoryData = await getCategories();
            setCategories(categoryData);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError(err instanceof Error ? err : new Error('Error fetching categories'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // 카테고리 추가
    const addCategory = async (name: string): Promise<string> => {
        try {
            const newCategoryId = await createCategory({ name });
            await fetchCategories(); // 다시 로드
            return newCategoryId;
        } catch (err) {
            console.error('Error adding category:', err);
            throw err;
        }
    };

    // 카테고리 업데이트
    const updateCategoryItem = async (id: string, data: Partial<Category>): Promise<void> => {
        try {
            await updateCategory(id, data);
            await fetchCategories(); // 다시 로드
        } catch (err) {
            console.error('Error updating category:', err);
            throw err;
        }
    };

    // 카테고리 삭제
    const deleteCategoryItem = async (id: string): Promise<void> => {
        try {
            await deleteCategory(id);
            await fetchCategories(); // 다시 로드
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    };

    // 세부 작업 추가
    const addRateToCategoryItem = async (
        categoryId: string,
        rateData: {
            name: string;
            description: string;
            defaultPrice: number;
            unit: string;
        }
    ): Promise<string> => {
        try {
            const newRateId = await addRateToCategory(categoryId, rateData);
            await fetchCategories(); // 다시 로드
            return newRateId;
        } catch (err) {
            console.error('Error adding rate to category:', err);
            throw err;
        }
    };

    // 세부 작업 업데이트
    const updateRateInCategoryItem = async (
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
            await updateRateInCategory(categoryId, rateId, rateData);
            await fetchCategories(); // 다시 로드
        } catch (err) {
            console.error('Error updating rate in category:', err);
            throw err;
        }
    };

    // 세부 작업 삭제
    const deleteRateFromCategoryItem = async (categoryId: string, rateId: string): Promise<void> => {
        try {
            await deleteRateFromCategory(categoryId, rateId);
            await fetchCategories(); // 다시 로드
        } catch (err) {
            console.error('Error deleting rate from category:', err);
            throw err;
        }
    };

    // 다음 카테고리 설정
    const setNextCategoryItem = async (categoryId: string, nextCategoryId: string | null): Promise<void> => {
        try {
            await setNextCategory(categoryId, nextCategoryId);
            await fetchCategories(); // 다시 로드
        } catch (err) {
            console.error('Error setting next category:', err);
            throw err;
        }
    };

    // 카테고리 경로 계산 (단계 순서)
    const getCategoryPath = (startCategoryId: string): Category[] => {
        const path: Category[] = [];
        let currentId = startCategoryId;

        // 순환 참조 방지를 위한 Set
        const visitedIds = new Set<string>();

        while (currentId && !visitedIds.has(currentId)) {
            const category = categories.find(c => c.id === currentId);
            if (!category) break;

            path.push(category);
            visitedIds.add(currentId);

            // 다음 카테고리가 없으면 종료
            if (!category.nextCategoryId) break;

            currentId = category.nextCategoryId;
        }

        return path;
    };

    // 카테고리 순서 변경
    const reorderCategoriesItems = async (reorderedCategories: Category[]): Promise<void> => {
        try {
            await reorderCategories(reorderedCategories);
            await fetchCategories(); // 다시 로드
        } catch (err) {
            console.error('Error reordering categories:', err);
            throw err;
        }
    };

    // 카테고리 위치 이동
    const moveCategoryPositionItem = async (categoryId: string, direction: 'up' | 'down'): Promise<void> => {
        try {
            await moveCategoryPosition(categoryId, direction);
            await fetchCategories(); // 다시 로드
        } catch (err) {
            console.error(`Error moving category ${direction}:`, err);
            throw err;
        }
    };

    return {
        categories,
        isLoading,
        error,
        refreshCategories: fetchCategories,
        addCategory,
        updateCategory: updateCategoryItem,
        deleteCategory: deleteCategoryItem,
        addRateToCategory: addRateToCategoryItem,
        updateRateInCategory: updateRateInCategoryItem,
        deleteRateFromCategory: deleteRateFromCategoryItem,
        setNextCategory: setNextCategoryItem,
        getCategoryPath,
        reorderCategories: reorderCategoriesItems,
        moveCategoryPosition: moveCategoryPositionItem
    };
}

// 단일 카테고리 데이터를 위한 커스텀 훅
export function useCategory(categoryId: string) {
    const [category, setCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const categoryData = await getCategoryById(categoryId);
                setCategory(categoryData);
            } catch (err) {
                console.error('Error fetching category:', err);
                setError(err instanceof Error ? err : new Error('Error fetching category'));
            } finally {
                setIsLoading(false);
            }
        };

        if (categoryId) {
            fetchCategory();
        }
    }, [categoryId]);

    // 카테고리 업데이트
    const updateCategoryData = async (data: Partial<Category>): Promise<void> => {
        try {
            await updateCategory(categoryId, data);

            // 데이터 새로고침
            const updatedCategory = await getCategoryById(categoryId);
            setCategory(updatedCategory);
        } catch (err) {
            console.error('Error updating category:', err);
            throw err;
        }
    };

    // 카테고리 삭제
    const deleteCategoryData = async (): Promise<void> => {
        try {
            await deleteCategory(categoryId);
            setCategory(null);
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    };

    return {
        category,
        isLoading,
        error,
        updateCategory: updateCategoryData,
        deleteCategory: deleteCategoryData
    };
}