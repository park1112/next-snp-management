'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import WorkerList from '@/components/workers/WorkerList';

export default function WorkersPage() {
    return (
        <MainLayout>
            <WorkerList />
        </MainLayout>
    );
}