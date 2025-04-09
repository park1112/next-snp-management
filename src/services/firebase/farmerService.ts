// src/services/firebase/farmerService.ts
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
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
const convertTimestampToDate = (data: any): any => {
    if (!data) return data;

    if (data instanceof Timestamp) {
        return data.toDate();
    }

    if (Array.isArray(data)) {
        return data.map(item => convertTimestampToDate(item));
    }

    if (typeof data === 'object') {
        const result: { [key: string]: any } = {};
        for (const key in data) {
            result[key] = convertTimestampToDate(data[key]);
        }
        return result;
    }

    return data;
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