'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import PaymentGroupManagement from '@/components/paymentGroups/PaymentGroupManagement';

export default function CategoriesPage() {
    return (
        <MainLayout>
            <PaymentGroupManagement />
        </MainLayout>
    );
}