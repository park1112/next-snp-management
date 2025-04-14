// src/app/schedules/add/page.tsx
'use client';

import React from 'react';
import { Container } from '@mui/material';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import MainLayout from '@/components/layout/MainLayout';
export default function AddSchedulePage() {
  return (
    <MainLayout>
      <Container maxWidth="lg">
        <ScheduleForm />
      </Container>
    </MainLayout>
  );
}