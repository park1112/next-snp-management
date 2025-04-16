// src/services/firebase/contractService.ts
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
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Contract } from '@/types';
import { getFarmerById } from './farmerService';
import { getFieldById } from './fieldService';

// Firestore 컬렉션 참조
const db = getFirestore();
const contractsCollection = collection(db, 'contracts');

// Timestamp를 Date로 변환하는 유틸리티 함수
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


// Date를 Firestore에 저장 가능한 형태로 변환
const prepareDataForFirestore = (data: any): any => {
    const result = { ...data };

    // id 필드는 저장하지 않음
    if (result.id) {
        delete result.id;
    }

    // 농가명과 농지명은 UI 표시용이므로 저장하지 않음
    if (result.farmerName) {
        delete result.farmerName;
    }
    if (result.fieldNames) {
        delete result.fieldNames;
    }

    return result;
};

// 모든 계약 조회
export const getContracts = async (): Promise<Contract[]> => {
    try {
        const q = query(contractsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const contracts = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();

            // 농가 정보 추가
            let farmerName = '';
            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
                }
            }

            // 농지 이름 배열 추가
            let fieldNames: string[] = [];
            if (data.fieldIds && Array.isArray(data.fieldIds)) {
                fieldNames = await Promise.all(data.fieldIds.map(async (fieldId: string) => {
                    const field = await getFieldById(fieldId);
                    return field ? (field.address.full.split(' ').pop() || '농지') : '이름 없음';
                }));
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
                fieldNames,
            } as Contract;
        }));

        return contracts;
    } catch (error) {
        console.error("Error getting contracts:", error);
        throw error;
    }
};

// 농가별 계약 조회
export const getContractsByFarmerId = async (farmerId: string): Promise<Contract[]> => {
    try {
        const q = query(
            contractsCollection,
            where('farmerId', '==', farmerId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        // 농가 정보
        const farmer = await getFarmerById(farmerId);
        const farmerName = farmer ? farmer.name : '';

        const contracts = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();

            // 농지 이름 배열 추가
            let fieldNames: string[] = [];
            if (data.fieldIds && Array.isArray(data.fieldIds)) {
                fieldNames = await Promise.all(data.fieldIds.map(async (fieldId: string) => {
                    const field = await getFieldById(fieldId);
                    return field ? (field.address.full.split(' ').pop() || '농지') : '이름 없음';
                }));
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
                fieldNames,
            } as Contract;
        }));

        return contracts;
    } catch (error) {
        console.error("Error getting contracts by farmer ID:", error);
        throw error;
    }
};

// 계약 상세 조회
export const getContractById = async (id: string): Promise<Contract | null> => {
    try {
        const docRef = doc(contractsCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // 농가 정보 추가
            let farmerName = '';
            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
                }
            }

            // 농지 이름 배열 추가
            let fieldNames: string[] = [];
            if (data.fieldIds && Array.isArray(data.fieldIds)) {
                fieldNames = await Promise.all(data.fieldIds.map(async (fieldId: string) => {
                    const field = await getFieldById(fieldId);
                    return field ? (field.address.full.split(' ').pop() || '농지') : '이름 없음';
                }));
            }

            return {
                id: docSnap.id,
                ...convertTimestampToDate(data),
                farmerName,
                fieldNames,
            } as Contract;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting contract:", error);
        throw error;
    }
};

// 계약 등록
export const createContract = async (contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error("User not authenticated");
        }

        const newContract = {
            ...prepareDataForFirestore(contractData),
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(contractsCollection, newContract);

        // 농가 문서에 계약 ID 추가
        if (contractData.farmerId) {
            const farmerRef = doc(db, 'farmers', contractData.farmerId);
            const farmerDoc = await getDoc(farmerRef);

            if (farmerDoc.exists()) {
                const farmerData = farmerDoc.data();
                const contracts = farmerData.contracts || [];

                await updateDoc(farmerRef, {
                    contracts: [...contracts, docRef.id],
                    activeContracts: (farmerData.activeContracts || 0) + 1,
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 농지 문서에 계약 ID 추가
        if (contractData.fieldIds && Array.isArray(contractData.fieldIds)) {
            for (const fieldId of contractData.fieldIds) {
                const fieldRef = doc(db, 'fields', fieldId);
                const fieldDoc = await getDoc(fieldRef);

                if (fieldDoc.exists()) {
                    const fieldData = fieldDoc.data();
                    const contractIds = fieldData.contractIds || [];

                    await updateDoc(fieldRef, {
                        contractIds: [...contractIds, docRef.id],
                        contractStatus: contractData.contractStatus,
                        currentContract: {
                            id: docRef.id,
                            contractNumber: contractData.contractNumber,
                            finalPaymentDueDate: contractData.finalPayment.dueDate,
                        },
                        updatedAt: serverTimestamp(),
                    });
                }
            }
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating contract:", error);
        throw error;
    }
};

// 계약 정보 수정
export const updateContract = async (id: string, contractData: Partial<Contract>): Promise<void> => {
    try {
        const contractRef = doc(contractsCollection, id);

        // 기존 계약 정보 가져오기
        const contractDoc = await getDoc(contractRef);
        if (!contractDoc.exists()) {
            throw new Error("Contract not found");
        }

        const oldData = contractDoc.data();

        // updateAt 필드 추가
        const updateData = {
            ...prepareDataForFirestore(contractData),
            updatedAt: serverTimestamp(),
        };

        await updateDoc(contractRef, updateData);

        // 계약 상태가 변경된 경우 관련 농지 문서 업데이트
        if (contractData.contractStatus && contractData.contractStatus !== oldData.contractStatus) {
            const fieldIds = contractData.fieldIds || oldData.fieldIds || [];

            for (const fieldId of fieldIds) {
                const fieldRef = doc(db, 'fields', fieldId);
                const fieldDoc = await getDoc(fieldRef);

                if (fieldDoc.exists()) {
                    await updateDoc(fieldRef, {
                        contractStatus: contractData.contractStatus,
                        updatedAt: serverTimestamp(),
                    });
                }
            }
        }

        // 계약 완료 상태로 변경된 경우 농가의 activeContracts 감소
        if (contractData.contractStatus === 'completed' && oldData.contractStatus !== 'completed') {
            const farmerId = contractData.farmerId || oldData.farmerId;
            if (farmerId) {
                const farmerRef = doc(db, 'farmers', farmerId);
                const farmerDoc = await getDoc(farmerRef);

                if (farmerDoc.exists()) {
                    const farmerData = farmerDoc.data();
                    const activeContracts = Math.max(0, (farmerData.activeContracts || 1) - 1);

                    await updateDoc(farmerRef, {
                        activeContracts,
                        updatedAt: serverTimestamp(),
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error updating contract:", error);
        throw error;
    }
};

// 계약 삭제
export const deleteContract = async (id: string): Promise<void> => {
    try {
        const contractRef = doc(contractsCollection, id);

        // 기존 계약 정보 가져오기
        const contractDoc = await getDoc(contractRef);
        if (!contractDoc.exists()) {
            throw new Error("Contract not found");
        }

        const contractData = contractDoc.data();

        // 계약 삭제
        await deleteDoc(contractRef);

        // 농가 문서에서 계약 ID 제거
        if (contractData.farmerId) {
            const farmerRef = doc(db, 'farmers', contractData.farmerId);
            const farmerDoc = await getDoc(farmerRef);

            if (farmerDoc.exists()) {
                const farmerData = farmerDoc.data();
                const contracts = farmerData.contracts || [];
                const activeContracts = contractData.contractStatus !== 'completed' ?
                    Math.max(0, (farmerData.activeContracts || 1) - 1) :
                    (farmerData.activeContracts || 0);

                await updateDoc(farmerRef, {
                    contracts: contracts.filter((contractId: string) => contractId !== id),
                    activeContracts,
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 농지 문서에서 계약 ID 제거
        if (contractData.fieldIds && Array.isArray(contractData.fieldIds)) {
            for (const fieldId of contractData.fieldIds) {
                const fieldRef = doc(db, 'fields', fieldId);
                const fieldDoc = await getDoc(fieldRef);

                if (fieldDoc.exists()) {
                    const fieldData = fieldDoc.data();
                    const contractIds = fieldData.contractIds || [];

                    // 현재 계약이 삭제되는 계약인 경우 currentContract 업데이트
                    const updateFields: any = {
                        contractIds: contractIds.filter((contractId: string) => contractId !== id),
                        updatedAt: serverTimestamp(),
                    };

                    if (fieldData.currentContract && fieldData.currentContract.id === id) {
                        updateFields.currentContract = null;
                        updateFields.contractStatus = '계약예정';
                    }

                    await updateDoc(fieldRef, updateFields);
                }
            }
        }
    } catch (error) {
        console.error("Error deleting contract:", error);
        throw error;
    }
};

// 계약 유형 목록 조회
export const getContractTypes = async (): Promise<string[]> => {
    try {
        const querySnapshot = await getDocs(contractsCollection);

        const typesSet = new Set<string>();
        // 기본 유형 추가
        typesSet.add('일반');
        typesSet.add('특수');
        typesSet.add('장기');

        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.contractType) {
                typesSet.add(data.contractType);
            }
        });

        return Array.from(typesSet).sort();
    } catch (error) {
        console.error("Error getting contract types:", error);
        return ['일반', '특수', '장기']; // 기본값 반환
    }
};