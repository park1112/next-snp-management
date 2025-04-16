// src/services/firebase/farmerService.ts
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
    Timestamp,
    startAt,
    endAt,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Farmer } from '@/types';

// Firestore 인스턴스
const db = getFirestore();
const farmersCollection = collection(db, 'farmers');

// Timestamp to Date 변환 함수
const convertTimestampToDate = (
    data: Record<string, unknown>
): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...data };

    if (result.createdAt && result.createdAt instanceof Timestamp) {
        result.createdAt = (result.createdAt as Timestamp).toDate();
    }
    if (result.updatedAt && result.updatedAt instanceof Timestamp) {
        result.updatedAt = (result.updatedAt as Timestamp).toDate();
    }
    if (result.contractDate && result.contractDate instanceof Timestamp) {
        result.contractDate = (result.contractDate as Timestamp).toDate();
    }

    // 예시: downPayment 처리 (필요한 부분만 표시)
    if (result.downPayment && typeof result.downPayment === 'object') {
        const dp = result.downPayment as Record<string, unknown>;
        if (dp.dueDate && dp.dueDate instanceof Timestamp) {
            dp.dueDate = (dp.dueDate as Timestamp).toDate();
        }
        if (dp.paidDate && dp.paidDate instanceof Timestamp) {
            dp.paidDate = (dp.paidDate as Timestamp).toDate();
        }
    }

    if (result.intermediatePayments && Array.isArray(result.intermediatePayments)) {
        result.intermediatePayments = (result.intermediatePayments as Record<string, unknown>[]).map(
            (payment: Record<string, unknown>) => {
                if (payment.dueDate && payment.dueDate instanceof Timestamp) {
                    payment.dueDate = (payment.dueDate as Timestamp).toDate();
                }
                if (payment.paidDate && payment.paidDate instanceof Timestamp) {
                    payment.paidDate = (payment.paidDate as Timestamp).toDate();
                }
                return payment;
            }
        );
    }

    if (result.finalPayment && typeof result.finalPayment === 'object') {
        const fp = result.finalPayment as Record<string, unknown>;
        if (fp.dueDate && fp.dueDate instanceof Timestamp) {
            fp.dueDate = (fp.dueDate as Timestamp).toDate();
        }
        if (fp.paidDate && fp.paidDate instanceof Timestamp) {
            fp.paidDate = (fp.paidDate as Timestamp).toDate();
        }
    }

    if (
        result.contractDetails &&
        typeof result.contractDetails === 'object' &&
        (result.contractDetails as Record<string, unknown>).harvestPeriod
    ) {
        const harvestPeriod = (result.contractDetails as Record<string, unknown>).harvestPeriod as Record<string, unknown>;
        if (harvestPeriod.start && harvestPeriod.start instanceof Timestamp) {
            harvestPeriod.start = (harvestPeriod.start as Timestamp).toDate();
        }
        if (harvestPeriod.end && harvestPeriod.end instanceof Timestamp) {
            harvestPeriod.end = (harvestPeriod.end as Timestamp).toDate();
        }
    }

    if (result.attachments && Array.isArray(result.attachments)) {
        result.attachments = (result.attachments as Record<string, unknown>[]).map(
            (attachment: Record<string, unknown>) => {
                if (attachment.uploadedAt && attachment.uploadedAt instanceof Timestamp) {
                    attachment.uploadedAt = (attachment.uploadedAt as Timestamp).toDate();
                }
                return attachment;
            }
        );
    }

    return result;
};


// 모든 농가 조회
export const getFarmers = async (): Promise<Farmer[]> => {
    try {
        const q = query(farmersCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);

        const farmers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
            } as Farmer;
        });

        return farmers;
    } catch (error) {
        console.error("Error getting farmers:", error);
        throw error;
    }
};

// 농가 검색 (이름, 전화번호, 지역별)
export const searchFarmers = async (
    searchType: 'name' | 'phoneNumber' | 'subdistrict',
    searchValue: string
): Promise<Farmer[]> => {
    try {
        let q;

        if (searchType === 'name') {
            // 이름 검색 - 시작 문자열 매칭
            const end = searchValue + '\uf8ff';
            q = query(
                farmersCollection,
                orderBy('name'),
                startAt(searchValue),
                endAt(end)
            );
        } else {
            // 전화번호 또는 지역 검색
            q = query(
                farmersCollection,
                where(searchType, '==', searchValue),
                orderBy('name')
            );
        }

        const querySnapshot = await getDocs(q);

        const farmers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
            } as Farmer;
        });

        return farmers;
    } catch (error) {
        console.error(`Error searching farmers by ${searchType}:`, error);
        throw error;
    }
};

// 농가 상세 조회
export const getFarmerById = async (id: string): Promise<Farmer | null> => {
    try {
        const docRef = doc(farmersCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...convertTimestampToDate(data),
            } as Farmer;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting farmer:", error);
        throw error;
    }
};

// 농가 등록
export const createFarmer = async (farmerData: Omit<Farmer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error("User not authenticated");
        }

        const newFarmer = {
            ...farmerData,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(farmersCollection, newFarmer);
        return docRef.id;
    } catch (error) {
        console.error("Error creating farmer:", error);
        throw error;
    }
};

// 농가 정보 수정
export const updateFarmer = async (id: string, farmerData: Partial<Farmer>): Promise<void> => {
    try {
        const farmerRef = doc(farmersCollection, id);

        // updateAt 필드 추가
        const updateData = {
            ...farmerData,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(farmerRef, updateData);
    } catch (error) {
        console.error("Error updating farmer:", error);
        throw error;
    }
};

// 농가 삭제
export const deleteFarmer = async (id: string): Promise<void> => {
    try {
        const farmerRef = doc(farmersCollection, id);
        await deleteDoc(farmerRef);
    } catch (error) {
        console.error("Error deleting farmer:", error);
        throw error;
    }
};

// 면단위 목록 조회 (고유값)
export const getSubdistricts = async (): Promise<string[]> => {
    try {
        const querySnapshot = await getDocs(farmersCollection);

        const subdistrictsSet = new Set<string>();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.subdistrict) {
                subdistrictsSet.add(data.subdistrict);
            }
        });

        return Array.from(subdistrictsSet).sort();
    } catch (error) {
        console.error("Error getting subdistricts:", error);
        throw error;
    }
};

// 결제소속 목록 조회 (고유값)
export const getPaymentGroups = async (): Promise<string[]> => {
    try {
        const querySnapshot = await getDocs(farmersCollection);

        const paymentGroupsSet = new Set<string>();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.paymentGroup) {
                paymentGroupsSet.add(data.paymentGroup);
            }
        });

        return Array.from(paymentGroupsSet).sort();
    } catch (error) {
        console.error("Error getting payment groups:", error);
        throw error;
    }
};