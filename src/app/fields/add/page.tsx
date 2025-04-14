'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import FieldForm from '@/components/fields/FieldForm';

export default function AddFieldPage() {
    return (
        <MainLayout>
            <FieldForm />
        </MainLayout>
    );
}