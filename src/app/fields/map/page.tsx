'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import FieldMap from '@/components/fields/FieldMap';

export default function FieldMapPage() {
    return (
        <MainLayout>
            <Box sx={{ height: 'calc(100vh - 320px)' }}>
                <FieldMap />
            </Box>
        </MainLayout>
    );
}