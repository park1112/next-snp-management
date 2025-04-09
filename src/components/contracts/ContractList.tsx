// src/components/contracts/ContractList.tsx
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
    SelectChangeEvent,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { Contract } from '@/types';
import { useContracts } from '@/hooks/useContracts';
import { useConfirm } from '@/hooks/useConfirm';

interface ContractListProps {
    farmerId?: string;
}

const ContractList: React.FC<ContractListProps> = ({ farmerId }) => {
    const router = useRouter();
    const { confirm } = useConfirm();
    
    // useContracts 훅 사용
    const { 
        contracts, 
        isLoading, 
        error, 
        contractTypes, 
        deleteContract 
    } = useContracts(farmerId);

    // 상태 변수들
    const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage] = useState<number>(9);
    
    // 컨텍스트 메뉴 상태
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

    // 필터링 효과
    useEffect(() => {
        if (!contracts) return;
        
        let result = [...contracts];
        
        // 검색어 필터링
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            result = result.filter(contract => 
                contract.contractNumber?.toLowerCase().includes(lowerCaseSearchTerm) ||
                contract.farmerName?.toLowerCase().includes(lowerCaseSearchTerm) ||
                contract.fieldNames?.some(name => name.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }
        
        // 상태 필터링
        if (statusFilter) {
            result = result.filter(contract => contract.contractStatus === statusFilter);
        }
        
        // 유형 필터링
        if (typeFilter) {
            result = result.filter(contract => contract.contractType === typeFilter);
        }
        
        setFilteredContracts(result);
        setPage(1); // 필터링 시 첫 페이지로 리셋
    }, [contracts, searchTerm, statusFilter, typeFilter]);

    // 페이지네이션
    const paginatedContracts = React.useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredContracts.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredContracts, page, rowsPerPage]);

    // 페이지 변경 핸들러
    const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };
    
    // 필터 변경 핸들러
    const handleStatusChange = (event: SelectChangeEvent) => {
        setStatusFilter(event.target.value);
    };
    
    const handleTypeChange = (event: SelectChangeEvent) => {
        setTypeFilter(event.target.value);
    };
    
    // 컨텍스트 메뉴 핸들러
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, contractId: string) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedContractId(contractId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedContractId(null);
    };
    
    // 컨텍스트 메뉴 액션
    const handleViewContract = () => {
        if (selectedContractId) {
            router.push(`/contracts/${selectedContractId}`);
        }
        handleMenuClose();
    };

    const handleEditContract = () => {
        if (selectedContractId) {
            router.push(`/contracts/${selectedContractId}/edit`);
        }
        handleMenuClose();
    };

    const handleDeleteContract = async () => {
        if (selectedContractId) {
            const isConfirmed = await confirm({
                title: '계약 삭제',
                message: '이 계약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                confirmText: '삭제',
                cancelText: '취소',
                confirmColor: 'error'
            });
            
            if (isConfirmed) {
                try {
                    await deleteContract(selectedContractId);
                    // 성공 메시지는 useConfirm 훅에서 처리
                } catch (error) {
                    console.error('Error deleting contract:', error);
                }
            }
        }
        handleMenuClose();
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
                <Typography color="error">오류가 발생했습니다: {error.message}</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* 헤더 및 액션 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    계약 관리
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(farmerId ? `/contracts/add?farmerId=${farmerId}` : '/contracts/add')}
                >
                    계약 등록
                </Button>
            </Box>

            {/* 검색 및 필터 */}
            <Card elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="계약번호 또는 농가명 검색..."
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
                                <InputLabel>계약 상태</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="계약 상태"
                                    onChange={handleStatusChange}
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    <MenuItem value="pending">예정</MenuItem>
                                    <MenuItem value="active">진행중</MenuItem>
                                    <MenuItem value="completed">완료</MenuItem>
                                    <MenuItem value="cancelled">취소</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>계약 유형</InputLabel>
                                <Select
                                    value={typeFilter}
                                    label="계약 유형"
                                    onChange={handleTypeChange}
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    {contractTypes.map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 결과 카운트 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    총 {filteredContracts.length}개의 계약
                </Typography>
            </Box>

            {/* 결과 없음 */}
            {filteredContracts.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {contracts.length === 0
                            ? '등록된 계약이 없습니다.'
                            : '검색 결과가 없습니다.'}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push(farmerId ? `/contracts/add?farmerId=${farmerId}` : '/contracts/add')}
                    >
                        계약 등록
                    </Button>
                </Box>
            )}

            {/* 계약 목록 */}
            {filteredContracts.length > 0 && (
                <Grid container spacing={2}>
                    {paginatedContracts.map((contract) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={contract.id}>
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
                                onClick={() => router.push(`/contracts/${contract.id}`)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            계약 #{contract.contractNumber}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            sx={{
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease-in-out',
                                            }}
                                            className="actionButton"
                                            onClick={(e) => handleMenuOpen(e, contract.id)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            농가
                                        </Typography>
                                        <Typography variant="body1">
                                            {contract.farmerName || '알 수 없음'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            계약일
                                        </Typography>
                                        <Typography variant="body1">
                                            {contract.contractDate.toLocaleDateString('ko-KR')}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            계약금액
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {contract.totalAmount?.toLocaleString()}원
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            다음 납부
                                        </Typography>
                                        <Typography variant="body1">
                                            {contract.contractStatus === 'completed' ? 
                                                '완납' : 
                                                contract.downPayment?.status === 'unpaid' ? 
                                                    `계약금: ${contract.downPayment.amount.toLocaleString()}원` :
                                                contract.intermediatePayments?.some(p => p.status === 'unpaid') ?
                                                    `중도금: ${contract.intermediatePayments.find(p => p.status === 'unpaid')?.amount.toLocaleString()}원` :
                                                contract.finalPayment?.status === 'unpaid' ?
                                                    `잔금: ${contract.finalPayment.amount.toLocaleString()}원` :
                                                    '없음'
                                            }
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Chip
                                            size="small"
                                            label={{
                                                pending: '예정',
                                                active: '진행중',
                                                completed: '완료',
                                                cancelled: '취소'
                                            }[contract.contractStatus] || '알 수 없음'}
                                            color={getStatusColor(contract.contractStatus)}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            {contract.contractType || '일반'}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* 페이지네이션 */}
            {filteredContracts.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={Math.ceil(filteredContracts.length / rowsPerPage)}
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
                <MenuItem onClick={handleViewContract}>
                    <ListItemIcon>
                        <ViewIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>상세 보기</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEditContract}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>수정</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteContract} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>삭제</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default ContractList;