import { useState, useEffect } from 'react';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { PaymentGroup } from '@/types';
import { DropdownOption } from '@/types';

export function usePaymentGroups() {
    const [paymentGroups, setPaymentGroups] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Firestore에서 결제소속 불러오기
    useEffect(() => {
        const loadPaymentGroups = async () => {
            setLoading(true);
            try {
                const db = getFirestore();
                const paymentGroupsCol = collection(db, 'paymentGroups');
                const querySnapshot = await getDocs(paymentGroupsCol);

                const paymentGroupsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        value: data.name,
                        label: data.name,
                        id: doc.id,
                    };
                });

                setPaymentGroups(paymentGroupsData);
            } catch (error) {
                console.error('결제소속 로드 오류:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPaymentGroups();
    }, []);

    // 새 결제소속 추가 함수
    const addPaymentGroup = async (newVal: string): Promise<string> => {
        try {
            const db = getFirestore();
            const paymentGroupsCol = collection(db, 'paymentGroups');
            const auth = getAuth();
            const user = auth.currentUser;
            const userId = user ? user.uid : 'anonymous-user';

            const newPaymentGroup = {
                name: newVal,
                createdBy: userId,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(paymentGroupsCol, newPaymentGroup);

            // 성공적으로 추가되면 상태 업데이트
            setPaymentGroups(prev => [
                ...prev,
                {
                    value: newVal,
                    label: newVal,
                    id: docRef.id
                }
            ]);

            return docRef.id;
        } catch (error) {
            console.error("새 결제소속 추가 오류:", error);
            throw error;
        }
    };

    // 결제소속 수정 함수
    const updatePaymentGroup = async (id: string, newName: string): Promise<void> => {
        try {
            const db = getFirestore();
            const paymentGroupRef = doc(db, 'paymentGroups', id);

            await updateDoc(paymentGroupRef, {
                name: newName,
            });

            // 성공적으로 수정되면 상태 업데이트
            setPaymentGroups(prev =>
                prev.map(group =>
                    group.id === id
                        ? { ...group, value: newName, label: newName }
                        : group
                )
            );
        } catch (error) {
            console.error("결제소속 수정 오류:", error);
            throw error;
        }
    };

    // 결제소속 재로드 함수
    const refreshPaymentGroups = async (): Promise<void> => {
        setLoading(true);
        try {
            const db = getFirestore();
            const paymentGroupsCol = collection(db, 'paymentGroups');
            const querySnapshot = await getDocs(paymentGroupsCol);

            const paymentGroupsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    value: data.name,
                    label: data.name,
                    id: doc.id,
                };
            });

            setPaymentGroups(paymentGroupsData);
        } catch (error) {
            console.error('결제소속 재로드 오류:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        paymentGroups,
        loading,
        addPaymentGroup,
        updatePaymentGroup,
        refreshPaymentGroups
    };
}