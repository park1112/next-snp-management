// src/app/schedules/page.tsx
'use client';

import React, { useState } from 'react';
import { Container, Box, Tabs, Tab } from '@mui/material';
import ScheduleList from '@/components/schedules/ScheduleList';

import MainLayout from '@/components/layout/MainLayout';
export default function SchedulesPage() {
  const [viewMode, setViewMode] = useState<string>('list');

  const handleViewChange = (event: React.SyntheticEvent, newValue: string) => {
    setViewMode(newValue);
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={viewMode}
            onChange={handleViewChange}
            textColor="primary"
            indicatorColor="primary"
            aria-label="view mode tabs"
          >
            <Tab value="list" label="목록 보기" />

          </Tabs>
        </Box>
        <ScheduleList />
      </Container>
    </MainLayout>
  );
}