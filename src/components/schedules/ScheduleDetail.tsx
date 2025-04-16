'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
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
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Terrain as TerrainIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    LocalShipping as ShippingIcon,
    LocationOn as LocationIcon,
    Inventory as InventoryIcon,
    PendingActions as PendingIcon,
    BuildCircle as ProcessingIcon,
    PlayCircle as ActiveIcon,
    HighlightOff as CancelledIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useSchedule } from '@/hooks/useSchedules';
import { Schedule } from '@/types';

interface ScheduleDetailProps {
    scheduleId: string;
}

const ScheduleDetail: React.FC<ScheduleDetailProps> = ({ scheduleId }) => {
    const router = useRouter();
    const { schedule, isLoading, error, updateScheduleStage, deleteSchedule } = useSchedule(scheduleId);

    // UI 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stageDialogOpen, setStageDialogOpen] = useState(false);
    const [selectedStage, setSelectedStage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // 작업 상태 변경 핸들러
    const handleStageUpdate = async () => {
        if (!selectedStage) return;

        setActionLoading(true);
        try {
            await updateScheduleStage(selectedStage);
            setSuccessMessage(`작업 상태가 '${selectedStage}'(으)로 변경되었습니다.`);
            setSuccess(true);
            setStageDialogOpen(false);
        } catch (error) {
            console.error('Error updating stage:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // 작업 일정 삭제 핸들러
    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await deleteSchedule();
            setSuccessMessage('작업 일정이 삭제되었습니다.');
            setSuccess(true);
            setDeleteDialogOpen(false);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push('/schedules');
            }, 3000);
        } catch (error) {
            console.error('Error deleting schedule:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // 작업 유형별 표시 텍스트
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'pulling': return '뽑기';
            case 'cutting': return '자르기';
            case 'packing': return '포장';
            case 'transport': return '운송';
            default: return type;
        }
    };

    // 작업 유형별 칩 색상
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'pulling': return 'primary';
            case 'cutting': return 'secondary';
            case 'packing': return 'success';
            case 'transport': return 'warning';
            default: return 'default';
        }
    };

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

    // 결제 상태별 칩 색상
    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'default';
            case 'requested': return 'warning';
            case 'onhold': return 'info';
            case 'completed': return 'success';
            default: return 'default';
        }
    };

    // 결제 상태별 텍스트
    const getPaymentStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return '대기';
            case 'requested': return '요청됨';
            case 'onhold': return '보류';
            case 'completed': return '완료';
            default: return status;
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !schedule) {
        return (
            <Alert severity="error">
                작업 일정을 불러오는 중 오류가 발생했습니다.
            </Alert>
        );
    }

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            {/* 헤더 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => router.push('/schedules')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        작업 일정 상세
                    </Typography>
                </Box>

                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/schedules/${scheduleId}/edit`)}
                        sx={{ mr: 1 }}
                    >
                        수정
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        삭제
                    </Button>
                </Box>
            </Box>

            {/* 상태 표시 영역 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Chip
                    label={getTypeLabel(schedule.type)}
                    color={getTypeColor(schedule.type)}
                    size="medium"
                />
                <Chip
                    label={schedule.stage.current}
                    color={getStageColor(schedule.stage.current)}
                    size="medium"
                    icon={getStageIcon(schedule.stage.current)}
                />
                <Chip
                    label={`결제: ${getPaymentStatusLabel(schedule.paymentStatus)}`}
                    color={getPaymentStatusColor(schedule.paymentStatus)}
                    size="medium"
                />
            </Box>

            {/* 작업 상태 변경 버튼 */}
            {(schedule.stage.current !== '완료' && schedule.stage.current !== '취소') && (
                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => {
                            const nextStage =
                                schedule.stage.current === '예정' ? '준비중' :
                                    schedule.stage.current === '준비중' ? '진행중' : '완료';
                            setSelectedStage(nextStage);
                            setStageDialogOpen(true);
                        }}
                        sx={{ mr: 1 }}
                    >
                        {schedule.stage.current === '예정' ? '준비중' :
                            schedule.stage.current === '준비중' ? '진행중' : '완료'} 처리
                    </Button>

                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                            setSelectedStage('취소');
                            setStageDialogOpen(true);
                        }}
                    >
                        취소 처리
                    </Button>
                </Box>
            )}

            {/* 작업 기본 정보 */}
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
                                <Typography variant="body1">
                                    {schedule.farmerName || '정보 없음'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    농지
                                </Typography>
                                <Typography variant="body1">
                                    {schedule.fieldName || '정보 없음'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {schedule.fieldAddress || ''}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    작업자
                                </Typography>
                                <Typography variant="body1">
                                    {schedule.workerName || '미배정'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 작업 단가 정보 */}
                <Grid size={{ xs: 12, md: 6 }}>
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

                            {schedule.rateInfo?.negotiatedRate !== undefined && (
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

                            {schedule.paymentId && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        결제 정보
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => router.push(`/payments/${schedule.paymentId}`)}
                                    >
                                        결제 상세 보기
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* 작업 상태 이력 */}
                <Grid size={{ xs: 12, md: 6 }}>
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
                                            {format(item.timestamp, 'yyyy-MM-dd HH:mm', { locale: ko })}
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
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 운송 정보 (운송 작업일 경우만) */}
                {schedule.type === 'transport' && schedule.transportInfo && (
                    <>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                                <ShippingIcon sx={{ mr: 1 }} />
                                운송 상세 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

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
                    </>
                )}

                {/* 메모 */}
                {schedule.memo && (
                    <Grid size={{ xs: 12 }}>
                        <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                    메모
                                </Typography>
                                <Typography variant="body1">
                                    {schedule.memo}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* 작업 상태 변경 다이얼로그 */}
            <Dialog open={stageDialogOpen} onClose={() => setStageDialogOpen(false)}>
                <DialogTitle>작업 상태 변경</DialogTitle>
                <DialogContent>
                    <Typography>
                        작업 상태를 &apos;{selectedStage}&apos;(으)로 변경하시겠습니까?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStageDialogOpen(false)}>취소</Button>
                    <Button
                        variant="contained"
                        onClick={handleStageUpdate}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={24} /> : '확인'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>작업 일정 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        이 작업 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={24} /> : '삭제'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 성공 알림 */}
            <Snackbar
                open={success}
                autoHideDuration={3000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default ScheduleDetail;