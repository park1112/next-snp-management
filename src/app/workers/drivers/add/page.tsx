'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import DriverForm from '@/components/workers/DriverForm';

export default function AddDriverPage() {
    return (
        <MainLayout>
            <DriverForm />
        </MainLayout>
    );
}