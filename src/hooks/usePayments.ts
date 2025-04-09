// src/hooks/usePayments.ts
import { useState, useEffect } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
    getPaymentsByWorkerId
} from '@/services/firebase/paymentService';
import { Payment } from '@/types';
import { where } from 'firebase/firestore';

// 정산 데이터를 위한 커스텀 훅
export function usePayments(workerId?: string, statusFilter?: string) {
    const queryConstraints = [];

    if (workerId) {
        queryConstraints.push(where('receiverId', '==', workerId));
    }

    if (statusFilter) {
        queryConstraints.push(where('status', '==', statusFilter));
    }

    const {
        items: payments,
        isLoading,
        error,
        getItem: getPayment,
        addItem: addPayment,
        updateItem: updatePaymentItem,
        deleteItem: deletePaymentItem,
        refreshItems: refreshPayments
    } = useFirestoreCollection<Payment>({
        collectionName: 'payments',
        orderByField: 'paymentDate',
        orderDirection: 'desc',
        queryConstraints
    });

    // 작업자별 정산 내역 조회 함수
    const fetchPaymentsByWorker = async (wId: string): Promise<Payment[]> => {
        try {
            return await getPaymentsByWorkerId(wId);
        } catch (error) {
            console.error('Error fetching payments by worker:', error);
            throw error;
        }
    };

    return {
        payments,
        isLoading,
        error,
        getPayment,
        addPayment,
        updatePayment: updatePaymentItem,
        deletePayment: deletePaymentItem,
        refreshPayments,
        fetchPaymentsByWorker
    };
}

// 단일 정산 데이터를 위한 커스텀 훅
export function usePayment(paymentId: string) {
    const [payment, setPayment] = useState<Payment | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const paymentData = await getPaymentById(paymentId);
                setPayment(paymentData);
            } catch (err) {
                console.error('Error fetching payment:', err);
                setError(err instanceof Error ? err : new Error('Error fetching payment'));
            } finally {
                setIsLoading(false);
            }
        };

        if (paymentId) {
            fetchPayment();
        }
    }, [paymentId]);

    const updatePaymentData = async (data: Partial<Payment>): Promise<void> => {
        try {
            await updatePayment(paymentId, data);

            // 데이터 새로고침
            const updatedPayment = await getPaymentById(paymentId);
            setPayment(updatedPayment);
        } catch (err) {
            console.error('Error updating payment:', err);
            throw err;
        }
    };

    const deletePaymentData = async (): Promise<void> => {
        try {
            await deletePayment(paymentId);
            setPayment(null);
        } catch (err) {
            console.error('Error deleting payment:', err);
            throw err;
        }
    };

    return {
        payment,
        isLoading,
        error,
        updatePayment: updatePaymentData,
        deletePayment: deletePaymentData
    };
}