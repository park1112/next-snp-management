
// src/app/schedules/[id]/page.tsx
import React from 'react';
import { Container } from '@mui/material';
import ScheduleDetail from '@/components/schedules/ScheduleDetail';
import MainLayout from '@/components/layout/MainLayout';

interface Props {
  // Next.js 15부터 params는 Promise<{ id: string }> 타입입니다.
  params: Promise<{ id: string }>;
}

export default async function ScheduleDetailPage({ params }: Props) {
  const { id } = await params;    // ★ 여기서 await
  return (
    <MainLayout>
      <Container maxWidth="lg">
        <ScheduleDetail scheduleId={id} />
      </Container>
    </MainLayout>
  );
}
