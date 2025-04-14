'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  InputAdornment,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Pagination,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';
import { Payment } from '@/types';
import { usePayments } from '@/hooks/usePayments';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PaymentListProps {
  workerId?: string;
  mode?: 'card' | 'table';
}

const PaymentList: React.FC<PaymentListProps> = ({ workerId, mode = 'card' }) => {
  const router = useRouter();

  // usePayments 훅 사용 (workerId가 전달되면 해당 작업자에 속한 정산만 불러옵니다)
  const { payments, isLoading, error, deletePayment } = usePayments(workerId);

  // 상태 변수들
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);

  // 컨텍스트 메뉴 상태
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);


  // 필터링 효과: 검색어, 정산 상태, 결제 방법에 따라 payments 배열 필터링
  useEffect(() => {
    let result = [...payments];

    if (searchTerm) {
      result = result.filter((payment) =>
        payment.receiverName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      result = result.filter((payment) => payment.status === statusFilter);
    }
    if (methodFilter) {
      result = result.filter((payment) => payment.method === methodFilter);
    }
    setFilteredPayments(result);
    setPage(1);
  }, [payments, searchTerm, statusFilter, methodFilter]);

  // 페이지네이션 처리
  const paginatedPayments = React.useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredPayments.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPayments, page, rowsPerPage]);

  const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // 컨텍스트 메뉴 핸들러
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, paymentId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedPaymentId(paymentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPaymentId(null);
  };

  const handleViewPayment = () => {
    if (selectedPaymentId) {
      router.push(`/payments/${selectedPaymentId}`);
    }
    handleMenuClose();
  };

  const handleEditPayment = () => {
    if (selectedPaymentId) {
      router.push(`/payments/${selectedPaymentId}/edit`);
    }
    handleMenuClose();
  };

  const handleDeletePayment = async () => {
    if (selectedPaymentId) {
      try {
        await deletePayment(selectedPaymentId);
        // 필요한 경우 삭제 성공 메시지를 추가할 수 있음.
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
    handleMenuClose();
  };

  // 헬퍼 함수: 정산 상태에 따른 칩 색상 및 텍스트, 결제 방법, 수취인 유형 등
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'processing': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '요청대기';
      case 'processing': return '처리중';
      case 'completed': return '완료';
      default: return status;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank': return '계좌이체';
      case 'cash': return '현금';
      case 'other': return '기타';
      default: return method;
    }
  };

  const getReceiverTypeLabel = (type?: string) => {
    switch (type) {
      case 'foreman': return '작업반장';
      case 'driver': return '운송기사';
      default: return '정보 없음';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">오류가 발생했습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 헤더 및 액션 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          정산 관리
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() =>
              router.push(workerId ? `/payments/add?workerId=${workerId}` : '/payments/add')
            }
            sx={{ mr: 1 }}
          >
            정산 등록
          </Button>
          {/* 필요에 따라 카드 / 테이블 모드를 토글하는 버튼을 추가할 수 있습니다. */}
        </Box>
      </Box>

      {/* 검색 및 필터 */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="수취인 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>정산 상태</InputLabel>
                <Select
                  value={statusFilter}
                  label="정산 상태"
                  onChange={(e) => setStatusFilter(e.target.value as string)}
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="pending">요청대기</MenuItem>
                  <MenuItem value="processing">처리중</MenuItem>
                  <MenuItem value="completed">완료</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>결제 방법</InputLabel>
                <Select
                  value={methodFilter}
                  label="결제 방법"
                  onChange={(e) => setMethodFilter(e.target.value as string)}
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="bank">계좌이체</MenuItem>
                  <MenuItem value="cash">현금</MenuItem>
                  <MenuItem value="other">기타</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 결과 카운트 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          총 {filteredPayments.length}개의 정산
        </Typography>
      </Box>

      {/* 결과 없음 */}
      {filteredPayments.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {payments.length === 0
              ? '등록된 정산 내역이 없습니다.'
              : '검색 결과가 없습니다.'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() =>
              router.push(workerId ? `/payments/add?workerId=${workerId}` : '/payments/add')
            }
          >
            정산 등록
          </Button>
        </Box>
      )}

      {/* 카드 뷰 */}
      {mode === 'card' && filteredPayments.length > 0 && (
        <Grid container spacing={2}>
          {paginatedPayments.map((payment) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={payment.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  position: 'relative',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    '& .actionButton': {
                      opacity: 1,
                    },
                  },
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/payments/${payment.id}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Chip
                      size="small"
                      label={getStatusLabel(payment.status)}
                      color={getStatusColor(payment.status)}
                      sx={{ mb: 1 }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s ease-in-out',
                      }}
                      className="actionButton"
                      onClick={(e) => handleMenuOpen(e, payment.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                      수취인
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {payment.receiverName || '정보 없음'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getReceiverTypeLabel(payment.receiverType)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                      정산 금액
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {payment.amount.toLocaleString()}원
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />
                      결제 방법
                    </Typography>
                    <Typography variant="body1">
                      {getMethodLabel(payment.method)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      정산 일자
                    </Typography>
                    <Typography variant="body1">
                      {format(payment.paymentDate, 'yyyy년 M월 d일', { locale: ko })}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      작업 수: {payment.scheduleIds.length}개
                    </Typography>
                    {payment.method === 'bank' && payment.bankInfo && (
                      <Tooltip title={`${payment.bankInfo.bankName} ${payment.bankInfo.accountNumber}`}>
                        <BankIcon fontSize="small" color="action" />
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 테이블 뷰 */}
      {mode === 'table' && filteredPayments.length > 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="payments table">
            <TableHead>
              <TableRow sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                <TableCell>상태</TableCell>
                <TableCell>수취인</TableCell>
                <TableCell>정산 금액</TableCell>
                <TableCell>결제 방법</TableCell>
                <TableCell>정산 일자</TableCell>
                <TableCell>작업 수</TableCell>
                <TableCell align="right">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPayments.map((payment) => (
                <TableRow
                  key={payment.id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    }
                  }}
                  onClick={() => router.push(`/payments/${payment.id}`)}
                >
                  <TableCell>
                    <Chip
                      size="small"
                      label={getStatusLabel(payment.status)}
                      color={getStatusColor(payment.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {payment.receiverName || '정보 없음'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getReceiverTypeLabel(payment.receiverType)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {payment.amount.toLocaleString()}원
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {payment.method === 'bank' ? (
                        <BankIcon fontSize="small" sx={{ mr: 0.5 }} />
                      ) : (
                        <MoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                      )}
                      <Typography>{getMethodLabel(payment.method)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {format(payment.paymentDate, 'yyyy-MM-dd', { locale: ko })}
                  </TableCell>
                  <TableCell>{payment.scheduleIds.length}개</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, payment.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {filteredPayments.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(filteredPayments.length / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
          />
        </Box>
      )}

      {/* 컨텍스트 메뉴 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, width: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
        }}
      >
        <MenuItem onClick={handleViewPayment}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="상세 보기" />
        </MenuItem>
        <MenuItem onClick={handleEditPayment}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="수정" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeletePayment} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="삭제" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PaymentList;
