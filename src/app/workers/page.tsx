'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import WorkerList from '@/components/workers/WorkerList';

export default function WorkersPage() {
    return (
        <MainLayout>
            <WorkerList />
        </MainLayout>
    );
}