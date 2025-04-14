
// src/app/schedules/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import { getScheduleById } from '@/services/firebase/scheduleService';
import { Schedule } from '@/types';
import MainLayout from '@/components/layout/MainLayout';
interface EditSchedulePageProps {
  params: {
    id: string;
  };
}

export default function EditSchedulePage({ params }: EditSchedulePageProps) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await getScheduleById(params.id);
        setSchedule(data);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch schedule'));
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [params.id]);

  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (error || !schedule) {
    return (
      <MainLayout>
        <Container maxWidth="lg">
          <Alert severity="error">
            작업 일정을 불러오는 중 오류가 발생했습니다.
          </Alert>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <ScheduleForm initialData={schedule} isEdit={true} />
      </Container>
    </MainLayout>
  );
}