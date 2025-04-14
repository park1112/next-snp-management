'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import WorkTypeManagement from '@/components/workTypes/WorkTypeManagement';

export default function CategoriesPage() {
    return (
        <MainLayout>
            <WorkTypeManagement />
        </MainLayout>
    );
}