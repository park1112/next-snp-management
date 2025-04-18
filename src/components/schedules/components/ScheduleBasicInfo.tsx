'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Schedule } from '@/types';
import { useRouter } from 'next/navigation';

interface ScheduleBasicInfoProps {
  schedule: Schedule;
}

const ScheduleBasicInfo: React.FC<ScheduleBasicInfoProps> = ({ schedule }) => {
  const router = useRouter();

  return (
    <Grid container spacing={3}>
      {/* 작업 일정 정보 */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ mb: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 1 }} />
              작업 일정 정보
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                작업 시작 일시
              </Typography>
              <Typography variant="body1">
                {schedule.scheduledDate?.start && format(schedule.scheduledDate.start, 'yyyy년 M월 d일(E) HH:mm', { locale: ko })}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                작업 종료 일시
              </Typography>
              <Typography variant="body1">
                {schedule.scheduledDate?.end
                  ? format(schedule.scheduledDate.end, 'yyyy년 M월 d일(E) HH:mm', { locale: ko })
                  : '미정'}
              </Typography>
            </Box>

            {schedule.actualDate?.start && (
              <>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    실제 작업 시작
                  </Typography>
                  <Typography variant="body1">
                    {format(schedule.actualDate.start, 'yyyy년 M월 d일(E) HH:mm', { locale: ko })}
                  </Typography>
                </Box>

                {schedule.actualDate.end && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      실제 작업 종료
                    </Typography>
                    <Typography variant="body1">
                      {format(schedule.actualDate.end, 'yyyy년 M월 d일(E) HH:mm', { locale: ko })}
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {schedule.additionalInfo?.flagNumber && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  깃발 번호
                </Typography>
                <Typography variant="body1">
                  {schedule.additionalInfo.flagNumber}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* 작업 관계자 정보 */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ mb: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              작업 관계자 정보
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                농가
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                {schedule.farmerName || '정보 없음'}
                <Button
                  size="small"
                  sx={{ ml: 2 }}
                  onClick={() => router.push(`/farmers/${schedule.farmerId}`)}
                >
                  상세 보기
                </Button>
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                농지
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                {schedule.fieldName || '정보 없음'}
                <Button
                  size="small"
                  sx={{ ml: 2 }}
                  onClick={() => router.push(`/fields/${schedule.fieldId}`)}
                >
                  상세 보기
                </Button>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {schedule.fieldAddress || ''}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                작업자
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                {schedule.workerName || '미배정'}
                {schedule.workerId && (
                  <Button
                    size="small"
                    sx={{ ml: 2 }}
                    onClick={() => router.push(`/workers/foremen/${schedule.workerId}`)}
                  >
                    상세 보기
                  </Button>
                )}
              </Typography>
            </Box>

            {schedule.additionalInfo?.cropType && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  작물 종류
                </Typography>
                <Typography variant="body1">
                  {schedule.additionalInfo.cropType}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* 메모 */}
      {schedule.memo && (
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                메모
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {schedule.memo}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default ScheduleBasicInfo;