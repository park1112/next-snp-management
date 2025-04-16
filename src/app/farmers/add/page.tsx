'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import FarmerForm from '@/components/farmers/FarmerForm';

export default function AddFarmerPage() {
    return (
        <MainLayout>
            <FarmerForm />
        </MainLayout>
    );
}