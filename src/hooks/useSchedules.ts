// src/hooks/useSchedules.ts
import { useState, useEffect } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import {
    getSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByFarmerId,
    getSchedulesByWorkerId,
    getSchedulesByFieldId,
    updateScheduleStage
} from '@/services/firebase/scheduleService';
import { Schedule, Worker, Foreman } from '@/types';
import { where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getWorkers } from '@/services/firebase/workerService';

// 작업 일정 데이터를 위한 커스텀 훅
export function useSchedules(farmerId?: string, workerId?: string, fieldId?: string, typeFilter?: string) {
    const queryConstraints = [];

    if (farmerId) {
        queryConstraints.push(where('farmerId', '==', farmerId));
    }

    if (workerId) {
        queryConstraints.push(where('workerId', '==', workerId));
    }

    if (fieldId) {
        queryConstraints.push(where('fieldId', '==', fieldId));
    }

    if (typeFilter) {
        queryConstraints.push(where('type', '==', typeFilter));
    }

    const {
        items: schedules,
        isLoading,
        error,
        getItem: getSchedule,
        addItem: addSchedule,
        updateItem: updateScheduleItem,
        deleteItem: deleteScheduleItem,
        refreshItems: refreshSchedules
    } = useFirestoreCollection<Schedule>({
        collectionName: 'schedules',
        orderByField: 'farmerId', // 색인에 맞게 변경
        orderDirection: 'desc',
        queryConstraints
    });

    // 농가별 작업 일정 조회 함수
    const fetchSchedulesByFarmer = async (fId: string): Promise<Schedule[]> => {
        try {
            return await getSchedulesByFarmerId(fId);
        } catch (error) {
            console.error('Error fetching schedules by farmer:', error);
            throw error;
        }
    };

    // 카테고리별 작업자 정보 조회 함수
    // src/hooks/useSchedules.ts의 fetchWorkersByCategory 함수 수정
    const fetchWorkersByCategory = async (categoryName: string): Promise<Worker[]> => {
        try {
            const workers = await getWorkers() as Worker[];
            return workers.filter(worker => {
                if (worker.type === 'foreman') {
                    const foreman = worker as Foreman;
                    // 타입 구조에 맞게 수정
                    if (Array.isArray(foreman.foremanInfo.category.name)) {
                        return foreman.foremanInfo.category.name.includes(categoryName);
                    }
                    // 타입이 문자열인 경우 호환성 유지
                    if (typeof foreman.foremanInfo.category === 'string') {
                        return foreman.foremanInfo.category === categoryName;
                    }
                    return false;
                }
                return false;
            });
        } catch (error) {
            console.error('Error fetching workers by category:', error);
            throw error;
        }
    };

    // 작업자별 작업 일정 조회 함수
    const fetchSchedulesByWorker = async (wId: string): Promise<Schedule[]> => {
        try {
            return await getSchedulesByWorkerId(wId);
        } catch (error) {
            console.error('Error fetching schedules by worker:', error);
            throw error;
        }
    };

    // 농지별 작업 일정 조회 함수
    const fetchSchedulesByField = async (fId: string): Promise<Schedule[]> => {
        try {
            return await getSchedulesByFieldId(fId);
        } catch (error) {
            console.error('Error fetching schedules by field:', error);
            throw error;
        }
    };

    // 작업 상태 업데이트 함수
    const updateStage = async (scheduleId: string, stage: string): Promise<void> => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('User not authenticated');
            }

            await updateScheduleStage(scheduleId, stage, user.uid);
            await refreshSchedules();
        } catch (error) {
            console.error('Error updating schedule stage:', error);
            throw error;
        }
    };

    return {
        schedules,
        isLoading,
        error,
        getSchedule,
        addSchedule,
        updateSchedule: updateScheduleItem,
        deleteSchedule: deleteScheduleItem,
        refreshSchedules,
        fetchSchedulesByFarmer,
        fetchSchedulesByWorker,
        fetchSchedulesByField,
        updateStage,
        fetchWorkersByCategory
    };
}

// 단일 작업 일정 데이터를 위한 커스텀 훅
export function useSchedule(scheduleId: string) {
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const scheduleData = await getScheduleById(scheduleId);
                setSchedule(scheduleData);
            } catch (err) {
                console.error('Error fetching schedule:', err);
                setError(err instanceof Error ? err : new Error('Error fetching schedule'));
            } finally {
                setIsLoading(false);
            }
        };

        if (scheduleId) {
            fetchSchedule();
        }
    }, [scheduleId]);

    const updateScheduleData = async (data: Partial<Schedule>): Promise<void> => {
        try {
            await updateSchedule(scheduleId, data);

            // 데이터 새로고침
            const updatedSchedule = await getScheduleById(scheduleId);
            setSchedule(updatedSchedule);
        } catch (err) {
            console.error('Error updating schedule:', err);
            throw err;
        }
    };

    const deleteScheduleData = async (): Promise<void> => {
        try {
            await deleteSchedule(scheduleId);
            setSchedule(null);
        } catch (err) {
            console.error('Error deleting schedule:', err);
            throw err;
        }
    };

    const updateScheduleStageData = async (stage: string): Promise<void> => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('User not authenticated');
            }

            await updateScheduleStage(scheduleId, stage, user.uid);

            // 데이터 새로고침
            const updatedSchedule = await getScheduleById(scheduleId);
            setSchedule(updatedSchedule);
        } catch (err) {
            console.error('Error updating schedule stage:', err);
            throw err;
        }
    };

    return {
        schedule,
        isLoading,
        error,
        updateSchedule: updateScheduleData,
        deleteSchedule: deleteScheduleData,
        updateScheduleStage: updateScheduleStageData
    };
}