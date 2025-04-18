'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { Schedule } from '@/types';

interface ScheduleTransportInfoProps {
  schedule: Schedule;
}

const ScheduleTransportInfo: React.FC<ScheduleTransportInfoProps> = ({ schedule }) => {
  if (!schedule.transportInfo) {
    return null;
  }

  return (
    <Grid container spacing={3}>
      {/* 출발지/도착지 정보 */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <LocationIcon sx={{ mr: 1 }} />
              경로 정보
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                출발지
              </Typography>
              <Typography variant="body1">
                {schedule.transportInfo.origin.address}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                도착지
              </Typography>
              <Typography variant="body1">
                {schedule.transportInfo.destination.address}
              </Typography>

              {schedule.transportInfo.destination.contactName && (
                <Typography variant="body2">
                  연락처: {schedule.transportInfo.destination.contactName}
                  {schedule.transportInfo.destination.contactPhone &&
                    ` (${schedule.transportInfo.destination.contactPhone})`}
                </Typography>
              )}
            </Box>

            {schedule.transportInfo.distance && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  운송 거리
                </Typography>
                <Typography variant="body1">
                  {schedule.transportInfo.distance}km
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* 화물 정보 */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <InventoryIcon sx={{ mr: 1 }} />
              화물 정보
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                화물 종류
              </Typography>
              <Typography variant="body1">
                {schedule.transportInfo.cargo.type}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                화물 수량
              </Typography>
              <Typography variant="body1">
                {schedule.transportInfo.cargo.quantity} {schedule.transportInfo.cargo.unit}
              </Typography>
            </Box>

            {schedule.transportInfo.distanceRate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  거리당 추가 요금
                </Typography>
                <Typography variant="body1">
                  {schedule.transportInfo.distanceRate.toLocaleString()}원/km
                </Typography>
              </Box>
            )}

            {schedule.transportInfo.additionalFee && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  추가 요금
                </Typography>
                <Typography variant="body1">
                  {schedule.transportInfo.additionalFee.toLocaleString()}원
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ScheduleTransportInfo;