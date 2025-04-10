// src/app/schedules/[id]/page.tsx
'use client';

import React from 'react';
import { Container } from '@mui/material';
import ScheduleDetail from '@/components/schedules/ScheduleDetail';
import MainLayout from '@/components/layout/MainLayout';
interface ScheduleDetailPageProps {
  params: {
    id: string;
  };
}

export default function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  return (
    <MainLayout>
      <Container maxWidth="lg">
        <ScheduleDetail scheduleId={params.id} />
      </Container>
    </MainLayout>
  );
}