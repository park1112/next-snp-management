'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import FarmerForm from '@/components/farmers/FarmerForm';

export default function AddFarmerPage() {
    return (
        <MainLayout>
            <FarmerForm />
        </MainLayout>
    );
}