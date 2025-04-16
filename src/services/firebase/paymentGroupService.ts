// src/services/firebase/paymentGroupService.ts
import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    deleteDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firestore 인스턴스
const db = getFirestore();
const paymentGroupsCollection = collection(db, 'paymentGroups');

// 결제소속 인터페이스
export interface PaymentGroup {
    id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
}

// 모든 결제소속 조회
export const getPaymentGroups = async (): Promise<PaymentGroup[]> => {
    try {
        console.log('결제소속 목록 조회 시작...');
        const q = query(paymentGroupsCollection, orderBy('name'));
        console.log('Firestore 쿼리 생성됨:', q);

        const querySnapshot = await getDocs(q);
        console.log('Firestore 결과 받음, 문서 수:', querySnapshot.docs.length);

        const paymentGroups = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('결제소속 문서:', doc.id, data);

            // createdAt이 없거나 Timestamp가 아닌 경우 처리
            let createdAt;
            if (!data.createdAt) {
                console.warn(`결제소속 ${doc.id}에 createdAt이 없음`);
                createdAt = new Date();
            } else if (data.createdAt instanceof Timestamp) {
                createdAt = data.createdAt.toDate();
            } else {
                createdAt = new Date(data.createdAt);
            }

            return {
                id: doc.id,
                name: data.name || '이름 없음',
                createdBy: data.createdBy || '작성자 없음',
                createdAt: createdAt,
            } as PaymentGroup;
        });

        console.log('결제소속 목록 변환 완료:', paymentGroups);
        return paymentGroups;
    } catch (error) {
        console.error("Error getting payment groups:", error);
        // 오류가 발생하더라도 빈 배열 반환하여 UI가 멈추지 않도록 함
        return [];
    }
};

// 결제소속명으로 단일 결제소속 조회
export const getPaymentGroupByName = async (name: string): Promise<PaymentGroup | null> => {
    try {
        console.log(`결제소속 조회 시작: 이름 = ${name}`);
        const q = query(paymentGroupsCollection, where('name', '==', name));
        const querySnapshot = await getDocs(q);

        console.log(`결제소속 조회 결과: ${querySnapshot.docs.length}개 문서 발견`);

        if (querySnapshot.empty) {
            console.log(`결제소속 '${name}' 찾을 수 없음`);
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        console.log(`결제소속 찾음: id=${doc.id}, 이름=${data.name}`);

        return {
            id: doc.id,
            name: data.name,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
        } as PaymentGroup;
    } catch (error) {
        console.error("Error getting payment group by name:", error);
        return null;
    }
};

// 결제소속 추가
export const createPaymentGroup = async (name: string): Promise<string> => {
    try {
        console.log(`결제소속 추가 시작: ${name}`);

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error("User not authenticated");
        }


        const newPaymentGroup = {
            name,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
        };

        console.log(`결제소속 데이터 생성:`, newPaymentGroup);

        // 직접 저장 방식 사용
        const docRef = await addDoc(paymentGroupsCollection, newPaymentGroup);
        console.log(`새 결제소속 추가됨: ${name}, ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("Error creating payment group:", error);
        throw error;
    }
};

// 결제소속 삭제
export const deletePaymentGroup = async (id: string): Promise<void> => {
    try {
        console.log(`결제소속 삭제 시작: ID ${id}`);
        const paymentGroupRef = doc(paymentGroupsCollection, id);
        await deleteDoc(paymentGroupRef);
        console.log(`결제소속 삭제 완료: ID ${id}`);
    } catch (error) {
        console.error("Error deleting payment group:", error);
        throw error;
    }
};