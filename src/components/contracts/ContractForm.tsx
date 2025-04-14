// src/components/contracts/ContractForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    FormControl,
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
    Autocomplete,
    Chip
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Person as PersonIcon,
    Terrain as TerrainIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { Contract, Farmer, Field } from '@/types';
import { createContract, updateContract } from '@/services/firebase/contractService';
import { useFarmers } from '@/hooks/useFarmers';
import { useFields } from '@/hooks/useFields';
import { SelectChangeEvent } from '@mui/material/Select';

// TabPanel 컴포넌트
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`contract-tabpanel-${index}`}
            aria-labelledby={`contract-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

interface ContractFormProps {
    initialData?: Contract;
    isEdit?: boolean;
}

// 계약 폼 데이터 타입 (필요에 따라 확장)
interface ContractFormData {
    id?: string;
    farmerId: string;
    farmerName: string;
    fieldIds: string[];
    fieldNames: string[];
    contractNumber: string;
    contractDate: Date;
    contractType: string;
    contractStatus: 'pending' | 'active' | 'completed' | 'cancelled';
    totalAmount: number;
    downPayment: {
        amount: number;
        dueDate: Date;
        paidDate?: Date;
        paidAmount?: number;
        receiptImageUrl?: string;
        status: 'unpaid' | 'scheduled' | 'paid';
    };
    intermediatePayments: {
        installmentNumber: number;
        amount: number;
        dueDate: Date;
        paidDate?: Date;
        paidAmount?: number;
        receiptImageUrl?: string;
        status: 'unpaid' | 'scheduled' | 'paid';
    }[];
    finalPayment: {
        amount: number;
        dueDate: Date;
        paidDate?: Date;
        paidAmount?: number;
        receiptImageUrl?: string;
        status: 'unpaid' | 'scheduled' | 'paid';
    };
    contractDetails: {
        harvestPeriod: {
            start: Date;
            end: Date;
        };
        pricePerUnit: number;
        unitType: string;
        estimatedQuantity: number;
        specialTerms?: string;
        qualityStandards?: string;
    };
    attachments: {
        name: string;
        url: string;
        type: string;
        uploadedAt: Date;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
    createdBy: string;
    memo: string;
}

function generateContractNumber(): string {
    const today = new Date();
    const year = today.getFullYear().toString().slice(2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `C${year}${month}${day}-${random}`;
}

const ContractForm: React.FC<ContractFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const farmerIdParam = searchParams?.get('farmerId');

    // 탭 상태
    const [tabValue, setTabValue] = useState<number>(0);

    // 상태 관리
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // 기본 계약 데이터 초기화 (수정모드이면 initialData 적용)
    const [formData, setFormData] = useState<ContractFormData>(() => {
        if (initialData) {
            return {
                ...initialData,
                farmerName: initialData.farmerName || '',
                fieldIds: initialData.fieldIds || [],
                fieldNames: initialData.fieldNames || [],
                memo: initialData.memo || '',
                createdBy: initialData.createdBy || ''
            } as ContractFormData;
        }
        return {
            farmerId: farmerIdParam || '',
            farmerName: '',
            fieldIds: [],
            fieldNames: [],
            contractNumber: generateContractNumber(),
            contractDate: new Date(),
            contractType: '일반',
            contractStatus: 'pending',
            totalAmount: 0,
            downPayment: {
                amount: 0,
                dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                status: 'unpaid'
            },
            intermediatePayments: [],
            finalPayment: {
                amount: 0,
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                status: 'unpaid'
            },
            contractDetails: {
                harvestPeriod: {
                    start: new Date(new Date().setMonth(new Date().getMonth() + 2)),
                    end: new Date(new Date().setMonth(new Date().getMonth() + 3))
                },
                pricePerUnit: 0,
                unitType: 'kg',
                estimatedQuantity: 0
            },
            attachments: [],
            createdBy: '',
            memo: ''
        };
    });

    // 농가 및 농지 데이터 로드 (커스텀 훅 사용)
    const { farmers, isLoading: isFarmersLoading } = useFarmers();
    const { fields: allFields, isLoading: isFieldsLoading } = useFields();
    // 현재 선택된 농가의 농지만 필터링
    const [fields, setFields] = useState<Field[]>([]);
    useEffect(() => {
        if (formData.farmerId) {
            const filtered = allFields.filter(field => field.farmerId === formData.farmerId);
            setFields(filtered);
        } else {
            setFields([]);
        }
    }, [formData.farmerId, allFields]);

    // 계약 유형 및 단위 옵션
    const contractTypes = [
        { value: '일반', label: '일반' },
        { value: '특수', label: '특수' },
        { value: '장기', label: '장기' },
    ];
    const unitTypes = [
        { value: 'kg', label: 'kg' },
        { value: '상자', label: '상자' },
        { value: '톤', label: '톤' },
    ];

    // 탭 변경 핸들러
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 폼 입력 핸들러 (일반 필드와 중첩 필드 모두 처리)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
        const { name, value } = e.target;
        if (!name) return;
        // 중첩 필드 처리: 예, contractDetails.pricePerUnit 등
        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;
                if (parent === 'contractDetails') {
                    setFormData(prev => ({
                        ...prev,
                        contractDetails: {
                            ...prev.contractDetails,
                            [child]: child === 'pricePerUnit' || child === 'estimatedQuantity'
                                ? Number(value)
                                : value
                        }
                    }));
                } else if (parent === 'downPayment') {
                    setFormData(prev => ({
                        ...prev,
                        downPayment: {
                            ...prev.downPayment,
                            [child]: child === 'amount' ? Number(value) : value
                        }
                    }));
                } else if (parent === 'finalPayment') {
                    setFormData(prev => ({
                        ...prev,
                        finalPayment: {
                            ...prev.finalPayment,
                            [child]: child === 'amount' ? Number(value) : value
                        }
                    }));
                }
            }
            return;
        }
        // 일반 필드
        if (name === 'totalAmount') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                // 계약금 30%, 잔금 70% 자동 계산 예시
                const downPaymentAmount = Math.round(numValue * 0.3);
                const finalPaymentAmount = numValue - downPaymentAmount;
                setFormData(prev => ({
                    ...prev,
                    totalAmount: numValue,
                    downPayment: {
                        ...prev.downPayment,
                        amount: downPaymentAmount
                    },
                    finalPayment: {
                        ...prev.finalPayment,
                        amount: finalPaymentAmount
                    }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // 농가 선택 핸들러
    const handleFarmerChange = (_event: any, newValue: Farmer | null) => {
        if (newValue) {
            setFormData(prev => ({
                ...prev,
                farmerId: newValue.id,
                farmerName: newValue.name,
                fieldIds: [],
                fieldNames: []
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                farmerId: '',
                farmerName: '',
                fieldIds: [],
                fieldNames: []
            }));
        }
    };

    // 농지 다중 선택 핸들러 (Autocomplete의 multiple 옵션 사용)
    const handleFieldsChange = (_event: any, newValue: Field[]) => {
        if (newValue && newValue.length > 0) {
            setFormData(prev => ({
                ...prev,
                fieldIds: newValue.map(field => field.id),
                fieldNames: newValue.map(field => field.address.full.split(' ').pop() || '알 수 없음')
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                fieldIds: [],
                fieldNames: []
            }));
        }
    };

    // 날짜 핸들러
    const handleDateChange = (date: Date | null, field: string) => {
        if (!date) return;
        if (field === 'contractDate') {
            setFormData(prev => ({
                ...prev,
                contractDate: date
            }));
        } else if (field === 'downPayment.dueDate') {
            setFormData(prev => ({
                ...prev,
                downPayment: {
                    ...prev.downPayment,
                    dueDate: date
                }
            }));
        } else if (field === 'finalPayment.dueDate') {
            setFormData(prev => ({
                ...prev,
                finalPayment: {
                    ...prev.finalPayment,
                    dueDate: date
                }
            }));
        }
    };

    // 수확 기간 핸들러
    const handleHarvestPeriodChange = (field: 'start' | 'end', date: Date | null) => {
        if (!date) return;
        setFormData(prev => ({
            ...prev,
            contractDetails: {
                ...prev.contractDetails,
                harvestPeriod: {
                    ...prev.contractDetails.harvestPeriod,
                    [field]: date
                }
            }
        }));
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { [key: string]: string } = {};
        if (!formData.farmerId) newErrors.farmerId = '농가는 필수 항목입니다.';
        if (!formData.fieldIds || formData.fieldIds.length === 0) newErrors.fieldIds = '최소 하나 이상의 농지를 선택해야 합니다.';
        if (!formData.contractNumber) newErrors.contractNumber = '계약 번호는 필수 항목입니다.';
        if (!formData.contractType) newErrors.contractType = '계약 유형은 필수 항목입니다.';
        if (!formData.totalAmount || formData.totalAmount <= 0) newErrors.totalAmount = '계약 금액은 0보다 커야 합니다.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setLoading(true);

        try {
            if (isEdit && formData.id) {
                await updateContract(formData.id, formData as Contract);
                setSuccessMessage('계약 정보가 성공적으로 수정되었습니다.');
            } else {
                await createContract(formData as Contract);
                setSuccessMessage('계약이 성공적으로 등록되었습니다.');
            }
            setSuccess(true);
            setTimeout(() => {
                router.push(formData.farmerId ? `/farmers/${formData.farmerId}` : '/contracts');
            }, 3000);
        } catch (error) {
            console.error("Error saving contract:", error);
            setErrors({ submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
        } finally {
            setLoading(false);
        }
    };

    // 현재 선택된 농가 및 농지 찾기 (디버깅용)
    const selectedFarmer = farmers.find(farmer => farmer.id === formData.farmerId);
    const selectedFields = fields.filter(field => formData.fieldIds.includes(field.id));

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton
                        onClick={() => router.push(farmerIdParam ? `/farmers/${farmerIdParam}` : '/contracts')}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        {isEdit ? '계약 정보 수정' : '새 계약 등록'}
                    </Typography>
                </Box>

                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* 탭 내비게이션 */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="contract form tabs">
                        <Tab label="기본 정보" id="contract-tab-0" aria-controls="contract-tabpanel-0" />
                        <Tab label="납부 일정" id="contract-tab-1" aria-controls="contract-tabpanel-1" />
                        <Tab label="계약 세부사항" id="contract-tab-2" aria-controls="contract-tabpanel-2" />
                    </Tabs>
                </Box>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {/* 기본 정보 탭 */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Autocomplete
                                    id="farmer-select"
                                    options={farmers}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedFarmer || null}
                                    onChange={handleFarmerChange}
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

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Autocomplete
                                    multiple
                                    id="fields-select"
                                    options={fields}
                                    getOptionLabel={(option) => option.address.full}
                                    value={selectedFields}
                                    onChange={handleFieldsChange}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="농지 선택 (복수 선택 가능)"
                                            required
                                            error={!!errors.fieldIds}
                                            helperText={errors.fieldIds || '농지를 하나 이상 선택하세요'}
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="계약 번호"
                                    name="contractNumber"
                                    value={formData.contractNumber}
                                    onChange={handleChange}
                                    required
                                    error={!!errors.contractNumber}
                                    helperText={errors.contractNumber}
                                />
                            </Grid>

                            <Box sx={{ flexGrow: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <DatePicker
                                            label="계약 날짜"
                                            value={formData.contractDate}
                                            onChange={(date) => handleDateChange(date, 'contractDate')}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    required: true
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <FormControl fullWidth required>
                                            <InputLabel>계약 유형</InputLabel>
                                            <Select
                                                name="contractType"
                                                value={formData.contractType}
                                                onChange={handleChange}
                                                label="계약 유형"
                                            >
                                                {contractTypes.map(option => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="계약 금액"
                                            name="totalAmount"
                                            value={formData.totalAmount}
                                            onChange={handleChange}
                                            required
                                            error={!!errors.totalAmount}
                                            helperText={errors.totalAmount}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <MoneyIcon />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            계약금 (Down Payment)
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="계약금 금액"
                                            name="downPayment.amount"
                                            value={formData.downPayment.amount}
                                            onChange={handleChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <MoneyIcon />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                            }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <DatePicker
                                            label="계약금 납부 예정일"
                                            value={formData.downPayment.dueDate}
                                            onChange={(date) => handleDateChange(date, 'downPayment.dueDate')}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </TabPanel>

                    {/* 납부 일정 탭 */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        중도금 (Intermediate Payments)
                                    </Typography>
                                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
                                        const newPayment = {
                                            installmentNumber: (formData.intermediatePayments.length || 0) + 1,
                                            amount: 0,
                                            dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
                                            status: 'unpaid' as const
                                        };
                                        setFormData(prev => ({
                                            ...prev,
                                            intermediatePayments: [...prev.intermediatePayments, newPayment]
                                        }));
                                    }}>
                                        중도금 추가
                                    </Button>
                                </Box>
                            </Grid>

                            {formData.intermediatePayments.map((payment, index) => (
                                <React.Fragment key={index}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label={`중도금 ${index + 1} 금액`}
                                            value={payment.amount}
                                            onChange={(e) => {
                                                const amount = Number(e.target.value);
                                                setFormData(prev => {
                                                    const payments = [...prev.intermediatePayments];
                                                    payments[index].amount = amount;
                                                    return { ...prev, intermediatePayments: payments };
                                                });
                                            }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <MoneyIcon />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <DatePicker
                                            label={`중도금 ${index + 1} 납부 예정일`}
                                            value={payment.dueDate}
                                            onChange={(date) => {
                                                if (date) {
                                                    setFormData(prev => {
                                                        const payments = [...prev.intermediatePayments];
                                                        payments[index].dueDate = date;
                                                        return { ...prev, intermediatePayments: payments };
                                                    });
                                                }
                                            }}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                        <IconButton color="error" onClick={() => {
                                            setFormData(prev => {
                                                const payments = [...prev.intermediatePayments];
                                                payments.splice(index, 1);
                                                // 회차 번호 재설정
                                                payments.forEach((p, idx) => p.installmentNumber = idx + 1);
                                                return { ...prev, intermediatePayments: payments };
                                            });
                                        }}>
                                            <RemoveIcon />
                                        </IconButton>
                                    </Grid>
                                </React.Fragment>
                            ))}

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    잔금 (Final Payment)
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="잔금 금액"
                                    name="finalPayment.amount"
                                    value={formData.finalPayment.amount}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <MoneyIcon />
                                            </InputAdornment>
                                        ),
                                        endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DatePicker
                                    label="잔금 납부 예정일"
                                    value={formData.finalPayment.dueDate}
                                    onChange={(date) => handleDateChange(date, 'finalPayment.dueDate')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* 계약 세부사항 탭 */}
                    <TabPanel value={tabValue} index={2}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DatePicker
                                    label="수확 시작일"
                                    value={formData.contractDetails.harvestPeriod.start}
                                    onChange={(date) => handleHarvestPeriodChange('start', date)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DatePicker
                                    label="수확 종료일"
                                    value={formData.contractDetails.harvestPeriod.end}
                                    onChange={(date) => handleHarvestPeriodChange('end', date)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="단가"
                                    name="contractDetails.pricePerUnit"
                                    value={formData.contractDetails.pricePerUnit}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel>단위</InputLabel>
                                    <Select
                                        name="contractDetails.unitType"
                                        value={formData.contractDetails.unitType}
                                        onChange={handleChange}
                                        label="단위"
                                    >
                                        {unitTypes.map(option => (
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
                                    type="number"
                                    label="예상 수확량"
                                    name="contractDetails.estimatedQuantity"
                                    value={formData.contractDetails.estimatedQuantity}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="특별 계약 조건"
                                    name="contractDetails.specialTerms"
                                    value={formData.contractDetails.specialTerms || ''}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="품질 기준"
                                    name="contractDetails.qualityStandards"
                                    value={formData.contractDetails.qualityStandards || ''}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="메모"
                                    name="memo"
                                    value={formData.memo}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* 제출 버튼 */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => router.push(formData.farmerId ? `/farmers/${formData.farmerId}` : '/contracts')}
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

export default ContractForm;
