'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress, Alert } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import { getFieldById } from '@/services/firebase/fieldService';
import { Field } from '@/types';

// 필드 상세 정보 컴포넌트는 별도 파일로 분리하여 구현 예정
const FieldDetailPlaceholder = ({ field }: { field: Field }) => {
    return (
        <Box>
            <pre>{JSON.stringify(field, null, 2)}</pre>
        </Box>
    );
};

export default function FieldDetailPage() {
    const params = useParams();
    const fieldId = params.id as string;

    // States
    const [field, setField] = useState<Field | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFieldData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch field data
                const fieldData = await getFieldById(fieldId);
                if (!fieldData) {
                    setError('농지 정보를 찾을 수 없습니다.');
                    return;
                }

                setField(fieldData);
            } catch (err) {
                console.error('Error fetching field data:', err);
                setError('농지 정보를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchFieldData();
    }, [fieldId]);

    return (
        <MainLayout>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            ) : field ? (
                <FieldDetailPlaceholder field={field} />
            ) : (
                <Alert severity="error" sx={{ mb: 3 }}>
                    농지 정보를 찾을 수 없습니다.
                </Alert>
            )}
        </MainLayout>
    );
}