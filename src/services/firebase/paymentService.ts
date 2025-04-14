// src/services/firebase/paymentService.ts
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
import { Payment } from '@/types';
import { getWorkerById } from './workerService';
import { getFirestore } from 'firebase/firestore';

// Firestore 컬렉션 참조
const db = getFirestore();
const paymentsCollection = collection(db, 'payments');

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
    if (result.paymentDate && result.paymentDate instanceof Timestamp) {
        result.paymentDate = result.paymentDate.toDate();
    }
    
    // 작업 상세 정보 날짜
    if (result.scheduleDetails && Array.isArray(result.scheduleDetails)) {
        result.scheduleDetails = result.scheduleDetails.map((detail: any) => {
            if (detail.date && detail.date instanceof Timestamp) {
                detail.date = detail.date.toDate();
            }
            return detail;
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
    
    // UI 표시용 필드 제거
    if (result.receiverName) {
        delete result.receiverName;
    }
    
    return result;
};

// 모든 정산 조회
export const getPayments = async (): Promise<Payment[]> => {
    try {
        const q = query(paymentsCollection, orderBy('paymentDate', 'desc'));
        const querySnapshot = await getDocs(q);

        const payments = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();
            
            // 작업자 정보 추가
            let receiverName = '';
            
            if (data.receiverId) {
                const worker = await getWorkerById(data.receiverId);
                if (worker) {
                    receiverName = worker.name;
                }
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                receiverName
            } as Payment;
        }));

        return payments;
    } catch (error) {
        console.error("Error getting payments:", error);
        throw error;
    }
};

// 작업자별 정산 내역 조회
export const getPaymentsByWorkerId = async (workerId: string): Promise<Payment[]> => {
    try {
        const q = query(
            paymentsCollection,
            where('receiverId', '==', workerId),
            orderBy('paymentDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        // 작업자 정보
        const worker = await getWorkerById(workerId);
        const receiverName = worker ? worker.name : '';
        
        const payments = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();
            
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                receiverName
            } as Payment;
        }));
        
        return payments;
    } catch (error) {
        console.error("Error getting payments by worker ID:", error);
        throw error;
    }
};

// 정산 상세 조회
export const getPaymentById = async (id: string): Promise<Payment | null> => {
    try {
        const docRef = doc(paymentsCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 작업자 정보 추가
            let receiverName = '';
            
            if (data.receiverId) {
                const worker = await getWorkerById(data.receiverId);
                if (worker) {
                    receiverName = worker.name;
                }
            }

            return {
                id: docSnap.id,
                ...convertTimestampToDate(data),
                receiverName
            } as Payment;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting payment:", error);
        throw error;
    }
};

// 정산 등록
export const createPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const newPayment = {
            ...prepareDataForFirestore(paymentData),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(paymentsCollection, newPayment);
        
        // 작업자 문서에 정산 ID 추가
        if (paymentData.receiverId) {
            const workerRef = doc(db, 'workers', paymentData.receiverId);
            const workerDoc = await getDoc(workerRef);
            
            if (workerDoc.exists()) {
                const workerData = workerDoc.data();
                const payments = workerData.payments || [];
                
                await updateDoc(workerRef, {
                    payments: [...payments, docRef.id],
                    updatedAt: serverTimestamp(),
                });
            }
        }
        
        // 각 작업 일정의 정산 상태 업데이트
        if (paymentData.scheduleIds && Array.isArray(paymentData.scheduleIds)) {
            for (const scheduleId of paymentData.scheduleIds) {
                const scheduleRef = doc(db, 'schedules', scheduleId);
                const scheduleDoc = await getDoc(scheduleRef);
                
                if (scheduleDoc.exists()) {
                    // 정산 상태 업데이트
                    let paymentStatus = 'requested'; // 기본값은 요청됨
                    
                    // 정산 상태에 따라 작업 일정 상태 설정
                    if (paymentData.status === 'completed') {
                        paymentStatus = 'completed'; // 완료
                    } else if (paymentData.status === 'processing') {
                        paymentStatus = 'onhold'; // 보류
                    }
                    
                    await updateDoc(scheduleRef, {
                        paymentStatus,
                        paymentId: docRef.id,
                        updatedAt: serverTimestamp(),
                    });
                }
            }
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating payment:", error);
        throw error;
    }
};

// 정산 정보 수정
export const updatePayment = async (id: string, paymentData: Partial<Payment>): Promise<void> => {
    try {
        const paymentRef = doc(paymentsCollection, id);
        
        // 기존 정산 정보 가져오기
        const paymentDoc = await getDoc(paymentRef);
        if (!paymentDoc.exists()) {
            throw new Error("Payment not found");
        }
        
        const oldData = paymentDoc.data();
        
        // updateAt 필드 추가
        const updateData = {
            ...prepareDataForFirestore(paymentData),
            updatedAt: serverTimestamp(),
        };
        
        await updateDoc(paymentRef, updateData);
        
        // 상태가 변경된 경우 관련 작업 일정 업데이트
        if (paymentData.status && paymentData.status !== oldData.status) {
            const scheduleIds = paymentData.scheduleIds || oldData.scheduleIds || [];
            
            // 완료 상태로 변경된 경우
            if (paymentData.status === 'completed') {
                for (const scheduleId of scheduleIds) {
                    const scheduleRef = doc(db, 'schedules', scheduleId);
                    const scheduleDoc = await getDoc(scheduleRef);
                    
                    if (scheduleDoc.exists()) {
                        await updateDoc(scheduleRef, {
                            paymentStatus: 'completed',
                            updatedAt: serverTimestamp(),
                        });
                    }
                }
            }
            // 처리중 또는 요청 상태로 변경된 경우
            else {
                for (const scheduleId of scheduleIds) {
                    const scheduleRef = doc(db, 'schedules', scheduleId);
                    const scheduleDoc = await getDoc(scheduleRef);
                    
                    if (scheduleDoc.exists()) {
                        await updateDoc(scheduleRef, {
                            paymentStatus: paymentData.status === 'processing' ? 'onhold' : 'requested',
                            updatedAt: serverTimestamp(),
                        });
                    }
                }
            }
        }
        
        // 작업 목록이 변경된 경우
        if (paymentData.scheduleIds && oldData.scheduleIds) {
            const newScheduleIds = new Set(paymentData.scheduleIds);
            const oldScheduleIds = new Set(oldData.scheduleIds);
            
            // 제거된 작업 ID (이전에 있었지만 새로운 목록에 없는 ID)
            const removedIds = [...oldScheduleIds].filter((id) => !newScheduleIds.has(id as string)) as string[];
            
            // 추가된 작업 ID (새로운 목록에 있지만 이전에 없었던 ID)
            const addedIds = [...newScheduleIds].filter((id) => !oldScheduleIds.has(id as string)) as string[];
            
            // 제거된 작업의 정산 상태 업데이트
            for (const scheduleId of removedIds) {
                const scheduleRef = doc(db, 'schedules', scheduleId as string);
                const scheduleDoc = await getDoc(scheduleRef);
                
                if (scheduleDoc.exists()) {
                    await updateDoc(scheduleRef, {
                        paymentStatus: 'pending',  // 다시 정산 대기 상태로
                        paymentId: null,
                        updatedAt: serverTimestamp(),
                    });
                }
            }
            
            // 추가된 작업의 정산 상태 업데이트
            for (const scheduleId of addedIds) {
                const scheduleRef = doc(db, 'schedules', scheduleId as string);
                const scheduleDoc = await getDoc(scheduleRef);
                
                if (scheduleDoc.exists()) {
                    // 새 정산 상태 설정
                    let paymentStatus = 'requested'; // 기본값은 요청됨
                    
                    // 정산 상태에 따라 작업 일정 상태 설정
                    if (paymentData.status === 'completed') {
                        paymentStatus = 'completed'; // 완료
                    } else if (paymentData.status === 'processing') {
                        paymentStatus = 'onhold'; // 보류
                    }
                    
                    await updateDoc(scheduleRef, {
                        paymentStatus,
                        paymentId: id,
                        updatedAt: serverTimestamp(),
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error updating payment:", error);
        throw error;
    }
};

// 정산 삭제
export const deletePayment = async (id: string): Promise<void> => {
    try {
        const paymentRef = doc(paymentsCollection, id);
        
        // 기존 정산 정보 가져오기
        const paymentDoc = await getDoc(paymentRef);
        if (!paymentDoc.exists()) {
            throw new Error("Payment not found");
        }
        
        const paymentData = paymentDoc.data();
        
        // 정산 삭제
        await deleteDoc(paymentRef);
        
        // 작업자 문서에서 정산 ID 제거
        if (paymentData.receiverId) {
            const workerRef = doc(db, 'workers', paymentData.receiverId);
            const workerDoc = await getDoc(workerRef);
            
            if (workerDoc.exists()) {
                const workerData = workerDoc.data();
                const payments = workerData.payments || [];
                
                await updateDoc(workerRef, {
                    payments: payments.filter((paymentId: string) => paymentId !== id),
                    updatedAt: serverTimestamp(),
                });
            }
        }
        
        // 각 작업 일정의 정산 상태 업데이트
        if (paymentData.scheduleIds && Array.isArray(paymentData.scheduleIds)) {
            for (const scheduleId of paymentData.scheduleIds) {
                const scheduleRef = doc(db, 'schedules', scheduleId);
                const scheduleDoc = await getDoc(scheduleRef);
                
                if (scheduleDoc.exists()) {
                    await updateDoc(scheduleRef, {
                        paymentStatus: 'pending',
                        paymentId: null,
                        updatedAt: serverTimestamp(),
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error deleting payment:", error);
        throw error;
    }
};