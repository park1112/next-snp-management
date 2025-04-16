'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ForemanForm from '@/components/workers/ForemanForm';

export default function AddForemanPage() {
    return (
        <MainLayout>
            <ForemanForm />
        </MainLayout>
    );
}