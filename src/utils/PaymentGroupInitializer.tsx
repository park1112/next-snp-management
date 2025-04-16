'use client';

// src/components/utils/PaymentGroupInitializer.tsx
import React, { useEffect, useState } from 'react';
import { Button, Alert, Snackbar, Box, Typography, CircularProgress } from '@mui/material';
import { collection, getDocs, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * 이 컴포넌트는 결제소속 컬렉션이 비어있을 때 테스트용 초기 데이터를 생성합니다.
 * 개발/테스트 환경에서만 사용하세요.
 */
const PaymentGroupInitializer: React.FC = () => {
    const [isInitializing, setIsInitializing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isCheckingData, setIsCheckingData] = useState(true);
    const [isDataEmpty, setIsDataEmpty] = useState(false);

    useEffect(() => {
        // 결제소속 컬렉션이 비어있는지 확인
        const checkPaymentGroups = async () => {
            try {
                const db = getFirestore();
                const paymentGroupsCol = collection(db, 'paymentGroups');
                const querySnapshot = await getDocs(paymentGroupsCol);

                setIsDataEmpty(querySnapshot.empty);
                console.log('결제소속 컬렉션 확인:', querySnapshot.empty ? '비어있음' : `${querySnapshot.docs.length}개 문서 있음`);
            } catch (error) {
                console.error('결제소속 확인 오류:', error);
            } finally {
                setIsCheckingData(false);
            }
        };

        checkPaymentGroups();
    }, []);

    const initializePaymentGroups = async () => {
        setIsInitializing(true);
        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.error('인증된 사용자가 없습니다.');
                return;
            }

            const paymentGroupsCol = collection(db, 'paymentGroups');

            // 기본 결제소속 데이터
            const defaultGroups = [
                '유기농 조합',
                '합천 농협',
                '직거래 농가',
                '경남 농산물',
                '지역 직판장'
            ];

            // 모든 결제소속 추가
            for (const groupName of defaultGroups) {
                await addDoc(paymentGroupsCol, {
                    name: groupName,
                    createdBy: user.uid,
                    createdAt: serverTimestamp()
                });
                console.log(`결제소속 추가됨: ${groupName}`);
            }

            setShowSuccess(true);
            // 성공 후 상태 업데이트
            setIsDataEmpty(false);
        } catch (error) {
            console.error('결제소속 초기화 오류:', error);
        } finally {
            setIsInitializing(false);
        }
    };

    if (isCheckingData) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                <CircularProgress size={20} />
                <Typography>결제소속 데이터 확인 중...</Typography>
            </Box>
        );
    }

    if (!isDataEmpty) {
        return null;
    }

    return (
        <Box sx={{ p: 2, mb: 3, border: '1px dashed #ccc', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                결제소속 데이터가 없습니다. 테스트용 초기 데이터를 생성하시겠습니까?
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={initializePaymentGroups}
                disabled={isInitializing}
                sx={{ mt: 1 }}
            >
                {isInitializing ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
                결제소속 초기화
            </Button>

            <Snackbar
                open={showSuccess}
                autoHideDuration={5000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowSuccess(false)} severity="success">
                    결제소속이 성공적으로 초기화되었습니다.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PaymentGroupInitializer;