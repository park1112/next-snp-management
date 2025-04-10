'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    FormControl,
    FormHelperText,
    InputLabel,
    Select,
    Grid,
    Typography,
    Divider,
    Paper,
    IconButton,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    InputAdornment,
    useTheme,
    Autocomplete,
    Chip,
    Checkbox,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    ListItemButton,
    ListItemSecondaryAction
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    AttachMoney as MoneyIcon,
    Receipt as ReceiptIcon,
    AccountBalance as BankIcon,
    CalendarToday as CalendarIcon,
    EventNote as ScheduleIcon,
    Add as AddIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { Payment, Worker, Schedule } from '@/types';
import { createPayment, updatePayment } from '@/services/firebase/paymentService';
import { getWorkers } from '@/services/firebase/workerService';
import { getSchedulesByWorkerId } from '@/services/firebase/scheduleService';
import { format } from 'date-fns';
import { SelectChangeEvent } from '@mui/material';

interface PaymentFormProps {
    initialData?: Payment;
    isEdit?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const theme = useTheme();

    // URL 파라미터
    const workerId = searchParams?.get('workerId');

    // 기본 정산 데이터
    const [formData, setFormData] = useState<Partial<Payment>>(initialData || {
        receiverId: workerId || '',
        receiverName: '',
        receiverType: undefined,
        payerId: '', // 현재 로그인한 사용자 ID로 설정됨
        scheduleIds: [],
        scheduleDetails: [],
        amount: 0,
        method: 'bank',
        status: 'pending',
        paymentDate: new Date(),
        memo: ''
    });

    // 드롭다운 옵션
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [availableSchedules, setAvailableSchedules] = useState<Schedule[]>([]);
    const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
    const [selectedSchedules, setSelectedSchedules] = useState<Schedule[]>([]);
    const [scheduleSearchTerm, setScheduleSearchTerm] = useState<string>('');
    const [scheduleDialog, setScheduleDialog] = useState<boolean>(false);
    
    // UI 상태
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // 작업자 및 일정 데이터 로드
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 작업자 데이터 로드
                const workersData = await getWorkers();
                setWorkers(workersData);

                // 작업자 ID가 있는 경우 해당 작업자의 작업 일정 로드
                if (workerId || formData.receiverId) {
                    const currentWorkerId = workerId || formData.receiverId;
                    await loadWorkerSchedules(currentWorkerId as string);
                    
                    // 작업자 이름과 타입 설정
                    const worker = workersData.find(w => w.id === currentWorkerId);
                    if (worker && !isEdit) {
                        setFormData(prev => ({
                            ...prev,
                            receiverId: currentWorkerId,
                            receiverName: worker.name,
                            receiverType: worker.type
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [workerId, formData.receiverId, isEdit]);

    // 선택된 일정 상태 변경 시 처리
    useEffect(() => {
        if (selectedSchedules.length > 0) {
            // 선택된 일정에서 UI 표시용 요약 정보 생성
            const scheduleDetails = selectedSchedules.map(schedule => ({
                type: schedule.type,
                date: schedule.scheduledDate.start,
                description: `${schedule.fieldName || ''} (${getTypeLabel(schedule.type)})`
            }));
            
            // 총액 계산
            let totalAmount = 0;
            selectedSchedules.forEach(schedule => {
                // 기본 단가 사용
                let amount = schedule.rateInfo.baseRate;
                
                // 협의 단가가 있으면 그걸 사용
                if (schedule.rateInfo.negotiatedRate) {
                    amount = schedule.rateInfo.negotiatedRate;
                }
                
                // 작업량이 있으면 곱하기
                if (schedule.rateInfo.quantity) {
                    amount *= schedule.rateInfo.quantity;
                }
                
                // 운송 작업인 경우 추가 요금 계산
                if (schedule.type === 'transport' && schedule.transportInfo) {
                    // 거리 기반 추가 요금
                    if (schedule.transportInfo.distanceRate && schedule.transportInfo.distance) {
                        amount += schedule.transportInfo.distanceRate * schedule.transportInfo.distance;
                    }
                    
                    // 기타 추가 요금
                    if (schedule.transportInfo.additionalFee) {
                        amount += schedule.transportInfo.additionalFee;
                    }
                }
                
                totalAmount += amount;
            });
            
            // 데이터 업데이트
            setFormData(prev => ({
                ...prev,
                scheduleIds: selectedSchedules.map(s => s.id),
                scheduleDetails,
                amount: totalAmount
            }));
            
            // 오류 제거
            if (errors.scheduleIds) {
                setErrors({
                    ...errors,
                    scheduleIds: ''
                });
            }
        } else {
            // 선택된 일정이 없는 경우
            setFormData(prev => ({
                ...prev,
                scheduleIds: [],
                scheduleDetails: [],
                amount: 0
            }));
        }
    }, [selectedSchedules]);

    // 작업자의 일정 로드
    const loadWorkerSchedules = async (workerId: string) => {
        try {
            setLoading(true);
            const schedules = await getSchedulesByWorkerId(workerId);
            
            // 정산 가능한 일정만 필터링 (완료 상태이고 정산이 아직 안 된 것)
            const eligibleSchedules = schedules.filter(schedule => 
                schedule.stage.current === '완료' && 
                (schedule.paymentStatus === 'pending' || schedule.paymentStatus === 'requested')
            );
            
            setAvailableSchedules(eligibleSchedules);
            setFilteredSchedules(eligibleSchedules);
            
            // 수정 모드인 경우 이미 선택된 일정 설정
            if (isEdit && initialData) {
                const preselectedSchedules = eligibleSchedules.filter(
                    schedule => initialData.scheduleIds.includes(schedule.id)
                );
                setSelectedSchedules(preselectedSchedules);
            }
        } catch (error) {
            console.error('Error loading worker schedules:', error);
        } finally {
            setLoading(false);
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

    // 폼 입력 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
        const { name, value } = e.target;
        if (!name) return;

        // 중첩된 필드 처리
        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;
                
                if (parent === 'bankInfo') {
                    setFormData({
                        ...formData,
                        bankInfo: {
                            bankName: formData.bankInfo?.bankName || '',
                            accountNumber: formData.bankInfo?.accountNumber || '',
                            accountHolder: formData.bankInfo?.accountHolder || '',
                            [child]: value,
                        },
                    });
                }
            }
            return;
        }

        // 일반 필드
        if (name === 'amount') {
            setFormData({
                ...formData,
                [name]: Number(value),
            });
        } else if (name === 'method') {
            // 결제 방법이 계좌이체인데 은행 정보가 없는 경우 기본값 추가
            if (value === 'bank' && !formData.bankInfo) {
                setFormData({
                    ...formData,
                    [name]: value as 'bank' | 'cash' | 'other',
                    bankInfo: {
                        bankName: '',
                        accountNumber: '',
                        accountHolder: ''
                    }
                });
            } else {
                setFormData({
                    ...formData,
                    [name]: value as 'bank' | 'cash' | 'other',
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }

        // 필수 필드 오류 제거
        if (errors[name] && value) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };

    // 작업자 선택 핸들러
    const handleWorkerChange = (_event: any, newValue: Worker | null) => {
        if (newValue) {
            setFormData({
                ...formData,
                receiverId: newValue.id,
                receiverName: newValue.name,
                receiverType: newValue.type
            });

            // 작업자의 일정 로드
            loadWorkerSchedules(newValue.id);

            // 작업자 관련 오류 제거
            if (errors.receiverId) {
                setErrors({
                    ...errors,
                    receiverId: '',
                });
            }
        } else {
            setFormData({
                ...formData,
                receiverId: '',
                receiverName: '',
                receiverType: undefined
            });
            setAvailableSchedules([]);
            setFilteredSchedules([]);
            setSelectedSchedules([]);
        }
    };

    // 정산 날짜 핸들러
    const handleDateChange = (date: Date | null) => {
        if (!date) return;
        
        setFormData({
            ...formData,
            paymentDate: date
        });
    };

    // 작업 일정 검색 및 필터링
    const handleScheduleSearch = (searchTerm: string) => {
        setScheduleSearchTerm(searchTerm);
        
        if (!searchTerm) {
            setFilteredSchedules(availableSchedules);
            return;
        }
        
        const filtered = availableSchedules.filter(schedule => 
            (schedule.fieldName && schedule.fieldName.includes(searchTerm)) ||
            (schedule.farmerName && schedule.farmerName.includes(searchTerm)) ||
            (schedule.fieldAddress && schedule.fieldAddress.includes(searchTerm)) ||
            getTypeLabel(schedule.type).includes(searchTerm)
        );
        
        setFilteredSchedules(filtered);
    };

    // 작업 일정 선택 핸들러
    const handleScheduleSelect = (schedule: Schedule) => {
        if (selectedSchedules.some(s => s.id === schedule.id)) {
            // 이미 선택된 일정인 경우 제거
            setSelectedSchedules(prev => prev.filter(s => s.id !== schedule.id));
        } else {
            // 새로 선택한 일정 추가
            setSelectedSchedules(prev => [...prev, schedule]);
        }
    };

    // 일정 선택 다이얼로그 열기
    const handleOpenScheduleDialog = () => {
        setScheduleDialog(true);
        setScheduleSearchTerm('');
        setFilteredSchedules(availableSchedules);
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { [key: string]: string } = {};

        if (!formData.receiverId) {
            newErrors.receiverId = '수취인은 필수 항목입니다.';
        }

        if (!formData.scheduleIds || formData.scheduleIds.length === 0) {
            newErrors.scheduleIds = '최소 하나 이상의 작업이 필요합니다.';
        }

        if (!formData.amount || formData.amount <= 0) {
            newErrors.amount = '금액은 0보다 커야 합니다.';
        }

        if (!formData.method) {
            newErrors.method = '결제 방법은 필수 항목입니다.';
        }

        if (formData.method === 'bank') {
            if (!formData.bankInfo?.bankName) {
                newErrors['bankInfo.bankName'] = '은행명은 필수 항목입니다.';
            }
            if (!formData.bankInfo?.accountNumber) {
                newErrors['bankInfo.accountNumber'] = '계좌번호는 필수 항목입니다.';
            }
            if (!formData.bankInfo?.accountHolder) {
                newErrors['bankInfo.accountHolder'] = '예금주는 필수 항목입니다.';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            if (isEdit && initialData?.id) {
                // 정산 정보 수정
                await updatePayment(initialData.id, formData);
                setSuccessMessage('정산 정보가 성공적으로 수정되었습니다.');
            } else {
                // 새 정산 등록
                await createPayment(formData as Required<Payment>);
                setSuccessMessage('정산이 성공적으로 등록되었습니다.');
            }

            setSuccess(true);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push('/payments');
            }, 3000);
        } catch (error) {
            console.error("Error saving payment:", error);
            setErrors({
                submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
            });
        } finally {
            setLoading(false);
        }
    };

    // 현재 선택된 작업자 찾기
    const selectedWorker = workers.find(worker => worker.id === formData.receiverId);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton 
                        onClick={() => router.push('/payments')} 
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        {isEdit ? '정산 정보 수정' : '새 정산 등록'}
                    </Typography>
                </Box>

                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {errors.submit}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                        {/* 수취인 정보 */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                수취인 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                                id="worker-select"
                                options={workers}
                                getOptionLabel={(option) => {
                                    if (option.type === 'driver') {
                                        return `${option.name} (운송기사)`;
                                    } else {
                                        return `${option.name} (작업반장)`;
                                    }
                                }}
                                value={selectedWorker || null}
                                onChange={handleWorkerChange}
                                disabled={isEdit} // 수정 시 작업자 변경 불가
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="수취인 선택"
                                        required
                                        error={!!errors.receiverId}
                                        helperText={errors.receiverId}
                                        placeholder="작업자를 선택하세요"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth required>
                                <InputLabel>정산 상태</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status || 'pending'}
                                    onChange={handleChange}
                                    label="정산 상태"
                                >
                                    <MenuItem value="pending">요청대기</MenuItem>
                                    <MenuItem value="processing">처리중</MenuItem>
                                    <MenuItem value="completed">완료</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 결제 정보 */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                                <MoneyIcon sx={{ mr: 1 }} />
                                결제 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth required>
                                <InputLabel>결제 방법</InputLabel>
                                <Select
                                    name="method"
                                    value={formData.method || 'bank'}
                                    onChange={handleChange}
                                    label="결제 방법"
                                >
                                    <MenuItem value="bank">계좌이체</MenuItem>
                                    <MenuItem value="cash">현금</MenuItem>
                                    <MenuItem value="other">기타</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DatePicker
                                label="정산 날짜"
                                value={formData.paymentDate || null}
                                onChange={handleDateChange}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="정산 금액"
                                name="amount"
                                value={formData.amount || ''}
                                onChange={handleChange}
                                error={!!errors.amount}
                                helperText={errors.amount || '작업 선택 시 자동 계산됩니다'}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MoneyIcon sx={{ color: 'action.active' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                }}
                            />
                        </Grid>

                        {/* 계좌정보 (계좌이체 선택 시) */}
                        {formData.method === 'bank' && (
                            <>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center' }}>
                                        <BankIcon sx={{ mr: 1 }} />
                                        계좌 정보
                                    </Typography>
                                </Grid>
                                
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="은행명"
                                        name="bankInfo.bankName"
                                        value={formData.bankInfo?.bankName || ''}
                                        onChange={handleChange}
                                        error={!!errors['bankInfo.bankName']}
                                        helperText={errors['bankInfo.bankName']}
                                    />
                                </Grid>
                                
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="계좌번호"
                                        name="bankInfo.accountNumber"
                                        value={formData.bankInfo?.accountNumber || ''}
                                        onChange={handleChange}
                                        error={!!errors['bankInfo.accountNumber']}
                                        helperText={errors['bankInfo.accountNumber']}
                                    />
                                </Grid>
                                
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="예금주"
                                        name="bankInfo.accountHolder"
                                        value={formData.bankInfo?.accountHolder || ''}
                                        onChange={handleChange}
                                        error={!!errors['bankInfo.accountHolder']}
                                        helperText={errors['bankInfo.accountHolder']}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* 작업 일정 선택 */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                                <ScheduleIcon sx={{ mr: 1 }} />
                                작업 일정 선택
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    선택된 작업: {selectedSchedules.length}개
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenScheduleDialog}
                                    disabled={!formData.receiverId}
                                >
                                    작업 선택
                                </Button>
                            </Box>

                            {errors.scheduleIds && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {errors.scheduleIds}
                                </Alert>
                            )}

                            {selectedSchedules.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                    <Table sx={{ minWidth: 650 }} size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                                                <TableCell>작업 유형</TableCell>
                                                <TableCell>작업 일시</TableCell>
                                                <TableCell>작업 위치</TableCell>
                                                <TableCell align="right">단가</TableCell>
                                                <TableCell align="right">작업량</TableCell>
                                                <TableCell align="right">금액</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedSchedules.map((schedule) => {
                                                // 금액 계산
                                                let rate = schedule.rateInfo.baseRate;
                                                if (schedule.rateInfo.negotiatedRate) {
                                                    rate = schedule.rateInfo.negotiatedRate;
                                                }
                                                
                                                let quantity = schedule.rateInfo.quantity || 1;
                                                let amount = rate * quantity;
                                                
                                                // 운송 작업인 경우 추가 요금 계산
                                                if (schedule.type === 'transport' && schedule.transportInfo) {
                                                    if (schedule.transportInfo.distanceRate && schedule.transportInfo.distance) {
                                                        amount += schedule.transportInfo.distanceRate * schedule.transportInfo.distance;
                                                    }
                                                    
                                                    if (schedule.transportInfo.additionalFee) {
                                                        amount += schedule.transportInfo.additionalFee;
                                                    }
                                                }
                                                
                                                return (
                                                    <TableRow key={schedule.id}>
                                                        <TableCell>
                                                            <Chip
                                                                size="small"
                                                                label={getTypeLabel(schedule.type)}
                                                                color={getTypeColor(schedule.type)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(schedule.scheduledDate.start, 'yyyy-MM-dd', { locale: ko })}
                                                        </TableCell>
                                                        <TableCell>
                                                            {schedule.fieldName} ({schedule.farmerName})
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {rate.toLocaleString()}원/{schedule.rateInfo.unit}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {quantity || '-'} {quantity ? schedule.rateInfo.unit : ''}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography fontWeight="bold">
                                                                {amount.toLocaleString()}원
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            <TableRow>
                                                <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                                                    총계:
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography fontWeight="bold" color="primary">
                                                        {formData.amount?.toLocaleString()}원
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    정산할 작업을 선택해주세요.
                                </Alert>
                            )}
                        </Grid>

                        {/* 메모 */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="메모"
                                name="memo"
                                value={formData.memo || ''}
                                onChange={handleChange}
                                multiline
                                rows={4}
                                placeholder="정산에 관한 특이사항이나 참고할 내용을 입력하세요"
                            />
                        </Grid>

                        {/* 제출 버튼 */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => router.push('/payments')}
                                    disabled={loading}
                                >
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                >
                                    {isEdit ? '수정' : '등록'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* 작업 선택 다이얼로그 */}
                <Dialog 
                    open={scheduleDialog} 
                    onClose={() => setScheduleDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Typography variant="h6" fontWeight="bold">작업 일정 선택</Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="작업 위치나 유형으로 검색..."
                                value={scheduleSearchTerm}
                                onChange={(e) => handleScheduleSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        {filteredSchedules.length === 0 ? (
                            <Alert severity="info">
                                {availableSchedules.length === 0 ? 
                                    '정산 가능한 작업이 없습니다. 완료된 작업만 정산할 수 있습니다.' : 
                                    '검색 결과가 없습니다.'}
                            </Alert>
                        ) : (
                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {filteredSchedules.map((schedule) => {
                                    const isSelected = selectedSchedules.some(s => s.id === schedule.id);
                                    
                                    // 금액 계산
                                    let rate = schedule.rateInfo.baseRate;
                                    if (schedule.rateInfo.negotiatedRate) {
                                        rate = schedule.rateInfo.negotiatedRate;
                                    }
                                    
                                    let quantity = schedule.rateInfo.quantity || 1;
                                    let amount = rate * quantity;
                                    
                                    // 운송 작업인 경우 추가 요금 계산
                                    if (schedule.type === 'transport' && schedule.transportInfo) {
                                        if (schedule.transportInfo.distanceRate && schedule.transportInfo.distance) {
                                            amount += schedule.transportInfo.distanceRate * schedule.transportInfo.distance;
                                        }
                                        
                                        if (schedule.transportInfo.additionalFee) {
                                            amount += schedule.transportInfo.additionalFee;
                                        }
                                    }
                                    
                                    return (
                                        <ListItem key={schedule.id} disablePadding>
                                        <ListItemButton onClick={() => handleScheduleSelect(schedule)}>
                                          <ListItemText primary={`Item ${schedule.id}`} />
                                        </ListItemButton>
                                
                                          <Chip
                                            size="small"
                                            label={`${amount.toLocaleString()}원`}
                                            color="primary"
                                            variant={isSelected ? "filled" : "outlined"}
                                          />
                                      
                                   
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={isSelected}
                                                    icon={<CheckBoxOutlineBlankIcon />}
                                                    checkedIcon={<CheckBoxIcon />}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Chip
                                                            size="small"
                                                            label={getTypeLabel(schedule.type)}
                                                            color={getTypeColor(schedule.type)}
                                                            sx={{ mr: 1 }}
                                                        />
                                                        <Typography variant="body1">
                                                            {format(schedule.scheduledDate.start, 'yyyy-MM-dd', { locale: ko })}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="body2" color="text.secondary">
                                                        {schedule.fieldName} ({schedule.farmerName}) - 
                                                        {rate.toLocaleString()}원/{schedule.rateInfo.unit} 
                                                        {quantity > 1 ? ` × ${quantity} ${schedule.rateInfo.unit}` : ''}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setScheduleDialog(false)} color="inherit">취소</Button>
                        <Button 
                            onClick={() => setScheduleDialog(false)} 
                            variant="contained" 
                            color="primary"
                        >
                            확인 ({selectedSchedules.length}개 선택)
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
        </LocalizationProvider>
    );
};

export default PaymentForm;