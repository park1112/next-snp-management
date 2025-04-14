// src/hooks/useContracts.ts
import { useState, useEffect } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import {
    getContracts,
    getContractById,
    createContract,
    updateContract,
    deleteContract,
    getContractsByFarmerId,
    getContractTypes
} from '@/services/firebase/contractService';
import { Contract } from '@/types';
import { where } from 'firebase/firestore';

// 계약 데이터를 위한 커스텀 훅
export function useContracts(farmerId?: string, statusFilter?: string) {
    const queryConstraints = [];

    if (farmerId) {
        queryConstraints.push(where('farmerId', '==', farmerId));
    }

    if (statusFilter) {
        queryConstraints.push(where('contractStatus', '==', statusFilter));
    }

    const {
        items: contracts,
        isLoading,
        error,
        getItem: getContract,
        addItem: addContract,
        updateItem: updateContractItem,
        deleteItem: deleteContractItem,
        refreshItems: refreshContracts
    } = useFirestoreCollection<Contract>({
        collectionName: 'contracts',
        orderByField: 'createdAt',
        orderDirection: 'desc',
        queryConstraints
    });

    const [contractTypes, setContractTypes] = useState<string[]>([]);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

    // 계약 유형 데이터 로드
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setIsLoadingMetadata(true);
                const contractTypesData = await getContractTypes();
                setContractTypes(contractTypesData);
            } catch (error) {
                console.error('Error fetching metadata:', error);
            } finally {
                setIsLoadingMetadata(false);
            }
        };

        fetchMetadata();
    }, []);

    // 농가별 계약 조회 함수
    const fetchContractsByFarmer = async (fId: string): Promise<Contract[]> => {
        try {
            return await getContractsByFarmerId(fId);
        } catch (error) {
            console.error('Error fetching contracts by farmer:', error);
            throw error;
        }
    };

    return {
        contracts,
        isLoading: isLoading || isLoadingMetadata,
        error,
        contractTypes,
        getContract,
        addContract,
        updateContract: updateContractItem,
        deleteContract: deleteContractItem,
        refreshContracts,
        fetchContractsByFarmer
    };
}

// 단일 계약 데이터를 위한 커스텀 훅
export function useContract(contractId: string) {
    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchContract = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const contractData = await getContractById(contractId);
                setContract(contractData);
            } catch (err) {
                console.error('Error fetching contract:', err);
                setError(err instanceof Error ? err : new Error('Error fetching contract'));
            } finally {
                setIsLoading(false);
            }
        };

        if (contractId) {
            fetchContract();
        }
    }, [contractId]);

    const updateContractData = async (data: Partial<Contract>): Promise<void> => {
        try {
            await updateContract(contractId, data);

            // 데이터 새로고침
            const updatedContract = await getContractById(contractId);
            setContract(updatedContract);
        } catch (err) {
            console.error('Error updating contract:', err);
            throw err;
        }
    };

    const deleteContractData = async (): Promise<void> => {
        try {
            await deleteContract(contractId);
            setContract(null);
        } catch (err) {
            console.error('Error deleting contract:', err);
            throw err;
        }
    };

    return {
        contract,
        isLoading,
        error,
        updateContract: updateContractData,
        deleteContract: deleteContractData
    };
}