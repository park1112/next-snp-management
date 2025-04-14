// src/components/workTypes/WorkTypeManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Alert, Snackbar, FormControl, InputLabel,
    Select, MenuItem, Grid, Chip, InputAdornment, Tabs, Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, serverTimestamp, getFirestore, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


interface WorkType {
    id: string;
    name: string;
    workerType: string;
    defaultRate: number;
    rateUnit: string;
    createdBy: string;
    createdAt: Date;
}

const WorkTypeManagement: React.FC = () => {
    // 상태 관리
    const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [workerTypeFilter, setWorkerTypeFilter] = useState<string>('foreman');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // 폼 상태
    const [newWorkType, setNewWorkType] = useState({
        name: '',
        workerType: 'foreman',
        defaultRate: 0,
        rateUnit: '시간'
    });
    const [editWorkType, setEditWorkType] = useState<WorkType | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    // 단위 옵션
    const rateUnitOptions = [
        { value: '시간', label: '시간' },
        { value: '일', label: '일' },
        { value: '건', label: '건' },
        { value: '회', label: '회' },
    ];

    // 작업자 유형 옵션
    const workerTypeOptions = [
        { value: 'foreman', label: '작업반장' },
        { value: 'driver', label: '운전기사' },
    ];

    // 데이터 로드 함수
    const loadWorkTypes = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const db = getFirestore();
            const workTypesCol = collection(db, 'workTypes');

            // 선택된 작업자 유형에 따라 필터링
            const q = query(workTypesCol, where('workerType', '==', workerTypeFilter));
            const querySnapshot = await getDocs(q);

            const workTypesData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '이름 없음',
                    workerType: data.workerType || 'foreman',
                    defaultRate: data.defaultRate || 0,
                    rateUnit: data.rateUnit || '시간',
                    createdBy: data.createdBy || '작성자 없음',
                    createdAt: data.createdAt?.toDate() || new Date(),
                } as WorkType;
            });

            setWorkTypes(workTypesData);
        } catch (error) {
            console.error('업무 유형 로딩 오류:', error);
            setFetchError('데이터 로딩 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 작업자 유형 변경 시 데이터 다시 로드
    useEffect(() => {
        loadWorkTypes();
    }, [workerTypeFilter]);

    // 새 업무 유형 추가 핸들러
    const handleAdd = async () => {
        if (!newWorkType.name.trim()) return;

        try {
            setIsAdding(true);

            const db = getFirestore();
            const workTypesCol = collection(db, 'workTypes');
            const auth = getAuth();
            const user = auth.currentUser;
            const userId = user ? user.uid : 'anonymous-user';

            const newWorkTypeData = {
                name: newWorkType.name,
                workerType: newWorkType.workerType,
                defaultRate: newWorkType.defaultRate,
                rateUnit: newWorkType.rateUnit,
                createdBy: userId,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(workTypesCol, newWorkTypeData);
            console.log(`새 업무 유형 추가됨: ${newWorkType.name}, ID: ${docRef.id}`);

            // 폼 초기화
            setNewWorkType({
                name: '',
                workerType: workerTypeFilter,
                defaultRate: 0,
                rateUnit: '시간'
            });

            setSuccessMessage('업무 유형이 성공적으로 추가되었습니다.');
            setShowSnackbar(true);

            // 데이터 다시 로드
            loadWorkTypes();
        } catch (error) {
            console.error('Error adding work type:', error);
            setSuccessMessage('업무 유형 추가 중 오류가 발생했습니다.');
            setShowSnackbar(true);
        } finally {
            setIsAdding(false);
            setShowAddDialog(false);
        }
    };

    // 업무 유형 수정 다이얼로그 표시
    const handleShowEditDialog = (workType: WorkType) => {
        setEditWorkType(workType);
        setShowEditDialog(true);
    };

    // 업무 유형 수정 핸들러
    const handleEdit = async () => {
        if (!editWorkType || !editWorkType.name.trim()) return;

        try {
            setIsEditing(true);

            const db = getFirestore();
            const workTypeRef = doc(db, 'workTypes', editWorkType.id);

            await updateDoc(workTypeRef, {
                name: editWorkType.name,
                defaultRate: editWorkType.defaultRate,
                rateUnit: editWorkType.rateUnit,
            });

            setSuccessMessage('업무 유형이 성공적으로 수정되었습니다.');
            setShowSnackbar(true);

            // 데이터 다시 로드
            loadWorkTypes();
        } catch (error) {
            console.error('Error updating work type:', error);
            setSuccessMessage('업무 유형 수정 중 오류가 발생했습니다.');
            setShowSnackbar(true);
        } finally {
            setIsEditing(false);
            setShowEditDialog(false);
            setEditWorkType(null);
        }
    };

    // 업무 유형 삭제 확인 다이얼로그 표시
    const handleShowDeleteConfirm = (id: string, name: string) => {
        setDeleteTargetId(id);
        setDeleteTargetName(name);
        setShowConfirmDialog(true);
    };

    // 업무 유형 삭제 핸들러
    const handleDelete = async () => {
        if (!deleteTargetId) return;

        try {
            setIsDeleting(deleteTargetId);

            const db = getFirestore();
            const workTypeRef = doc(db, 'workTypes', deleteTargetId);
            await deleteDoc(workTypeRef);

            setSuccessMessage('업무 유형이 성공적으로 삭제되었습니다.');
            setShowSnackbar(true);

            // 데이터 다시 로드
            loadWorkTypes();
        } catch (error) {
            console.error('Error removing work type:', error);
            setSuccessMessage('업무 유형 삭제 중 오류가 발생했습니다.');
            setShowSnackbar(true);
        } finally {
            setIsDeleting(null);
            setShowConfirmDialog(false);
            setDeleteTargetId(null);
        }
    };

    // 새 업무 추가 다이얼로그 열기
    const handleOpenAddDialog = () => {
        setNewWorkType({
            name: '',
            workerType: workerTypeFilter,
            defaultRate: 0,
            rateUnit: '시간'
        });
        setShowAddDialog(true);
    };

    // 작업자 유형 필터 변경 핸들러
    const handleWorkerTypeChange = (event: React.SyntheticEvent, newValue: string) => {
        setWorkerTypeFilter(newValue);
    };

    return (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">업무 유형 관리</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadWorkTypes}
                        disabled={isLoading}
                        sx={{ mr: 1 }}
                    >
                        새로고침
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddDialog}
                    >
                        새 업무 유형 추가
                    </Button>
                </Box>
            </Box>

            {/* 작업자 유형 필터 탭 */}
            <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={workerTypeFilter}
                    onChange={handleWorkerTypeChange}
                    aria-label="작업자 유형 필터"
                >
                    <Tab
                        label="작업반장"
                        value="foreman"
                        id="tab-foreman"
                        aria-controls="tabpanel-foreman"
                    />
                    <Tab
                        label="운전기사"
                        value="driver"
                        id="tab-driver"
                        aria-controls="tabpanel-driver"
                    />
                </Tabs>
            </Box>

            {fetchError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {fetchError}
                </Alert>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography>업무 유형 정보를 불러오는 중입니다...</Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>업무 유형명</TableCell>
                                <TableCell align="center">기본 단가</TableCell>
                                <TableCell align="center">단위</TableCell>
                                <TableCell align="right">생성일</TableCell>
                                <TableCell align="right">관리</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {workTypes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        등록된 업무 유형이 없습니다. 새 업무 유형을 추가해보세요.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                workTypes.map((workType) => (
                                    <TableRow key={workType.id}>
                                        <TableCell>{workType.name}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={<MoneyIcon />}
                                                label={`${workType.defaultRate.toLocaleString()}원`}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={workType.rateUnit}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {workType.createdAt.toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleShowEditDialog(workType)}
                                                disabled={isEditing}
                                                sx={{ mr: 1 }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleShowDeleteConfirm(workType.id, workType.name)}
                                                disabled={isDeleting === workType.id}
                                            >
                                                {isDeleting === workType.id ? <CircularProgress size={24} /> : <DeleteIcon />}
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* 새 업무 유형 추가 다이얼로그 */}
            <Dialog
                open={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>새 업무 유형 추가</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                autoFocus
                                label="업무 유형명"
                                fullWidth
                                value={newWorkType.name}
                                onChange={(e) => setNewWorkType({ ...newWorkType, name: e.target.value })}
                                margin="normal"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>작업자 유형</InputLabel>
                                <Select
                                    value={newWorkType.workerType}
                                    onChange={(e) => setNewWorkType({ ...newWorkType, workerType: e.target.value })}
                                    label="작업자 유형"
                                >
                                    {workerTypeOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>단위</InputLabel>
                                <Select
                                    value={newWorkType.rateUnit}
                                    onChange={(e) => setNewWorkType({ ...newWorkType, rateUnit: e.target.value })}
                                    label="단위"
                                >
                                    {rateUnitOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="기본 단가"
                                fullWidth
                                type="number"
                                value={newWorkType.defaultRate}
                                onChange={(e) => setNewWorkType({ ...newWorkType, defaultRate: parseInt(e.target.value) || 0 })}
                                margin="normal"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddDialog(false)} color="inherit" disabled={isAdding}>
                        취소
                    </Button>
                    <Button
                        onClick={handleAdd}
                        color="primary"
                        disabled={isAdding || !newWorkType.name.trim()}
                        startIcon={isAdding ? <CircularProgress size={20} /> : null}
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 업무 유형 수정 다이얼로그 */}
            <Dialog
                open={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>업무 유형 수정</DialogTitle>
                <DialogContent>
                    {editWorkType && (
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    autoFocus
                                    label="업무 유형명"
                                    fullWidth
                                    value={editWorkType.name}
                                    onChange={(e) => setEditWorkType({ ...editWorkType, name: e.target.value })}
                                    margin="normal"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth margin="normal" disabled>
                                    <InputLabel>작업자 유형</InputLabel>
                                    <Select
                                        value={editWorkType.workerType}
                                        label="작업자 유형"
                                    >
                                        {workerTypeOptions.map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>단위</InputLabel>
                                    <Select
                                        value={editWorkType.rateUnit}
                                        onChange={(e) => setEditWorkType({ ...editWorkType, rateUnit: e.target.value })}
                                        label="단위"
                                    >
                                        {rateUnitOptions.map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="기본 단가"
                                    fullWidth
                                    type="number"
                                    value={editWorkType.defaultRate}
                                    onChange={(e) => setEditWorkType({ ...editWorkType, defaultRate: parseInt(e.target.value) || 0 })}
                                    margin="normal"
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                    }}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditDialog(false)} color="inherit" disabled={isEditing}>
                        취소
                    </Button>
                    <Button
                        onClick={handleEdit}
                        color="primary"
                        disabled={isEditing || !editWorkType?.name.trim()}
                        startIcon={isEditing ? <CircularProgress size={20} /> : null}
                    >
                        수정
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 업무 유형 삭제 확인 다이얼로그 */}
            <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
                <DialogTitle>업무 유형 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        '{deleteTargetName}' 업무 유형을 삭제하시겠습니까?
                    </Typography>
                    <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                        * 주의: 이 업무 유형을 사용하는 작업자가 있을 경우 영향을 받을 수 있습니다.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmDialog(false)} color="inherit">
                        취소
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        disabled={isDeleting !== null}
                        startIcon={isDeleting ? <CircularProgress size={20} /> : null}
                    >
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 알림 스낵바 */}
            <Snackbar
                open={showSnackbar}
                autoHideDuration={3000}
                onClose={() => setShowSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowSnackbar(false)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default WorkTypeManagement;