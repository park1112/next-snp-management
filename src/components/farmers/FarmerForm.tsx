// src/components/farmers/FarmerForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    IconButton,
    Alert,
    Snackbar,
    CircularProgress,
    Grid,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import BasicInfo from '../form/BasicInfo';
import AddressInfo from '../form/AddressInfo';
import BankInfo from '../form/BankInfo';
import AdditionalInfo from '../form/AdditionalInfo';
import { Farmer, DropdownOption } from '@/types';
import { createFarmer, updateFarmer, getSubdistricts } from '@/services/firebase/farmerService';
import { collection, getDocs, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { PaymentGroup } from '@/services/firebase/paymentGroupService';
import CollectionSelector from '../common/AffiliationCollectionSelector';
import { usePaymentGroups } from '@/hooks/common/usePaymentGroups';

interface FarmerFormProps {
    initialData?: Partial<Farmer>;
    isEdit?: boolean;
}

const FarmerForm: React.FC<FarmerFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();

    // 초기 폼 데이터 구성
    const [formData, setFormData] = useState<Partial<Farmer>>(
        initialData || {
            name: '',
            phoneNumber: '',
            paymentGroup: '',
            personalId: '',
            address: {
                full: '',
                zipcode: '',
                detail: '',
                subdistrict: '',
            },
            bankInfo: {
                bankName: '',
                accountNumber: '',
                accountHolder: '',
            },
            memo: '',
        }
    );

    const [subdistrictOptions, setSubdistrictOptions] = useState<DropdownOption[]>([]);
    const { paymentGroups: paymentGroupOptions, addPaymentGroup } = usePaymentGroups();
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

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

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
    const [dialogType, setDialogType] = useState<'subdistrict' | 'paymentGroup'>('subdistrict');
    const [newValue, setNewValue] = useState<string>('');
    const [isAdding, setIsAdding] = useState<boolean>(false);

    // 데이터 로드 함수
    const loadMetadata = async () => {
        setIsLoadingMetadata(true);
        try {
            // 면단위 로드
            const subdistrictsData = await getSubdistricts();
            setSubdistrictOptions(subdistrictsData.map(item => ({ value: item, label: item })));

        } catch (error) {
            console.error('메타데이터 로드 오류:', error);
        } finally {
            setIsLoadingMetadata(false);
        }
    };

    // 초기 데이터 로드
    useEffect(() => {
        loadMetadata();
    }, []);

    // 입력 핸들러 (포맷팅 포함)
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
    ) => {
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
                setFormData({ ...formData, [name]: formattedValue });
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
                setFormData({ ...formData, [name]: formattedValue });
                if (errors.phoneNumber && formattedValue.length === 13) {
                    setErrors({ ...errors, phoneNumber: '' });
                }
            }
            return;
        }

        // 중첩 필드 처리 (address, bankInfo 등)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            const parentValue = formData[parent as keyof Farmer];
            if (parentValue && typeof parentValue === 'object') {
                setFormData({
                    ...formData,
                    [parent]: { ...parentValue, [child]: value },
                });
            }
            return;
        }

        // 일반 필드 업데이트
        setFormData({ ...formData, [name]: value });
        if (errors[name] && value) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // 결제소속 선택 핸들러
    const handleSelectPaymentGroup = (groupName: string) => {
        setFormData({ ...formData, paymentGroup: groupName });
        if (errors.paymentGroup) {
            setErrors({ ...errors, paymentGroup: '' });
        }
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

        // 저장 전, 주소 검색에서 추출한 면 단위는 address.subdistrict에 저장된 값으로 덮어씁니다.
        const updatedData: Partial<Farmer> = {
            ...formData,
            address: {
                ...formData.address,
                full: formData.address?.full || '',
                subdistrict: formData.address?.subdistrict || '',
            },
        };

        setLoading(true);
        try {
            if (isEdit && initialData?.id) {
                await updateFarmer(initialData.id, updatedData);
                setSuccessMessage('농가 정보가 성공적으로 수정되었습니다.');
            } else {
                await createFarmer(
                    updatedData as Omit<Farmer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
                );
                setSuccessMessage('농가가 성공적으로 등록되었습니다.');
            }
            setSuccess(true);
            setTimeout(() => {
                router.push('/farmers');
            }, 3000);
        } catch (error) {
            console.error('Error saving farmer:', error);
            setErrors({ submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
        } finally {
            setLoading(false);
        }
    };

    // 드롭다운 추가 다이얼로그 핸들러
    const handleOpenDialog = (type: 'subdistrict' | 'paymentGroup') => {
        setDialogType(type);
        setNewValue('');
        setShowAddDialog(true);
    };

    const handleCloseDialog = () => {
        setShowAddDialog(false);
    };


    // AddressInfo에서 전달받은 주소 업데이트 핸들러
    const handleAddressUpdate = (address: {
        full: string;
        zipcode: string;
        coordinates?: { latitude: number; longitude: number };
        subdistrict: string;
    }) => {
        setFormData({
            ...formData,
            address: {
                ...formData.address,
                full: address.full,
                zipcode: address.zipcode,
                coordinates: address.coordinates,
                subdistrict: address.subdistrict,
            },
        });
    };



    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => router.push('/farmers')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
            </Box>
            {errors.submit && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.submit}
                </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={3}>
                    <BasicInfo
                        formData={formData}
                        errors={errors}
                        onChange={handleChange}
                        handleOpenDialog={handleOpenDialog}
                    />
                    <Grid size={{ xs: 12 }}>
                        <CollectionSelector
                            label="결제소속"
                            options={paymentGroupOptions}
                            selectedValue={formData.paymentGroup || ''}
                            onSelect={handleSelectPaymentGroup}
                            onAddNew={async (newVal: string) => {
                                await addPaymentGroup(newVal);
                                setFormData({ ...formData, paymentGroup: newVal });
                            }}
                            additionalButtonText="새 결제소속 추가"
                        />
                    </Grid>
                    <AddressInfo
                        formData={formData}
                        onChange={handleChange}
                        onAddressUpdate={handleAddressUpdate}
                    />
                    <BankInfo
                        formData={formData}
                        onChange={handleChange}
                        bankOptions={bankOptions}
                    />
                    <AdditionalInfo formData={formData} onChange={handleChange} />
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

export default FarmerForm;