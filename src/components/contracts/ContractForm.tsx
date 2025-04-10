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
    Autocomplete,
    Chip,
    SelectChangeEvent
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Description as DescriptionIcon,
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

const ContractForm: React.FC<ContractFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL 파라미터
    const farmerId = searchParams?.get('farmerId');

    // Tab state
    const [tabValue, setTabValue] = useState(0);

    // 기본 계약 데이터
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
            farmerId: farmerId || '',
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

    // 농가 및 농지 데이터 가져오기
    const { farmers, isLoading: isFarmersLoading } = useFarmers();
    const { fields: allFields, isLoading: isFieldsLoading } = useFields();

    // 현재 선택된 농가의 농지만 필터링
    const [fields, setFields] = useState<Field[]>([]);

    // 계약 유형 옵션
    const [contractTypes] = useState<{ value: string, label: string }[]>([
        { value: '일반', label: '일반' },
        { value: '특수', label: '특수' },
        { value: '장기', label: '장기' },
    ]);

    // 단위 유형 옵션
    const [unitTypes] = useState<{ value: string, label: string }[]>([
        { value: 'kg', label: 'kg' },
        { value: '상자', label: '상자' },
        { value: '톤', label: '톤' },
    ]);

    // UI 상태
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // Tab 변경 핸들러
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 현재 농가에 해당하는 농지 필터링
    useEffect(() => {
        if (formData.farmerId) {
            const filtered = allFields.filter(field => field.farmerId === formData.farmerId);
            setFields(filtered);
        } else {
            setFields([]);
        }
    }, [formData.farmerId, allFields]);

    // 기본값 계약번호 생성
    function generateContractNumber(): string {
        const today = new Date();
        const year = today.getFullYear().toString().slice(2); // 2자리 연도
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `C${year}${month}${day}-${random}`;
    }

    // 폼 입력 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
        const { name, value } = e.target;
        if (!name) return;

        // 중첩된 필드 처리
        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                const [parent, child] = parts;

                if (parent === 'contractDetails') {
                    setFormData({
                        ...formData,
                        contractDetails: {
                            ...formData.contractDetails,
                            [child]: child === 'pricePerUnit' || child === 'estimatedQuantity'
                                ? Number(value)
                                : value,
                        },
                    });
                } else if (parent === 'downPayment') {
                    setFormData({
                        ...formData,
                        downPayment: {
                            ...formData.downPayment,
                            [child]: child === 'amount' ? Number(value) : value,
                        },
                    });
                } else if (parent === 'finalPayment') {
                    setFormData({
                        ...formData,
                        finalPayment: {
                            ...formData.finalPayment,
                            [child]: child === 'amount' ? Number(value) : value,
                        },
                    });
                }
            }
            return;
        }

        // 일반 필드
        if (name === 'totalAmount') {
            // 숫자 값 변환
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                // 계약금, 잔금 자동 계산 (30%, 70%)
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
                farmerName: newValue.name,
                fieldIds: [], // 농가 변경 시 농지 선택 초기화
                fieldNames: []
            });

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
                farmerName: '',
                fieldIds: [],
                fieldNames: []
            });
        }
    };

    // 농지 선택 핸들러
    const handleFieldsChange = (_event: any, newValue: Field[]) => {
        if (newValue && newValue.length > 0) {
            setFormData({
                ...formData,
                fieldIds: newValue.map(field => field.id),
                fieldNames: newValue.map(field => field.address.full.split(' ').pop() || '이름 없음')
            });

            // 농지 관련 오류 제거
            if (errors.fieldIds) {
                setErrors({
                    ...errors,
                    fieldIds: '',
                });
            }
        } else {
            setFormData({
                ...formData,
                fieldIds: [],
                fieldNames: []
            });
        }
    };

    // 계약 날짜 핸들러
    const handleDateChange = (date: Date | null, field: string) => {
        if (!date) return;

        if (field === 'contractDate') {
            setFormData({
                ...formData,
                contractDate: date
            });
        } else if (field === 'downPayment.dueDate') {
            setFormData({
                ...formData,
                downPayment: {
                    ...formData.downPayment,
                    dueDate: date
                }
            });
        } else if (field === 'finalPayment.dueDate') {
            setFormData({
                ...formData,
                finalPayment: {
                    ...formData.finalPayment,
                    dueDate: date
                }
            });
        } else if (field === 'contractDetails.harvestPeriod.start') {
            setFormData({
                ...formData,
                contractDetails: {
                    ...formData.contractDetails,
                    harvestPeriod: {
                        ...formData.contractDetails?.harvestPeriod,
                        start: date
                    }
                }
            });
        } else if (field === 'contractDetails.harvestPeriod.end') {
            setFormData({
                ...formData,
                contractDetails: {
                    ...formData.contractDetails,
                    harvestPeriod: {
                        ...formData.contractDetails?.harvestPeriod,
                        end: date
                    }
                }
            });
        }
    };

    // 중도금 추가 핸들러
    const handleAddIntermediatePayment = () => {
        const newPayment = {
            installmentNumber: (formData.intermediatePayments?.length || 0) + 1,
            amount: 0,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 2주 후 기본값
            status: 'unpaid' as const
        };

        setFormData({
            ...formData,
            intermediatePayments: [...(formData.intermediatePayments || []), newPayment]
        });
    };

    // 중도금 수정 핸들러
    type IntermediatePaymentType = {
        installmentNumber: number;
        amount: number;
        dueDate: Date;
        paidDate?: Date;
        paidAmount?: number;
        receiptImageUrl?: string;
        status: 'unpaid' | 'scheduled' | 'paid';
    };

    type IntermediatePaymentField = keyof IntermediatePaymentType;

    const handleIntermediatePaymentChange = (index: number, field: IntermediatePaymentField, value: any) => {
        setFormData(prev => {
            const newIntermediatePayments = [...prev.intermediatePayments];
            newIntermediatePayments[index] = {
                ...newIntermediatePayments[index],
                [field]: value,
                status: 'unpaid' as const
            };
            return {
                ...prev,
                intermediatePayments: newIntermediatePayments
            };
        });
    };

    // 중도금 날짜 변경 핸들러
    const handleIntermediatePaymentDateChange = (date: Date | null, index: number) => {
        if (!date) return;

        const updatedPayments = [...(formData.intermediatePayments || [])];
        updatedPayments[index].dueDate = date;

        setFormData({
            ...formData,
            intermediatePayments: updatedPayments
        });
    };

    // 중도금 삭제 핸들러
    const handleRemoveIntermediatePayment = (index: number) => {
        const updatedPayments = [...(formData.intermediatePayments || [])];
        updatedPayments.splice(index, 1);

        // 회차 번호 재정렬
        updatedPayments.forEach((payment, idx) => {
            payment.installmentNumber = idx + 1;
        });

        setFormData({
            ...formData,
            intermediatePayments: updatedPayments
        });
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { [key: string]: string } = {};

        if (!formData.farmerId) {
            newErrors.farmerId = '농가는 필수 항목입니다.';
        }

        if (!formData.fieldIds || formData.fieldIds.length === 0) {
            newErrors.fieldIds = '최소 하나 이상의 농지를 선택해야 합니다.';
        }

        if (!formData.contractNumber) {
            newErrors.contractNumber = '계약 번호는 필수 항목입니다.';
        }

        if (!formData.contractType) {
            newErrors.contractType = '계약 유형은 필수 항목입니다.';
        }

        if (!formData.totalAmount || formData.totalAmount <= 0) {
            newErrors.totalAmount = '계약 금액은 0보다 커야 합니다.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            // 금액 재계산 및 검증
            let totalCalculated = formData.downPayment?.amount || 0;
            (formData.intermediatePayments || []).forEach(payment => {
                totalCalculated += payment.amount;
            });
            totalCalculated += formData.finalPayment?.amount || 0;

            // 총 금액과 계산된 금액이 다른 경우 조정
            if (totalCalculated !== formData.totalAmount) {
                // 잔금 자동 조정
                const adjustedFinalAmount = formData.totalAmount -
                    (formData.downPayment?.amount || 0) -
                    (formData.intermediatePayments || []).reduce((sum, payment) => sum + payment.amount, 0);

                setFormData(prev => ({
                    ...prev,
                    finalPayment: {
                        ...prev.finalPayment,
                        amount: adjustedFinalAmount
                    }
                }));
            }

            if (isEdit && initialData?.id) {
                // 계약 정보 수정
                await updateContract(initialData.id, formData as Contract);
                setSuccessMessage('계약 정보가 성공적으로 수정되었습니다.');
            } else {
                // 새 계약 등록
                await createContract(formData as Contract);
                setSuccessMessage('계약이 성공적으로 등록되었습니다.');
            }

            setSuccess(true);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push(formData.farmerId ? `/farmers/${formData.farmerId}` : '/contracts');
            }, 3000);
        } catch (error) {
            console.error("Error saving contract:", error);
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
    const selectedFields = fields.filter(field => formData.fieldIds?.includes(field.id));

    type PaymentType = {
        amount: number;
        dueDate: Date;
        paidDate?: Date;
        paidAmount?: number;
        receiptImageUrl?: string;
        status: 'unpaid' | 'scheduled' | 'paid';
    };

    type PaymentField = keyof PaymentType;

    const handlePaymentChange = (type: 'down' | 'final', field: PaymentField, value: any) => {
        setFormData(prev => {
            const payment = type === 'down' ? prev.downPayment : prev.finalPayment;
            return {
                ...prev,
                [type === 'down' ? 'downPayment' : 'finalPayment']: {
                    ...payment,
                    [field]: value,
                    status: 'unpaid' as const
                }
            };
        });
    };

    const handleHarvestPeriodChange = (field: keyof (typeof formData.contractDetails.harvestPeriod), value: Date) => {
        setFormData(prev => ({
            ...prev,
            contractDetails: {
                ...prev.contractDetails,
                harvestPeriod: {
                    ...prev.contractDetails.harvestPeriod,
                    [field]: value
                }
            }
        }));
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton
                        onClick={() => router.push(farmerId ? `/farmers/${farmerId}` : '/contracts')}
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

                {/* 탭 네비게이션 */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="contract form tabs"
                    >
                        <Tab label="기본 정보" id="contract-tab-0" aria-controls="contract-tabpanel-0" />
                        <Tab label="납부 일정" id="contract-tab-1" aria-controls="contract-tabpanel-1" />
                        <Tab label="계약 세부사항" id="contract-tab-2" aria-controls="contract-tabpanel-2" />
                    </Tabs>
                </Box>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {/* 탭 패널 내용은 이전 응답에서 제공됨 */}
                    {/* 기본 정보, 납부 일정, 계약 세부사항 탭 내용 */}
                    {/* ... */}

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

export default ContractForm;