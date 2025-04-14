// src/services/firebase/firestoreService.ts
// 기존 파일에 다음 코드를 추가합니다.

import { doc, getDoc, setDoc, updateDoc, getFirestore } from 'firebase/firestore';

/**
 * Firebase에서 마지막으로 사용된 깃발 번호를 가져옵니다.
 * 해당 설정이 없으면 새로 생성합니다.
 */
export const getLastFlagNumber = async (): Promise<number> => {
    try {
        const db = getFirestore();
        const configRef = doc(db, 'configs', 'fieldConfig');
        const configSnap = await getDoc(configRef);

        if (configSnap.exists() && configSnap.data().lastFlagNumber !== undefined) {
            return configSnap.data().lastFlagNumber;
        }

        // 설정이 없으면 새로 생성
        await setDoc(configRef, { lastFlagNumber: 0 });
        return 0;
    } catch (error) {
        console.error("Error getting last flag number:", error);
        return 0; // 오류 시 0 반환
    }
};

/**
 * Firebase에 마지막으로 사용된 깃발 번호를 업데이트합니다.
 * @param flagNumber 새 깃발 번호
 */
export const updateLastFlagNumber = async (flagNumber: number): Promise<void> => {
    try {
        const db = getFirestore();
        const configRef = doc(db, 'configs', 'fieldConfig');

        // 문서가 존재하는지 확인
        const docSnap = await getDoc(configRef);

        if (docSnap.exists()) {
            await updateDoc(configRef, { lastFlagNumber: flagNumber });
        } else {
            await setDoc(configRef, { lastFlagNumber: flagNumber });
        }
    } catch (error) {
        console.error("Error updating last flag number:", error);
        throw error;
    }
};