// src/components/workers/DriverForm.tsx
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
    FormControlLabel,
    InputAdornment,
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
    DirectionsCar as CarIcon,
    Money as MoneyIcon,
} from '@mui/icons-material';
import { Driver, DropdownOption } from '@/types';
import { createDriver, updateWorker, getVehicleTypes, getDriverCategories } from '@/services/firebase/workerService';
import { useDrivers } from '@/hooks/useWorkers';

interface DriverFormProps {
    initialData?: Partial<Driver>;
    isEdit?: boolean;
}

const DriverForm = ({ initialData, isEdit = false }: DriverFormProps): React.ReactElement => {
    const router = useRouter();
    const theme = useTheme();
    const { vehicleTypes, driverCategories } = useDrivers();

    // Form state
    const [formData, setFormData] = useState<Partial<Driver>>(initialData || {
        type: 'driver',
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
        driverInfo: {
            vehicleNumber: '',
            vehicleNumberLast4: '',
            vehicleType: '',
            category: '',
            rates: {
                baseRate: 0,
                distanceRate: 0,
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

    const [vehicleTypeOptions, setVehicleTypeOptions] = useState<DropdownOption[]>([
        { value: '트럭', label: '트럭' },
        { value: '5톤', label: '5톤' },
        { value: '11톤', label: '11톤' },
    ]);

    const [categoryOptions, setCategoryOptions] = useState<DropdownOption[]>([
        { value: '직영차량', label: '직영차량' },
        { value: '콜차량', label: '콜차량' },
        { value: '팀', label: '팀' },
    ]);

    // UI states
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
    const [dialogType, setDialogType] = useState<'vehicleType' | 'category'>('vehicleType');
    const [newValue, setNewValue] = useState<string>('');

    // 단가 관련 상태
    const [isNegotiable, setIsNegotiable] = useState<boolean>(false);

    // 차량 종류 및 구분 옵션 불러오기
    useEffect(() => {
        if (vehicleTypes.length > 0) {
            const options = vehicleTypes.map((type) => ({
                value: type,
                label: type
            }));

            // 기존 옵션과 병합하되 중복 제거
            const existingValues = vehicleTypeOptions.map(option => option.value);
            const newOptions = options.filter(option => !existingValues.includes(option.value));

            if (newOptions.length > 0) {
                setVehicleTypeOptions([...vehicleTypeOptions, ...newOptions]);
            }
        }

        if (driverCategories.length > 0) {
            const options = driverCategories.map((category) => ({
                value: category,
                label: category
            }));

            // 기존 옵션과 병합하되 중복 제거
            const existingValues = categoryOptions.map(option => option.value);
            const newOptions = options.filter(option => !existingValues.includes(option.value));

            if (newOptions.length > 0) {
                setCategoryOptions([...categoryOptions, ...newOptions]);
            }
        }
    }, [vehicleTypes, driverCategories, vehicleTypeOptions, categoryOptions]);

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

        // 차량번호 포맷팅
        if (name === 'driverInfo.vehicleNumber') {
            const vehicleNumber = value as string;

            setFormData({
                ...formData,
                driverInfo: {
                    ...formData.driverInfo!,
                    vehicleNumber: vehicleNumber,
                    // 마지막 4자리는 서버에서 자동 설정
                },
            });

            // 차량번호 오류 검증
            if (errors['driverInfo.vehicleNumber'] && vehicleNumber) {
                setErrors({
                    ...errors,
                    'driverInfo.vehicleNumber': '',
                });
            }

            return;
        }

        // 단가 관련 필드
        if (name.startsWith('driverInfo.rates.')) {
            const rateName = name.split('.')[2];
            const rateValue = parseFloat(value as string);

            if (!isNaN(rateValue) && rateValue >= 0) {
                setFormData({
                    ...formData,
                    driverInfo: {
                        ...formData.driverInfo!,
                        rates: {
                            ...formData.driverInfo?.rates!,
                            [rateName]: rateValue,
                        },
                    },
                });
            }
            return;
        }

        // 기타 driverInfo 필드
        if (name.startsWith('driverInfo.')) {
            const fieldName = name.split('.')[1];

            setFormData({
                ...formData,
                driverInfo: {
                    ...formData.driverInfo!,
                    [fieldName]: value,
                },
            });

            // 오류 검증
            if (errors[`driverInfo.${fieldName}`] && value) {
                setErrors({
                    ...errors,
                    [`driverInfo.${fieldName}`]: '',
                });
            }

            return;
        }

        // 중첩된 필드 (address, bankInfo)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            const parentValue = formData[parent as keyof Driver];
            if (parentValue && typeof parentValue === 'object') {
                setFormData({
                    ...formData,
                    [parent]: {
                        ...parentValue,
                        [child]: value,
                    },
                });
                return;
            }
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

        if (!formData.driverInfo?.vehicleNumber) {
            newErrors['driverInfo.vehicleNumber'] = '차량번호는 필수 항목입니다.';
        }

        if (!formData.driverInfo?.vehicleType) {
            newErrors['driverInfo.vehicleType'] = '차량 종류는 필수 항목입니다.';
        }

        if (!formData.driverInfo?.category) {
            newErrors['driverInfo.category'] = '구분은 필수 항목입니다.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            // 단가 설정이 협의가격인 경우 단가 정보 초기화
            if (isNegotiable) {
                formData.driverInfo = {
                    ...formData.driverInfo!,
                    rates: {
                        baseRate: 0,
                        distanceRate: 0,
                    },
                };
            }

            if (isEdit && initialData?.id) {
                // 운송기사 정보 수정
                await updateWorker(initialData.id, formData);
                setSuccessMessage('운송기사 정보가 성공적으로 수정되었습니다.');
            } else {
                // 운송기사 등록
                await createDriver(formData as Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>);
                setSuccessMessage('운송기사가 성공적으로 등록되었습니다.');
            }

            setSuccess(true);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push('/workers/drivers');
            }, 3000);
        } catch (error) {
            console.error("Error saving driver:", error);
            setErrors({
                submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
            });
        } finally {
            setLoading(false);
        }
    };

    // 다이얼로그 핸들러
    const handleOpenDialog = (type: 'vehicleType' | 'category') => {
        setDialogType(type);
        setNewValue('');
        setShowAddDialog(true);
    };

    const handleCloseDialog = () => {
        setShowAddDialog(false);
    };

    const handleAddNewValue = () => {
        if (!newValue.trim()) return;

        if (dialogType === 'vehicleType') {
            const newOption = { value: newValue, label: newValue };
            setVehicleTypeOptions([...vehicleTypeOptions, newOption]);
            setFormData({
                ...formData,
                driverInfo: {
                    ...formData.driverInfo!,
                    vehicleType: newValue,
                },
            });
        } else if (dialogType === 'category') {
            const newOption = { value: newValue, label: newValue };
            setCategoryOptions([...categoryOptions, newOption]);
            setFormData({
                ...formData,
                driverInfo: {
                    ...formData.driverInfo!,
                    category: newValue,
                },
            });
        }

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
                <IconButton onClick={() => router.push('/workers/drivers')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight="bold">
                    {isEdit ? '운송기사 정보 수정' : '새 운송기사 등록'}
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
                    <Grid size={12}>
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
                            placeholder="운송기사 이름"
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

                    {/* 차량 정보 */}
                    <Grid size={12}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <CarIcon sx={{ mr: 1 }} />
                            차량 정보
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    {/* 차량번호 */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            required
                            fullWidth
                            label="차량번호"
                            name="driverInfo.vehicleNumber"
                            value={formData.driverInfo?.vehicleNumber || ''}
                            onChange={handleChange}
                            error={!!errors['driverInfo.vehicleNumber']}
                            helperText={errors['driverInfo.vehicleNumber']}
                            placeholder="예: 12가 3456"
                        />
                    </Grid>

                    {/* 차량 종류 */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth required error={!!errors['driverInfo.vehicleType']}>
                            <InputLabel>차량 종류</InputLabel>
                            <Select
                                name="driverInfo.vehicleType"
                                value={formData.driverInfo?.vehicleType || ''}
                                onChange={handleChange}
                                label="차량 종류"
                                endAdornment={
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog('vehicleType');
                                        }}
                                        sx={{ mr: 2 }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                }
                            >
                                {vehicleTypeOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors['driverInfo.vehicleType'] && (
                                <FormHelperText>{errors['driverInfo.vehicleType']}</FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* 구분 */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth required error={!!errors['driverInfo.category']}>
                            <InputLabel>구분</InputLabel>
                            <Select
                                name="driverInfo.category"
                                value={formData.driverInfo?.category || ''}
                                onChange={handleChange}
                                label="구분"
                                endAdornment={
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog('category');
                                        }}
                                        sx={{ mr: 2 }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                }
                            >
                                {categoryOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors['driverInfo.category'] && (
                                <FormHelperText>{errors['driverInfo.category']}</FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* 단가 설정 */}
                    <Grid size={12}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <MoneyIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
                            운송료 설정
                        </Typography>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isNegotiable}
                                    onChange={handleNegotiableChange}
                                    color="primary"
                                />
                            }
                            label="협의가격 (운송별로 개별 협의)"
                        />

                        {!isNegotiable && (
                            <Grid container spacing={2} sx={{ ml: 0, mt: 1 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="기본 운송료"
                                        name="driverInfo.rates.baseRate"
                                        type="number"
                                        value={formData.driverInfo?.rates?.baseRate || ''}
                                        onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                            inputProps: { min: 0 }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="거리별 추가 요금 (km당)"
                                        name="driverInfo.rates.distanceRate"
                                        type="number"
                                        value={formData.driverInfo?.rates?.distanceRate || ''}
                                        onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                            inputProps: { min: 0 }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </Grid>

                    {/* 주소 정보 */}
                    <Grid size={12}>
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

                    <Grid size={12}>
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
                    <Grid size={12}>
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
                    <Grid size={12}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <NoteIcon sx={{ mr: 1 }} />
                            추가 정보 (선택)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid size={12}>
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
                    <Grid size={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => router.push('/workers/drivers')}
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

            {/* 추가 다이얼로그 */}
            <Dialog open={showAddDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    {dialogType === 'vehicleType' ? '새 차량 종류 추가' : '새 구분 추가'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={dialogType === 'vehicleType' ? '차량 종류' : '구분'}
                        fullWidth
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">
                        취소
                    </Button>
                    <Button onClick={handleAddNewValue} color="primary">
                        추가
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default DriverForm;