'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Schedule } from '@/types';
import { useRouter } from 'next/navigation';

interface SchedulePaymentInfoProps {
  schedule: Schedule;
  onAddSettlementClick: () => void;
}

const SchedulePaymentInfo: React.FC<SchedulePaymentInfoProps> = ({
  schedule,
  onAddSettlementClick
}) => {
  const router = useRouter();

  // 총 작업 금액 계산
  const calculateTotalAmount = () => {
    const baseRate = schedule.rateInfo?.negotiatedRate || schedule.rateInfo?.baseRate || 0;
    const quantity = schedule.rateInfo?.quantity || 0;
    const baseAmount = baseRate * quantity;
    const additionalAmount = schedule.rateInfo?.additionalAmount || 0;

    return baseAmount + additionalAmount;
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <MoneyIcon sx={{ mr: 1 }} />
          작업 단가 정보
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            기본 단가
          </Typography>
          <Typography variant="body1">
            {schedule.rateInfo?.baseRate !== undefined ? schedule.rateInfo.baseRate.toLocaleString() : 0}원 / {schedule.rateInfo?.unit || '단위 없음'}
          </Typography>
        </Box>

        {schedule.rateInfo?.negotiatedRate !== undefined && schedule.rateInfo.negotiatedRate !== schedule.rateInfo.baseRate && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              협의 단가
            </Typography>
            <Typography variant="body1">
              {schedule.rateInfo?.negotiatedRate !== undefined ? schedule.rateInfo.negotiatedRate.toLocaleString() : 0}원 / {schedule.rateInfo?.unit || '단위 없음'}
            </Typography>
          </Box>
        )}

        {schedule.rateInfo?.quantity !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              작업량
            </Typography>
            <Typography variant="body1">
              {schedule.rateInfo?.quantity !== undefined ? schedule.rateInfo.quantity.toLocaleString() : 0} {schedule.rateInfo?.unit || '단위 없음'}
            </Typography>
          </Box>
        )}

        {schedule.additionalInfo?.expectedQuantity !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              수확량
            </Typography>
            <Typography variant="body1">
              {schedule.additionalInfo.expectedQuantity.toLocaleString()} kg
            </Typography>
          </Box>
        )}

        {schedule.rateInfo?.quantity !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              기본 정산 금액
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {((schedule.rateInfo.negotiatedRate || schedule.rateInfo.baseRate || 0) *
                schedule.rateInfo.quantity).toLocaleString()}원
            </Typography>
          </Box>
        )}

        {schedule.rateInfo?.additionalAmount && schedule.rateInfo.additionalAmount > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              추가 정산 금액
            </Typography>
            <Typography variant="body1" color="primary">
              +{schedule.rateInfo?.additionalAmount?.toLocaleString()}원
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            총 정산 금액
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {calculateTotalAmount().toLocaleString()}원
          </Typography>
        </Box>

        {/* 추가 정산 내역 */}
        {schedule.additionalSettlements && schedule.additionalSettlements.length > 0 && (
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              추가 정산 내역
            </Typography>
            {schedule.additionalSettlements.map((settlement, index) => (
              <Box key={index} sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {settlement.amount.toLocaleString()}원 - {settlement.reason}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {settlement.date && new Date(settlement.date).toLocaleDateString()}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* 결제 버튼 영역 */}
        <Box sx={{ mt: 3 }}>
          {schedule.paymentId ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ReceiptIcon />}
              onClick={() => router.push(`/payments/${schedule.paymentId}`)}
              fullWidth
            >
              결제 상세 보기
            </Button>
          ) : (
            schedule.stage.current === '완료' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => router.push(`/payments/add?scheduleId=${schedule.id}`)}
                  fullWidth
                >
                  새 정산 등록
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={onAddSettlementClick}
                  fullWidth
                >
                  추가 정산 등록
                </Button>
              </Box>
            )
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SchedulePaymentInfo;