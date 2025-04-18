'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Typography,
} from '@mui/material';
import { Schedule } from '@/types';

interface AdditionalInfo {
  quantity?: number;
  unit: string;
  workPrice?: number;
  harvestAmount?: number;
  transportFee?: number;
  notes?: string;
}

interface ScheduleDialogsProps {
  // 상태 변경 다이얼로그
  stageDialogOpen: boolean;
  onStageDialogClose: () => void;
  selectedStage: string;
  onStageUpdate: () => Promise<void>;
  
  // 삭제 다이얼로그
  deleteDialogOpen: boolean;
  onDeleteDialogClose: () => void;
  onDelete: () => Promise<void>;
  
  // 추가 정보 다이얼로그
  additionalInfoDialogOpen: boolean;
  onAdditionalInfoDialogClose: () => void;
  additionalInfo: AdditionalInfo;
  onAdditionalInfoChange: (field: keyof AdditionalInfo, value: any) => void;
  onSaveAdditionalInfo: () => Promise<void>;
  
  // 추가 정산 다이얼로그
  additionalSettlementDialogOpen: boolean;
  onAdditionalSettlementDialogClose: () => void;
  additionalSettlementAmount: number;
  onAdditionalSettlementAmountChange: (value: number) => void;
  additionalSettlementReason: string;
  onAdditionalSettlementReasonChange: (value: string) => void;
  onSaveAdditionalSettlement: () => Promise<void>;
  
  // 로딩 상태
  actionLoading: boolean;
  
  // 작업 유형
  scheduleType: string;
}

const ScheduleDialogs: React.FC<ScheduleDialogsProps> = ({
  stageDialogOpen,
  onStageDialogClose,
  selectedStage,
  onStageUpdate,
  
  deleteDialogOpen,
  onDeleteDialogClose,
  onDelete,
  
  additionalInfoDialogOpen,
  onAdditionalInfoDialogClose,
  additionalInfo,
  onAdditionalInfoChange,
  onSaveAdditionalInfo,
  
  additionalSettlementDialogOpen,
  onAdditionalSettlementDialogClose,
  additionalSettlementAmount,
  onAdditionalSettlementAmountChange,
  additionalSettlementReason,
  onAdditionalSettlementReasonChange,
  onSaveAdditionalSettlement,
  
  actionLoading,
  scheduleType,
}) => {
  return (
    <>
      {/* 작업 상태 변경 다이얼로그 */}
      <Dialog open={stageDialogOpen} onClose={onStageDialogClose}>
        <DialogTitle>작업 상태 변경</DialogTitle>
        <DialogContent>
          <Typography>
            작업 상태를 '{selectedStage}'(으)로 변경하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onStageDialogClose}>취소</Button>
          <Button
            variant="contained"
            onClick={onStageUpdate}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '확인'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={onDeleteDialogClose}>
        <DialogTitle>작업 일정 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            이 작업 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onDeleteDialogClose}>취소</Button>
          <Button
            variant="contained"
            color="error"
            onClick={onDelete}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 추가 정보 입력 다이얼로그 */}
      <Dialog 
        open={additionalInfoDialogOpen} 
        onClose={onAdditionalInfoDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>작업 완료 정보 입력</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="작업량"
                type="number"
                value={additionalInfo.quantity || 0}
                onChange={(e) => onAdditionalInfoChange('quantity', Number(e.target.value))}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {additionalInfo.unit}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>단위</InputLabel>
                <Select
                  value={additionalInfo.unit}
                  onChange={(e) => onAdditionalInfoChange('unit', e.target.value)}
                  label="단위"
                >
                  <MenuItem value="평">평</MenuItem>
                  <MenuItem value="m²">m²</MenuItem>
                  <MenuItem value="ha">ha</MenuItem>
                  <MenuItem value="개">개</MenuItem>
                  <MenuItem value="kg">kg</MenuItem>
                  <MenuItem value="km">km</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="작업 단가"
                type="number"
                value={additionalInfo.workPrice || 0}
                onChange={(e) => onAdditionalInfoChange('workPrice', Number(e.target.value))}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      원/{additionalInfo.unit}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* 작업 유형에 따른 추가 필드 */}
            {(scheduleType === 'packing' || scheduleType === 'netting') && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="수확량"
                  type="number"
                  value={additionalInfo.harvestAmount || 0}
                  onChange={(e) => onAdditionalInfoChange('harvestAmount', Number(e.target.value))}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                />
              </Grid>
            )}
            
            {scheduleType === 'transport' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="운송 추가 요금"
                  type="number"
                  value={additionalInfo.transportFee || 0}
                  onChange={(e) => onAdditionalInfoChange('transportFee', Number(e.target.value))}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">원</InputAdornment>,
                  }}
                />
              </Grid>
            )}
            
            <Grid size={{ xs: 12 }}>
              <TextField
                label="메모"
                multiline
                rows={4}
                value={additionalInfo.notes || ''}
                onChange={(e) => onAdditionalInfoChange('notes', e.target.value)}
                fullWidth
                placeholder="추가 정보나 특이사항을 입력하세요"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onAdditionalInfoDialogClose}>취소</Button>
          <Button
            variant="contained"
            onClick={onSaveAdditionalInfo}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 추가 정산 입력 다이얼로그 */}
      <Dialog 
        open={additionalSettlementDialogOpen} 
        onClose={onAdditionalSettlementDialogClose}
      >
        <DialogTitle>추가 정산 등록</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="추가 정산 금액"
                type="number"
                value={additionalSettlementAmount}
                onChange={(e) => onAdditionalSettlementAmountChange(Number(e.target.value))}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">원</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="추가 정산 사유"
                value={additionalSettlementReason}
                onChange={(e) => onAdditionalSettlementReasonChange(e.target.value)}
                fullWidth
                placeholder="추가 정산 사유를 입력하세요"
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onAdditionalSettlementDialogClose}>취소</Button>
          <Button
            variant="contained"
            onClick={onSaveAdditionalSettlement}
            disabled={actionLoading || !additionalSettlementAmount || !additionalSettlementReason}
          >
            {actionLoading ? <CircularProgress size={24} /> : '등록'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ScheduleDialogs;