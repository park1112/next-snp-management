// src/services/firebase/scheduleService.ts
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { Schedule } from '@/types';
import { getFarmerById } from './farmerService';
import { getFieldById } from './fieldService';
import { getWorkerById } from './workerService';
import { getFirestore } from 'firebase/firestore';

// Firestore 컬렉션 참조
const db = getFirestore();
const schedulesCollection = collection(db, 'schedules');

interface CategorySchedule {
    scheduledDate: {
        start: Date | null;
    };
    [key: string]: any;
}

// Timestamp를 Date로 변환하는 유틸리티 함수
const convertTimestampToDate = (data: any): any => {
    const result = { ...data };

    // 기본 날짜 필드
    if (result.createdAt && result.createdAt instanceof Timestamp) {
        result.createdAt = result.createdAt.toDate();
    }
    if (result.updatedAt && result.updatedAt instanceof Timestamp) {
        result.updatedAt = result.updatedAt.toDate();
    }

    // 예정 날짜
    if (result.scheduledDate) {
        if (result.scheduledDate.start && result.scheduledDate.start instanceof Timestamp) {
            result.scheduledDate.start = result.scheduledDate.start.toDate();
        }
        if (result.scheduledDate.end && result.scheduledDate.end instanceof Timestamp) {
            result.scheduledDate.end = result.scheduledDate.end.toDate();
        }
    }

    // 실제 작업 날짜
    if (result.actualDate) {
        if (result.actualDate.start && result.actualDate.start instanceof Timestamp) {
            result.actualDate.start = result.actualDate.start.toDate();
        }
        if (result.actualDate.end && result.actualDate.end instanceof Timestamp) {
            result.actualDate.end = result.actualDate.end.toDate();
        }
    }

    // 상태 변경 이력 날짜
    if (result.stage && result.stage.history && Array.isArray(result.stage.history)) {
        result.stage.history = result.stage.history.map((item: any) => {
            if (item.timestamp && item.timestamp instanceof Timestamp) {
                item.timestamp = item.timestamp.toDate();
            }
            return item;
        });
    }

    return result;
};

// Date를 Firestore에 저장 가능한 형태로 변환
const prepareDataForFirestore = (data: any): any => {
    const result = { ...data };

    // id 필드는 저장하지 않음
    if (result.id) {
        delete result.id;
    }

    // UI 표시용 필드 중 fieldAddress만 제거 (다른 필드는 유지)
    if (result.fieldAddress) {
        delete result.fieldAddress;
    }

    return result;
};

// 모든 작업 일정 조회
export const getSchedules = async (): Promise<Schedule[]> => {
    try {
        const q = query(schedulesCollection, orderBy('scheduledDate.start', 'desc'));
        const querySnapshot = await getDocs(q);

        console.log(querySnapshot.docs);

        const schedules = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();

            // 관련 정보 추가
            let farmerName = '';
            let fieldName = '';
            let fieldAddress = '';
            let workerName = '';

            // 농가 정보
            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
                }
            }

            // 농지 정보
            if (data.fieldId) {
                const field = await getFieldById(data.fieldId);
                if (field) {
                    fieldName = field.address.full.split(' ').pop() || '농지';
                    fieldAddress = field.address.full;
                }
            }

            // 작업자 정보
            if (data.workerId) {
                const worker = await getWorkerById(data.workerId);
                if (worker) {
                    workerName = worker.name;
                }
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
                fieldName,
                fieldAddress,
                workerName
            } as Schedule;
        }));

        return schedules;
    } catch (error) {
        console.error("Error getting schedules:", error);
        throw error;
    }
};


// 농가별 작업 일정 조회
export const getSchedulesByFarmerId = async (farmerId: string): Promise<Schedule[]> => {
    try {
        const q = query(
            schedulesCollection,
            where('farmerId', '==', farmerId),
            orderBy('scheduledDate.start', 'desc')
        );
        const querySnapshot = await getDocs(q);

        // 농가 정보
        const farmer = await getFarmerById(farmerId);
        const farmerName = farmer ? farmer.name : '';

        const schedules = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();

            // 농지 및 작업자 정보
            let fieldName = '';
            let fieldAddress = '';
            let workerName = '';

            if (data.fieldId) {
                const field = await getFieldById(data.fieldId);
                if (field) {
                    fieldName = field.address.full.split(' ').pop() || '농지';
                    fieldAddress = field.address.full;
                }
            }

            if (data.workerId) {
                const worker = await getWorkerById(data.workerId);
                if (worker) {
                    workerName = worker.name;
                }
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
                fieldName,
                fieldAddress,
                workerName
            } as Schedule;
        }));

        return schedules;
    } catch (error) {
        console.error("Error getting schedules by farmer ID:", error);
        throw error;
    }
};

// 작업자별 작업 일정 조회
export const getSchedulesByWorkerId = async (workerId: string): Promise<Schedule[]> => {
    try {
        const q = query(
            schedulesCollection,
            where('workerId', '==', workerId),
            orderBy('scheduledDate.start', 'desc')
        );
        const querySnapshot = await getDocs(q);

        // 작업자 정보
        const worker = await getWorkerById(workerId);
        const workerName = worker ? worker.name : '';

        const schedules = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();

            // 농가 및 농지 정보
            let farmerName = '';
            let fieldName = '';
            let fieldAddress = '';

            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
                }
            }

            if (data.fieldId) {
                const field = await getFieldById(data.fieldId);
                if (field) {
                    fieldName = field.address.full.split(' ').pop() || '농지';
                    fieldAddress = field.address.full;
                }
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
                fieldName,
                fieldAddress,
                workerName
            } as Schedule;
        }));

        return schedules;
    } catch (error) {
        console.error("Error getting schedules by worker ID:", error);
        throw error;
    }
};

// 농지별 작업 일정 조회
export const getSchedulesByFieldId = async (fieldId: string): Promise<Schedule[]> => {
    try {
        const q = query(
            schedulesCollection,
            where('fieldId', '==', fieldId),
            orderBy('scheduledDate.start', 'desc')
        );
        const querySnapshot = await getDocs(q);

        // 농지 정보
        const field = await getFieldById(fieldId);
        const fieldName = field ? field.address.full.split(' ').pop() || '농지' : '';
        const fieldAddress = field ? field.address.full : '';

        const schedules = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();

            // 농가 및 작업자 정보
            let farmerName = '';
            let workerName = '';

            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
                }
            }

            if (data.workerId) {
                const worker = await getWorkerById(data.workerId);
                if (worker) {
                    workerName = worker.name;
                }
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
                fieldName,
                fieldAddress,
                workerName
            } as Schedule;
        }));

        return schedules;
    } catch (error) {
        console.error("Error getting schedules by field ID:", error);
        throw error;
    }
};

// 작업 일정 상세 조회
export const getScheduleById = async (id: string): Promise<Schedule | null> => {
    try {
        const docRef = doc(schedulesCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // 관련 정보 추가
            let farmerName = '';
            let fieldName = '';
            let fieldAddress = '';
            let workerName = '';

            // 농가 정보
            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
                }
            }

            // 농지 정보
            if (data.fieldId) {
                const field = await getFieldById(data.fieldId);
                if (field) {
                    fieldName = field.address.full.split(' ').pop() || '농지';
                    fieldAddress = field.address.full;
                }
            }

            // 작업자 정보
            if (data.workerId) {
                const worker = await getWorkerById(data.workerId);
                if (worker) {
                    workerName = worker.name;
                }
            }

            return {
                id: docSnap.id,
                ...convertTimestampToDate(data),
                farmerName,
                fieldName,
                fieldAddress,
                workerName
            } as Schedule;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting schedule:", error);
        throw error;
    }
};

// 작업 일정 등록
export const createSchedule = async (scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        // 데이터 전처리
        const processedData = prepareDataForFirestore(scheduleData);

        // 추가: 각 이름 정보 가져오기
        const farmerName = scheduleData.farmerId ? (await getFarmerById(scheduleData.farmerId))?.name || '' : '';
        const fieldName = scheduleData.fieldId ? ((await getFieldById(scheduleData.fieldId))?.address.full.split(' ').pop() || '농지') : '';
        const workerName = scheduleData.workerId ? (await getWorkerById(scheduleData.workerId))?.name || '' : '';

        // 상태 이력 준비 (serverTimestamp 제거)
        let stageHistory = [];
        if (scheduleData.stage?.history && Array.isArray(scheduleData.stage.history)) {
            stageHistory = scheduleData.stage.history.map(item => ({
                ...item,
                timestamp: item.timestamp || new Date() // serverTimestamp() 대신 Date 객체 사용
            }));
        } else {
            stageHistory = [{
                stage: scheduleData.stage?.current || '예정',
                timestamp: new Date(), // serverTimestamp() 대신 Date 객체 사용
                by: 'system'
            }];
        }

        // 날짜 필드 직접 처리 - 별도 변수에 저장하지 않고 바로 객체에 병합
        const newSchedule = {
            ...processedData,
            stage: {
                current: scheduleData.stage?.current || '예정',
                history: stageHistory
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            farmerName,
            fieldName,
            workerName
        };

        // scheduledDate 필드 추가 (필요하다면)
        if (scheduleData.scheduledDate) {
            newSchedule.scheduledDate = {
                start: scheduleData.scheduledDate.start instanceof Date ?
                    Timestamp.fromDate(scheduleData.scheduledDate.start) :
                    (typeof scheduleData.scheduledDate.start === 'string' ?
                        Timestamp.fromDate(new Date(scheduleData.scheduledDate.start)) : null),
                end: scheduleData.scheduledDate.end instanceof Date ?
                    Timestamp.fromDate(scheduleData.scheduledDate.end) :
                    (typeof scheduleData.scheduledDate.end === 'string' ?
                        Timestamp.fromDate(new Date(scheduleData.scheduledDate.end)) : null)
            };
        }

        console.log("저장할 데이터:", newSchedule);
        const docRef = await addDoc(schedulesCollection, newSchedule);

        // 농가 문서에 작업 ID 추가
        if (scheduleData.farmerId) {
            const farmerRef = doc(db, 'farmers', scheduleData.farmerId);
            const farmerDoc = await getDoc(farmerRef);

            if (farmerDoc.exists()) {
                const farmerData = farmerDoc.data();
                const schedules = farmerData.schedules || [];

                await updateDoc(farmerRef, {
                    schedules: [...schedules, docRef.id],
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 농지 문서에 작업 ID 추가
        if (scheduleData.fieldId) {
            const fieldRef = doc(db, 'fields', scheduleData.fieldId);
            const fieldDoc = await getDoc(fieldRef);

            if (fieldDoc.exists()) {
                const fieldData = fieldDoc.data();
                const schedules = fieldData.schedules || [];

                await updateDoc(fieldRef, {
                    schedules: [...schedules, docRef.id],
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 작업자 문서에 작업 ID 추가
        if (scheduleData.workerId) {
            const workerRef = doc(db, 'workers', scheduleData.workerId);
            const workerDoc = await getDoc(workerRef);

            if (workerDoc.exists()) {
                const workerData = workerDoc.data();
                const schedules = workerData.schedules || [];

                await updateDoc(workerRef, {
                    schedules: [...schedules, docRef.id],
                    updatedAt: serverTimestamp(),
                });
            }
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating schedule:", error);
        throw error;
    }
};

// 작업 일정 정보 수정
export const updateSchedule = async (id: string, scheduleData: Partial<Schedule>): Promise<void> => {
    try {
        const scheduleRef = doc(schedulesCollection, id);

        // 기존 작업 정보 가져오기
        const scheduleDoc = await getDoc(scheduleRef);
        if (!scheduleDoc.exists()) {
            throw new Error("Schedule not found");
        }

        const oldData = scheduleDoc.data();

        // updateAt 필드 추가
        const updateData = {
            ...prepareDataForFirestore(scheduleData),
            updatedAt: serverTimestamp(),
        };

        await updateDoc(scheduleRef, updateData);

        // 작업자가 변경된 경우 참조 업데이트
        if (scheduleData.workerId && scheduleData.workerId !== oldData.workerId) {
            // 이전 작업자 문서에서 작업 ID 제거
            if (oldData.workerId) {
                const oldWorkerRef = doc(db, 'workers', oldData.workerId);
                const oldWorkerDoc = await getDoc(oldWorkerRef);

                if (oldWorkerDoc.exists()) {
                    const oldWorkerData = oldWorkerDoc.data();
                    const schedules = oldWorkerData.schedules || [];

                    await updateDoc(oldWorkerRef, {
                        schedules: schedules.filter((scheduleId: string) => scheduleId !== id),
                        updatedAt: serverTimestamp(),
                    });
                }
            }

            // 새 작업자 문서에 작업 ID 추가
            const newWorkerRef = doc(db, 'workers', scheduleData.workerId);
            const newWorkerDoc = await getDoc(newWorkerRef);

            if (newWorkerDoc.exists()) {
                const newWorkerData = newWorkerDoc.data();
                const schedules = newWorkerData.schedules || [];

                await updateDoc(newWorkerRef, {
                    schedules: [...schedules, id],
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 농지가 변경된 경우 참조 업데이트
        if (scheduleData.fieldId && scheduleData.fieldId !== oldData.fieldId) {
            // 이전 농지 문서에서 작업 ID 제거
            if (oldData.fieldId) {
                const oldFieldRef = doc(db, 'fields', oldData.fieldId);
                const oldFieldDoc = await getDoc(oldFieldRef);

                if (oldFieldDoc.exists()) {
                    const oldFieldData = oldFieldDoc.data();
                    const schedules = oldFieldData.schedules || [];

                    await updateDoc(oldFieldRef, {
                        schedules: schedules.filter((scheduleId: string) => scheduleId !== id),
                        updatedAt: serverTimestamp(),
                    });
                }
            }

            // 새 농지 문서에 작업 ID 추가
            const newFieldRef = doc(db, 'fields', scheduleData.fieldId);
            const newFieldDoc = await getDoc(newFieldRef);

            if (newFieldDoc.exists()) {
                const newFieldData = newFieldDoc.data();
                const schedules = newFieldData.schedules || [];

                await updateDoc(newFieldRef, {
                    schedules: [...schedules, id],
                    updatedAt: serverTimestamp(),
                });
            }
        }
    } catch (error) {
        console.error("Error updating schedule:", error);
        throw error;
    }
};

// 작업 일정 삭제
export const deleteSchedule = async (id: string): Promise<void> => {
    try {
        const scheduleRef = doc(schedulesCollection, id);

        // 기존 작업 정보 가져오기
        const scheduleDoc = await getDoc(scheduleRef);
        if (!scheduleDoc.exists()) {
            throw new Error("Schedule not found");
        }

        const scheduleData = scheduleDoc.data();

        // 작업 삭제
        await deleteDoc(scheduleRef);

        // 농가 문서에서 작업 ID 제거
        if (scheduleData.farmerId) {
            const farmerRef = doc(db, 'farmers', scheduleData.farmerId);
            const farmerDoc = await getDoc(farmerRef);

            if (farmerDoc.exists()) {
                const farmerData = farmerDoc.data();
                const schedules = farmerData.schedules || [];

                await updateDoc(farmerRef, {
                    schedules: schedules.filter((scheduleId: string) => scheduleId !== id),
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 농지 문서에서 작업 ID 제거
        if (scheduleData.fieldId) {
            const fieldRef = doc(db, 'fields', scheduleData.fieldId);
            const fieldDoc = await getDoc(fieldRef);

            if (fieldDoc.exists()) {
                const fieldData = fieldDoc.data();
                const schedules = fieldData.schedules || [];

                await updateDoc(fieldRef, {
                    schedules: schedules.filter((scheduleId: string) => scheduleId !== id),
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 작업자 문서에서 작업 ID 제거
        if (scheduleData.workerId) {
            const workerRef = doc(db, 'workers', scheduleData.workerId);
            const workerDoc = await getDoc(workerRef);

            if (workerDoc.exists()) {
                const workerData = workerDoc.data();
                const schedules = workerData.schedules || [];

                await updateDoc(workerRef, {
                    schedules: schedules.filter((scheduleId: string) => scheduleId !== id),
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 정산 정보가 있는 경우 정산에서도 제거
        if (scheduleData.paymentId) {
            const paymentRef = doc(db, 'payments', scheduleData.paymentId);
            const paymentDoc = await getDoc(paymentRef);

            if (paymentDoc.exists()) {
                const paymentData = paymentDoc.data();
                const scheduleIds = paymentData.scheduleIds || [];

                await updateDoc(paymentRef, {
                    scheduleIds: scheduleIds.filter((scheduleId: string) => scheduleId !== id),
                    updatedAt: serverTimestamp(),
                });
            }
        }
    } catch (error) {
        console.error("Error deleting schedule:", error);
        throw error;
    }
};

// 작업 일정 상태 업데이트
export const updateScheduleStage = async (id: string, stage: string, userId: string): Promise<void> => {
    try {
        const scheduleRef = doc(schedulesCollection, id);

        // 기존 작업 정보 가져오기
        const scheduleDoc = await getDoc(scheduleRef);
        if (!scheduleDoc.exists()) {
            throw new Error("Schedule not found");
        }

        const scheduleData = scheduleDoc.data();

        // 상태 변경 이력 업데이트
        const history = scheduleData.stage?.history || [];

        // 새로운 이력 항목 추가
        history.push({
            stage,
            timestamp: serverTimestamp(),
            by: userId
        });

        // 현재 상태 및 이력 업데이트
        await updateDoc(scheduleRef, {
            'stage.current': stage,
            'stage.history': history,
            updatedAt: serverTimestamp(),
        });

        // 상태가 '완료'로 변경된 경우 실제 작업 시간 기록
        if (stage === '완료' && !scheduleData.actualDate?.end) {
            const actualStart = scheduleData.actualDate?.start || scheduleData.scheduledDate?.start;

            await updateDoc(scheduleRef, {
                actualDate: {
                    start: actualStart,
                    end: serverTimestamp()
                }
            });
        }

        // 상태가 '취소'로 변경된 경우 정산 상태 업데이트
        if (stage === '취소' && scheduleData.paymentId) {
            // 정산에서 이 일정 제거
            const paymentRef = doc(db, 'payments', scheduleData.paymentId);
            const paymentDoc = await getDoc(paymentRef);

            if (paymentDoc.exists()) {
                const paymentData = paymentDoc.data();
                const scheduleIds = paymentData.scheduleIds || [];

                await updateDoc(paymentRef, {
                    scheduleIds: scheduleIds.filter((scheduleId: string) => scheduleId !== id),
                    updatedAt: serverTimestamp(),
                });
            }

            // 이 일정의 정산 상태 업데이트
            await updateDoc(scheduleRef, {
                paymentStatus: 'pending',
                paymentId: null
            });
        }
    } catch (error) {
        console.error("Error updating schedule stage:", error);
        throw error;
    }
};

