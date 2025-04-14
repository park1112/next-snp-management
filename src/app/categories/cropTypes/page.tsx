'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import CropTypeManagement from '@/components/cropTypes/CropTypeManagement';

export default function CategoriesPage() {
    return (
        <MainLayout>
            <CropTypeManagement />
        </MainLayout>
    );
}