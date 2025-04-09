// src/hooks/useFields.ts
import { useState, useEffect } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import {
    getFields,
    getFieldById,
    createField,
    updateField,
    deleteField,
    getFieldsByFarmerId,
    getCropTypes,
    updateFieldStage
} from '@/services/firebase/fieldService';
import { Field } from '@/types';
import { where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// 농지 데이터를 위한 커스텀 훅
export function useFields(farmerId?: string, cropTypeFilter?: string) {
    const queryConstraints = [];

    if (farmerId) {
        queryConstraints.push(where('farmerId', '==', farmerId));
    }

    if (cropTypeFilter) {
        queryConstraints.push(where('cropType', '==', cropTypeFilter));
    }

    const {
        items: fields,
        isLoading,
        error,
        getItem: getField,
        addItem: addField,
        updateItem: updateFieldItem,
        deleteItem: deleteFieldItem,
        refreshItems: refreshFields
    } = useFirestoreCollection<Field>({
        collectionName: 'fields',
        orderByField: 'createdAt',
        orderDirection: 'desc',
        queryConstraints
    });

    const [cropTypes, setCropTypes] = useState<string[]>([]);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

    // 작물 종류 데이터 로드
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setIsLoadingMetadata(true);
                const cropTypeData = await getCropTypes();
                setCropTypes(cropTypeData);
            } catch (error) {
                console.error('Error fetching metadata:', error);
            } finally {
                setIsLoadingMetadata(false);
            }
        };

        fetchMetadata();
    }, []);

    // 농가별 농지 조회 함수
    const fetchFieldsByFarmer = async (fId: string): Promise<Field[]> => {
        try {
            return await getFieldsByFarmerId(fId);
        } catch (error) {
            console.error('Error fetching fields by farmer:', error);
            throw error;
        }
    };

    // 농지 단계 업데이트 함수
    const updateStage = async (fieldId: string, stage: string): Promise<void> => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('User not authenticated');
            }

            await updateFieldStage(fieldId, stage, user.uid);
            await refreshFields();
        } catch (error) {
            console.error('Error updating field stage:', error);
            throw error;
        }
    };

    return {
        fields,
        isLoading: isLoading || isLoadingMetadata,
        error,
        cropTypes,
        getField,
        addField,
        updateField: updateFieldItem,
        deleteField: deleteFieldItem,
        refreshFields,
        fetchFieldsByFarmer,
        updateStage
    };
}

// 단일 농지 데이터를 위한 커스텀 훅
export function useField(fieldId: string) {
    const [field, setField] = useState<Field | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchField = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const fieldData = await getFieldById(fieldId);
                setField(fieldData);
            } catch (err) {
                console.error('Error fetching field:', err);
                setError(err instanceof Error ? err : new Error('Error fetching field'));
            } finally {
                setIsLoading(false);
            }
        };

        if (fieldId) {
            fetchField();
        }
    }, [fieldId]);

    const updateFieldData = async (data: Partial<Field>): Promise<void> => {
        try {
            await updateField(fieldId, data);

            // 데이터 새로고침
            const updatedField = await getFieldById(fieldId);
            setField(updatedField);
        } catch (err) {
            console.error('Error updating field:', err);
            throw err;
        }
    };

    const deleteFieldData = async (): Promise<void> => {
        try {
            await deleteField(fieldId);
            setField(null);
        } catch (err) {
            console.error('Error deleting field:', err);
            throw err;
        }
    };

    const updateFieldStageData = async (stage: string): Promise<void> => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('User not authenticated');
            }

            await updateFieldStage(fieldId, stage, user.uid);

            // 데이터 새로고침
            const updatedField = await getFieldById(fieldId);
            setField(updatedField);
        } catch (err) {
            console.error('Error updating field stage:', err);
            throw err;
        }
    };

    return {
        field,
        isLoading,
        error,
        updateField: updateFieldData,
        deleteField: deleteFieldData,
        updateFieldStage: updateFieldStageData
    };
}