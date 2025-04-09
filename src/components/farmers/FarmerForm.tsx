// src/components/farmers/FarmerForm.tsx
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    InputAdornment,
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
    Business as BusinessIcon,
    Place as PlaceIcon
} from '@mui/icons-material';
import { Farmer, DropdownOption } from '@/types';
import { createFarmer, updateFarmer, getSubdistricts, getPaymentGroups } from '@/services/firebase/farmerService';
import { useAppContext } from '@/contexts/AppContext';

interface FarmerFormProps {
    initialData?: Partial<Farmer>;
    isEdit?: boolean;
}

const FarmerForm: React.FC<FarmerFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const theme = useTheme();
    const { subdistricts, paymentGroups, isLoadingMetadata, refreshMetadata } = useAppContext();

    // Form state
    const [formData, setFormData] = useState<Partial<Farmer>>(initialData || {
        name: '',
        phoneNumber: '',
        subdistrict: '',
        paymentGroup: '',
        personalId: '',
        address: {
            full: '',
            zipcode: '',
            detail: '',
        },
        bankInfo: {
            bankName: '',
            accountNumber: '',
            accountHolder: '',
        },
        memo: '',
    });

    // Dropdown options
    const [subdistrictOptions, setSubdistrictOptions] = useState<DropdownOption[]>([]);
    const [paymentGroupOptions, setPaymentGroupOptions] = useState<DropdownOption[]>([]);
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
    const [dialogType, setDialogType] = useState<'subdistrict' | 'paymentGroup'>('subdistrict');
    const [newValue, setNewValue] = useState<string>('');

    // Load options from context
    useEffect(() => {
        if (subdistricts.length > 0) {
            setSubdistrictOptions(
                subdistricts.map(item => ({ value: item, label: item }))
            );
        }

        if (paymentGroups.length > 0) {
            setPaymentGroupOptions(
                paymentGroups.map(item => ({ value: item, label: item }))
            );
        }

        // 데이터가 없는 경우 새로고침 시도
        if (!isLoadingMetadata && subdistricts.length === 0 && paymentGroups.length === 0) {
            refreshMetadata();
        }
    }, [subdistricts, paymentGroups, isLoadingMetadata, refreshMetadata]);

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

        // 중첩된 필드 (address, bankInfo)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            const parentValue = formData[parent as keyof Farmer];
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

        if (!formData.subdistrict) {
            newErrors.subdistrict = '면단위는 필수 항목입니다.';
        }

        if (!formData.paymentGroup) {
            newErrors.paymentGroup = '결제소속은 필수 항목입니다.';
        }

        if (formData.personalId && !/^\d{6}-\d{7}$/.test(formData.personalId)) {
            newErrors.personalId = '올바른 주민등록번호 형식이 아닙니다.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            if (isEdit && initialData?.id) {
                // 농가 정보 수정
                await updateFarmer(initialData.id, formData);
                setSuccessMessage('농가 정보가 성공적으로 수정되었습니다.');
            } else {
                // 새 농가 등록
                await createFarmer(formData as Omit<Farmer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>);
                setSuccessMessage('농가가 성공적으로 등록되었습니다.');
            }

            setSuccess(true);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push('/farmers');
            }, 3000);
        } catch (error) {
            console.error("Error saving farmer:", error);
            setErrors({
                submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
            });
        } finally {
            setLoading(false);
        }
    };

    // 다이얼로그 핸들러
    const handleOpenDialog = (type: 'subdistrict' | 'paymentGroup') => {
        setDialogType(type);
        setNewValue('');
        setShowAddDialog(true);
    };

    const handleCloseDialog = () => {
        setShowAddDialog(false);
    };

    const handleAddNewValue = () => {
        if (!newValue.trim()) return;

        if (dialogType === 'subdistrict') {
            const newOption = { value: newValue, label: newValue };
            setSubdistrictOptions([...subdistrictOptions, newOption]);
            setFormData({
                ...formData,
                subdistrict: newValue,
            });
        } else if (dialogType === 'paymentGroup') {
            const newOption = { value: newValue, label: newValue };
            setPaymentGroupOptions([...paymentGroupOptions, newOption]);
            setFormData({
                ...formData,
                paymentGroup: newValue,
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
                zipcode: '12345',
            },
        });
    };

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => router.push('/farmers')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight="bold">
                    {isEdit ? '농가 정보 수정' : '새 농가 등록'}
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
                    <Grid size={12} >
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1 }} />
                            기본 정보
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    {/* 이름 */}
                    <Grid size={{ xs: 12, sm: 6 }} >
                        <TextField
                            required
                            fullWidth
                            label="이름"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            placeholder="농가 이름 또는 대표자 이름"
                            InputProps={{
                                startAdornment: <PersonIcon sx={{ color: 'action.active', mr: 1 }} />,
                                inputProps: { maxLength: 50 }
                            }}
                        />
                    </Grid>

                    {/* 전화번호 */}
                    <Grid size={{ xs: 12, sm: 6 }} >
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

                    {/* 면단위 */}
                    <Grid size={{ xs: 12, sm: 6 }} >
                        <FormControl fullWidth required error={!!errors.subdistrict}>
                            <InputLabel>면단위</InputLabel>
                            <Select
                                name="subdistrict"
                                value={formData.subdistrict || ''}
                                onChange={handleChange}
                                label="면단위"
                                endAdornment={
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog('subdistrict');
                                        }}
                                        sx={{ mr: 2 }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                }
                                startAdornment={
                                    <InputAdornment position="start">
                                        <PlaceIcon sx={{ color: 'action.active' }} />
                                    </InputAdornment>
                                }
                            >
                                {subdistrictOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.subdistrict && (
                                <FormHelperText>{errors.subdistrict}</FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* 결제소속 */}
                    <Grid size={{ xs: 12, sm: 6 }} >
                        <FormControl fullWidth required error={!!errors.paymentGroup}>
                            <InputLabel>결제소속</InputLabel>
                            <Select
                                name="paymentGroup"
                                value={formData.paymentGroup || ''}
                                onChange={handleChange}
                                label="결제소속"
                                endAdornment={
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog('paymentGroup');
                                        }}
                                        sx={{ mr: 2 }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                }
                                startAdornment={
                                    <InputAdornment position="start">
                                        <BusinessIcon sx={{ color: 'action.active' }} />
                                    </InputAdornment>
                                }
                            >
                                {paymentGroupOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.paymentGroup && (
                                <FormHelperText>{errors.paymentGroup}</FormHelperText>
                            )}
                        </FormControl>
                    </Grid>

                    {/* 주민등록번호 */}
                    <Grid size={{ xs: 12, sm: 6 }} >
                        <TextField
                            fullWidth
                            label="주민등록번호 (선택)"
                            name="personalId"
                            value={formData.personalId || ''}
                            onChange={handleChange}
                            error={!!errors.personalId}
                            helperText={errors.personalId || '주민등록번호는 암호화되어 저장됩니다.'}
                            placeholder="123456-1234567"
                        />
                    </Grid>

                    {/* 주소 정보 */}
                    <Grid size={{ xs: 12 }} >
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <HomeIcon sx={{ mr: 1 }} />
                            주소 정보 (선택)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 8 }} >
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

                    <Grid size={{ xs: 12, sm: 4 }} >
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleAddressSearch}
                            sx={{ height: '56px' }}
                        >
                            주소 검색
                        </Button>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }} >
                        <TextField
                            fullWidth
                            label="우편번호"
                            name="address.zipcode"
                            value={formData.address?.zipcode || ''}
                            onChange={handleChange}
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 8 }} >
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
                    <Grid size={{ xs: 12 }} >
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <BankIcon sx={{ mr: 1 }} />
                            계좌정보 (선택)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }} >
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

                    <Grid size={{ xs: 12, sm: 4 }} >
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

                    <Grid size={{ xs: 12, sm: 4 }} >
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
                    <Grid size={{ xs: 12 }} >
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                            <NoteIcon sx={{ mr: 1 }} />
                            추가 정보 (선택)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid size={{ xs: 12 }} >
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
                            onClick={() => router.push('/farmers')}
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
                    {dialogType === 'subdistrict' ? '새 면단위 추가' : '새 결제소속 추가'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={dialogType === 'subdistrict' ? '면단위' : '결제소속'}
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

export default FarmerForm;