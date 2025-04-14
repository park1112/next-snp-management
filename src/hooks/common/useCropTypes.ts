import { useState, useEffect } from 'react';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface CropTypeOption {
    value: string;
    label: string;
    id?: string; // Optional id property
}

export function useCropTypes() {
    const [cropTypes, setCropTypes] = useState<CropTypeOption[]>([]);

    // Firestore에서 작물 종류 불러오기
    useEffect(() => {
        const loadCropTypes = async () => {
            try {
                const db = getFirestore();
                const cropTypesCol = collection(db, 'cropTypes');
                const snapshot = await getDocs(cropTypesCol);
                const cropTypesData = snapshot.docs.map(doc => ({
                    value: doc.data().name,
                    label: doc.data().name,
                }));
                setCropTypes(cropTypesData);
            } catch (error) {
                console.error('작물 종류 불러오기 오류:', error);
            }
        };

        loadCropTypes();
    }, []);

    // 새 작물 종류 추가 함수
    const addCropType = async (newVal: string): Promise<void> => {
        try {
            const db = getFirestore();
            const cropTypesCol = collection(db, 'cropTypes');
            const auth = getAuth();
            const user = auth.currentUser;
            const userId = user ? user.uid : 'anonymous-user';
            const newCropType = {
                name: newVal,
                createdBy: userId,
                createdAt: serverTimestamp(),
            };
            await addDoc(cropTypesCol, newCropType);
            // 성공적으로 추가되면 상태 업데이트
            setCropTypes(prev => [...prev, { value: newVal, label: newVal }]);
        } catch (error) {
            console.error("새 작물 종류 추가 오류:", error);
        }
    };

    return { cropTypes, addCropType };
}
