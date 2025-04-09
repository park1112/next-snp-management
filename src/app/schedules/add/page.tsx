// src/app/schedules/add/page.tsx
'use client';

import React from 'react';
import { Container } from '@mui/material';
import ScheduleForm from '@/components/schedules/ScheduleForm';

export default function AddSchedulePage() {
  return (
    <Container maxWidth="lg">
      <ScheduleForm />
    </Container>
  );
}