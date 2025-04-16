'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Divider,
    Alert,
    Snackbar,
    Card,
    CardContent,
    CardActions,
    Grid,
    InputAdornment,
    Chip,
    List,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Money as MoneyIcon
} from '@mui/icons-material';
import { useCategory, useCategories } from '@/hooks/common/useCategories';
import { Rate } from '@/types';

const CategoryDetailPage: React.FC = () => {
    const params = useParams();
    const categoryId = params.id as string;
    const router = useRouter();

    const {
        category,
        isLoading,
        error,
    } = useCategory(categoryId);

    const {
        addRateToCategory,
        updateRateInCategory,
        deleteRateFromCategory
    } = useCategories();

    // 상태 관리
    const [editRateId, setEditRateId] = useState<string | null>(null);
    const [showAddRateDialog, setShowAddRateDialog] = useState(false);
    const [showDeleteRateDialog, setShowDeleteRateDialog] = useState(false);
    const [rateToDelete, setRateToDelete] = useState<Rate | null>(null);
    const [newRate, setNewRate] = useState<{
        name: string;
        description: string;
        defaultPrice: number;
        unit: string;
    }>({
        name: '',
        description: '',
        defaultPrice: 0,
        unit: '개'
    });
    const [editRate, setEditRate] = useState<Rate | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // 세부 작업 추가 핸들러
    const handleAddRate = async () => {
        if (!newRate.name.trim()) return;

        try {
            await addRateToCategory(categoryId, newRate);
            setNewRate({
                name: '',
                description: '',
                defaultPrice: 0,
                unit: '개'
            });
            setShowAddRateDialog(false);
            setSuccessMessage('세부 작업이 성공적으로 추가되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error adding rate:', error);
        }
    };

    // 세부 작업 수정 핸들러
    const handleUpdateRate = async () => {
        if (!editRate || !editRate.name.trim()) return;

        try {
            await updateRateInCategory(categoryId, editRate.id, {
                name: editRate.name,
                description: editRate.description,
                defaultPrice: editRate.defaultPrice,
                unit: editRate.unit
            });
            setEditRate(null);
            setEditRateId(null);
            setSuccessMessage('세부 작업이 성공적으로 수정되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error updating rate:', error);
        }
    };

    // 세부 작업 삭제 핸들러
    const handleDeleteRate = async () => {
        if (!rateToDelete) return;

        try {
            await deleteRateFromCategory(categoryId, rateToDelete.id);
            setRateToDelete(null);
            setShowDeleteRateDialog(false);
            setSuccessMessage('세부 작업이 성공적으로 삭제되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error deleting rate:', error);
        }
    };


    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !category) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    카테고리 정보를 불러오는 중 오류가 발생했습니다.
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/categories')}
                    sx={{ mt: 2 }}
                >
                    목록으로 돌아가기
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => router.push('/categories')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight="bold">
                    {category.name} 카테고리 상세
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <MoneyIcon sx={{ mr: 1 }} />
                                세부 작업 및 단가 관리
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setShowAddRateDialog(true)}
                            >
                                세부 작업 추가
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        {category.rates && category.rates.length > 0 ? (
                            <List>
                                {category.rates.map(rate => (
                                    <Card key={rate.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <CardContent>
                                            {editRateId === rate.id ? (
                                                <Box>
                                                    <TextField
                                                        fullWidth
                                                        label="작업 이름"
                                                        value={editRate?.name || ''}
                                                        onChange={(e) => setEditRate(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                        sx={{ mb: 2 }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="작업 설명"
                                                        value={editRate?.description || ''}
                                                        onChange={(e) => setEditRate(prev => prev ? { ...prev, description: e.target.value } : null)}
                                                        sx={{ mb: 2 }}
                                                    />
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <TextField
                                                            label="기본 단가"
                                                            type="number"
                                                            value={editRate?.defaultPrice || 0}
                                                            onChange={(e) => {
                                                                const value = parseFloat(e.target.value);
                                                                if (!isNaN(value) && value >= 0) {
                                                                    setEditRate(prev => prev ? { ...prev, defaultPrice: value } : null);
                                                                }
                                                            }}
                                                            InputProps={{
                                                                endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                                                inputProps: { min: 0 }
                                                            }}
                                                            sx={{ width: '50%' }}
                                                        />
                                                        <TextField
                                                            label="단위"
                                                            value={editRate?.unit || '개'}
                                                            onChange={(e) => setEditRate(prev => prev ? { ...prev, unit: e.target.value } : null)}
                                                            sx={{ width: '50%' }}
                                                        />
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <>
                                                    <Typography variant="h6" gutterBottom>
                                                        {rate.name}
                                                        <Chip
                                                            label={`${rate.defaultPrice.toLocaleString()}원/${rate.unit}`}
                                                            size="small"
                                                            color="primary"
                                                            sx={{ ml: 2 }}
                                                        />
                                                    </Typography>
                                                    {rate.description && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                            {rate.description}
                                                        </Typography>
                                                    )}
                                                </>
                                            )}
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                                            {editRateId === rate.id ? (
                                                <>
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            setEditRateId(null);
                                                            setEditRate(null);
                                                        }}
                                                    >
                                                        취소
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="primary"
                                                        onClick={handleUpdateRate}
                                                        disabled={!editRate?.name?.trim()}
                                                    >
                                                        저장
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditRateId(rate.id);
                                                            setEditRate(rate);
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setRateToDelete(rate);
                                                            setShowDeleteRateDialog(true);
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </>
                                            )}
                                        </CardActions>
                                    </Card>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                    등록된 세부 작업이 없습니다.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowAddRateDialog(true)}
                                    sx={{ mt: 2 }}
                                >
                                    세부 작업 추가
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* 다이얼로그 - 세부 작업 추가 */}
            <Dialog open={showAddRateDialog} onClose={() => setShowAddRateDialog(false)}>
                <DialogTitle>세부 작업 추가</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="작업 이름"
                        fullWidth
                        value={newRate.name}
                        onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="설명 (선택사항)"
                        fullWidth
                        value={newRate.description}
                        onChange={(e) => setNewRate({ ...newRate, description: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            margin="dense"
                            label="기본 단가"
                            type="number"
                            fullWidth
                            value={newRate.defaultPrice || ''}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value >= 0) {
                                    setNewRate({ ...newRate, defaultPrice: value });
                                }
                            }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                inputProps: { min: 0 }
                            }}
                        />
                        <TextField
                            margin="dense"
                            label="단위"
                            fullWidth
                            value={newRate.unit}
                            onChange={(e) => setNewRate({ ...newRate, unit: e.target.value })}
                            placeholder="개, 시간, kg 등"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddRateDialog(false)}>
                        취소
                    </Button>
                    <Button
                        onClick={handleAddRate}
                        color="primary"
                        disabled={!newRate.name.trim()}
                        startIcon={<SaveIcon />}
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 다이얼로그 - 세부 작업 삭제 */}
            <Dialog open={showDeleteRateDialog} onClose={() => setShowDeleteRateDialog(false)}>
                <DialogTitle>세부 작업 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        &apos;{rateToDelete?.name}&apos; 작업을 삭제하시겠습니까?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        이 작업을 삭제하면 해당 작업과 연관된 가격 정보도 함께 삭제됩니다.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteRateDialog(false)}>취소</Button>
                    <Button
                        onClick={handleDeleteRate}
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        삭제
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
        </Box>
    );
};

export default CategoryDetailPage;