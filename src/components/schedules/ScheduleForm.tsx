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
    Tabs,
    Tab,
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
    SelectChangeEvent
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Terrain as TerrainIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
    LocalShipping as ShippingIcon,
    LocationOn as LocationIcon,
    Inventory as InventoryIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { Schedule, Farmer, Field, Worker, Foreman, Driver } from '@/types';
import { createSchedule, updateSchedule } from '@/services/firebase/scheduleService';
import { getFarmers } from '@/services/firebase/farmerService';
import { getFieldsByFarmerId } from '@/services/firebase/fieldService';
import { getWorkers } from '@/services/firebase/workerService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`schedule-tabpanel-${index}`}
            aria-labelledby={`schedule-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

interface ScheduleFormProps {
    initialData?: Schedule;
    isEdit?: boolean;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const theme = useTheme();

    // URL 파라미터
    const farmerId = searchParams?.get('farmerId');
    const fieldId = searchParams?.get('fieldId');
    const workerId = searchParams?.get('workerId');
    const startDate = searchParams?.get('startDate');
    const endDate = searchParams?.get('endDate');

    // Tab state
    const [tabValue, setTabValue] = useState(0);

    // 기본 작업 일정 데이터
    const [formData, setFormData] = useState<Partial<Schedule>>(initialData || {
        type: 'pulling',
        farmerId: farmerId || '',
        fieldId: fieldId || '',
        workerId: workerId || '',
        stage: {
            current: '예정',
            history: []
        },
        scheduledDate: {
            start: startDate ? new Date(startDate) : new Date(),
            end: endDate ? new Date(endDate) : new Date(new Date().setHours(new Date().getHours() + 2))
        },
        rateInfo: {
            baseRate: 0,
            unit: '시간'
        },
        paymentStatus: 'pending',
        memo: ''
    });

    // 드롭다운 옵션
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [fields, setFields] = useState<Field[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [workerTypes] = useState<{ value: string, label: string }[]>([
        { value: 'foreman', label: '작업반장' },
        { value: 'driver', label: '운송기사' },
    ]);
    const [scheduleTypes] = useState<{ value: string, label: string }[]>([
        { value: 'pulling', label: '뽑기' },
        { value: 'cutting', label: '자르기' },
        { value: 'packing', label: '포장' },
        { value: 'transport', label: '운송' },
    ]);
    const [rateUnits] = useState<{ value: string, label: string }[]>([
        { value: '시간', label: '시간' },
        { value: '일', label: '일' },
        { value: '개수', label: '개수' },
        { value: '면적', label: '면적' },
    ]);

    // 작업자 타입 필터링
    const [workerTypeFilter, setWorkerTypeFilter] = useState<'foreman' | 'driver'>(
        initialData?.type === 'transport' ? 'driver' : 'foreman'
    );

    // UI 상태
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // Tab 변경 핸들러
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 작업 유형이 변경될 때 작업자 타입 필터 업데이트
    useEffect(() => {
        if (formData.type === 'transport') {
            setWorkerTypeFilter('driver');
            // 작업자 타입도 변경
            if (formData.workerId) {
                const currentWorker = workers.find(w => w.id === formData.workerId);
                if (currentWorker && currentWorker.type !== 'driver') {
                    setFormData(prev => ({
                        ...prev,
                        workerId: ''
                    }));
                }
            }
        } else {
            setWorkerTypeFilter('foreman');
            // 작업자 타입도 변경
            if (formData.workerId) {
                const currentWorker = workers.find(w => w.id === formData.workerId);
                if (currentWorker && currentWorker.type !== 'foreman') {
                    setFormData(prev => ({
                        ...prev,
                        workerId: ''
                    }));
                }
            }
        }
    }, [formData.type, workers, formData.workerId]);

    // 농가, 농지, 작업자 데이터 로드
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 농가 데이터 로드
                const farmersData = await getFarmers();
                setFarmers(farmersData);

                // 작업자 데이터 로드
                const workersData = await getWorkers();
                setWorkers(workersData);

                // 농가 ID가 있는 경우 관련 농지 로드
                if (farmerId || formData.farmerId) {
                    const currentFarmerId = farmerId || formData.farmerId;
                    const fieldsData = await getFieldsByFarmerId(currentFarmerId as string);
                    setFields(fieldsData);

                    // 폼 초기화 시 농가 이름 설정 (UI 표시용)
                    if (farmerId && !isEdit) {
                        const farmer = farmersData.find(f => f.id === farmerId);
                        if (farmer) {
                            setFormData(prev => ({
                                ...prev,
                                farmerId
                            }));
                        }
                    }
                }

                // 농지 ID가 있는 경우 해당 농지의 농가 ID도 설정
                if (fieldId && !isEdit) {
                    const allFields = [];
                    for (const farmer of farmersData) {
                        const farmerFields = await getFieldsByFarmerId(farmer.id);
                        allFields.push(...farmerFields);
                    }

                    const field = allFields.find(f => f.id === fieldId);
                    if (field) {
                        setFormData(prev => ({
                            ...prev,
                            farmerId: field.farmerId,
                            fieldId
                        }));

                        // 이 농가의 농지들도 로드
                        const fieldsData = await getFieldsByFarmerId(field.farmerId);
                        setFields(fieldsData);
                    }
                }

                // 작업자 ID가 있는 경우 해당 작업자 타입에 맞게 필터 설정
                if (workerId && !isEdit) {
                    const worker = workersData.find(w => w.id === workerId);
                    if (worker) {
                        setWorkerTypeFilter(worker.type);

                        // 작업 유형도 작업자 타입에 맞게 조정
                        if (worker.type === 'driver') {
                            setFormData(prev => ({
                                ...prev,
                                type: 'transport',
                                workerId
                            }));
                        } else {
                            setFormData(prev => ({
                                ...prev,
                                workerId
                            }));
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [farmerId, fieldId, workerId, formData.farmerId, isEdit]);

    // 폼 입력 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
        const { name, value } = e.target;
        if (!name) return;

        // 중첩된 필드 처리
        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;

                if (parent === 'rateInfo') {
                    setFormData({
                        ...formData,
                        rateInfo: {
                            baseRate: formData.rateInfo?.baseRate || 0,
                            negotiatedRate: formData.rateInfo?.negotiatedRate,
                            quantity: formData.rateInfo?.quantity,
                            unit: formData.rateInfo?.unit || '시간',
                            [child]: child === 'baseRate' ? Number(value) : value,
                        },
                    });
                } else if (parent === 'transportInfo') {
                    setFormData({
                        ...formData,
                        transportInfo: {
                            origin: formData.transportInfo?.origin || { address: '' },
                            destination: formData.transportInfo?.destination || { address: '' },
                            cargo: formData.transportInfo?.cargo || { type: '', quantity: 0, unit: '개' },
                            [child]: value,
                        },
                    });
                } else if (parent === 'stage') {
                    setFormData({
                        ...formData,
                        stage: {
                            current: formData.stage?.current || '예정',
                            history: formData.stage?.history || [],
                            [child]: value,
                        },
                    });
                }
            } else if (parts.length === 3) {
                const [parent, middle, child] = parts;
                if (parent === 'transportInfo') {
                    // Create a new object with the updated nested property
                    const updatedTransportInfo = formData.transportInfo ? { ...formData.transportInfo } : {
                        origin: { address: '' },
                        destination: { address: '' },
                        cargo: { type: '', quantity: 0, unit: '개' }
                    };

                    // Update the nested property
                    if (middle === 'origin' || middle === 'destination') {
                        updatedTransportInfo[middle] = {
                            ...updatedTransportInfo[middle],
                            [child]: value
                        };
                    } else if (middle === 'cargo') {
                        updatedTransportInfo.cargo = {
                            ...updatedTransportInfo.cargo,
                            [child]: value
                        };
                    } else {
                        // Use type assertion to tell TypeScript this is a valid operation
                        (updatedTransportInfo as any)[middle] = value;
                    }

                    setFormData({
                        ...formData,
                        transportInfo: updatedTransportInfo
                    });
                } else if (parent === 'additionalInfo') {
                    // Create a new object with the updated nested property
                    const updatedAdditionalInfo = formData.additionalInfo ? { ...formData.additionalInfo } : {};

                    // Update the nested property
                    (updatedAdditionalInfo as any)[middle] = {
                        ...(updatedAdditionalInfo as any)[middle],
                        [child]: value
                    };

                    setFormData({
                        ...formData,
                        additionalInfo: updatedAdditionalInfo
                    });
                }
            }
            return;
        }

        // 일반 필드
        if (name === 'type') {
            // 작업 유형 변경 시 운송 정보 필드 자동 초기화
            if (value === 'transport' && !formData.transportInfo) {
                setFormData({
                    ...formData,
                    [name]: value as 'pulling' | 'cutting' | 'packing' | 'transport',
                    transportInfo: {
                        origin: { address: '' },
                        destination: { address: '' },
                        cargo: { type: '', quantity: 0, unit: '개' }
                    }
                });
            } else {
                setFormData({
                    ...formData,
                    [name]: value as 'pulling' | 'cutting' | 'packing' | 'transport',
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

    // 농가 선택 핸들러
    const handleFarmerChange = (_event: any, newValue: Farmer | null) => {
        if (newValue) {
            setFormData({
                ...formData,
                farmerId: newValue.id,
                fieldId: '', // 농가 변경 시 농지 선택 초기화
            });

            // 관련 농지 로드
            const fetchFields = async () => {
                try {
                    const fieldsData = await getFieldsByFarmerId(newValue.id);
                    setFields(fieldsData);
                } catch (error) {
                    console.error('Error fetching fields:', error);
                }
            };

            fetchFields();

            // 농가 관련 오류 제거
            if (errors.farmerId) {
                setErrors({
                    ...errors,
                    farmerId: '',
                });
            }
        } else {
            setFormData({
                ...formData,
                farmerId: '',
                fieldId: ''
            });
            setFields([]);
        }
    };

    // 농지 선택 핸들러
    const handleFieldChange = (_event: any, newValue: Field | null) => {
        if (newValue) {
            setFormData({
                ...formData,
                fieldId: newValue.id
            });

            // 농지 관련 오류 제거
            if (errors.fieldId) {
                setErrors({
                    ...errors,
                    fieldId: '',
                });
            }
        } else {
            setFormData({
                ...formData,
                fieldId: ''
            });
        }
    };

    // 작업자 선택 핸들러
    const handleWorkerChange = (_event: any, newValue: Worker | null) => {
        if (newValue) {
            setFormData({
                ...formData,
                workerId: newValue.id
            });

            // 작업자 관련 오류 제거
            if (errors.workerId) {
                setErrors({
                    ...errors,
                    workerId: '',
                });
            }
        } else {
            setFormData({
                ...formData,
                workerId: ''
            });
        }
    };

    // 날짜/시간 핸들러
    const handleDateChange = (date: Date | null, field: string) => {
        if (!date) return;

        if (field === 'scheduledDate.start') {
            setFormData({
                ...formData,
                scheduledDate: {
                    ...formData.scheduledDate,
                    start: date
                }
            });
        } else if (field === 'scheduledDate.end') {
            // Ensure we have a valid start date
            const startDate = formData.scheduledDate?.start || new Date();

            setFormData({
                ...formData,
                scheduledDate: {
                    start: startDate,
                    end: date
                }
            });
        }
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { [key: string]: string } = {};

        if (!formData.type) {
            newErrors.type = '작업 유형은 필수 항목입니다.';
        }

        if (!formData.farmerId) {
            newErrors.farmerId = '농가는 필수 항목입니다.';
        }

        if (!formData.fieldId) {
            newErrors.fieldId = '농지는 필수 항목입니다.';
        }

        if (!formData.workerId) {
            newErrors.workerId = '작업자는 필수 항목입니다.';
        }

        if (!formData.scheduledDate?.start) {
            newErrors['scheduledDate.start'] = '작업 시작 일시는 필수 항목입니다.';
        }

        if (!formData.scheduledDate?.end) {
            newErrors['scheduledDate.end'] = '작업 종료 일시는 필수 항목입니다.';
        }

        if (formData.scheduledDate?.start && formData.scheduledDate?.end &&
            formData.scheduledDate.start > formData.scheduledDate.end) {
            newErrors['scheduledDate.end'] = '종료 일시는 시작 일시보다 이후여야 합니다.';
        }

        if (!formData.rateInfo?.baseRate) {
            newErrors['rateInfo.baseRate'] = '기본 단가는 필수 항목입니다.';
        }

        if (formData.type === 'transport') {
            if (!formData.transportInfo?.origin.address) {
                newErrors['transportInfo.origin.address'] = '출발지 주소는 필수 항목입니다.';
            }

            if (!formData.transportInfo?.destination.address) {
                newErrors['transportInfo.destination.address'] = '도착지 주소는 필수 항목입니다.';
            }

            if (!formData.transportInfo?.cargo.type) {
                newErrors['transportInfo.cargo.type'] = '화물 종류는 필수 항목입니다.';
            }

            if (!formData.transportInfo?.cargo.quantity) {
                newErrors['transportInfo.cargo.quantity'] = '화물 수량은 필수 항목입니다.';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            // undefined 값을 null로 변환하거나 제거하는 함수
            const sanitizeData = (data: any): any => {
                const cleaned: any = {};

                Object.keys(data).forEach(key => {
                    if (data[key] === undefined) {
                        // undefined 값은 제외
                        return;
                    }

                    if (data[key] === null) {
                        cleaned[key] = null;
                        return;
                    }

                    if (typeof data[key] === 'object' && data[key] !== null) {
                        // 객체인 경우 재귀적으로 처리
                        cleaned[key] = sanitizeData(data[key]);

                        // 빈 객체인 경우 제외
                        if (Object.keys(cleaned[key]).length === 0) {
                            delete cleaned[key];
                        }
                    } else {
                        cleaned[key] = data[key];
                    }
                });

                return cleaned;
            };

            // 1. 상태 변경 이력에 현재 상태 추가
            const stageHistory = [...(formData.stage?.history || [])];
            if (!isEdit || stageHistory.length === 0) {
                stageHistory.push({
                    stage: formData.stage?.current || '예정',
                    timestamp: new Date(),
                    by: 'system'
                });
            }

            // 기본 데이터 구성
            const scheduleData = {
                ...formData,
                stage: {
                    current: formData.stage?.current || '예정',
                    history: stageHistory
                },
                rateInfo: {
                    baseRate: formData.rateInfo?.baseRate || 0,
                    unit: formData.rateInfo?.unit || '시간',
                    quantity: formData.rateInfo?.quantity || null,
                    negotiatedRate: formData.rateInfo?.negotiatedRate || null
                }
            };

            // 데이터 정제
            const cleanedData = sanitizeData(scheduleData);

            if (isEdit && initialData?.id) {
                // 작업 일정 수정
                await updateSchedule(initialData.id, cleanedData);
                setSuccessMessage('작업 일정이 성공적으로 수정되었습니다.');
            } else {
                // 새 작업 일정 등록
                await createSchedule(cleanedData as Required<Schedule>);
                setSuccessMessage('작업 일정이 성공적으로 등록되었습니다.');
            }

            setSuccess(true);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push('/schedules');
            }, 3000);
        } catch (error) {
            console.error("Error saving schedule:", error);
            setErrors({
                submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
            });
        } finally {
            setLoading(false);
        }
    };

    // 현재 선택된 농가 찾기
    const selectedFarmer = farmers.find(farmer => farmer.id === formData.farmerId);

    // 현재 선택된 농지 찾기
    const selectedField = fields.find(field => field.id === formData.fieldId);

    // 작업자 타입에 따라 필터링
    const filteredWorkers = workers.filter(worker => worker.type === workerTypeFilter);

    // 현재 선택된 작업자 찾기
    const selectedWorker = workers.find(worker => worker.id === formData.workerId);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton
                        onClick={() => router.push('/schedules')}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        {isEdit ? '작업 일정 수정' : '새 작업 일정 등록'}
                    </Typography>
                </Box>

                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* 탭 네비게이션 */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="schedule form tabs"
                    >
                        <Tab label="기본 정보" id="schedule-tab-0" aria-controls="schedule-tabpanel-0" />
                        <Tab label="작업 정보" id="schedule-tab-1" aria-controls="schedule-tabpanel-1" />
                        {formData.type === 'transport' && (
                            <Tab label="운송 정보" id="schedule-tab-2" aria-controls="schedule-tabpanel-2" />
                        )}
                    </Tabs>
                </Box>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {/* 기본 정보 탭 */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            {/* 작업 유형 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth required error={!!errors.type}>
                                    <InputLabel>작업 유형</InputLabel>
                                    <Select
                                        name="type"
                                        value={formData.type || ''}
                                        onChange={handleChange}
                                        label="작업 유형"
                                    >
                                        {scheduleTypes.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.type && (
                                        <FormHelperText>{errors.type}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            {/* 작업 상태 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>작업 상태</InputLabel>
                                    <Select
                                        name="stage.current"
                                        value={formData.stage?.current || '예정'}
                                        onChange={handleChange}
                                        label="작업 상태"
                                    >
                                        <MenuItem value="예정">예정</MenuItem>
                                        <MenuItem value="준비중">준비중</MenuItem>
                                        <MenuItem value="진행중">진행중</MenuItem>
                                        <MenuItem value="완료">완료</MenuItem>
                                        <MenuItem value="취소">취소</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* 농가 선택 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon sx={{ mr: 1 }} />
                                    농가 정보
                                </Typography>

                                <Autocomplete
                                    id="farmer-select"
                                    options={farmers}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedFarmer || null}
                                    onChange={handleFarmerChange}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="농가 선택"
                                            required
                                            error={!!errors.farmerId}
                                            helperText={errors.farmerId}
                                            placeholder="농가를 선택하세요"
                                        />
                                    )}
                                />
                            </Grid>

                            {/* 농지 선택 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <TerrainIcon sx={{ mr: 1 }} />
                                    농지 정보
                                </Typography>

                                <Autocomplete
                                    id="field-select"
                                    options={fields}
                                    getOptionLabel={(option) => `${option.address.full.split(' ').pop() || '농지'} (${option.cropType})`}
                                    value={selectedField || null}
                                    onChange={handleFieldChange}
                                    disabled={!formData.farmerId}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="농지 선택"
                                            required
                                            error={!!errors.fieldId}
                                            helperText={errors.fieldId || '농지를 선택하세요'}
                                            placeholder="농지를 선택하세요"
                                        />
                                    )}
                                />
                            </Grid>

                            {/* 작업자 타입 및 작업자 선택 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon sx={{ mr: 1 }} />
                                    작업자 정보
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>작업자 타입</InputLabel>
                                    <Select
                                        value={workerTypeFilter}
                                        onChange={(e) => setWorkerTypeFilter(e.target.value as 'foreman' | 'driver')}
                                        label="작업자 타입"
                                        disabled={formData.type === 'transport'} // 운송 작업일 경우 무조건 운송기사
                                    >
                                        {workerTypes.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Autocomplete
                                    id="worker-select"
                                    options={filteredWorkers}
                                    getOptionLabel={(option) => {
                                        if (option.type === 'driver') {
                                            const driver = option as Driver;
                                            return `${option.name} (${driver.driverInfo.vehicleType} ${driver.driverInfo.vehicleNumberLast4})`;
                                        } else {
                                            const foreman = option as Foreman;
                                            return `${option.name} (${foreman.foremanInfo.category})`;
                                        }
                                    }}
                                    value={selectedWorker || null}
                                    onChange={handleWorkerChange}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={workerTypeFilter === 'foreman' ? '작업반장 선택' : '운송기사 선택'}
                                            required
                                            error={!!errors.workerId}
                                            helperText={errors.workerId}
                                            placeholder={workerTypeFilter === 'foreman' ? '작업반장을 선택하세요' : '운송기사를 선택하세요'}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* 작업 일정 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center' }}>
                                    <CalendarIcon sx={{ mr: 1 }} />
                                    작업 일정
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <DateTimePicker
                                    label="작업 시작 일시"
                                    value={formData.scheduledDate?.start || null}
                                    onChange={(date) => handleDateChange(date, 'scheduledDate.start')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            error: !!errors['scheduledDate.start'],
                                            helperText: errors['scheduledDate.start']
                                        },
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <DateTimePicker
                                    label="작업 종료 일시"
                                    value={formData.scheduledDate?.end || null}
                                    onChange={(date) => handleDateChange(date, 'scheduledDate.end')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            error: !!errors['scheduledDate.end'],
                                            helperText: errors['scheduledDate.end']
                                        },
                                    }}
                                />
                            </Grid>

                            {/* 메모 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="메모"
                                    name="memo"
                                    value={formData.memo || ''}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    placeholder="작업에 관한 특이사항이나 참고할 내용을 입력하세요"
                                />
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* 작업 정보 탭 */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            {/* 작업 단가 정보 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <MoneyIcon sx={{ mr: 1 }} />
                                    작업 단가 정보
                                </Typography>
                                <Card variant="outlined" sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    required
                                                    type="number"
                                                    label="기본 단가"
                                                    name="rateInfo.baseRate"
                                                    value={formData.rateInfo?.baseRate || ''}
                                                    onChange={handleChange}
                                                    error={!!errors['rateInfo.baseRate']}
                                                    helperText={errors['rateInfo.baseRate']}
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

                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <FormControl fullWidth required>
                                                    <InputLabel>단위</InputLabel>
                                                    <Select
                                                        name="rateInfo.unit"
                                                        value={formData.rateInfo?.unit || '시간'}
                                                        onChange={handleChange}
                                                        label="단위"
                                                    >
                                                        {rateUnits.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>

                                            {formData.type !== 'transport' && (
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="작업량"
                                                        name="rateInfo.quantity"
                                                        value={formData.rateInfo?.quantity || ''}
                                                        onChange={handleChange}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">{formData.rateInfo?.unit}</InputAdornment>,
                                                        }}
                                                    />
                                                </Grid>
                                            )}

                                            {formData.type !== 'transport' && (
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="협의 단가"
                                                        name="rateInfo.negotiatedRate"
                                                        value={formData.rateInfo?.negotiatedRate || ''}
                                                        onChange={handleChange}
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
                                            )}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* 작업 상세 정보 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <InfoIcon sx={{ mr: 1 }} />
                                    작업 상세 정보
                                </Typography>
                                <Card variant="outlined">
                                    <CardContent>
                                        {/* 작업 유형별 추가 정보 필드 */}
                                        {formData.type === 'pulling' && (
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="대상 작물"
                                                        name="additionalInfo.cropType"
                                                        value={formData.additionalInfo?.cropType || ''}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="예상 작업량"
                                                        name="additionalInfo.expectedQuantity"
                                                        value={formData.additionalInfo?.expectedQuantity || ''}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                            </Grid>
                                        )}

                                        {formData.type === 'cutting' && (
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="절단 방식"
                                                        name="additionalInfo.cuttingMethod"
                                                        value={formData.additionalInfo?.cuttingMethod || ''}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="기타 요청사항"
                                                        name="additionalInfo.specialRequirements"
                                                        value={formData.additionalInfo?.specialRequirements || ''}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                            </Grid>
                                        )}

                                        {formData.type === 'packing' && (
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="포장 유형"
                                                        name="additionalInfo.packagingType"
                                                        value={formData.additionalInfo?.packagingType || ''}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="예상 포장 수량"
                                                        name="additionalInfo.expectedPackages"
                                                        value={formData.additionalInfo?.expectedPackages || ''}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                            </Grid>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* 운송 정보 탭 */}
                    {formData.type === 'transport' && (
                        <TabPanel value={tabValue} index={2}>
                            <Grid container spacing={3}>
                                {/* 출발지 정보 */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <LocationIcon sx={{ mr: 1 }} />
                                        출발지 정보
                                    </Typography>
                                    <Card variant="outlined" sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        label="출발지 주소"
                                                        name="transportInfo.origin.address"
                                                        value={formData.transportInfo?.origin.address || ''}
                                                        onChange={handleChange}
                                                        error={!!errors['transportInfo.origin.address']}
                                                        helperText={errors['transportInfo.origin.address']}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <LocationIcon sx={{ color: 'action.active' }} />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 도착지 정보 */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <LocationIcon sx={{ mr: 1 }} />
                                        도착지 정보
                                    </Typography>
                                    <Card variant="outlined" sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        label="도착지 주소"
                                                        name="transportInfo.destination.address"
                                                        value={formData.transportInfo?.destination.address || ''}
                                                        onChange={handleChange}
                                                        error={!!errors['transportInfo.destination.address']}
                                                        helperText={errors['transportInfo.destination.address']}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <LocationIcon sx={{ color: 'action.active' }} />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="도착지 담당자"
                                                        name="transportInfo.destination.contactName"
                                                        value={formData.transportInfo?.destination.contactName || ''}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="도착지 연락처"
                                                        name="transportInfo.destination.contactPhone"
                                                        value={formData.transportInfo?.destination.contactPhone || ''}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 화물 정보 */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <InventoryIcon sx={{ mr: 1 }} />
                                        화물 정보
                                    </Typography>
                                    <Card variant="outlined" sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        label="화물 종류"
                                                        name="transportInfo.cargo.type"
                                                        value={formData.transportInfo?.cargo.type || ''}
                                                        onChange={handleChange}
                                                        error={!!errors['transportInfo.cargo.type']}
                                                        helperText={errors['transportInfo.cargo.type']}
                                                    />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        required
                                                        type="number"
                                                        label="화물 수량"
                                                        name="transportInfo.cargo.quantity"
                                                        value={formData.transportInfo?.cargo.quantity || ''}
                                                        onChange={handleChange}
                                                        error={!!errors['transportInfo.cargo.quantity']}
                                                        helperText={errors['transportInfo.cargo.quantity']}
                                                    />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <FormControl fullWidth>
                                                        <InputLabel>단위</InputLabel>
                                                        <Select
                                                            name="transportInfo.cargo.unit"
                                                            value={formData.transportInfo?.cargo.unit || '개'}
                                                            onChange={handleChange}
                                                            label="단위"
                                                        >
                                                            <MenuItem value="개">개</MenuItem>
                                                            <MenuItem value="상자">상자</MenuItem>
                                                            <MenuItem value="박스">박스</MenuItem>
                                                            <MenuItem value="kg">kg</MenuItem>
                                                            <MenuItem value="톤">톤</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="운송 거리"
                                                        name="transportInfo.distance"
                                                        value={formData.transportInfo?.distance || ''}
                                                        onChange={handleChange}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">km</InputAdornment>,
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 운송 단가 정보 */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <MoneyIcon sx={{ mr: 1 }} />
                                        운송료 정보
                                    </Typography>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="거리당 추가 요금"
                                                        name="transportInfo.distanceRate"
                                                        value={formData.transportInfo?.distanceRate || ''}
                                                        onChange={handleChange}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <MoneyIcon sx={{ color: 'action.active' }} />
                                                                </InputAdornment>
                                                            ),
                                                            endAdornment: <InputAdornment position="end">원/km</InputAdornment>,
                                                        }}
                                                    />
                                                </Grid>

                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="추가 요금"
                                                        name="transportInfo.additionalFee"
                                                        value={formData.transportInfo?.additionalFee || ''}
                                                        onChange={handleChange}
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
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>
                    )}

                    {/* 제출 버튼 */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => router.push('/schedules')}
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
                </Box>
            </Paper>

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
        </LocalizationProvider>
    );
};

export default ScheduleForm;