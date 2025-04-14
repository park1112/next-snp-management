'use client';

import React from 'react';
import { Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import ScheduleCalendar from '@/components/schedules/ScheduleCalendar';

export default function FieldMapPage() {
    return (
        <MainLayout>
            <Box sx={{ height: 'calc(100vh - 150px)' }}>
                <ScheduleCalendar />
            </Box>
        </MainLayout>
    );
}