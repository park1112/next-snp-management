// src/hooks/useFarmers.ts
import { useState, useEffect } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import {
    getFarmers,
    getFarmerById,
    createFarmer,
    updateFarmer,
    deleteFarmer,
    searchFarmers as searchFarmersService,
    getSubdistricts,
    getPaymentGroups
} from '@/services/firebase/farmerService';
import { Farmer } from '@/types';
import { where } from 'firebase/firestore';

// 농가 데이터를 위한 커스텀 훅
export function useFarmers(subdistrictFilter?: string) {
    const queryConstraints = subdistrictFilter
        ? [where('subdistrict', '==', subdistrictFilter)]
        : [];

    const {
        items: farmers,
        isLoading,
        error,
        getItem: getFarmer,
        addItem: addFarmer,
        updateItem: updateFarmerItem,
        deleteItem: deleteFarmerItem,
        refreshItems: refreshFarmers
    } = useFirestoreCollection<Farmer>({
        collectionName: 'farmers',
        orderByField: 'name',
        orderDirection: 'asc',
        queryConstraints
    });

    const [subdistricts, setSubdistricts] = useState<string[]>([]);
    const [paymentGroups, setPaymentGroups] = useState<string[]>([]);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

    // 면단위 및 결제소속 데이터 로드
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setIsLoadingMetadata(true);
                const subdistrictData = await getSubdistricts();
                const paymentGroupData = await getPaymentGroups();

                setSubdistricts(subdistrictData);
                setPaymentGroups(paymentGroupData);
            } catch (error) {
                console.error('Error fetching metadata:', error);
            } finally {
                setIsLoadingMetadata(false);
            }
        };

        fetchMetadata();
    }, []);

    // 농가 검색 함수
    const searchFarmers = async (
        searchType: 'name' | 'phoneNumber' | 'subdistrict',
        searchValue: string
    ): Promise<Farmer[]> => {
        try {
            return await searchFarmersService(searchType, searchValue);
        } catch (error) {
            console.error('Error searching farmers:', error);
            throw error;
        }
    };

    return {
        farmers,
        isLoading: isLoading || isLoadingMetadata,
        error,
        subdistricts,
        paymentGroups,
        getFarmer,
        addFarmer,
        updateFarmer: updateFarmerItem,
        deleteFarmer: deleteFarmerItem,
        refreshFarmers,
        searchFarmers
    };
}

// 단일 농가 데이터를 위한 커스텀 훅
export function useFarmer(farmerId: string) {
    const [farmer, setFarmer] = useState<Farmer | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchFarmer = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const farmerData = await getFarmerById(farmerId);
                setFarmer(farmerData);
            } catch (err) {
                console.error('Error fetching farmer:', err);
                setError(err instanceof Error ? err : new Error('Error fetching farmer'));
            } finally {
                setIsLoading(false);
            }
        };

        if (farmerId) {
            fetchFarmer();
        }
    }, [farmerId]);

    const updateFarmerData = async (data: Partial<Farmer>): Promise<void> => {
        try {
            await updateFarmer(farmerId, data);

            // 데이터 새로고침
            const updatedFarmer = await getFarmerById(farmerId);
            setFarmer(updatedFarmer);
        } catch (err) {
            console.error('Error updating farmer:', err);
            throw err;
        }
    };

    const deleteFarmerData = async (): Promise<void> => {
        try {
            await deleteFarmer(farmerId);
            setFarmer(null);
        } catch (err) {
            console.error('Error deleting farmer:', err);
            throw err;
        }
    };

    return {
        farmer,
        isLoading,
        error,
        updateFarmer: updateFarmerData,
        deleteFarmer: deleteFarmerData
    };
}