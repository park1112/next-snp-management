'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress, Alert } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import FarmerDetail from '@/components/farmers/FarmerDetail';
import { getFarmerById } from '@/services/firebase/farmerService';
import { Farmer, Field, Contract } from '@/types';

export default function FarmerDetailPage() {
    const params = useParams();
    const farmerId = params.id as string;

    // States
    const [farmer, setFarmer] = useState<Farmer | null>(null);
    const [fields, setFields] = useState<Field[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
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

                // In a real app, you would fetch fields and contracts here
                // For now, we'll use mock data
                setFields([]);
                setContracts([]);
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
                <FarmerDetail
                    farmer={farmer}
                    fields={fields}
                    contracts={contracts}
                />
            ) : (
                <Alert severity="error" sx={{ mb: 3 }}>
                    농가 정보를 찾을 수 없습니다.
                </Alert>
            )}
        </MainLayout>
    );
}