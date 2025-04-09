// src/app/schedules/[id]/page.tsx
'use client';

import React from 'react';
import { Container } from '@mui/material';
import ScheduleDetail from '@/components/schedules/ScheduleDetail';

interface ScheduleDetailPageProps {
  params: {
    id: string;
  };
}

export default function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  return (
    <Container maxWidth="lg">
      <ScheduleDetail scheduleId={params.id} />
    </Container>
  );
}