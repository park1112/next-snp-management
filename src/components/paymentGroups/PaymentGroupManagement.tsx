'use client';

// src/components/paymentGroups/PaymentGroupManagement.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Alert, Snackbar,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import PaymentGroupInitializer from '@/utils/PaymentGroupInitializer';
import { PaymentGroup } from '@/services/firebase/paymentGroupService';

const PaymentGroupManagement: React.FC = () => {
    const [paymentGroups, setPaymentGroups] = useState<PaymentGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newGroupName, setNewGroupName] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // 수정 관련 상태 추가
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editGroupId, setEditGroupId] = useState<string>('');
    const [editGroupName, setEditGroupName] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    // 데이터 로드 함수
    const loadPaymentGroups = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const db = getFirestore();
            const paymentGroupsCol = collection(db, 'paymentGroups');
            const querySnapshot = await getDocs(paymentGroupsCol);

            console.log('직접 조회 결과:', querySnapshot.docs.length);

            const paymentGroupsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '이름 없음',
                    createdBy: data.createdBy || '작성자 없음',
                    createdAt: data.createdAt?.toDate() || new Date(),
                } as PaymentGroup;
            });

            setPaymentGroups(paymentGroupsData);
        } catch (error) {
            console.error('결제소속 로딩 오류:', error);
            setFetchError('데이터 로딩 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadPaymentGroups();
    }, []);

    // 결제소속 추가 핸들러
    const handleAdd = async () => {
        if (!newGroupName.trim()) return;

        try {
            setIsAdding(true);

            const db = getFirestore();
            const paymentGroupsCol = collection(db, 'paymentGroups');
            const auth = getAuth();
            const user = auth.currentUser;
            const userId = user ? user.uid : 'anonymous-user';

            const newPaymentGroup = {
                name: newGroupName,
                createdBy: userId,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(paymentGroupsCol, newPaymentGroup);
            console.log(`새 결제소속 추가됨: ${newGroupName}, ID: ${docRef.id}`);

            setNewGroupName('');
            setSuccessMessage('결제소속이 성공적으로 추가되었습니다.');
            setShowSnackbar(true);

            // 데이터 다시 로드
            loadPaymentGroups();
        } catch (error) {
            console.error('Error adding payment group:', error);
            setSuccessMessage('결제소속 추가 중 오류가 발생했습니다.');
            setShowSnackbar(true);
        } finally {
            setIsAdding(false);
            setShowAddDialog(false);
        }
    };

    // 결제소속 수정 다이얼로그 열기
    const handleShowEditDialog = (id: string, name: string) => {
        setEditGroupId(id);
        setEditGroupName(name);
        setShowEditDialog(true);
    };

    // 결제소속 수정 핸들러
    const handleEdit = async () => {
        if (!editGroupName.trim()) return;

        try {
            setIsEditing(true);

            const db = getFirestore();
            const paymentGroupRef = doc(db, 'paymentGroups', editGroupId);
            await updateDoc(paymentGroupRef, {
                name: editGroupName,
            });

            setSuccessMessage('결제소속이 성공적으로 수정되었습니다.');
            setShowSnackbar(true);

            // 데이터 다시 로드
            loadPaymentGroups();
        } catch (error) {
            console.error('Error updating payment group:', error);
            setSuccessMessage('결제소속 수정 중 오류가 발생했습니다.');
            setShowSnackbar(true);
        } finally {
            setIsEditing(false);
            setShowEditDialog(false);
        }
    };

    // 결제소속 삭제 확인 다이얼로그 표시
    const handleShowDeleteConfirm = (id: string, name: string) => {
        setDeleteTargetId(id);
        setDeleteTargetName(name);
        setShowConfirmDialog(true);
    };

    // 결제소속 삭제 핸들러
    const handleDelete = async () => {
        if (!deleteTargetId) return;

        try {
            setIsDeleting(deleteTargetId);

            const db = getFirestore();
            const paymentGroupRef = doc(db, 'paymentGroups', deleteTargetId);
            await deleteDoc(paymentGroupRef);

            setSuccessMessage('결제소속이 성공적으로 삭제되었습니다.');
            setShowSnackbar(true);

            // 데이터 다시 로드
            loadPaymentGroups();
        } catch (error) {
            console.error('Error removing payment group:', error);
            setSuccessMessage('결제소속 삭제 중 오류가 발생했습니다.');
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
                <Typography variant="h5" fontWeight="bold">결제소속 관리</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadPaymentGroups}
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
                        새 결제소속 추가
                    </Button>
                </Box>
            </Box>

            <PaymentGroupInitializer />

            {fetchError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {fetchError}
                </Alert>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography>결제소속 정보를 불러오는 중입니다...</Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>결제소속명</TableCell>
                                <TableCell align="right">생성일</TableCell>
                                <TableCell align="right">관리</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paymentGroups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        등록된 결제소속이 없습니다. 새 결제소속을 추가해보세요.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paymentGroups.map((group) => (
                                    <TableRow key={group.id}>
                                        <TableCell>{group.name}</TableCell>
                                        <TableCell align="right">
                                            {group.createdAt instanceof Date
                                                ? group.createdAt.toLocaleDateString()
                                                : new Date(group.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleShowEditDialog(group.id, group.name)}
                                                disabled={isEditing}
                                                sx={{ mr: 1 }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleShowDeleteConfirm(group.id, group.name)}
                                                disabled={isDeleting === group.id}
                                            >
                                                {isDeleting === group.id ? <CircularProgress size={24} /> : <DeleteIcon />}
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* 새 결제소속 추가 다이얼로그 */}
            <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
                <DialogTitle>새 결제소속 추가</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="결제소속명"
                        fullWidth
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
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
                        disabled={isAdding || !newGroupName.trim()}
                        startIcon={isAdding ? <CircularProgress size={20} /> : null}
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 결제소속 수정 다이얼로그 */}
            <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
                <DialogTitle>결제소속 수정</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="결제소속명"
                        fullWidth
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
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
                        disabled={isEditing || !editGroupName.trim()}
                        startIcon={isEditing ? <CircularProgress size={20} /> : null}
                    >
                        수정
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 결제소속 삭제 확인 다이얼로그 */}
            <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
                <DialogTitle>결제소속 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        '{deleteTargetName}' 결제소속을 삭제하시겠습니까?
                    </Typography>
                    <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                        * 주의: 이 결제소속을 사용하는 농가가 있을 경우 영향을 받을 수 있습니다.
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

export default PaymentGroupManagement;