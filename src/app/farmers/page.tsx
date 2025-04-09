'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import FarmerList from '@/components/farmers/FarmerList';

export default function FarmersPage() {
    return (
        <MainLayout>
            <FarmerList />
        </MainLayout>
    );
}