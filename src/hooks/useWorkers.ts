// src/hooks/useWorkers.ts
import { useState, useEffect } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import {
    getWorkers,
    getForemen,
    getDrivers,
    getWorkerById,
    createForeman,
    createDriver,
    updateWorker,
    deleteWorker,
    searchWorkers as searchWorkersService,
    getForemanCategories,
    getVehicleTypes,
    getDriverCategories
} from '@/services/firebase/workerService';
import { Worker, Foreman, Driver } from '@/types';
import { where } from 'firebase/firestore';

// 모든 작업자 데이터를 위한 커스텀 훅
export function useWorkers(workerType?: 'foreman' | 'driver') {
    const queryConstraints = workerType
        ? [where('type', '==', workerType)]
        : [];

    const {
        items: workers,
        isLoading,
        error,
        getItem: getWorker,
        addItem: addWorker,
        updateItem: updateWorkerItem,
        deleteItem: deleteWorkerItem,
        refreshItems: refreshWorkers
    } = useFirestoreCollection<Worker>({
        collectionName: 'workers',
        orderByField: 'name',
        orderDirection: 'asc',
        queryConstraints
    });

    const [foremanCategories, setForemanCategories] = useState<string[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
    const [driverCategories, setDriverCategories] = useState<string[]>([]);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

    // 메타데이터 로드
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setIsLoadingMetadata(true);

                // 필요한 메타데이터만 로드
                if (!workerType || workerType === 'foreman') {
                    const foremanCategoriesData = await getForemanCategories();
                    setForemanCategories(foremanCategoriesData);
                }

                if (!workerType || workerType === 'driver') {
                    const vehicleTypesData = await getVehicleTypes();
                    const driverCategoriesData = await getDriverCategories();
                    setVehicleTypes(vehicleTypesData);
                    setDriverCategories(driverCategoriesData);
                }
            } catch (error) {
                console.error('Error fetching metadata:', error);
            } finally {
                setIsLoadingMetadata(false);
            }
        };

        fetchMetadata();
    }, [workerType]);

    // 작업반장 등록 함수
    const addForeman = async (foremanData: Omit<Foreman, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        try {
            const id = await createForeman(foremanData);
            await refreshWorkers();
            return id;
        } catch (error) {
            console.error('Error adding foreman:', error);
            throw error;
        }
    };

    // 운송기사 등록 함수
    const addDriver = async (driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        try {
            const id = await createDriver(driverData);
            await refreshWorkers();
            return id;
        } catch (error) {
            console.error('Error adding driver:', error);
            throw error;
        }
    };

    // 작업자 검색 함수
    const searchWorkers = async (
        searchType: 'name' | 'phoneNumber' | 'vehicleNumber',
        searchValue: string
    ): Promise<Worker[]> => {
        try {
            return await searchWorkersService(searchType, searchValue, workerType);
        } catch (error) {
            console.error('Error searching workers:', error);
            throw error;
        }
    };

    // 작업반장 필터링
    const foremen = workers.filter(worker => worker.type === 'foreman') as Foreman[];

    // 운송기사 필터링
    const drivers = workers.filter(worker => worker.type === 'driver') as Driver[];

    return {
        workers,
        foremen,
        drivers,
        isLoading: isLoading || isLoadingMetadata,
        error,
        foremanCategories,
        vehicleTypes,
        driverCategories,
        getWorker,
        addWorker,
        addForeman,
        addDriver,
        updateWorker: updateWorkerItem,
        deleteWorker: deleteWorkerItem,
        refreshWorkers,
        searchWorkers
    };
}

// 작업반장 데이터만을 위한 커스텀 훅
export function useForemen() {
    const {
        workers: foremen,
        isLoading,
        error,
        foremanCategories,
        getWorker,
        addForeman,
        updateWorker,
        deleteWorker,
        refreshWorkers: refreshForemen,
        searchWorkers
    } = useWorkers('foreman');

    return {
        foremen,
        isLoading,
        error,
        foremanCategories,
        getForeman: getWorker,
        addForeman,
        updateForeman: updateWorker,
        deleteForeman: deleteWorker,
        refreshForemen,
        searchForemen: (searchType: 'name' | 'phoneNumber', searchValue: string) =>
            searchWorkers(searchType, searchValue)
    };
}

// 운송기사 데이터만을 위한 커스텀 훅
export function useDrivers() {
    const {
        workers: drivers,
        isLoading,
        error,
        vehicleTypes,
        driverCategories,
        getWorker,
        addDriver,
        updateWorker,
        deleteWorker,
        refreshWorkers: refreshDrivers,
        searchWorkers
    } = useWorkers('driver');

    return {
        drivers,
        isLoading,
        error,
        vehicleTypes,
        driverCategories,
        getDriver: getWorker,
        addDriver,
        updateDriver: updateWorker,
        deleteDriver: deleteWorker,
        refreshDrivers,
        searchDrivers: (searchType: 'name' | 'phoneNumber' | 'vehicleNumber', searchValue: string) =>
            searchWorkers(searchType, searchValue)
    };
}

// 단일 작업자 데이터를 위한 커스텀 훅
export function useWorker(workerId: string) {
    const [worker, setWorker] = useState<Worker | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const workerData = await getWorkerById(workerId);
                setWorker(workerData);
            } catch (err) {
                console.error('Error fetching worker:', err);
                setError(err instanceof Error ? err : new Error('Error fetching worker'));
            } finally {
                setIsLoading(false);
            }
        };

        if (workerId) {
            fetchWorker();
        }
    }, [workerId]);

    const updateWorkerData = async (data: Partial<Worker>): Promise<void> => {
        try {
            await updateWorker(workerId, data);

            // 데이터 새로고침
            const updatedWorker = await getWorkerById(workerId);
            setWorker(updatedWorker);
        } catch (err) {
            console.error('Error updating worker:', err);
            throw err;
        }
    };

    const deleteWorkerData = async (): Promise<void> => {
        try {
            await deleteWorker(workerId);
            setWorker(null);
        } catch (err) {
            console.error('Error deleting worker:', err);
            throw err;
        }
    };

    return {
        worker,
        isForeman: worker?.type === 'foreman',
        isDriver: worker?.type === 'driver',
        isLoading,
        error,
        updateWorker: updateWorkerData,
        deleteWorker: deleteWorkerData
    };
}

