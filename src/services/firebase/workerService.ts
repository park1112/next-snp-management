// src/services/firebase/workerService.ts
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
import { Worker, Foreman, Driver } from '@/types';

// Firestore 인스턴스
const db = getFirestore();
const workersCollection = collection(db, 'workers');

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

// 모든 작업자 조회
export const getWorkers = async (): Promise<Worker[]> => {
    try {
        const q = query(workersCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);

        const workers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
            } as Worker;
        });

        return workers;
    } catch (error) {
        console.error("Error getting workers:", error);
        throw error;
    }
};

// 작업반장만 조회
export const getForemen = async (): Promise<Foreman[]> => {
    try {
        const q = query(
            workersCollection,
            where('type', '==', 'foreman'),
            orderBy('name')
        );
        const querySnapshot = await getDocs(q);

        const foremen = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
            } as Foreman;
        });

        return foremen;
    } catch (error) {
        console.error("Error getting foremen:", error);
        throw error;
    }
};

// 운송기사만 조회
export const getDrivers = async (): Promise<Driver[]> => {
    try {
        const q = query(
            workersCollection,
            where('type', '==', 'driver'),
            orderBy('name')
        );
        const querySnapshot = await getDocs(q);

        const drivers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
            } as Driver;
        });

        return drivers;
    } catch (error) {
        console.error("Error getting drivers:", error);
        throw error;
    }
};

// 작업자 상세 조회
export const getWorkerById = async (id: string): Promise<Worker | null> => {
    try {
        const docRef = doc(workersCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...convertTimestampToDate(data),
            } as Worker;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting worker:", error);
        throw error;
    }
};

// 작업자 검색 (이름 또는 전화번호)
export const searchWorkers = async (
    searchType: 'name' | 'phoneNumber' | 'vehicleNumber',
    searchValue: string,
    workerType?: 'foreman' | 'driver'
): Promise<Worker[]> => {
    try {
        let q;

        if (searchType === 'name') {
            // 이름 검색 - 시작 문자열 매칭
            const end = searchValue + '\uf8ff';

            if (workerType) {
                q = query(
                    workersCollection,
                    where('type', '==', workerType),
                    orderBy('name'),
                    startAt(searchValue),
                    endAt(end)
                );
            } else {
                q = query(
                    workersCollection,
                    orderBy('name'),
                    startAt(searchValue),
                    endAt(end)
                );
            }
        } else if (searchType === 'vehicleNumber' && workerType === 'driver') {
            // 차량번호 검색 (운송기사만 해당)
            // 마지막 4자리로 검색할 경우
            if (searchValue.length <= 4) {
                q = query(
                    workersCollection,
                    where('type', '==', 'driver'),
                    where('driverInfo.vehicleNumberLast4', '==', searchValue)
                );
            } else {
                // 전체 차량번호로 검색
                q = query(
                    workersCollection,
                    where('type', '==', 'driver'),
                    where('driverInfo.vehicleNumber', '==', searchValue)
                );
            }
        } else {
            // 전화번호 검색
            if (workerType) {
                q = query(
                    workersCollection,
                    where('type', '==', workerType),
                    where(searchType, '==', searchValue)
                );
            } else {
                q = query(
                    workersCollection,
                    where(searchType, '==', searchValue)
                );
            }
        }

        const querySnapshot = await getDocs(q);

        const workers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
            } as Worker;
        });

        return workers;
    } catch (error) {
        console.error(`Error searching workers by ${searchType}:`, error);
        throw error;
    }
};

// 작업반장 등록
export const createForeman = async (foremanData: Omit<Foreman, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error("User not authenticated");
        }

        // 차량번호 마지막 4자리 처리
        if (foremanData.type === 'foreman' && !foremanData.foremanInfo.rates) {
            foremanData.foremanInfo.rates = {
                detailedRates: []
            };
        }
        // 단가 정보 처리
        const processedData = {
            ...foremanData,
            type: 'foreman' as const,
            foremanInfo: {
                ...foremanData.foremanInfo,
                // 단가 정보가 제대로 되어 있는지 확인
                rates: {
                    detailedRates: foremanData.foremanInfo.rates?.detailedRates || []
                }
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(workersCollection, processedData);
        return docRef.id;
    } catch (error) {
        console.error("Error creating foreman:", error);
        throw error;
    }
};

// 운송기사 등록
export const createDriver = async (driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error("User not authenticated");
        }

        // 차량번호 마지막 4자리 추출
        if (driverData.type === 'driver' && driverData.driverInfo.vehicleNumber) {
            const vehicleNumber = driverData.driverInfo.vehicleNumber.replace(/\s/g, '');
            driverData.driverInfo.vehicleNumberLast4 = vehicleNumber.slice(-4);
        }

        const newDriver = {
            ...driverData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(workersCollection, newDriver);
        return docRef.id;
    } catch (error) {
        console.error("Error creating driver:", error);
        throw error;
    }
};

// 작업자 정보 수정
export const updateWorker = async (id: string, workerData: Partial<Worker>): Promise<void> => {
    try {
        const workerRef = doc(workersCollection, id);

        // 운송기사인 경우 차량번호 마지막 4자리 업데이트
        if (
            workerData.type === 'driver' &&
            workerData.driverInfo?.vehicleNumber
        ) {
            const vehicleNumber = workerData.driverInfo.vehicleNumber.replace(/\s/g, '');
            workerData.driverInfo.vehicleNumberLast4 = vehicleNumber.slice(-4);
        }

        // updateAt 필드 추가
        const updateData = {
            ...workerData,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(workerRef, updateData);
    } catch (error) {
        console.error("Error updating worker:", error);
        throw error;
    }
};

// 작업자 삭제
export const deleteWorker = async (id: string): Promise<void> => {
    try {
        const workerRef = doc(workersCollection, id);
        await deleteDoc(workerRef);
    } catch (error) {
        console.error("Error deleting worker:", error);
        throw error;
    }
};

// 작업 구분 목록 조회 (작업반장)
export const getForemanCategories = async (): Promise<string[]> => {
    try {
        const q = query(
            workersCollection,
            where('type', '==', 'foreman')
        );
        const querySnapshot = await getDocs(q);

        const categoriesSet = new Set<string>();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.foremanInfo?.category) {
                // category가 객체이고 name 배열이 있는 경우
                if (data.foremanInfo.category.name && Array.isArray(data.foremanInfo.category.name)) {
                    data.foremanInfo.category.name.forEach((cat: string) => categoriesSet.add(cat));
                }
                // category가 문자열인 경우 (이전 데이터 구조와의 호환성을 위해)
                else if (typeof data.foremanInfo.category === 'string') {
                    categoriesSet.add(data.foremanInfo.category);
                }
            }
        });

        return Array.from(categoriesSet).sort();
    } catch (error) {
        console.error("Error getting foreman categories:", error);
        throw error;
    }
};

// 카테고리별 작업자 조회 함수 추가
export const getWorkersByCategory = async (categoryName: string): Promise<Worker[]> => {
    try {
        const workersData = await getWorkers();
        return workersData.filter(worker => {
            if (worker.type === 'foreman') {
                const foreman = worker as Foreman;
                // category가 배열인 경우
                if (Array.isArray(foreman.foremanInfo.category)) {
                    return foreman.foremanInfo.category.includes(categoryName);
                }
                // category가 문자열인 경우
                else if (typeof foreman.foremanInfo.category === 'string') {
                    return foreman.foremanInfo.category === categoryName;
                }
            }
            return false;
        });
    } catch (error) {
        console.error('Error fetching workers by category:', error);
        throw error;
    }
};

// 차량 종류 목록 조회 (운송기사)
export const getVehicleTypes = async (): Promise<string[]> => {
    try {
        const q = query(
            workersCollection,
            where('type', '==', 'driver')
        );
        const querySnapshot = await getDocs(q);

        const vehicleTypesSet = new Set<string>();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.driverInfo?.vehicleType) {
                vehicleTypesSet.add(data.driverInfo.vehicleType);
            }
        });

        return Array.from(vehicleTypesSet).sort();
    } catch (error) {
        console.error("Error getting vehicle types:", error);
        throw error;
    }
};

// 운송기사 구분 목록 조회
export const getDriverCategories = async (): Promise<string[]> => {
    try {
        const q = query(
            workersCollection,
            where('type', '==', 'driver')
        );
        const querySnapshot = await getDocs(q);

        const categoriesSet = new Set<string>();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.driverInfo?.category) {
                categoriesSet.add(data.driverInfo.category);
            }
        });

        return Array.from(categoriesSet).sort();
    } catch (error) {
        console.error("Error getting driver categories:", error);
        throw error;
    }
};



export const addRateToCategory = async (categoryId: string, rateData: {
    name: string;
    description: string;
    defaultPrice: number;
    unit: string;
}): Promise<string> => {
    try {
        // 카테고리 컬렉션 참조
        const categoriesCol = collection(db, 'categories');
        const categoryRef = doc(categoriesCol, categoryId);

        // 카테고리 문서 가져오기
        const categoryDoc = await getDoc(categoryRef);

        if (!categoryDoc.exists()) {
            throw new Error("Category not found");
        }

        // 기존 rates 배열 가져오기
        const categoryData = categoryDoc.data();
        const rates = categoryData.rates || [];

        // 새 rate 객체 생성
        const newRate = {
            id: `rate_${Date.now()}`, // 유니크 ID 생성
            ...rateData,
            createdAt: serverTimestamp()
        };

        // rates 배열에 새 rate 추가
        rates.push(newRate);

        // 카테고리 문서 업데이트
        await updateDoc(categoryRef, { rates });

        return newRate.id;
    } catch (error) {
        console.error("Error adding rate to category:", error);
        throw error;
    }
};