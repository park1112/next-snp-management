// src/components/contracts/ContractDetail.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Divider,
    Button,
    Chip,
    Card,
    CardContent,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CircularProgress,
    Tabs,
    Tab,
    Alert,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as BackIcon,
    CalendarToday as CalendarIcon,
    Description as DescriptionIcon,
    Person as PersonIcon,
    Terrain as TerrainIcon,
    Payment as PaymentIcon,
    Info as InfoIcon,
    AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useContract } from '@/hooks/useContracts';

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
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
};

interface ContractDetailProps {
    contractId: string;
}

const ContractDetail: React.FC<ContractDetailProps> = ({ contractId }) => {
    const router = useRouter();
    const { contract, isLoading, error, deleteContract } = useContract(contractId);

    // Tab state
    const [tabValue, setTabValue] = useState(0);

    // 삭제 다이얼로그 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                계약 정보를 불러오는 중 오류가 발생했습니다: {error.message}
            </Alert>
        );
    }

    if (!contract) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}>
                계약 정보를 찾을 수 없습니다.
            </Alert>
        );
    }

    // Tab 변경 핸들러
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 계약 상태에 따른 칩 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'active': return 'primary';
            case 'completed': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    // 계약 상태 레이블
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return '예정';
            case 'active': return '진행중';
            case 'completed': return '완료';
            case 'cancelled': return '취소';
            default: return '알 수 없음';
        }
    };

    // 삭제 확인 다이얼로그 열기
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    // 삭제 확인 다이얼로그 닫기
    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    // 삭제 실행
    const handleDeleteConfirm = async () => {
        try {
            setIsDeleting(true);
            await deleteContract();
            setDeleteDialogOpen(false);
            // 성공 후 목록 페이지로 이동
            router.push(contract.farmerId ? `/farmers/${contract.farmerId}` : '/contracts');
        } catch (error) {
            console.error('Error deleting contract:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    // 수정 페이지로 이동
    const handleEditClick = () => {
        router.push(`/contracts/${contractId}/edit`);
    };

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            {/* 헤더 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        onClick={() => router.push(contract.farmerId ? `/farmers/${contract.farmerId}` : '/contracts')}
                        sx={{ mr: 2 }}
                    >
                        <BackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            계약 #{contract.contractNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip
                                size="small"
                                label={getStatusLabel(contract.contractStatus)}
                                color={getStatusColor(contract.contractStatus)}
                                sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {contract.contractType || '일반'} |
                                {' ' + new Date(contract.contractDate).toLocaleDateString('ko-KR')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Box>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={handleEditClick}
                        sx={{ mr: 1 }}
                    >
                        수정
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteClick}
                    >
                        삭제
                    </Button>
                </Box>
            </Box>

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="contract detail tabs"
                >
                    <Tab
                        icon={<InfoIcon />}
                        iconPosition="start"
                        label="기본 정보"
                        id="contract-tab-0"
                        aria-controls="contract-tabpanel-0"
                    />
                    <Tab
                        icon={<PaymentIcon />}
                        iconPosition="start"
                        label="납부 일정"
                        id="contract-tab-1"
                        aria-controls="contract-tabpanel-1"
                    />
                    <Tab
                        icon={<DescriptionIcon />}
                        iconPosition="start"
                        label="세부 정보"
                        id="contract-tab-2"
                        aria-controls="contract-tabpanel-2"
                    />
                </Tabs>
            </Box>

            {/* 기본 정보 탭 */}
            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">농가 정보</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 4 }}>
                                        <Typography variant="body2" color="text.secondary">농가명</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 8 }}>
                                        <Typography variant="body1">{contract.farmerName || '정보 없음'}</Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => router.push(`/farmers/${contract.farmerId}`)}
                                        >
                                            농가 상세 보기
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <TerrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">농지 정보</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    계약 대상 농지
                                </Typography>

                                {contract.fieldNames && contract.fieldNames.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {contract.fieldNames.map((name, index) => (
                                            <Chip
                                                key={index}
                                                label={name}
                                                size="small"
                                                onClick={() => router.push(`/fields/${contract.fieldIds[index]}`)}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2">농지 정보 없음</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">계약 개요</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Typography variant="body2" color="text.secondary">계약 번호</Typography>
                                        <Typography variant="body1">{contract.contractNumber}</Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Typography variant="body2" color="text.secondary">계약일</Typography>
                                        <Typography variant="body1">
                                            {new Date(contract.contractDate).toLocaleDateString('ko-KR')}
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Typography variant="body2" color="text.secondary">계약 유형</Typography>
                                        <Typography variant="body1">{contract.contractType || '일반'}</Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Typography variant="body2" color="text.secondary">계약 상태</Typography>
                                        <Chip
                                            size="small"
                                            label={getStatusLabel(contract.contractStatus)}
                                            color={getStatusColor(contract.contractStatus)}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Divider sx={{ my: 1 }} />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" color="text.secondary">계약 총액</Typography>
                                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                                            {contract.totalAmount?.toLocaleString() || 0}원
                                        </Typography>
                                    </Grid>

                                    {contract.memo && (
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="body2" color="text.secondary">메모</Typography>
                                            <Typography variant="body2">{contract.memo}</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 납부 총액 요약 */}
                    <Grid size={{ xs: 12 }}>
                        <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="body2" color="text.secondary">계약 총액</Typography>
                                        <Typography variant="h6" fontWeight="bold">
                                            {contract.totalAmount?.toLocaleString() || 0}원
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="body2" color="text.secondary">납부 완료액</Typography>
                                        <Typography variant="h6" fontWeight="bold" color={
                                            contract.contractStatus === 'completed' ? 'success.main' : 'text.primary'
                                        }>
                                            {(
                                                (contract.downPayment?.status === 'paid' ? contract.downPayment.amount : 0) +
                                                (contract.intermediatePayments?.filter(p => p.status === 'paid')
                                                    .reduce((sum, p) => sum + p.amount, 0) || 0) +
                                                (contract.finalPayment?.status === 'paid' ? contract.finalPayment.amount : 0)
                                            ).toLocaleString()}원
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="body2" color="text.secondary">미납액</Typography>
                                        <Typography variant="h6" fontWeight="bold" color={
                                            contract.contractStatus === 'completed' ? 'text.primary' : 'warning.main'
                                        }>
                                            {(
                                                contract.totalAmount - (
                                                    (contract.downPayment?.status === 'paid' ? contract.downPayment.amount : 0) +
                                                    (contract.intermediatePayments?.filter(p => p.status === 'paid')
                                                        .reduce((sum, p) => sum + p.amount, 0) || 0) +
                                                    (contract.finalPayment?.status === 'paid' ? contract.finalPayment.amount : 0)
                                                )
                                            ).toLocaleString()}원
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* 납부 일정 탭 */}
            <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    {/* 계약금 */}
                    <Grid size={{ xs: 12 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">계약금</Typography>
                                    <Chip
                                        size="small"
                                        label={
                                            contract.downPayment?.status === 'paid' ? '납부 완료' :
                                                contract.downPayment?.status === 'scheduled' ? '납부 예정' : '미납'
                                        }
                                        color={
                                            contract.downPayment?.status === 'paid' ? 'success' :
                                                contract.downPayment?.status === 'scheduled' ? 'info' : 'warning'
                                        }
                                    />
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Typography variant="body2" color="text.secondary">금액</Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {contract.downPayment?.amount?.toLocaleString() || 0}원
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Typography variant="body2" color="text.secondary">납부 예정일</Typography>
                                        <Typography variant="body1">
                                            {contract.downPayment?.dueDate ?
                                                new Date(contract.downPayment.dueDate).toLocaleDateString('ko-KR') :
                                                '정보 없음'
                                            }
                                        </Typography>
                                    </Grid>

                                    {contract.downPayment?.paidDate && (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Typography variant="body2" color="text.secondary">실제 납부일</Typography>
                                            <Typography variant="body1">
                                                {new Date(contract.downPayment.paidDate).toLocaleDateString('ko-KR')}
                                            </Typography>
                                        </Grid>
                                    )}

                                    {contract.downPayment?.paidAmount && (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Typography variant="body2" color="text.secondary">실제 납부액</Typography>
                                            <Typography variant="body1">
                                                {contract.downPayment.paidAmount.toLocaleString()}원
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 중도금 */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>중도금</Typography>

                        {contract.intermediatePayments && contract.intermediatePayments.length > 0 ? (
                            contract.intermediatePayments.map((payment, index) => (
                                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="subtitle1">{payment.installmentNumber}회차</Typography>
                                            <Chip
                                                size="small"
                                                label={
                                                    payment.status === 'paid' ? '납부 완료' :
                                                        payment.status === 'scheduled' ? '납부 예정' : '미납'
                                                }
                                                color={
                                                    payment.status === 'paid' ? 'success' :
                                                        payment.status === 'scheduled' ? 'info' : 'warning'
                                                }
                                            />
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="body2" color="text.secondary">금액</Typography>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {payment.amount?.toLocaleString() || 0}원
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="body2" color="text.secondary">납부 예정일</Typography>
                                                <Typography variant="body1">
                                                    {payment.dueDate ?
                                                        new Date(payment.dueDate).toLocaleDateString('ko-KR') :
                                                        '정보 없음'
                                                    }
                                                </Typography>
                                            </Grid>

                                            {payment.paidDate && (
                                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                    <Typography variant="body2" color="text.secondary">실제 납부일</Typography>
                                                    <Typography variant="body1">
                                                        {new Date(payment.paidDate).toLocaleDateString('ko-KR')}
                                                    </Typography>
                                                </Grid>
                                            )}

                                            {payment.paidAmount && (
                                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                    <Typography variant="body2" color="text.secondary">실제 납부액</Typography>
                                                    <Typography variant="body1">
                                                        {payment.paidAmount.toLocaleString()}원
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                                <Typography color="text.secondary">
                                    등록된 중도금 회차가 없습니다.
                                </Typography>
                            </Box>
                        )}
                    </Grid>

                    {/* 잔금 */}
                    <Grid size={{ xs: 12 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">잔금</Typography>
                                    <Chip
                                        size="small"
                                        label={
                                            contract.finalPayment?.status === 'paid' ? '납부 완료' :
                                                contract.finalPayment?.status === 'scheduled' ? '납부 예정' : '미납'
                                        }
                                        color={
                                            contract.finalPayment?.status === 'paid' ? 'success' :
                                                contract.finalPayment?.status === 'scheduled' ? 'info' : 'warning'
                                        }
                                    />
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Typography variant="body2" color="text.secondary">금액</Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {contract.finalPayment?.amount?.toLocaleString() || 0}원
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Typography variant="body2" color="text.secondary">납부 예정일</Typography>
                                        <Typography variant="body1">
                                            {contract.finalPayment?.dueDate ?
                                                new Date(contract.finalPayment.dueDate).toLocaleDateString('ko-KR') :
                                                '정보 없음'
                                            }
                                        </Typography>
                                    </Grid>

                                    {contract.finalPayment?.paidDate && (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Typography variant="body2" color="text.secondary">실제 납부일</Typography>
                                            <Typography variant="body1">
                                                {new Date(contract.finalPayment.paidDate).toLocaleDateString('ko-KR')}
                                            </Typography>
                                        </Grid>
                                    )}

                                    {contract.finalPayment?.paidAmount && (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Typography variant="body2" color="text.secondary">실제 납부액</Typography>
                                            <Typography variant="body1">
                                                {contract.finalPayment.paidAmount.toLocaleString()}원
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* 계약 세부사항 탭 */}
            <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    {/* 수확 기간 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">수확 기간</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" color="text.secondary">시작일</Typography>
                                        <Typography variant="body1">
                                            {contract.contractDetails?.harvestPeriod?.start ?
                                                new Date(contract.contractDetails.harvestPeriod.start).toLocaleDateString('ko-KR') :
                                                '정보 없음'
                                            }
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" color="text.secondary">종료일</Typography>
                                        <Typography variant="body1">
                                            {contract.contractDetails?.harvestPeriod?.end ?
                                                new Date(contract.contractDetails.harvestPeriod.end).toLocaleDateString('ko-KR') :
                                                '정보 없음'
                                            }
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 단가 정보 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">단가 정보</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" color="text.secondary">단가</Typography>
                                        <Typography variant="body1">
                                            {contract.contractDetails?.pricePerUnit
                                                ? `${contract.contractDetails.pricePerUnit.toLocaleString()}원`
                                                : '정보 없음'}
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="body2" color="text.secondary">단위</Typography>
                                        <Typography variant="body1">
                                            {contract.contractDetails?.unitType || '정보 없음'}
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" color="text.secondary">예상 수확량</Typography>
                                        <Typography variant="body1">
                                            {contract.contractDetails?.estimatedQuantity
                                                ? `${contract.contractDetails.estimatedQuantity.toLocaleString()} ${contract.contractDetails.unitType || 'kg'}`
                                                : '정보 없음'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 특별 계약 조건 */}
                    {contract.contractDetails?.specialTerms && (
                        <Grid size={{ xs: 12 }}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2 }}>특별 계약 조건</Typography>
                                    <Typography variant="body1">
                                        {contract.contractDetails.specialTerms}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* 품질 기준 */}
                    {contract.contractDetails?.qualityStandards && (
                        <Grid size={{ xs: 12 }}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2 }}>품질 기준</Typography>
                                    <Typography variant="body1">
                                        {contract.contractDetails.qualityStandards}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>계약 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        정말로 이 계약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} disabled={isDeleting}>
                        취소
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        disabled={isDeleting}
                        startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ContractDetail;