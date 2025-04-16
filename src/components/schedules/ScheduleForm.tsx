'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    TextField,
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
    Alert,
    Snackbar,
    InputAdornment,
    Autocomplete,
    SelectChangeEvent,
    Card,
    CardContent,
    Chip,
    Button,
    CardActions,
    CardHeader,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Tooltip,
    Stack,
    CircularProgress
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import {
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Terrain as TerrainIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
    LocalShipping as ShippingIcon,
    LocationOn as LocationIcon,
    Info as InfoIcon,
    Save as SaveIcon,
    Flag as FlagIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Phone as PhoneIcon,
    Home as HomeIcon,
    Check as CheckIcon,
    SwapHoriz as SwapHorizIcon,
    Category as CategoryIcon,
    Payment as PaymentIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Schedule, Farmer, Field, Worker, Foreman, Driver, LocationItem, Category } from '@/types';
import { createSchedule, updateSchedule } from '@/services/firebase/scheduleService';
import { getFarmers, searchFarmers } from '@/services/firebase/farmerService';
import { getFieldsByFarmerId } from '@/services/firebase/fieldService';
import { getForemanCategories, getWorkers } from '@/services/firebase/workerService';
import { getCategories, getCategoryById } from '@/services/firebase/categoryService';

interface ScheduleFormProps {
    initialData?: Schedule;
    isEdit?: boolean;
}

interface SelectedField {
    farmerId: string;
    farmerName: string;
    fieldFullAddress: string;
    fieldId: string;
    fieldName: string;
    cropType: string;
    location: LocationItem;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL 파라미터
    const farmerId = searchParams?.get('farmerId');
    const fieldId = searchParams?.get('fieldId');
    const workerId = searchParams?.get('workerId');
    const startDate = searchParams?.get('startDate');
    const endDate = searchParams?.get('endDate');

    // 새로운 상태 추가
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    // 기본 작업 일정 데이터
    const [formData, setFormData] = useState<Partial<Schedule>>({
        farmerId: farmerId || '',
        fieldId: fieldId || '',
        workerId: workerId || '',
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

    // 카테고리 스케줄 상태
    const [categorySchedules, setCategorySchedules] = useState<{
        categoryId: string;
        categoryName: string;
        stage: '예정' | '준비중' | '진행중' | '완료' | '취소';
        workerId: string;
        workerName?: string;
        scheduledDate: {
            start: Date;
        }
    }[]>([]);

    // 다중 농지 선택을 위한 상태
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
    const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
    const [farmerSearchTerm, setFarmerSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Farmer[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [fieldsForDisplay, setFieldsForDisplay] = useState<Field[]>([]);

    // 작업자 타입 필터링
    const [workerTypeFilter, setWorkerTypeFilter] = useState<'foreman' | 'driver'>(
        initialData?.type === 'transport' ? 'driver' : 'foreman'
    );

    // UI 상태
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [cropType, setCropType] = useState<string>('');

    // 작업 카테고리 상태 및 로드
    const [categories, setCategories] = useState<Array<Category>>([]);// 카테고리 경로 가져오기
    const getCategoryPath = (startCategoryId: string): Array<{ id: string, name: string }> => {
        const path: Array<{ id: string, name: string }> = [];
        let currentId = startCategoryId;
        const visitedIds = new Set<string>();

        while (currentId && !visitedIds.has(currentId)) {
            const category = categories.find(c => c.id === currentId);
            if (!category) break;

            path.push({ id: category.id, name: category.name });
            visitedIds.add(currentId);

            // 다음 카테고리가 없으면 종료
            const currentCategory = categories.find(c => c.id === currentId);
            if (!currentCategory || !currentCategory.nextCategoryId) break;

            currentId = currentCategory.nextCategoryId;
        }

        return path;
    };

    // 전체 경로 자동 추가 기능
    const handleAddFullPath = (startCategoryId: string) => {
        // 경로 가져오기
        const path = getCategoryPath(startCategoryId);

        // 경로의 각 카테고리를 스케줄에 추가
        path.forEach(category => {
            if (!categorySchedules.some(cs => cs.categoryId === category.id)) {
                handleAddCategory(category.id, category.name);
            }
        });
    };

    // 카테고리 로드 useEffect
    useEffect(() => {
        const loadCategories = async () => {
            try {
                console.log("Fetching categories...");
                // 새 카테고리 API 사용
                const categoriesData = await getCategories();
                setCategories(categoriesData);
                console.log("Categories set:", categoriesData);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadCategories();
    }, []);

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
                    const farmerData = farmersData.find(f => f.id === currentFarmerId);

                    if (farmerData) {
                        setSelectedFarmer(farmerData);
                    }

                    const fieldsData = await getFieldsByFarmerId(currentFarmerId as string);
                    setFields(fieldsData);
                    setFieldsForDisplay(fieldsData);

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
                        // 농가 정보 설정
                        const farmerData = farmersData.find(f => f.id === field.farmerId);
                        if (farmerData) {
                            setSelectedFarmer(farmerData);
                        }

                        setFormData(prev => ({
                            ...prev,
                            farmerId: field.farmerId,
                            fieldId
                        }));

                        // 작물 타입 설정
                        setCropType(field.cropType || '');

                        // 이 농가의 농지들도 로드
                        const fieldsData = await getFieldsByFarmerId(field.farmerId);
                        setFields(fieldsData);
                        setFieldsForDisplay(fieldsData);

                        // 선택된 필드 추가
                        if (field.locations && field.locations.length > 0) {
                            const location = field.locations[0];
                            addSelectedField({
                                farmerId: field.farmerId,
                                farmerName: farmerData?.name || '',
                                fieldFullAddress: field.address.full,
                                fieldId: field.id,
                                fieldName: field.address.full.split(' ').pop() || '농지',
                                cropType: field.cropType || '',
                                location: location
                            });
                        }
                    }
                }

                // 작업자 ID가 있는 경우 해당 작업자 타입에 맞게 필터 설정
                if (workerId && !isEdit) {
                    const worker = workersData.find(w => w.id === workerId);
                    if (worker) {
                        setWorkerTypeFilter(worker.type as 'foreman' | 'driver');

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
    }, [farmerId, fieldId, workerId, formData.farmerId, isEdit]);// 폼 입력 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
        const { name, value } = e.target;
        if (!name) return;

        // 중첩된 필드 처리
        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;

                if (parent === 'stage') {
                    setFormData({
                        ...formData,
                        stage: {
                            current: formData.stage?.current || '예정',
                            history: formData.stage?.history || [],
                            ...formData.stage,
                            [child]: value,
                        },
                    });
                } else if (parent === 'transportInfo') {
                    const location = child as 'origin' | 'destination';
                    setFormData({
                        ...formData,
                        transportInfo: {
                            origin: formData.transportInfo?.origin || { address: '' },
                            destination: formData.transportInfo?.destination || { address: '' },
                            cargo: formData.transportInfo?.cargo || { type: '', quantity: 0, unit: '' },
                            ...formData.transportInfo,
                            [location]: {
                                ...formData.transportInfo?.[location],
                                address: value
                            }
                        }
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
                        cargo: { type: cropType || '', quantity: 0, unit: '개' }
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

    // 농가 검색 핸들러
    const handleFarmerSearch = async () => {
        if (!farmerSearchTerm.trim()) return;

        try {
            setIsSearching(true);
            const results = await searchFarmers('name', farmerSearchTerm);
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching farmers:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 폼 제출 방지
            handleFarmerSearch();
        }
    };

    // 농가 선택 핸들러
    const handleFarmerSelect = async (farmer: Farmer) => {
        setSelectedFarmer(farmer);

        try {
            // 관련 농지 로드
            const fieldsData = await getFieldsByFarmerId(farmer.id);
            setFieldsForDisplay(fieldsData);

            // 검색 결과 초기화
            setSearchResults([]);
            setFarmerSearchTerm('');

            // 농가 관련 오류 제거
            if (errors.farmerId) {
                setErrors({
                    ...errors,
                    farmerId: '',
                });
            }
        } catch (error) {
            console.error('Error fetching fields:', error);
        }
    };

    // 선택된 농지 추가
    const addSelectedField = (fieldData: SelectedField) => {
        // 이미 추가된 농지인지 확인
        const alreadySelected = selectedFields.some(
            field => field.fieldId === fieldData.fieldId && field.location.id === fieldData.location.id
        );

        if (!alreadySelected) {
            setSelectedFields(prev => [...prev, fieldData]);
        }
    };

    // 선택된 농지 제거
    const removeSelectedField = (fieldId: string, locationId: string) => {
        setSelectedFields(prev =>
            prev.filter(field => !(field.fieldId === fieldId && field.location.id === locationId))
        );
    };

    // 4. 카테고리 추가 함수
    const handleAddCategory = (categoryId: string, categoryName: string) => {
        // 이미 추가된 카테고리인지 확인
        if (categorySchedules.some(cs => cs.categoryId === categoryId)) {
            return;
        }

        setCategorySchedules([
            ...categorySchedules,
            {
                categoryId,
                categoryName,
                stage: '예정',
                workerId: '',
                scheduledDate: {
                    start: new Date()
                }
            }
        ]);
    };

    // 5. 카테고리 스케줄 업데이트 함수
    const updateCategorySchedule = (categoryId: string, field: string, value: any) => {
        setCategorySchedules(prevSchedules =>
            prevSchedules.map(cs =>
                cs.categoryId === categoryId
                    ? { ...cs, [field]: value }
                    : cs
            )
        );
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

    // 주소 정보 업데이트 핸들러
    const handleAddressUpdate = (addressData: any, fieldName: string) => {
        if (fieldName === 'origin' || fieldName === 'destination') {
            setFormData({
                ...formData,
                transportInfo: {
                    ...formData.transportInfo!,
                    [fieldName]: {
                        ...formData.transportInfo![fieldName],
                        address: addressData.full,
                        detail: addressData.detail || formData.transportInfo![fieldName]?.detail || ''
                    }
                }
            });

            // 오류 제거
            if (errors[`transportInfo.${fieldName}.address`]) {
                setErrors({
                    ...errors,
                    [`transportInfo.${fieldName}.address`]: ''
                });
            }
        }
    };// 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { [key: string]: string } = {};

        if (selectedFields.length === 0) {
            newErrors.fields = '최소 하나 이상의 농지를 선택해야 합니다.';
        }

        if (categorySchedules.length === 0) {
            newErrors.categories = '최소 하나 이상의 작업 카테고리를 선택해야 합니다.';
        }

        // 각 카테고리별 유효성 검사
        categorySchedules.forEach((cs, index) => {
            if (cs.stage !== '예정' && !cs.workerId) {
                newErrors[`categorySchedules[${index}].workerId`] = '작업상태가 예정이 아닌 경우 작업반장은 필수입니다.';
            }

            if (!cs.scheduledDate.start) {
                newErrors[`categorySchedules[${index}].scheduledDate.start`] = '작업 시작 일시는 필수입니다.';
            }
        });

        // 오류 처리
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);


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
            // 카테고리 스케줄 전처리 (Date 객체를 ISO 문자열로 변환)
            const processedCategorySchedules = categorySchedules.map(cs => ({
                ...cs,
                scheduledDate: {
                    start: cs.scheduledDate.start.toISOString() // Date 객체를 ISO 문자열로 변환
                },
                // stage 이력이 있으면 그 이력의 timestamp를 문자열로 변환
                stage: {
                    current: cs.stage,
                    history: [] // 이력은 서버에서 처리하도록 비워둠
                }
            }));

            // 저장할 여러 일정 데이터 준비
            const schedulePromises = selectedFields.map(async (field) => {
                // 기본 데이터 구성 (scheduledDate 필드 제거)
                const scheduleData = {
                    ...formData,
                    farmerId: field.farmerId,
                    fieldId: field.fieldId,
                    categorySchedules: processedCategorySchedules,
                    stage: {
                        current: '예정', // 기본 상태는 '예정'으로 설정
                        history: [] // 서버에서 처리하도록 비워둠
                    },
                    paymentStatus: formData.paymentStatus || 'pending',
                    additionalInfo: {
                        ...formData.additionalInfo,
                        locationId: field.location.id,
                        flagNumber: field.location.flagNumber,
                        cropType: field.cropType || field.location.cropType
                    }
                };

                // scheduledDate 필드 명시적 제거 (더 이상 사용하지 않음)
                if (scheduleData.scheduledDate) {
                    delete scheduleData.scheduledDate;
                }

                // 데이터 정제
                const cleanedData = sanitizeData(scheduleData);

                if (isEdit && initialData?.id) {
                    await updateSchedule(initialData.id, cleanedData);
                    return initialData.id;
                } else {
                    const id = await createSchedule(cleanedData as Required<Schedule>);
                    return id;
                }
            });

            // 모든 일정 저장 기다리기
            await Promise.all(schedulePromises);

            // 성공 메시지 및 리디렉션 처리
            const message = isEdit
                ? '작업 일정이 성공적으로 수정되었습니다.'
                : `${selectedFields.length}개의 작업 일정이 성공적으로 등록되었습니다.`;

            setSuccessMessage(message);
            setSuccess(true);
            setIsSubmitted(true); // 제출 성공 후 상태 설정

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push('/schedules');
            }, 2000);
        } catch (error) {
            console.error("Error saving schedule:", error);
            setErrors({
                submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
            });
        } finally {
            setLoading(false);
        }
    };


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

    // 현재 선택된 작업자 찾기
    const selectedWorker = workers.find(worker => worker.id === formData.workerId);

    // 작업자 타입에 따라 필터링
    const filteredWorkers = workers.filter(worker => worker.type === workerTypeFilter); return (
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

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {/* 새로운 Categories Section */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                            <CategoryIcon sx={{ mr: 1, color: '#1976d2' }} />
                            작업 카테고리 및 일정
                        </Typography>

                        {/* 카테고리 선택 - 카드 형태로 변경 */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                                시작 카테고리 선택:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                                {categories.map((category) => (
                                    <Card
                                        key={category.id}
                                        sx={{
                                            width: 120,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            border: categorySchedules.some(cs => cs.categoryId === category.id)
                                                ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                            },
                                            opacity: categorySchedules.some(cs => cs.categoryId === category.id) ? 0.7 : 1
                                        }}
                                        onClick={() => {
                                            if (!categorySchedules.some(cs => cs.categoryId === category.id)) {
                                                handleAddCategory(category.id, category.name);
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                            <CategoryIcon sx={{ fontSize: 32, color: '#1976d2', mb: 1 }} />
                                            <Typography variant="body2" fontWeight="medium">
                                                {category.name}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>

                        {/* 자동 추가 버튼 */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowForwardIcon />}
                                onClick={() => {
                                    if (categorySchedules.length > 0) {
                                        const startCategoryId = categorySchedules[0].categoryId;
                                        handleAddFullPath(startCategoryId);
                                    }
                                }}
                                disabled={categorySchedules.length === 0}
                            >
                                전체 작업 흐름 자동 추가
                            </Button>
                        </Box>

                        {/* 선택된 카테고리 목록 및 작업 흐름 */}
                        {categorySchedules.length === 0 ? (
                            <Alert severity="info">작업 카테고리를 추가해주세요.</Alert>
                        ) : (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                                    선택된 작업 흐름:
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    p: 2,
                                    bgcolor: 'action.hover',
                                    borderRadius: 2
                                }}>
                                    {categorySchedules.map((cs, index) => (
                                        <React.Fragment key={cs.categoryId}>
                                            <Chip
                                                label={cs.categoryName}
                                                color={index === 0 ? "primary" : index === categorySchedules.length - 1 ? "secondary" : "default"}
                                                sx={{ fontWeight: 'medium' }}
                                            />
                                            {index < categorySchedules.length - 1 && (
                                                <ArrowForwardIcon fontSize="small" color="action" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* 선택된 카테고리 목록 */}
                        <Grid container spacing={3}>
                            {categorySchedules.map((cs, index) => (
                                <Grid size={{ xs: 12 }} key={cs.categoryId}>
                                    <Card sx={{
                                        mb: 2,
                                        mt: 2, // 상단 여백 추가
                                        pt: 2, // 내부 상단 패딩 추가
                                        borderLeft: '4px solid',
                                        borderLeftColor: index === 0 ? '#1976d2' : index === categorySchedules.length - 1 ? '#f50057' : '#4caf50',
                                        position: 'relative',
                                        overflow: 'visible' // 중요: 카드 밖의 요소가 잘리지 않도록 설정
                                    }}>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: -10, // 위치 조정
                                                left: 20,
                                                bgcolor: index === 0 ? '#1976d2' : index === categorySchedules.length - 1 ? '#f50057' : '#4caf50',
                                                color: 'white',
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '0.8rem',
                                                zIndex: 10 // 다른 요소보다 앞에 표시되도록 z-index 설정
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h6">
                                                    {cs.categoryName}
                                                    <Chip
                                                        size="small"
                                                        label={index === 0 ? "첫 단계" : index === categorySchedules.length - 1 ? "마지막 단계" : `${index + 1}단계`}
                                                        sx={{ ml: 1 }}
                                                        color={index === 0 ? "primary" : index === categorySchedules.length - 1 ? "secondary" : "default"}
                                                    />
                                                </Typography>
                                                <IconButton
                                                    onClick={() => setCategorySchedules(prev => prev.filter(c => c.categoryId !== cs.categoryId))}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>

                                            <Grid container spacing={2}>
                                                {/* 작업 상태 */}
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <FormControl fullWidth>
                                                        <InputLabel>작업 상태</InputLabel>
                                                        <Select
                                                            value={cs.stage}
                                                            onChange={(e) => updateCategorySchedule(
                                                                cs.categoryId,
                                                                'stage',
                                                                e.target.value
                                                            )}
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

                                                {/* 작업반장 선택 */}
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Autocomplete
                                                        options={filteredWorkers}
                                                        getOptionLabel={(option) => option.name}
                                                        value={filteredWorkers.find(w => w.id === cs.workerId) || null}
                                                        onChange={(e, newValue) => {
                                                            updateCategorySchedule(
                                                                cs.categoryId,
                                                                'workerId',
                                                                newValue ? newValue.id : ''
                                                            );
                                                            if (newValue) {
                                                                updateCategorySchedule(
                                                                    cs.categoryId,
                                                                    'workerName',
                                                                    newValue.name
                                                                );
                                                            }
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label="작업반장"
                                                                required={cs.stage !== '예정'}
                                                                error={!!errors[`categorySchedules[${index}].workerId`]}
                                                                helperText={errors[`categorySchedules[${index}].workerId`] || ''}
                                                            />
                                                        )}
                                                    />
                                                </Grid>

                                                {/* 작업 시작 일시 */}

                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <DateTimePicker
                                                        label="작업 시작 일시"
                                                        value={cs.scheduledDate.start}
                                                        onChange={(date) => {
                                                            if (date) {
                                                                updateCategorySchedule(
                                                                    cs.categoryId,
                                                                    'scheduledDate',
                                                                    { start: date }
                                                                );
                                                            }
                                                        }}
                                                        slotProps={{
                                                            textField: {
                                                                fullWidth: true,
                                                                required: true,
                                                                error: !!errors[`categorySchedules[${index}].scheduledDate.start`],
                                                                helperText: errors[`categorySchedules[${index}].scheduledDate.start`] || '',
                                                                // 입력 필드 스타일 조정
                                                                sx: {
                                                                    '& .MuiInputBase-input': {
                                                                        width: '100%',
                                                                        overflow: 'visible'
                                                                    }
                                                                }
                                                            },
                                                            // 달력 팝업이 충분히 넓도록 설정
                                                            popper: {
                                                                sx: { zIndex: 1300 }
                                                            },
                                                        }}
                                                        // 포맷 지정으로 짧게 표시
                                                        format="yyyy.MM.dd HH:mm"
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* Fields Selection Section */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                            <TerrainIcon sx={{ mr: 1, color: '#1976d2' }} />
                            작업 농지 선택
                        </Typography>

                        {/* Selected Fields Display */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <CheckIcon sx={{ mr: 1, color: '#2e7d32' }} />
                                선택된 농지 목록 ({selectedFields.length}개)
                            </Typography>
                            {selectedFields.length === 0 ? (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    작업을 진행할 농지를 선택해주세요. 여러 농가의 여러 농지를 선택할 수 있습니다.
                                </Alert>
                            ) : (
                                <Grid container spacing={2}>
                                    {selectedFields.map((field) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`selected-${field.fieldId}-${field.location.id}`}>
                                            <Card
                                                sx={{
                                                    height: '100%',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-3px)',
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                                    },
                                                    borderTop: '4px solid #2e7d32',
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                                                        {field.fieldName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        농가: {field.farmerName}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                        {field.location.address.full}
                                                    </Typography>
                                                </CardContent>
                                                <CardActions>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => removeSelectedField(field.fieldId, field.location.id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>

                        {/* Farmer Search Section */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1, color: '#2e7d32' }} />
                                농가 검색
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 9 }}>
                                    <TextField
                                        fullWidth
                                        placeholder="농가 이름 또는 연락처로 검색"
                                        value={farmerSearchTerm}
                                        onChange={(e) => setFarmerSearchTerm(e.target.value)}
                                        onKeyDown={handleSearchKeyDown} // 추가: 엔터 키 이벤트 핸들러
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleFarmerSearch} // 추가: 검색 버튼 핸들러
                                        disabled={isSearching}
                                        sx={{ height: '56px' }}
                                    >
                                        {isSearching ? <CircularProgress size={24} color="inherit" /> : '농가 검색'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                                    검색 결과
                                </Typography>
                                <Grid container spacing={2}>
                                    {searchResults.map((farmer) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={farmer.id}>
                                            <Card
                                                sx={{
                                                    height: '100%',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-3px)',
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                                        cursor: 'pointer',
                                                        borderColor: '#2e7d32'
                                                    },
                                                    border: '1px solid #e0e0e0',
                                                }}
                                                onClick={() => handleFarmerSelect(farmer)}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: 'primary.light',
                                                                width: 32,
                                                                height: 32,
                                                                mr: 1.5,
                                                                fontSize: '0.875rem'
                                                            }}
                                                        >
                                                            {farmer.name.charAt(0)}
                                                        </Avatar>
                                                        <Typography variant="body1" fontWeight="600">
                                                            {farmer.name}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                        {farmer.phoneNumber}
                                                    </Typography>
                                                    {farmer.address?.full && (
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                                            <LocationIcon sx={{ fontSize: 16, mr: 1, mt: '2px', color: 'text.secondary' }} />
                                                            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {farmer.address.full}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Available Fields Section */}
                        {selectedFarmer && fieldsForDisplay.length > 0 && (
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <TerrainIcon sx={{ mr: 1, fontSize: 18 }} />
                                    선택 가능한 농지 ({fieldsForDisplay.length}개)
                                </Typography>
                                <Grid container spacing={2}>
                                    {fieldsForDisplay.map((field) => (
                                        field.locations?.map((location) => (
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${field.id}-${location.id}`}>
                                                <Card
                                                    sx={{
                                                        height: '100%',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            transform: 'translateY(-3px)',
                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                                        },
                                                        borderTop: '4px solid #2e7d32',
                                                    }}
                                                    onClick={() => addSelectedField({
                                                        farmerId: selectedFarmer.id,
                                                        farmerName: selectedFarmer.name,
                                                        fieldFullAddress: field.address.full,
                                                        fieldId: field.id,
                                                        fieldName: field.locations?.[0]?.address.full || '이름 없음',
                                                        cropType: field.cropType || location.cropType || '',
                                                        location: location
                                                    })}
                                                >
                                                    <CardContent>
                                                        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                                                            {field.locations?.[0]?.address.full || '이름 없음'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                            {location.address.full}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <TerrainIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                            면적: {location.area.value} {location.area.unit}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <FlagIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                            깃대 번호: {location.flagNumber}
                                                        </Typography>
                                                        {location.note && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', mt: 1 }}>
                                                                <InfoIcon sx={{ fontSize: 14, mr: 1, mt: '2px' }} />
                                                                {location.note}
                                                            </Typography>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </Paper>

                    {/* Additional Information Section */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                            <InfoIcon sx={{ mr: 1, color: '#1976d2' }} />
                            추가 정보
                        </Typography>
                        <TextField
                            fullWidth
                            label="메모"
                            name="memo"
                            value={formData.memo || ''}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            placeholder="작업에 관한 특이사항이나 참고할 내용을 입력하세요"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <InfoIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Paper>

                    {/* Submit Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={<SaveIcon />}
                            disabled={loading}
                        >
                            {loading ? '저장 중...' : (isEdit ? '수정하기' : '등록하기')}
                        </Button>
                    </Box>
                </Box>

                {/* 성공 알림 */}
                <Snackbar
                    open={success}
                    autoHideDuration={2000}
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

export default ScheduleForm;