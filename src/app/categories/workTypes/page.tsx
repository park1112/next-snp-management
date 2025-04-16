'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import WorkTypeManagement from '@/components/workTypes/WorkTypeManagement';

export default function CategoriesPage() {
    return (
        <MainLayout>
            <WorkTypeManagement />
        </MainLayout>
    );
}