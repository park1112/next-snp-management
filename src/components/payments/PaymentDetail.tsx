'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    AttachMoney as MoneyIcon,
    Receipt as ReceiptIcon,
    AccountBalance as BankIcon,
    CalendarToday as CalendarIcon,
    EventNote as ScheduleIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { usePayment } from '@/hooks/usePayments';
import { Payment } from '@/types';

interface PaymentDetailProps {
    paymentId: string;
}

const PaymentDetail: React.FC<PaymentDetailProps> = ({ paymentId }) => {
    const router = useRouter();
    const { payment, isLoading, error, deletePayment } = usePayment(paymentId);
    
    // UI 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // 정산 삭제 핸들러
    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await deletePayment();
            setSuccessMessage('정산이 삭제되었습니다.');
            setSuccess(true);
            setDeleteDialogOpen(false);
            
            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push('/payments');
            }, 3000);
        } catch (error) {
            console.error('Error deleting payment:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // 정산 상태별 칩 색상
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'default';
            case 'processing': return 'warning';
            case 'completed': return 'success';
            default: return 'default';
        }
    };

    // 정산 상태별 텍스트
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return '요청대기';
            case 'processing': return '처리중';
            case 'completed': return '완료';
            default: return status;
        }
    };

    // 결제 방법별 텍스트
    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'bank': return '계좌이체';
            case 'cash': return '현금';
            case 'other': return '기타';
            default: return method;
        }
    };

    // 수취인 유형별 텍스트
    const getReceiverTypeLabel = (type?: string) => {
        switch (type) {
            case 'foreman': return '작업반장';
            case 'driver': return '운송기사';
            default: return '정보 없음';
        }
    };

    // 작업 유형별 텍스트
    const getScheduleTypeLabel = (type: string) => {
        switch (type) {
            case 'pulling': return '뽑기';
            case 'cutting': return '자르기';
            case 'packing': return '포장';
            case 'transport': return '운송';
            default: return type;
        }
    };

    // 작업 유형별 칩 색상
    const getScheduleTypeColor = (type: string) => {
        switch (type) {
            case 'pulling': return 'primary';
            case 'cutting': return 'secondary';
            case 'packing': return 'success';
            case 'transport': return 'warning';
            default: return 'default';
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !payment) {
        return (
            <Alert severity="error">
                정산 정보를 불러오는 중 오류가 발생했습니다.
            </Alert>
        );
    }

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            {/* 헤더 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => router.push('/payments')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        정산 상세
                    </Typography>
                </Box>
                
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/payments/${paymentId}/edit`)}
                        sx={{ mr: 1 }}
                    >
                        수정
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        삭제
                    </Button>
                </Box>
            </Box>

            {/* 상태 표시 영역 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Chip 
                    label={getStatusLabel(payment.status)}
                    color={getStatusColor(payment.status)}
                    size="medium"
                />
                <Chip 
                    label={getMethodLabel(payment.method)}
                    variant="outlined"
                    size="medium"
                />
                <Chip 
                    label={`${payment.amount.toLocaleString()}원`}
                    color="primary"
                    size="medium"
                />
            </Box>

            {/* 정산 기본 정보 */}
            <Grid container spacing={3}>
                {/* 수취인 정보 */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ mb: 3, height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                수취인 정보
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    수취인
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {payment.receiverName || '정보 없음'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {getReceiverTypeLabel(payment.receiverType)}
                                </Typography>
                            </Box>
                            
                            {payment.method === 'bank' && payment.bankInfo && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                        <BankIcon sx={{ mr: 1, fontSize: 20 }} />
                                        계좌 정보
                                    </Typography>
                                    
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            은행명
                                        </Typography>
                                        <Typography variant="body1">
                                            {payment.bankInfo.bankName}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            계좌번호
                                        </Typography>
                                        <Typography variant="body1">
                                            {payment.bankInfo.accountNumber}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            예금주
                                        </Typography>
                                        <Typography variant="body1">
                                            {payment.bankInfo.accountHolder}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                
                {/* 정산 정보 */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ mb: 3, height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <MoneyIcon sx={{ mr: 1 }} />
                                정산 정보
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    정산 금액
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                    {payment.amount.toLocaleString()}원
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    결제 방법
                                </Typography>
                                <Typography variant="body1">
                                    {getMethodLabel(payment.method)}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    정산 일자
                                </Typography>
                                <Typography variant="body1">
                                    {format(payment.paymentDate, 'yyyy년 M월 d일(E)', { locale: ko })}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    정산 상태
                                </Typography>
                                <Chip 
                                    label={getStatusLabel(payment.status)}
                                    color={getStatusColor(payment.status)}
                                    size="small"
                                />
                            </Box>
                            
                            {payment.receiptImageUrl && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        영수증/증빙
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<ReceiptIcon />}
                                        onClick={() => window.open(payment.receiptImageUrl, '_blank')}
                                    >
                                        영수증 보기
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                
                {/* 정산 대상 작업 목록 */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon sx={{ mr: 1 }} />
                        정산 대상 작업 목록 ({payment.scheduleIds.length}개)
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {payment.scheduleDetails && payment.scheduleDetails.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                                        <TableCell>작업 유형</TableCell>
                                        <TableCell>작업 일자</TableCell>
                                        <TableCell>작업 내용</TableCell>
                                        <TableCell align="right">작업 상세</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payment.scheduleDetails.map((detail, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Chip 
                                                    size="small" 
                                                    label={getScheduleTypeLabel(detail.type)}
                                                    color={getScheduleTypeColor(detail.type)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {format(detail.date, 'yyyy-MM-dd', { locale: ko })}
                                            </TableCell>
                                            <TableCell>
                                                {detail.description}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="작업 상세 보기">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => router.push(`/schedules/${payment.scheduleIds[index]}`)}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            정산 대상 작업 정보가 없습니다.
                        </Alert>
                    )}
                </Grid>
                
                {/* 메모 */}
                {payment.memo && (
                    <Grid size={{ xs: 12 }}>
                        <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                    메모
                                </Typography>
                                <Typography variant="body1">
                                    {payment.memo}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
            
            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>정산 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        이 정산을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
                    <Button 
                        variant="contained" 
                        color="error" 
                        onClick={handleDelete}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={24} /> : '삭제'}
                    </Button>
                </DialogActions>
            </Dialog>
            
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
    );
};

export default PaymentDetail;