'use client';

import React, { useState, useEffect } from 'react';
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
    TextField,
    MenuItem,
    InputAdornment,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    Stack,
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
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    LocalShipping as ShippingIcon,
    Category as CategoryIcon,
    LocationOn as LocationIcon,
    Inventory as InventoryIcon,
    PendingActions as PendingIcon,
    BuildCircle as ProcessingIcon,
    PlayCircle as ActiveIcon,
    HighlightOff as CancelledIcon,
    ExpandMore as ExpandMoreIcon,
    AddCircle as AddCircleIcon,
    Receipt as ReceiptIcon,
    History as HistoryIcon,
    Info as InfoIcon,
    PlayArrow as PlayIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useSchedule } from '@/hooks/useSchedules';
import { Schedule, WorkStage } from '@/types';
import { toJSDate } from '@/utils/date';

interface ScheduleDetailProps {
    scheduleId: string;
}

// 탭 인터페이스 정의
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// 탭 패널 컴포넌트
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`schedule-tabpanel-${index}`}
            aria-labelledby={`schedule-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// 작업 상태에 따른 추가 정보 입력 인터페이스
interface AdditionalInfo {
    quantity?: number;
    unit: string;
    workPrice?: number;
    harvestAmount?: number;
    transportFee?: number;
    notes?: string;
}

const ScheduleDetail: React.FC<ScheduleDetailProps> = ({ scheduleId }) => {
    const router = useRouter();
    const { schedule, isLoading, error, updateSchedule, updateScheduleStage, deleteSchedule } = useSchedule(scheduleId);

    // UI 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stageDialogOpen, setStageDialogOpen] = useState(false);
    const [selectedStage, setSelectedStage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [currentTab, setCurrentTab] = useState(0);
    const [additionalInfoDialogOpen, setAdditionalInfoDialogOpen] = useState(false);
    const [additionalSettlementDialogOpen, setAdditionalSettlementDialogOpen] = useState(false);
    const [addSettlementFor, setAddSettlementFor] = useState<{ categoryId: string }>({ categoryId: '' });
    const [successOpen, setSuccessOpen] = useState(false);

    // 추가 정보 상태
    const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
        quantity: 0,
        unit: '평',
        workPrice: 0,
        harvestAmount: 0,
        transportFee: 0,
        notes: '',
    });

    // 추가 정산 상태
    const [additionalSettlement, setAdditionalSettlement] = useState({
        amount: 0,
        reason: '',
    });

    const [selectedSettlementCategoryId, setSelectedSettlementCategoryId] = useState<string>('');

    // **카테고리별 상태 변경 핸들러**
    const handleCategoryStageChange = async (categoryId: string, newStage: string) => {
        if (!schedule?.categorySchedules) return;
        const updated = schedule.categorySchedules.map(cs =>
            cs.categoryId === categoryId
                ? { ...cs, stage: newStage as WorkStage }
                : cs
        );
        await updateSchedule({ categorySchedules: updated });

        // 카테고리 이름 가져오기
        const categoryName = schedule.categorySchedules.find(cs => cs.categoryId === categoryId)?.categoryName || '작업';
        setSuccessMessage(`${categoryName} 작업이 '${newStage}' 상태로 변경되었습니다.`);
        setSuccessOpen(true);
    };


    // 작업 유형에 따른 기본 단위 설정
    useEffect(() => {
        if (schedule) {
            const defaultUnit = schedule.type === 'transport' ? 'km' : '평';
            setAdditionalInfo(prev => ({
                ...prev,
                unit: schedule.rateInfo?.unit || defaultUnit,
                quantity: schedule.rateInfo?.quantity || 0,
                workPrice: schedule.rateInfo?.negotiatedRate || schedule.rateInfo?.baseRate || 0,
            }));
        }
    }, [schedule]);

    useEffect(() => {
        if (schedule?.categorySchedules?.length) {
            setSelectedSettlementCategoryId(schedule.categorySchedules[0].categoryId);
        }
    }, [schedule]);

    // 작업 상태 변경 핸들러
    const handleStageUpdate = async () => {
        if (!selectedStage) return;

        setActionLoading(true);
        try {
            await updateScheduleStage(selectedStage);
            setSuccessMessage(`작업 상태가 '${selectedStage}'(으)로 변경되었습니다.`);
            setSuccess(true);
            setStageDialogOpen(false);

            // 상태가 '완료'로 변경된 경우 추가 정보 입력 다이얼로그 표시
            if (selectedStage === '완료') {
                setAdditionalInfoDialogOpen(true);
            }
        } catch (error) {
            console.error('Error updating stage:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // 추가 정보 저장 핸들러
    const handleSaveAdditionalInfo = async () => {
        if (!schedule) return;
        setActionLoading(true);
        try {
            // 작업 유형에 따라 다른 필드 업데이트
            // 현재 스케줄의 rateInfo를 기반으로 업데이트 데이터 구성
            const existingRateInfo = schedule.rateInfo;
            const updateData: Partial<Schedule> = {
                rateInfo: {
                    ...existingRateInfo,
                    quantity: additionalInfo.quantity,
                    unit: additionalInfo.unit,
                    negotiatedRate: additionalInfo.workPrice,
                }
            };

            // 운송 작업인 경우 운송 정보 업데이트
            if (schedule?.type === 'transport' && schedule.transportInfo) {
                updateData.transportInfo = {
                    ...schedule.transportInfo,
                    additionalFee: additionalInfo.transportFee,
                };
            }

            // 포장 작업인 경우 수확량 정보 추가
            if (schedule?.type === 'packing' || schedule?.additionalInfo?.cropType) {
                updateData.additionalInfo = {
                    ...(schedule?.additionalInfo || {}),
                    expectedQuantity: additionalInfo.harvestAmount,
                };
            }

            // 메모 업데이트
            if (additionalInfo.notes) {
                updateData.memo = schedule?.memo
                    ? `${schedule.memo}\n\n${additionalInfo.notes}`
                    : additionalInfo.notes;
            }

            await updateSchedule(updateData);
            setSuccessMessage('작업 정보가 성공적으로 업데이트되었습니다.');
            setSuccess(true);
            setAdditionalInfoDialogOpen(false);
        } catch (error) {
            console.error('Error saving additional info:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // 추가 정산 저장 핸들러
    const handleSaveAdditionalSettlement = async () => {
        if (!schedule) return;
        setActionLoading(true);
        try {
            // 안전하게 rateInfo 가져오기 (undefined 방지)
            const rateInfo = schedule.rateInfo || {
                baseRate: 0,
                negotiatedRate: 0,
                quantity: 0,
                additionalAmount: 0,
            };
            const baseRateValue = rateInfo.negotiatedRate ?? rateInfo.baseRate ?? 0;
            const quantityValue = rateInfo.quantity ?? 0;
            // 추가 정산 금액 계산
            const baseAmount = baseRateValue * quantityValue;
            const newAmount = baseAmount + additionalSettlement.amount;

            // 정산 정보 업데이트
            const updateData: Partial<Schedule> = {
                rateInfo: {
                    ...rateInfo,
                    additionalAmount: additionalSettlement.amount,
                    totalAmount: newAmount,
                },
                additionalSettlements: [
                    ...(schedule.additionalSettlements || []),
                    {
                        amount: additionalSettlement.amount,
                        reason: additionalSettlement.reason,
                        date: new Date(),
                        categoryId: selectedSettlementCategoryId,
                    }
                ],
                memo: schedule.memo
                    ? `${schedule.memo}\n\n추가 정산: ${additionalSettlement.amount.toLocaleString()}원 - ${additionalSettlement.reason}`
                    : `추가 정산: ${additionalSettlement.amount.toLocaleString()}원 - ${additionalSettlement.reason}`,
            };

            await updateSchedule(updateData);
            setSuccessMessage('추가 정산 정보가 성공적으로 등록되었습니다.');
            setSuccess(true);
            setAdditionalSettlementDialogOpen(false);

            // 추가 정산 입력값 초기화
            setAdditionalSettlement({
                amount: 0,
                reason: '',
            });
        } catch (error) {
            console.error('Error saving additional settlement:', error);
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
            case 'netting': return '망담기';
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
            case 'netting': return 'info';
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

    // 다음 단계 버튼 텍스트
    const getNextStageButtonText = (currentStage: string) => {
        switch (currentStage) {
            case '예정': return '준비중으로 변경';
            case '준비중': return '진행중으로 변경';
            case '진행중': return '완료로 변경';
            default: return '상태 변경';
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

    const nextStage = (stage: string) => {
        if (stage === '예정') return '준비중';
        if (stage === '준비중') return '진행중';
        if (stage === '진행중') return '완료';
        return stage;
    };

    // 총 작업 금액 계산
    const calculateTotalAmount = () => {
        const baseRate = schedule.rateInfo?.negotiatedRate || schedule.rateInfo?.baseRate || 0;
        const quantity = schedule.rateInfo?.quantity || 0;
        const baseAmount = baseRate * quantity;
        const additionalAmount = schedule.rateInfo?.additionalAmount || 0;

        return baseAmount + additionalAmount;
    };

    // **헤더: 빈 칩 대신 이 스케줄에 속한 모든 카테고리 이름 표시**
    const categoryLabels = schedule.categorySchedules?.map(cs => cs.categoryName).join(', ') || '카테고리 없음';


    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            {/* 헤더 영역 */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton onClick={() => router.back()}><ArrowBackIcon /></IconButton>
                    <Typography variant="h5">작업 일정 상세</Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Chip label={categoryLabels} color="secondary" size="medium" />
                    <Chip
                        label={schedule.stage.current}
                        color={getStageColor(schedule.stage.current)}
                        icon={getStageIcon(schedule.stage.current)}
                    />
                    <Chip
                        label={`결제: ${getPaymentStatusLabel(schedule.paymentStatus)}`}
                        variant="outlined"
                        color={getPaymentStatusColor(schedule.paymentStatus)}
                    />
                </Stack>
            </Box>



            {/* 완료된 작업의 추가 정산 버튼 */}
            {schedule.stage.current === '완료' && (
                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<MoneyIcon />}
                        onClick={() => setAdditionalSettlementDialogOpen(true)}
                        sx={{ mr: 1 }}
                    >
                        추가 정산 등록
                    </Button>
                </Box>
            )}

            {/* 탭 인터페이스 */}
            <Box sx={{ mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<InfoIcon />} label="기본 정보" />
                    <Tab icon={<CategoryIcon />} label="작업 카테고리" />
                    <Tab icon={<MoneyIcon />} label="정산 정보" />
                    <Tab icon={<HistoryIcon />} label="작업 이력" />
                    {schedule.type === 'transport' && <Tab icon={<ShippingIcon />} label="운송 정보" />}
                </Tabs>
            </Box>

            {/* 기본 정보 탭 */}
            <TabPanel value={currentTab} index={0}>
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
            </TabPanel>

            {/* 1. 작업 카테고리 */}
            <TabPanel value={currentTab} index={1}>
                {schedule.categorySchedules?.length
                    ? schedule.categorySchedules.map(cs => {
                        // 이 카테고리에 대한 추가정산만 골라서 합산
                        const extra = (schedule.additionalSettlements || [])
                            .filter(s => s.categoryId === cs.categoryId)
                            .reduce((sum, s) => sum + s.amount, 0);
                        const base = cs.amount || 0;
                        const total = base + extra;

                        return (
                            <Card key={cs.categoryId} variant="outlined" sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {cs.categoryName}
                                        <Chip
                                            label={cs.stage}
                                            size="small"
                                            sx={{ ml: 1 }}
                                            color={getStageColor(cs.stage)}
                                            icon={getStageIcon(cs.stage)}
                                        />
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        시작:{' '}
                                        {cs.scheduledDate?.start
                                            ? (() => {
                                                const date = toJSDate(cs.scheduledDate.start);
                                                return date
                                                    ? format(date, 'yyyy.MM.dd HH:mm', { locale: ko })
                                                    : '미정';
                                            })()
                                            : '미정'}
                                    </Typography>

                                    {cs.workerName && (
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            작업자: {cs.workerName}
                                        </Typography>
                                    )}


                                    {/* ─── 여기서 개별 상태 변경 버튼 추가 ─── */}
                                    {(cs.stage !== '완료' && cs.stage !== '취소') && (
                                        <Stack direction="row" spacing={1} mt={1}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                startIcon={<PlayIcon />}
                                                onClick={() => handleCategoryStageChange(cs.categoryId, nextStage(cs.stage))}
                                            >
                                                {nextStage(cs.stage)}
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<CancelIcon />}
                                                onClick={() => handleCategoryStageChange(cs.categoryId, '취소')}
                                            >
                                                취소
                                            </Button>
                                        </Stack>
                                    )}


                                    {/* 기본 작업비 + 카테고리별 추가정산 합계 */}
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        작업비: {base.toLocaleString()}원
                                        {extra > 0 && (
                                            <> +{extra.toLocaleString()}원 = <strong>{total.toLocaleString()}원</strong></>
                                        )}
                                    </Typography>

                                    {/* 카테고리별 추가 정산 버튼 */}
                                    {cs.stage === '완료' && (
                                        <Button
                                            size="small"
                                            startIcon={<AddCircleIcon />}
                                            sx={{ mt: 1 }}
                                            onClick={() => {
                                                setAddSettlementFor({ categoryId: cs.categoryId });
                                                setAdditionalSettlementDialogOpen(true);
                                            }}
                                        >
                                            추가 정산
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                    : <Typography>등록된 카테고리 작업이 없습니다.</Typography>
                }
            </TabPanel>


            {/* 정산 정보 탭 */}
            <TabPanel value={currentTab} index={2}>
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
                                    +{schedule.rateInfo.additionalAmount.toLocaleString()}원
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


                                    </Box >
                                ))}
                            </Box >
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
                                            onClick={() => setAdditionalSettlementDialogOpen(true)}
                                            fullWidth
                                        >
                                            추가 정산 등록
                                        </Button>
                                    </Box>
                                )
                            )}
                        </Box>
                    </CardContent >
                </Card >
            </TabPanel >

            {/* 작업 이력 탭 */}
            <TabPanel value={currentTab} index={3}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <CalendarIcon sx={{ mr: 1 }} />
                            작업 상태 이력
                        </Typography>

                        <Timeline position="right" sx={{ m: 0, p: 0 }}>
                            {schedule.stage?.history && Array.isArray(schedule.stage.history) && schedule.stage.history.map((item, index) => (
                                <TimelineItem key={index}>
                                    <TimelineOppositeContent color="text.secondary">
                                        {(() => {
                                            const jsDate = toJSDate(item.timestamp);
                                            return jsDate
                                                ? format(jsDate, 'yyyy-MM-dd HH:mm', { locale: ko })
                                                : '–';
                                        })()}
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
            </TabPanel >

            {/* 운송 정보 탭 */}
            {
                // 운송 정보가 있는 경우에만 표시
                schedule.type === 'transport' && schedule.transportInfo && (
                    <TabPanel value={currentTab} index={4}>
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
                    </TabPanel>
                )
            }



            {/* 작업 상태 변경 다이얼로그 */}
            <Dialog open={stageDialogOpen} onClose={() => setStageDialogOpen(false)}>
                <DialogTitle>작업 상태 변경</DialogTitle>
                <DialogContent>
                    <Typography>
                        작업 상태를 '{selectedStage}'(으)로 변경하시겠습니까?
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

            {/* 추가 정보 입력 다이얼로그 */}
            <Dialog
                open={additionalInfoDialogOpen}
                onClose={() => setAdditionalInfoDialogOpen(false)}
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
                                onChange={(e) => setAdditionalInfo(prev => ({
                                    ...prev,
                                    quantity: Number(e.target.value)
                                }))}
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
                            <TextField
                                select
                                label="단위"
                                value={additionalInfo.unit}
                                onChange={(e) => setAdditionalInfo(prev => ({
                                    ...prev,
                                    unit: e.target.value
                                }))}
                                fullWidth
                            >
                                <MenuItem value="평">평</MenuItem>
                                <MenuItem value="m²">m²</MenuItem>
                                <MenuItem value="ha">ha</MenuItem>
                                <MenuItem value="개">개</MenuItem>
                                <MenuItem value="kg">kg</MenuItem>
                                <MenuItem value="km">km</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="작업 단가"
                                type="number"
                                value={additionalInfo.workPrice || 0}
                                onChange={(e) => setAdditionalInfo(prev => ({
                                    ...prev,
                                    workPrice: Number(e.target.value)
                                }))}
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
                        {(schedule.type === 'packing' || schedule.type === 'netting') && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="수확량"
                                    type="number"
                                    value={additionalInfo.harvestAmount || 0}
                                    onChange={(e) => setAdditionalInfo(prev => ({
                                        ...prev,
                                        harvestAmount: Number(e.target.value)
                                    }))}
                                    fullWidth
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                                    }}
                                />
                            </Grid>
                        )}

                        {schedule.type === 'transport' && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="운송 추가 요금"
                                    type="number"
                                    value={additionalInfo.transportFee || 0}
                                    onChange={(e) => setAdditionalInfo(prev => ({
                                        ...prev,
                                        transportFee: Number(e.target.value)
                                    }))}
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
                                onChange={(e) => setAdditionalInfo(prev => ({
                                    ...prev,
                                    notes: e.target.value
                                }))}
                                fullWidth
                                placeholder="추가 정보나 특이사항을 입력하세요"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAdditionalInfoDialogOpen(false)}>취소</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveAdditionalInfo}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={24} /> : '저장'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 추가 정산 입력 다이얼로그 */}
            <Dialog
                open={additionalSettlementDialogOpen}
                onClose={() => setAdditionalSettlementDialogOpen(false)}
            >
                <DialogTitle>추가 정산 등록</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                        <InputLabel>정산 대상 작업</InputLabel>
                        <Select
                            value={selectedSettlementCategoryId}
                            label="정산 대상 작업"
                            onChange={e => setSelectedSettlementCategoryId(e.target.value)}
                        >
                            {schedule.categorySchedules?.map(cs => (
                                <MenuItem key={cs.categoryId} value={cs.categoryId}>
                                    {cs.categoryName} {cs.workerName ? `(${cs.workerName})` : '(미배정)'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="추가 정산 금액"
                                type="number"
                                value={additionalSettlement.amount}
                                onChange={(e) => setAdditionalSettlement(prev => ({
                                    ...prev,
                                    amount: Number(e.target.value)
                                }))}
                                fullWidth
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="추가 정산 사유"
                                value={additionalSettlement.reason}
                                onChange={(e) => setAdditionalSettlement(prev => ({
                                    ...prev,
                                    reason: e.target.value
                                }))}
                                fullWidth
                                placeholder="추가 정산 사유를 입력하세요"
                                margin="normal"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAdditionalSettlementDialogOpen(false)}>취소</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveAdditionalSettlement}
                        disabled={actionLoading || !additionalSettlement.amount || !additionalSettlement.reason}
                    >
                        {actionLoading ? <CircularProgress size={24} /> : '등록'}
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

            {/* ─── 성공 스낵바 ─────────────────── */}
            <Snackbar
                open={successOpen}
                autoHideDuration={3000}
                onClose={() => setSuccessOpen(false)}
            >
                <Alert onClose={() => setSuccessOpen(false)} severity="success">
                    {successMessage}
                </Alert>
            </Snackbar>
        </Paper >
    );
};

export default ScheduleDetail;