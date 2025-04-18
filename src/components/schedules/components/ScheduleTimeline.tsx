'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  BuildCircle as ProcessingIcon,
  PlayCircle as ActiveIcon,
  HighlightOff as CancelledIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Schedule } from '@/types';

interface ScheduleTimelineProps {
  schedule: Schedule;
}

const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ schedule }) => {
  // 작업 상태별 칩 색상
  const getStageColor = (stage: string) => {
    switch (stage) {
      case '예정': return 'info';
      case '준비중': return 'warning';
      case '진행중': return 'primary';
      case '완료': return 'success';
      case '취소': return 'error';
      default: return 'default';
    }
  };

  // 작업 상태별 아이콘
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case '예정': return <PendingIcon />;
      case '준비중': return <ProcessingIcon />;
      case '진행중': return <ActiveIcon />;
      case '완료': return <CheckCircleIcon />;
      case '취소': return <CancelledIcon />;
      default: return <PendingIcon />;
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <CalendarIcon sx={{ mr: 1 }} />
          작업 상태 이력
        </Typography>

        <Timeline position="right" sx={{ m: 0, p: 0 }}>
          {schedule.stage?.history && Array.isArray(schedule.stage.history) && schedule.stage.history.map((item, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="text.secondary" sx={{ minWidth: '180px', maxWidth: '180px' }}>
                {item.timestamp && format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm', { locale: ko })}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={getStageColor(item.stage) as any}>
                  {getStageIcon(item.stage)}
                </TimelineDot>
                {index < schedule.stage.history.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body2">
                  {item.stage}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  by {item.by === 'system' ? '시스템' : '관리자'}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
};

export default ScheduleTimeline;