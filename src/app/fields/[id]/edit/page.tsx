'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, CircularProgress, Alert } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import FieldForm from '@/components/fields/FieldForm';
import { getFieldById } from '@/services/firebase/fieldService';
import { Field } from '@/types';

export default function EditFieldPage() {
    const params = useParams();
    const router = useRouter();
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
                <FieldForm
                    initialData={field}
                    isEdit={true}
                />
            ) : (
                <Alert severity="error" sx={{ mb: 3 }}>
                    농지 정보를 찾을 수 없습니다.
                </Alert>
            )}
        </MainLayout>
    );
}