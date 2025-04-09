// src/components/workers/ForemanForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    SelectChangeEvent
} from '@mui/material';
import {
    Phone as PhoneIcon,
    Home as HomeIcon,
    AccountBalance as BankIcon,
    Add as AddIcon,
    LocationOn as LocationIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Note as NoteIcon,
    Engineering as EngineeringIcon,
    Money as MoneyIcon,
} from '@mui/icons-material';
import { Foreman, DropdownOption } from '@/types';
import { createForeman, updateWorker, getForemanCategories } from '@/services/firebase/workerService';
import { useForemen } from '@/hooks/useWorkers';

interface ForemanFormProps {
    initialData?: Partial<Foreman>;
    isEdit?: boolean;
}

const ForemanForm: React.FC<ForemanFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const theme = useTheme();
    const { foremanCategories } = useForemen();

    // Form state
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
            category: '',
            rates: {
                hourly: 0,
                daily: 0,
                custom: {},
            },
        },
        memo: '',
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

    const [foremanCategoryOptions, setForemanCategoryOptions] = useState<DropdownOption[]>([
        { value: '망담기', label: '망담기' },
        { value: '상차팀', label: '상차팀' },
        { value: '하차팀', label: '하차팀' },
        { value: '뽑기', label: '뽑기' },
        { value: '자르기', label: '자르기' },
    ]);

    // UI states
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
    const [newCategory, setNewCategory] = useState<string>('');

    // 단가 관련 상태
    const [useHourlyRate, setUseHourlyRate] = useState<boolean>(true);
    const [isNegotiable, setIsNegotiable] = useState<boolean>(false);

    // 카테고리 옵션 불러오기
    useEffect(() => {
        if (foremanCategories.length > 0) {
            const options = foremanCategories.map((category) => ({
                value: category,
                label: category
            }));

            // 기존 옵션과 병합하되 중복 제거
            const existingValues = foremanCategoryOptions.map(option => option.value);
            const newOptions = options.filter(option => !existingValues.includes(option.value));

            if (newOptions.length > 0) {
                setForemanCategoryOptions([...foremanCategoryOptions, ...newOptions]);
            }
        }
    }, [foremanCategories]);

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

    // 단가 방식 변경 핸들러
    const handleRateTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUseHourlyRate(event.target.value === 'hourly');
    };

    // 협의가격 토글 핸들러
    const handleNegotiableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsNegotiable(event.target.checked);
    };

    // 폼 제출 핸들러
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

        if (!formData.foremanInfo?.category) {
            newErrors['foremanInfo.category'] = '구분은 필수 항목입니다.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            // 단가 설정이 협의가격인 경우 단가 정보 초기화
            if (isNegotiable) {
                formData.foremanInfo = {
                    ...formData.foremanInfo!,
                    rates: {
                        hourly: 0,
                        daily: 0,
                    },
                };
            } else {
                // 시간당/일당 중 하나만 설정
                formData.foremanInfo = {
                    ...formData.foremanInfo!,
                    rates: {
                        hourly: useHourlyRate ? formData.foremanInfo?.rates?.hourly || 0 : 0,
                        daily: !useHourlyRate ? formData.foremanInfo?.rates?.daily || 0 : 0,
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

    // 카테고리 추가 다이얼로그 핸들러
    const handleOpenDialog = () => {
        setNewCategory('');
        setShowAddDialog(true);
    };

    const handleCloseDialog = () => {
        setShowAddDialog(false);
    };

    const handleAddNewCategory = () => {
        if (!newCategory.trim()) return;

        const newOption = { value: newCategory, label: newCategory };
        setForemanCategoryOptions([...foremanCategoryOptions, newOption]);
        setFormData({
            ...formData,
            foremanInfo: {
                ...formData.foremanInfo!,
                category: newCategory,
            },
        });

        setShowAddDialog(false);
    };

    // 주소 검색 핸들러 (실제 구현은 주소 API 연동 필요)
    const handleAddressSearch = () => {
        // 주소 API 연동 필요 (Daum 주소 API 등)
        // 테스트용 주소 입력
        setFormData({
            ...formData,
            address: {
                ...formData.address,
                full: '경기도 화성시 동탄면 금곡리 123-45',
            },
        });
    };

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

                    {/* 업무 정보 */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <EngineeringIcon sx={{ mr: 1 }} />
                            업무 정보
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    {/* 구분 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required error={!!errors['foremanInfo.category']}>
                            <InputLabel>구분</InputLabel>
                            <Select
                                name="foremanInfo.category"
                                value={formData.foremanInfo?.category || ''}
                                onChange={handleChange}
                                label="구분"
                                endAdornment={
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog();
                                        }}
                                        sx={{ mr: 2 }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                }
                            >
                                {foremanCategoryOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors['foremanInfo.category'] && (
                                <FormHelperText>{errors['foremanInfo.category']}</FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* 빈 영역 */}
                    <Grid size={{ xs: 12, sm: 6 }}></Grid>

                    {/* 단가 설정 */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <MoneyIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
                            단가 설정
                        </Typography>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isNegotiable}
                                    onChange={handleNegotiableChange}
                                    color="primary"
                                />
                            }
                            label="협의가격 (작업별로 개별 협의)"
                        />

                        {!isNegotiable && (
                            <Box sx={{ ml: 2, mt: 1 }}>
                                <FormControl component="fieldset">
                                    <RadioGroup
                                        row
                                        name="rateType"
                                        value={useHourlyRate ? 'hourly' : 'daily'}
                                        onChange={handleRateTypeChange}
                                    >
                                        <FormControlLabel value="hourly" control={<Radio />} label="시간당" />
                                        <FormControlLabel value="daily" control={<Radio />} label="일당" />
                                    </RadioGroup>
                                </FormControl>

                                {useHourlyRate ? (
                                    <TextField
                                        fullWidth
                                        label="시간당 단가"
                                        name="foremanInfo.rates.hourly"
                                        type="number"
                                        value={formData.foremanInfo?.rates?.hourly || ''}
                                        onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                            inputProps: { min: 0 }
                                        }}
                                        sx={{ mt: 1 }}
                                    />
                                ) : (
                                    <TextField
                                        fullWidth
                                        label="일당"
                                        name="foremanInfo.rates.daily"
                                        type="number"
                                        value={formData.foremanInfo?.rates?.daily || ''}
                                        onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                            inputProps: { min: 0 }
                                        }}
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </Box>
                        )}
                    </Grid>

                    {/* 주소 정보 */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <HomeIcon sx={{ mr: 1 }} />
                            주소 정보 (선택)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            fullWidth
                            label="주소"
                            name="address.full"
                            value={formData.address?.full || ''}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: <LocationIcon sx={{ color: 'action.active', mr: 1 }} />,
                                readOnly: true,
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleAddressSearch}
                            sx={{ height: '56px' }}
                        >
                            주소 검색
                        </Button>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="상세주소"
                            name="address.detail"
                            value={formData.address?.detail || ''}
                            onChange={handleChange}
                            placeholder="상세주소를 입력하세요"
                        />
                    </Grid>

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

            {/* 구분 추가 다이얼로그 */}
            <Dialog open={showAddDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    새 작업 구분 추가
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="작업 구분"
                        fullWidth
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">
                        취소
                    </Button>
                    <Button onClick={handleAddNewCategory} color="primary">
                        추가
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ForemanForm;