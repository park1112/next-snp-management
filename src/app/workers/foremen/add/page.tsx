'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import ForemanForm from '@/components/workers/ForemanForm';

export default function AddForemanPage() {
    return (
        <MainLayout>
            <ForemanForm />
        </MainLayout>
    );
}