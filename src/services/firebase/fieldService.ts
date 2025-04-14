// src/services/firebase/fieldService.ts
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
import { Field, LocationItem } from '@/types';
import { getFarmerById } from './farmerService';

// Firestore 인스턴스
const db = getFirestore();
const fieldsCollection = collection(db, 'fields');

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

// 모든 농지 조회
// src/services/firebase/fieldService.ts의 getFields 함수 내부에서 테스트용 좌표 추가

export const getFields = async (): Promise<Field[]> => {
    try {
        const q = query(fieldsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const fields = await Promise.all(querySnapshot.docs.map(async doc => {
            const data = doc.data();

            let farmerName = '';
            if (data.farmerId) {
                const farmer = await getFarmerById(data.farmerId);
                if (farmer) {
                    farmerName = farmer.name;
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

        const fields = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...convertTimestampToDate(data),
                farmerName,
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

        // 새 단계 정보
        const newStage = {
            stage: stage,
            updatedAt: new Date(),
        };

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