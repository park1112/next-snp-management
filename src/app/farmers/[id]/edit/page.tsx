'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, CircularProgress, Alert } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import FarmerForm from '@/components/farmers/FarmerForm';
import { getFarmerById } from '@/services/firebase/farmerService';
import { Farmer } from '@/types';

export default function EditFarmerPage() {
    const params = useParams();
    const router = useRouter();
    const farmerId = params.id as string;

    // States
    const [farmer, setFarmer] = useState<Farmer | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFarmerData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch farmer data
                const farmerData = await getFarmerById(farmerId);
                if (!farmerData) {
                    setError('농가 정보를 찾을 수 없습니다.');
                    return;
                }

                setFarmer(farmerData);
            } catch (err) {
                console.error('Error fetching farmer data:', err);
                setError('농가 정보를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchFarmerData();
    }, [farmerId]);

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
            ) : farmer ? (
                <FarmerForm
                    initialData={farmer}
                    isEdit={true}
                />
            ) : (
                <Alert severity="error" sx={{ mb: 3 }}>
                    농가 정보를 찾을 수 없습니다.
                </Alert>
            )}
        </MainLayout>
    );
}