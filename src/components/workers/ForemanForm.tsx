// src/components/workers/ForemanForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkCategories } from '@/hooks/common/useWorkCategories';

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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    RadioGroup,
    Radio,
    FormControlLabel,
    InputAdornment,
    Switch,
    Checkbox,
    useTheme,
    SelectChangeEvent,
    Autocomplete,
    Chip
} from '@mui/material';
import {
    Phone as PhoneIcon,

    AccountBalance as BankIcon,
    Add as AddIcon,

    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Note as NoteIcon,

    Money as MoneyIcon,
    Check as CheckIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { Foreman, DropdownOption } from '@/types';
import { createForeman, updateWorker, getForemanCategories } from '@/services/firebase/workerService';
import { useForemen } from '@/hooks/useWorkers';
import AddressInfo from '../form/AddressInfo';


interface ForemanFormProps {
    initialData?: Partial<Foreman>;
    isEdit?: boolean;
}

const ForemanForm: React.FC<ForemanFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();


    // 작업 유형 및 단가 관리 훅
    const { categories, isLoading: isCategoriesLoading, addCategory, addRateToCategory } = useWorkCategories();

    // 업무 타입 관련 상태 추가
    const [workTypeRates, setWorkTypeRates] = useState<{ [key: string]: number }>({});
    // 선택된 카테고리 단가를 관리하기 위한 상태 추가
    const [selectedCategoryRates, setSelectedCategoryRates] = useState<string[]>([]);
    const [categoryRates, setCategoryRates] = useState<{ [key: string]: number }>({});

    // Form state
    // 초기 폼 데이터에 workCategories 필드 추가
    const [formData, setFormData] = useState<Partial<Foreman>>(initialData || {
        type: 'foreman',
        name: '',
        phoneNumber: '',
        personalId: '',
        address: {
            full: '',
            detail: '',
        },
        bankInfo: {
            bankName: '',
            accountNumber: '',
            accountHolder: '',
        },
        foremanInfo: {
            categorysId: [],
            category: { name: [], id: [] }, // 기존 compatibility 
            rates: {
                detailedRates: [] // 세부 작업 정보 배열 추가

            }
        }
    });

    // Dropdown options
    const [bankOptions] = useState<DropdownOption[]>([
        { value: '신한은행', label: '신한은행' },
        { value: '국민은행', label: '국민은행' },
        { value: '우리은행', label: '우리은행' },
        { value: '하나은행', label: '하나은행' },
        { value: '농협은행', label: '농협은행' },
        { value: '기업은행', label: '기업은행' },
        { value: '수협은행', label: '수협은행' },
        { value: '카카오뱅크', label: '카카오뱅크' },
        { value: '토스뱅크', label: '토스뱅크' },
    ]);


    // UI states
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
    const [newCategory, setNewCategory] = useState<string>('');

    // 단가 관련 상태
    const [isNegotiable, setIsNegotiable] = useState<boolean>(false);






    // 초기 데이터로부터 선택된 카테고리 단가 설정
    useEffect(() => {
        if (isEdit && initialData?.foremanInfo?.rates?.detailedRates) {
            const custom = initialData.foremanInfo.rates.detailedRates;

            // 카테고리 단가 정보 추출
            const categoryIds = Object.keys(custom).filter(key => key.startsWith('category_'));

            if (categoryIds.length > 0) {
                // 선택된 카테고리 설정
                const extractedCategoryIds = categoryIds.map(key => key.replace('category_', ''));
                setSelectedCategoryRates(extractedCategoryIds);

                // 카테고리 단가 설정
                const rates: { [key: string]: number } = {};
                categoryIds.forEach(key => {
                    const categoryId = key.replace('category_', '');
                    const value = custom[key as keyof typeof custom];
                    rates[categoryId] = typeof value === 'number' ? value : 0;
                });
                setCategoryRates(rates);
            }
        }
    }, [isEdit, initialData]);




    // 폼 입력 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
        const { name, value } = e.target;

        if (!name) return;

        // 주민등록번호 포맷팅
        if (name === 'personalId') {
            const personalId = (value as string).replace(/[^0-9]/g, '');

            if (personalId.length <= 13) {
                let formattedValue = personalId;
                if (personalId.length > 6) {
                    formattedValue = `${personalId.slice(0, 6)}-${personalId.slice(6)}`;
                }

                setFormData({
                    ...formData,
                    [name]: formattedValue,
                });
            }
            return;
        }

        // 전화번호 포맷팅
        if (name === 'phoneNumber') {
            const phoneNumber = (value as string).replace(/[^0-9]/g, '');

            if (phoneNumber.length <= 11) {
                let formattedValue = phoneNumber;
                if (phoneNumber.length > 3 && phoneNumber.length <= 7) {
                    formattedValue = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
                } else if (phoneNumber.length > 7) {
                    formattedValue = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
                }

                setFormData({
                    ...formData,
                    [name]: formattedValue,
                });

                // 전화번호 오류 검증
                if (errors.phoneNumber && formattedValue.length === 13) {
                    setErrors({
                        ...errors,
                        phoneNumber: '',
                    });
                }
            }
            return;
        }

        // 단가 관련 필드
        if (name.startsWith('foremanInfo.rates.')) {
            const rateName = name.split('.')[2];
            const rateValue = parseFloat(value as string);

            if (!isNaN(rateValue) && rateValue >= 0) {
                setFormData({
                    ...formData,
                    foremanInfo: {
                        ...formData.foremanInfo!,
                        rates: {
                            ...formData.foremanInfo?.rates!,
                            [rateName]: rateValue,
                        },
                    },
                });
            }
            return;
        }

        // 기타 foremanInfo 필드
        if (name.startsWith('foremanInfo.')) {
            const fieldName = name.split('.')[1];

            setFormData({
                ...formData,
                foremanInfo: {
                    ...formData.foremanInfo!,
                    [fieldName]: value,
                },
            });

            // 구분 오류 검증
            if (fieldName === 'category' && errors['foremanInfo.category'] && value) {
                setErrors({
                    ...errors,
                    'foremanInfo.category': '',
                });
            }

            return;
        }

        // 중첩된 필드 (address, bankInfo)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            const parentValue = formData[parent as keyof Foreman];
            if (parentValue && typeof parentValue === 'object') {
                setFormData({
                    ...formData,
                    [parent]: {
                        ...parentValue,
                        [child]: value,
                    },
                });
            }
            return;
        }

        // 일반 필드
        setFormData({
            ...formData,
            [name]: value,
        });

        // 필수 필드 오류 제거
        if (errors[name] && value) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };



    // 폼 제출 핸들러 수정
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { [key: string]: string } = {};

        if (!formData.name?.trim()) {
            newErrors.name = '이름은 필수 항목입니다.';
        } else if (formData.name.length < 2) {
            newErrors.name = '이름은 최소 2자 이상이어야 합니다.';
        }

        if (!formData.phoneNumber?.trim()) {
            newErrors.phoneNumber = '전화번호는 필수 항목입니다.';
        } else if (!/^\d{3}-\d{3,4}-\d{4}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = '올바른 전화번호 형식이 아닙니다.';
        }

        // // 작업 유형 검사
        // if (!formData.foremanInfo?.categoryId) {
        //     newErrors.categoryId = '작업 유형은 필수 항목입니다.';
        // }
        // 폼 제출 핸들러 내 유효성 검사 부분


        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            // 폼 제출 핸들러 내부 - 단가 정보 처리 부분
            if (isNegotiable) {
                formData.foremanInfo = {
                    ...formData.foremanInfo!,
                    rates: {
                        detailedRates: [] // 빈 배열로 초기화
                    },
                };
            } else {
                // 기본 단가와 세부 작업 단가를 저장
                const customRates: { [key: string]: number } = {};
                const detailedRates: any[] = [];

                // 선택된 세부 작업 단가 저장
                selectedCategoryRates.forEach(rateId => {
                    customRates[rateId] = categoryRates[rateId] || 0;

                    // 세부 작업의 모든 정보를 찾아서 저장
                    categories.forEach(category => {
                        if (category.rates) {
                            const rate = category.rates.find(r => r.id === rateId);
                            if (rate) {
                                detailedRates.push({
                                    description: rate.description || '',
                                    defaultPrice: rate.defaultPrice || 0,
                                    unit: rate.unit || '개',
                                    createdAt: rate.createdAt || new Date().toISOString(),
                                    categoryId: category.id,
                                    categoryName: category.name,
                                    name: rate.name,
                                    id: rate.id
                                });
                            }
                        }
                    });
                });

                formData.foremanInfo = {
                    ...formData.foremanInfo!,
                    rates: {
                        detailedRates: detailedRates
                    },
                };
            }

            if (isEdit && initialData?.id) {
                // 작업반장 정보 수정
                await updateWorker(initialData.id, formData);
                setSuccessMessage('작업반장 정보가 성공적으로 수정되었습니다.');
            } else {
                // 작업반장 등록
                await createForeman(formData as Omit<Foreman, 'id' | 'createdAt' | 'updatedAt'>);
                setSuccessMessage('작업반장이 성공적으로 등록되었습니다.');
            }

            setSuccess(true);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push('/workers/foremen');
            }, 3000);
        } catch (error) {
            console.error("Error saving foreman:", error);
            setErrors({
                submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
            });
        } finally {
            setLoading(false);
        }
    };


    const handleCloseDialog = () => {
        setShowAddDialog(false);
    };

    // 세부 작업 관련 상태
    const [showAddRateDialog, setShowAddRateDialog] = useState<{ open: boolean; categoryId: string }>({
        open: false,
        categoryId: ''
    });
    const [newRate, setNewRate] = useState<{
        name: string;
        description: string;
        defaultPrice: number;
        unit: string;
    }>({
        name: '',
        description: '',
        defaultPrice: 0,
        unit: '개'
    });


    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => router.push('/workers/foremen')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight="bold">
                    {isEdit ? '작업반장 정보 수정' : '새 작업반장 등록'}
                </Typography>
            </Box>

            {errors.submit && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.submit}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={3}>
                    {/* 기본 정보 */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1 }} />
                            기본 정보
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    {/* 이름 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="이름"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            placeholder="작업반장 이름"
                            InputProps={{
                                inputProps: { maxLength: 50 }
                            }}
                        />
                    </Grid>

                    {/* 전화번호 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            required
                            fullWidth
                            label="전화번호"
                            name="phoneNumber"
                            value={formData.phoneNumber || ''}
                            onChange={handleChange}
                            error={!!errors.phoneNumber}
                            helperText={errors.phoneNumber || '숫자만 입력하세요. 자동으로 하이픈(-)이 추가됩니다.'}
                            placeholder="010-1234-5678"
                            InputProps={{
                                startAdornment: <PhoneIcon sx={{ color: 'action.active', mr: 1 }} />,
                            }}
                        />
                    </Grid>

                    {/* 주민등록번호 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="주민등록번호 (선택)"
                            name="personalId"
                            value={formData.personalId || ''}
                            onChange={handleChange}
                            placeholder="123456-1234567"
                            helperText="주민등록번호는 암호화되어 저장됩니다."
                        />
                    </Grid>


                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1 }}>
                            작업 카테고리 (중복 선택 가능)
                        </Typography>

                        <Box sx={{
                            mb: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1.5,
                                    flex: 1
                                }}
                            >
                                {categories.map((category: { id: string; name: string }) => (
                                    <Chip
                                        key={category.id}
                                        label={category.name}
                                        clickable
                                        onClick={() => {
                                            console
                                            // 중복 선택 가능하도록 수정
                                            const currentCategories = formData.foremanInfo?.categorysId || [];
                                            const currentCategoryNames = formData.foremanInfo?.category?.name || [];

                                            // 카테고리 ID가 이미 선택되어 있는지 확인
                                            const isSelected = currentCategories.includes(category.id);

                                            // 카테고리 이름이 이미 선택되어 있는지 확인
                                            const isNameSelected = currentCategoryNames.includes(category.name);

                                            // 선택 상태에 따라 카테고리 추가 또는 제거
                                            const newCategories = isSelected
                                                ? currentCategories.filter(c => c !== category.id)
                                                : [...currentCategories, category.id];

                                            // 카테고리 이름도 동일하게 처리
                                            const newCategoryNames = isNameSelected
                                                ? currentCategoryNames.filter(c => c !== category.name)
                                                : [...currentCategoryNames, category.name];

                                            const newCategoryIds = isSelected
                                                ? currentCategories.filter(c => c !== category.id)
                                                : [...currentCategories, category.id];

                                            setFormData({
                                                ...formData,
                                                foremanInfo: {
                                                    ...formData.foremanInfo!,
                                                    category: { name: newCategoryNames, id: newCategoryIds },
                                                    categorysId: newCategories
                                                }
                                            });
                                        }}
                                        color={formData.foremanInfo?.categorysId?.includes(category.id) ? "primary" : "default"}
                                        variant={formData.foremanInfo?.categorysId?.includes(category.id) ? "filled" : "outlined"}
                                        sx={{
                                            borderRadius: 6,
                                            py: 1.5,
                                            px: 1.5,
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 3px 5px rgba(0,0,0,0.1)',
                                            },
                                            ...(formData.foremanInfo?.categorysId?.includes(category.id) ? {
                                                boxShadow: '0 2px 4px rgba(25, 118, 210, 0.25)'
                                            } : {})
                                        }}
                                        icon={formData.foremanInfo?.categorysId?.includes(category.id) ?
                                            <CheckIcon fontSize="small" /> : undefined}
                                    />
                                ))}
                            </Box>

                            <Chip
                                label="+ 카테고리 추가"
                                clickable
                                onClick={() => setShowAddDialog(true)}
                                color="secondary"
                                variant="outlined"
                                sx={{
                                    borderRadius: 6,
                                    py: 1.5,
                                    px: 1.5,
                                    ml: 2,
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    borderStyle: 'dashed',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 3px 5px rgba(0,0,0,0.1)',
                                    }
                                }}
                            />
                        </Box>

                        {errors.workCategories && (
                            <Typography color="error" variant="caption">
                                {errors.workCategories}
                            </Typography>
                        )}
                    </Grid>

                    {/* 단가 설정 부분 - 기존 작업유형의 UI를 카테고리에 맞게 수정 */}
                    {formData.foremanInfo?.categorysId && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 3 }}>
                                <MoneyIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
                                단가 설정
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {!isNegotiable && (
                                <Box sx={{ ml: 2, mt: 1 }}>


                                    {/* 카테고리별 단가 설정 - 기존의 작업유형 UI와 유사하게 */}
                                    {formData.foremanInfo.categorysId.length > 0 && (
                                        <Box sx={{ mt: 3 }}>
                                            {!isNegotiable && (
                                                <Box sx={{ ml: 2, mt: 1 }}>

                                                    {/* 선택된 작업 카테고리별 세부 작업 단가 설정 */}
                                                    {formData.foremanInfo?.categorysId && formData.foremanInfo.categorysId.length > 0 && (
                                                        <Box sx={{ mt: 4 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                                                                카테고리별 세부 작업 단가
                                                            </Typography>

                                                            {formData.foremanInfo.categorysId.map(categoryId => {
                                                                const category = categories.find(c => c.id === categoryId);
                                                                if (!category) return null;

                                                                return (
                                                                    <Box key={categoryId} sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                                                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                                                                            {category.name} 작업 종류
                                                                        </Typography>

                                                                        {/* 세부 작업 목록 */}
                                                                        {category.rates && category.rates.length > 0 ? (
                                                                            <Box>
                                                                                {category.rates.map(rate => (
                                                                                    <Box
                                                                                        key={rate.id}
                                                                                        sx={{
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'space-between',
                                                                                            mb: 2,
                                                                                            p: 2,
                                                                                            border: '1px solid #e0e0e0',
                                                                                            borderRadius: 1,
                                                                                            backgroundColor: 'background.paper',
                                                                                            '&:hover': {
                                                                                                backgroundColor: 'action.hover',
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                            <Checkbox
                                                                                                checked={selectedCategoryRates.includes(rate.id)}
                                                                                                onChange={(e) => {
                                                                                                    if (e.target.checked) {
                                                                                                        // 세부 작업 선택
                                                                                                        setSelectedCategoryRates([...selectedCategoryRates, rate.id]);
                                                                                                        // 기본 단가 설정 (있는 경우)
                                                                                                        if (rate.defaultPrice) {
                                                                                                            setCategoryRates({
                                                                                                                ...categoryRates,
                                                                                                                [rate.id]: rate.defaultPrice
                                                                                                            });
                                                                                                        }
                                                                                                    } else {
                                                                                                        // 세부 작업 선택 해제
                                                                                                        setSelectedCategoryRates(selectedCategoryRates.filter(id => id !== rate.id));
                                                                                                        // 단가 정보에서도 제거
                                                                                                        const updatedRates = { ...categoryRates };
                                                                                                        delete updatedRates[rate.id];
                                                                                                        setCategoryRates(updatedRates);
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                            <Box>
                                                                                                <Typography variant="body2" fontWeight="medium">
                                                                                                    {rate.name}
                                                                                                </Typography>
                                                                                                {rate.description && (
                                                                                                    <Typography variant="caption" color="text.secondary">
                                                                                                        {rate.description}
                                                                                                    </Typography>
                                                                                                )}
                                                                                            </Box>
                                                                                        </Box>

                                                                                        {selectedCategoryRates.includes(rate.id) && (
                                                                                            <TextField
                                                                                                size="small"
                                                                                                label="단가"
                                                                                                type="number"
                                                                                                value={categoryRates[rate.id] || (rate.defaultPrice || '')}
                                                                                                onChange={(e) => {
                                                                                                    const value = parseFloat(e.target.value);
                                                                                                    if (!isNaN(value) && value >= 0) {
                                                                                                        setCategoryRates({
                                                                                                            ...categoryRates,
                                                                                                            [rate.id]: value
                                                                                                        });
                                                                                                    }
                                                                                                }}
                                                                                                InputProps={{
                                                                                                    endAdornment: <InputAdornment position="end">원/{rate.unit || '개'}</InputAdornment>,
                                                                                                    inputProps: { min: 0 }
                                                                                                }}
                                                                                                sx={{ width: '180px' }}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            />
                                                                                        )}
                                                                                    </Box>
                                                                                ))}
                                                                            </Box>
                                                                        ) : (
                                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    등록된 세부 작업이 없습니다.
                                                                                </Typography>
                                                                                <Button
                                                                                    size="small"
                                                                                    startIcon={<AddIcon />}
                                                                                    onClick={() => setShowAddRateDialog({ open: true, categoryId })}
                                                                                >
                                                                                    세부 작업 추가
                                                                                </Button>
                                                                            </Box>
                                                                        )}

                                                                        {/* 새 세부 작업 추가 버튼 */}
                                                                        {category.rates && category.rates.length > 0 && (
                                                                            <Button
                                                                                size="small"
                                                                                startIcon={<AddIcon />}
                                                                                onClick={() => setShowAddRateDialog({ open: true, categoryId })}
                                                                                sx={{ mt: 1 }}
                                                                            >
                                                                                세부 작업 추가
                                                                            </Button>
                                                                        )}
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Grid>
                    )}

                    {/* AddressInfo 컴포넌트를 통합 */}
                    <AddressInfo
                        formData={formData}
                        onChange={handleChange}
                        onAddressUpdate={(addressData) => {
                            setFormData({
                                ...formData,
                                address: {
                                    ...formData.address,
                                    full: addressData.full,
                                    zipcode: addressData.zipcode,
                                }
                            });

                            // 좌표 정보가 있으면 저장
                            if (addressData.coordinates) {
                                setFormData(prev => ({
                                    ...prev,
                                    coordinates: addressData.coordinates
                                }));
                            }
                        }}
                    />

                    {/* 계좌정보 */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <BankIcon sx={{ mr: 1 }} />
                            계좌정보 (선택)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel>은행</InputLabel>
                            <Select
                                name="bankInfo.bankName"
                                value={formData.bankInfo?.bankName || ''}
                                onChange={handleChange}
                                label="은행"
                            >
                                {bankOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="계좌번호"
                            name="bankInfo.accountNumber"
                            value={formData.bankInfo?.accountNumber || ''}
                            onChange={handleChange}
                            placeholder="숫자만 입력하세요"
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="예금주"
                            name="bankInfo.accountHolder"
                            value={formData.bankInfo?.accountHolder || formData.name || ''}
                            onChange={handleChange}
                            placeholder="예금주명"
                        />
                    </Grid>

                    {/* 메모 */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <NoteIcon sx={{ mr: 1 }} />
                            추가 정보 (선택)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="메모"
                            name="memo"
                            value={formData.memo || ''}
                            onChange={handleChange}
                            multiline
                            rows={4}
                            placeholder="특이사항이나 참고할 내용을 입력하세요"
                        />
                    </Grid>

                    {/* 버튼 */}
                    <Grid size={{ xs: 12 }} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => router.push('/workers/foremen')}
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
                    </Grid>
                </Grid>
            </Box>

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

            {/* 세부 작업 추가 다이얼로그 */}
           // ForemanForm.tsx 내의 세부 작업 추가 다이얼로그 부분
            <Dialog
                open={showAddRateDialog.open}
                onClose={() => setShowAddRateDialog({ open: false, categoryId: '' })}
            >
                <DialogTitle>세부 작업 추가</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="작업 이름"
                        fullWidth
                        value={newRate.name}
                        onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="설명 (선택사항)"
                        fullWidth
                        value={newRate.description}
                        onChange={(e) => setNewRate({ ...newRate, description: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            margin="dense"
                            label="기본 단가"
                            type="number"
                            fullWidth
                            value={newRate.defaultPrice || ''}
                            onChange={(e) => setNewRate({ ...newRate, defaultPrice: parseFloat(e.target.value) })}
                        />
                        <TextField
                            margin="dense"
                            label="단위"
                            fullWidth
                            value={newRate.unit}
                            onChange={(e) => setNewRate({ ...newRate, unit: e.target.value })}
                            placeholder="개, 시간, kg 등"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddRateDialog({ open: false, categoryId: '' })}>
                        취소
                    </Button>
                    <Button
                        onClick={async () => {
                            if (newRate.name && showAddRateDialog.categoryId) {
                                try {
                                    setLoading(true);
                                    await addRateToCategory(showAddRateDialog.categoryId, newRate);

                                    // 성공 메시지 표시
                                    setSuccessMessage("세부 작업이 성공적으로 추가되었습니다.");
                                    setSuccess(true);

                                    // 폼 초기화
                                    setNewRate({ name: '', description: '', defaultPrice: 0, unit: '개' });
                                    setShowAddRateDialog({ open: false, categoryId: '' });
                                } catch (error) {
                                    console.error("Error adding rate:", error);
                                    setErrors({
                                        ...errors,
                                        addRate: "세부 작업 추가 중 오류가 발생했습니다."
                                    });
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        color="primary"
                        disabled={loading || !newRate.name}
                    >
                        {loading ? <CircularProgress size={24} /> : "추가"}
                    </Button>
                </DialogActions>
            </Dialog>


            {/* 카테고리 추가 다이얼로그 */}
            <Dialog open={showAddDialog} onClose={handleCloseDialog}>
                <DialogTitle>새 작업 카테고리 추가</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="카테고리 이름"
                        fullWidth
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>취소</Button>
                    <Button
                        onClick={async () => {
                            if (newCategory.trim()) {
                                try {
                                    const categoryId = await addCategory(newCategory);
                                    // 추가 후 바로 선택
                                    setFormData({
                                        ...formData,
                                        foremanInfo: {
                                            ...formData.foremanInfo!,
                                            category: { name: [newCategory], id: [categoryId] }
                                        }
                                    });
                                    setNewCategory('');
                                    setShowAddDialog(false);
                                } catch (error) {
                                    console.error('Error adding category:', error);
                                }
                            }
                        }}
                        color="primary"
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>



        </Paper>
    );
};

export default ForemanForm;