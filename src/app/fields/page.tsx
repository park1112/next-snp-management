'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import FieldList from '@/components/fields/fieldList';

export default function FieldsPage() {
    return (
        <MainLayout>
            <FieldList />
        </MainLayout>
    );
}