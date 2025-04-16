'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import WorkerList from '@/components/workers/WorkerList';

export default function DriversPage() {
    return (
        <MainLayout>
            <WorkerList defaultTab={2} />
        </MainLayout>
    );
}