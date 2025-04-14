// src/components/cropTypes/CropTypeManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Alert, Snackbar, Chip,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Grass as GrassIcon
} from '@mui/icons-material';
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { CropTypeOption, useCropTypes } from '@/hooks/common/useCropTypes';

const CropTypeManagement: React.FC = () => {
    // 상태 관리
    const { cropTypes, addCropType } = useCropTypes();
    const [isLoading, setIsLoading] = useState(true);
    const [localCropTypes, setLocalCropTypes] = useState<CropTypeOption[]>([]);
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
    const [newCropTypeName, setNewCropTypeName] = useState('');
    const [editCropType, setEditCropType] = useState<{ id: string, name: string } | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    // cropTypes 훅에서 데이터가 로드되면 로컬 상태로 복사
    useEffect(() => {
        if (cropTypes.length > 0) {
            // 필요한 id 필드 추가
            const enhancedCropTypes = cropTypes.map(type => ({
                ...type,
                id: type.id || generateTempId(type.value)
            }));
            setLocalCropTypes(enhancedCropTypes);
            setIsLoading(false);
        }
    }, [cropTypes]);

    // 임시 ID 생성 함수
    const generateTempId = (value: string): string => {
        return `temp-${value}-${Date.now()}`;
    };

    // 데이터 로드 함수
    const loadCropTypes = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const db = getFirestore();
            const cropTypesCol = collection(db, 'cropTypes');
            const querySnapshot = await getDocs(cropTypesCol);

            const cropTypesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                value: doc.data().name,
                label: doc.data().name,
            }));

            setLocalCropTypes(cropTypesData);
        } catch (error) {
            console.error('작물 유형 로딩 오류:', error);
            setFetchError('데이터 로딩 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 새 작물 유형 추가 핸들러
    const handleAdd = async () => {
        if (!newCropTypeName.trim()) return;

        try {
            setIsAdding(true);
            await addCropType(newCropTypeName.trim());

            setNewCropTypeName('');
            setSuccessMessage('작물 유형이 성공적으로 추가되었습니다.');
            setShowSnackbar(true);

            // 데이터 다시 로드
            loadCropTypes();
        } catch (error) {
            console.error('Error adding crop type:', error);
            setSuccessMessage('작물 유형 추가 중 오류가 발생했습니다.');
            setShowSnackbar(true);
        } finally {
            setIsAdding(false);
            setShowAddDialog(false);
        }
    };

    // 작물 유형 수정 다이얼로그 표시
    const handleShowEditDialog = (id: string, name: string) => {
        setEditCropType({ id, name });
        setShowEditDialog(true);
    };

    // 작물 유형 수정 핸들러
    const handleEdit = async () => {
        if (!editCropType || !editCropType.name.trim()) return;

        try {
            setIsEditing(true);
            const db = getFirestore();

            // 임시 ID이면 update 대신 add 처리
            if (editCropType.id.startsWith('temp-')) {
                await addCropType(editCropType.name.trim());
            } else {
                const cropTypeRef = doc(db, 'cropTypes', editCropType.id);
                await updateDoc(cropTypeRef, {
                    name: editCropType.name,
                });
            }

            setSuccessMessage('작물 유형이 성공적으로 수정되었습니다.');
            setShowSnackbar(true);
            // 데이터 다시 로드
            loadCropTypes();
        } catch (error) {
            console.error('Error updating crop type:', error);
            setSuccessMessage('작물 유형 수정 중 오류가 발생했습니다.');
            setShowSnackbar(true);
        } finally {
            setIsEditing(false);
            setShowEditDialog(false);
            setEditCropType(null);
        }
    };


    // 작물 유형 삭제 확인 다이얼로그 표시
    const handleShowDeleteConfirm = (id: string, name: string) => {
        setDeleteTargetId(id);
        setDeleteTargetName(name);
        setShowConfirmDialog(true);
    };

    // 작물 유형 삭제 핸들러
    const handleDelete = async () => {
        if (!deleteTargetId) return;

        try {
            setIsDeleting(deleteTargetId);

            const db = getFirestore();
            const cropTypeRef = doc(db, 'cropTypes', deleteTargetId);
            await deleteDoc(cropTypeRef);

            setSuccessMessage('작물 유형이 성공적으로 삭제되었습니다.');
            setShowSnackbar(true);

            // 데이터 다시 로드
            loadCropTypes();
        } catch (error) {
            console.error('Error removing crop type:', error);
            setSuccessMessage('작물 유형 삭제 중 오류가 발생했습니다.');
            setShowSnackbar(true);
        } finally {
            setIsDeleting(null);
            setShowConfirmDialog(false);
            setDeleteTargetId(null);
        }
    };

    return (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">작물 유형 관리</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadCropTypes}
                        disabled={isLoading}
                        sx={{ mr: 1 }}
                    >
                        새로고침
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddDialog(true)}
                    >
                        새 작물 유형 추가
                    </Button>
                </Box>
            </Box>

            {fetchError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {fetchError}
                </Alert>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography>작물 유형 정보를 불러오는 중입니다...</Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>작물 유형명</TableCell>
                                <TableCell align="right">관리</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {localCropTypes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} align="center">
                                        등록된 작물 유형이 없습니다. 새 작물 유형을 추가해보세요.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                localCropTypes.map((cropType) => (
                                    <TableRow key={cropType.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Chip
                                                    icon={<GrassIcon />}
                                                    label={cropType.value}
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => cropType.id && handleShowEditDialog(cropType.id, cropType.value)}
                                                disabled={isEditing}
                                                sx={{ mr: 1 }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => cropType.id && handleShowDeleteConfirm(cropType.id, cropType.value)}
                                                disabled={isDeleting === cropType.id}
                                            >
                                                {isDeleting === cropType.id ? <CircularProgress size={24} /> : <DeleteIcon />}
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* 새 작물 유형 추가 다이얼로그 */}
            <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
                <DialogTitle>새 작물 유형 추가</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="작물 유형명"
                        fullWidth
                        value={newCropTypeName}
                        onChange={(e) => setNewCropTypeName(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddDialog(false)} color="inherit" disabled={isAdding}>
                        취소
                    </Button>
                    <Button
                        onClick={handleAdd}
                        color="primary"
                        disabled={isAdding || !newCropTypeName.trim()}
                        startIcon={isAdding ? <CircularProgress size={20} /> : null}
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 작물 유형 수정 다이얼로그 */}
            <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
                <DialogTitle>작물 유형 수정</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="작물 유형명"
                        fullWidth
                        value={editCropType?.name || ''}
                        onChange={(e) => setEditCropType(prev => prev ? { ...prev, name: e.target.value } : null)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditDialog(false)} color="inherit" disabled={isEditing}>
                        취소
                    </Button>
                    <Button
                        onClick={handleEdit}
                        color="primary"
                        disabled={isEditing || !editCropType?.name.trim()}
                        startIcon={isEditing ? <CircularProgress size={20} /> : null}
                    >
                        수정
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 작물 유형 삭제 확인 다이얼로그 */}
            <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
                <DialogTitle>작물 유형 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        '{deleteTargetName}' 작물 유형을 삭제하시겠습니까?
                    </Typography>
                    <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                        * 주의: 이 작물 유형을 사용하는 농지가 있을 경우 영향을 받을 수 있습니다.
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

export default CropTypeManagement;