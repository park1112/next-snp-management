// src/services/firebase/fieldService.ts
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

} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Field, LocationItem } from '@/types';
import { getFarmerById } from './farmerService';

// Firestore 인스턴스
const db = getFirestore();
const fieldsCollection = collection(db, 'fields');

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


// 모든 농지 조회
// src/services/firebase/fieldService.ts의 getFields 함수 내부에서 테스트용 좌표 추가

export const getFields = async (): Promise<Field[]> => {
    try {
        const q = query(fieldsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const fields = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();
            let farmerName = '';
            let phoneNumber = '';
            let paymentGroup = '';
            let subdistrict = '';
            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
                    phoneNumber = farmer.phoneNumber;
                    paymentGroup = farmer.paymentGroup;
                    subdistrict = farmer.address?.subdistrict || '';
                }
            }

            // 위치 정보가 없는 경우 주소 정보로부터 위치 정보 생성
            if (!data.locations && data.address) {
                // 좌표 정보가 없는 경우 임시로 추가 (테스트용)
                const coordinates = data.address.coordinates || {
                    latitude: 37.2156 + (Math.random() * 0.1),
                    longitude: 127.0642 + (Math.random() * 0.1)
                };

                data.locations = [
                    {
                        id: `location-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        address: {
                            ...data.address,
                            coordinates
                        },
                        flagNumber: 1,
                        area: data.area || { value: 0, unit: '평' },
                        cropType: data.cropType || '',
                    }
                ];
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
                phoneNumber,
                paymentGroup,
                subdistrict,
            } as Field;
        }));

        return fields;
    } catch (error) {
        console.error("Error getting fields:", error);
        throw error;
    }
};

// 특정 농가의 농지 조회
export const getFieldsByFarmerId = async (farmerId: string): Promise<Field[]> => {
    try {
        const q = query(
            fieldsCollection,
            where('farmerId', '==', farmerId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const farmer = await getFarmerById(farmerId);
        const farmerName = farmer?.name || '';
        const phoneNumber = farmer?.phoneNumber || '';
        const paymentGroup = farmer?.paymentGroup || '';
        const subdistrict = farmer?.address?.subdistrict || '';

        const fields = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
                phoneNumber,
                paymentGroup,
                subdistrict,
            } as Field;
        });

        return fields;
    } catch (error) {
        console.error("Error getting fields by farmer ID:", error);
        throw error;
    }
};

// 농지 상세 조회
export const getFieldById = async (id: string): Promise<Field | null> => {
    try {
        const docRef = doc(fieldsCollection, id);
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

            return {
                id: docSnap.id,
                ...convertTimestampToDate(data),
                farmerName,
            } as Field;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting field:", error);
        throw error;
    }
};

// 작물 유형 검색
export const searchFieldsByCropType = async (cropType: string): Promise<Field[]> => {
    try {
        const q = query(
            fieldsCollection,
            where('cropType', '==', cropType),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const fields = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();

            // 농가 정보 추가
            let farmerName = '';
            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
                }
            }

            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
            } as Field;
        }));

        return fields;
    } catch (error) {
        console.error("Error searching fields by crop type:", error);
        throw error;
    }
};

// 농지 등록
export const createField = async (fieldData: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error("User not authenticated");
        }

        // 현재 단계 정보 추가 (기존 코드 유지)
        if (!fieldData.currentStage) {
            fieldData.currentStage = {
                stage: '계약예정',
                updatedAt: new Date(),
            };
        }

        // 위치 정보가 없지만 주소 정보가 있는 경우 위치 정보 생성 (호환성)
        if ((!fieldData.locations || fieldData.locations.length === 0) && fieldData.address) {
            fieldData.locations = [
                {
                    id: `location-${Date.now()}`,
                    address: fieldData.address as LocationItem['address'],
                    flagNumber: 1,
                    area: fieldData.area || { value: 0, unit: '평' },
                    cropType: fieldData.cropType || '',
                }
            ];
        }

        // 위치 정보가 있는 경우 총 면적 계산
        if (fieldData.locations && fieldData.locations.length > 0) {
            // 같은 단위의 면적만 합산
            const unit = fieldData.locations[0].area.unit;
            const totalValue = fieldData.locations.reduce((sum, loc) => {
                if (loc.area.unit === unit) {
                    return sum + (loc.area.value || 0);
                }
                return sum;
            }, 0);

            // totalArea가 이미 지원됨
            fieldData.totalArea = {
                value: totalValue,
                unit: unit
            };
        }

        const newField = {
            ...fieldData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };


        // Firestore에 추가
        const docRef = await addDoc(fieldsCollection, newField);

        // 농가 정보에 농지 ID 추가
        if (fieldData.farmerId) {
            const farmerRef = doc(db, 'farmers', fieldData.farmerId);
            const farmerDoc = await getDoc(farmerRef);

            if (farmerDoc.exists()) {
                const farmerData = farmerDoc.data();
                const fields = farmerData.fields || [];

                await updateDoc(farmerRef, {
                    fields: [...fields, docRef.id],
                    updatedAt: serverTimestamp(),
                });
            }
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating field:", error);
        throw error;
    }
};

// 농지 정보 수정
export const updateField = async (id: string, fieldData: Partial<Field>): Promise<void> => {
    try {
        const fieldRef = doc(fieldsCollection, id);

        // 기존 농지 정보 가져오기
        const fieldDoc = await getDoc(fieldRef);
        if (!fieldDoc.exists()) {
            throw new Error("Field not found");
        }

        const oldData = fieldDoc.data();
        const oldFarmerId = oldData.farmerId;
        const newFarmerId = fieldData.farmerId;

        // 농가가 변경된 경우 처리
        if (newFarmerId && oldFarmerId !== newFarmerId) {
            // 기존 농가에서 해당 농지 ID 제거
            if (oldFarmerId) {
                const oldFarmerRef = doc(db, 'farmers', oldFarmerId);
                const oldFarmerDoc = await getDoc(oldFarmerRef);

                if (oldFarmerDoc.exists()) {
                    const oldFarmerData = oldFarmerDoc.data();
                    const oldFields = oldFarmerData.fields || [];

                    await updateDoc(oldFarmerRef, {
                        fields: oldFields.filter((fieldId: string) => fieldId !== id),
                        updatedAt: serverTimestamp(),
                    });
                }
            }

            // 새 농가에 해당 농지 ID 추가
            const newFarmerRef = doc(db, 'farmers', newFarmerId);
            const newFarmerDoc = await getDoc(newFarmerRef);

            if (newFarmerDoc.exists()) {
                const newFarmerData = newFarmerDoc.data();
                const newFields = newFarmerData.fields || [];

                await updateDoc(newFarmerRef, {
                    fields: [...newFields, id],
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // updateAt 필드 추가
        const updateData = {
            ...fieldData,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(fieldRef, updateData);
    } catch (error) {
        console.error("Error updating field:", error);
        throw error;
    }
};

// 농지 삭제
export const deleteField = async (id: string): Promise<void> => {
    try {
        const fieldRef = doc(fieldsCollection, id);

        // 기존 농지 정보 가져오기
        const fieldDoc = await getDoc(fieldRef);
        if (!fieldDoc.exists()) {
            throw new Error("Field not found");
        }

        const fieldData = fieldDoc.data();
        const farmerId = fieldData.farmerId;

        // 농가에서 해당 농지 ID 제거
        if (farmerId) {
            const farmerRef = doc(db, 'farmers', farmerId);
            const farmerDoc = await getDoc(farmerRef);

            if (farmerDoc.exists()) {
                const farmerData = farmerDoc.data();
                const fields = farmerData.fields || [];

                await updateDoc(farmerRef, {
                    fields: fields.filter((fieldId: string) => fieldId !== id),
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // 농지 삭제
        await deleteDoc(fieldRef);
    } catch (error) {
        console.error("Error deleting field:", error);
        throw error;
    }
};

// 작물 종류 목록 조회 (고유값)
export const getCropTypes = async (): Promise<string[]> => {
    try {
        const querySnapshot = await getDocs(fieldsCollection);

        const cropTypesSet = new Set<string>();
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.cropType) {
                cropTypesSet.add(data.cropType);
            }
        });

        return Array.from(cropTypesSet).sort();
    } catch (error) {
        console.error("Error getting crop types:", error);
        throw error;
    }
};

// 농지 단계 업데이트
export const updateFieldStage = async (
    id: string,
    stage: string,
    userId: string
): Promise<void> => {
    try {
        const fieldRef = doc(fieldsCollection, id);

        // 기존 농지 정보 가져오기
        const fieldDoc = await getDoc(fieldRef);
        if (!fieldDoc.exists()) {
            throw new Error("Field not found");
        }

        const fieldData = fieldDoc.data();
        const currentStage = fieldData.currentStage || {};
        const stageHistory = currentStage.history || [];


        // 이력에 추가할 항목
        const historyEntry = {
            stage: stage,
            timestamp: new Date(),
            by: userId,
        };

        // 업데이트
        await updateDoc(fieldRef, {
            'currentStage.stage': stage,
            'currentStage.updatedAt': serverTimestamp(),
            'currentStage.history': [...stageHistory, historyEntry],
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating field stage:", error);
        throw error;
    }
};