'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, CircularProgress, Alert, Paper, Typography, Grid, Divider, Button, Chip, IconButton, Tabs, Tab, List, ListItem, ListItemText, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Delete as DeleteIcon, Phone as PhoneIcon, Home as HomeIcon, Person as PersonIcon, Place as PlaceIcon, AccountBalance as BankIcon, Engineering as EngineeringIcon, Money as MoneyIcon, Event as EventIcon } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useWorker } from '@/hooks/useWorkers';
import { Worker, Foreman } from '@/types';

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
            id={`worker-tabpanel-${index}`}
            aria-labelledby={`worker-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

export default function ForemanDetailPage() {
    const params = useParams();
    const router = useRouter();
    const foremanId = params.id as string;

    // State
    const [tabValue, setTabValue] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Hook
    const { worker, isForeman, isLoading, error, deleteWorker } = useWorker(foremanId);

    // Tab change handler
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Delete dialog handlers
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteWorker();
            router.push('/workers/foremen');
        } catch (error) {
            console.error('Failed to delete foreman:', error);
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Redirect if not a foreman
    useEffect(() => {
        if (!isLoading && worker && !isForeman) {
            router.push(`/workers/drivers/${worker.id}`);
        }
    }, [isLoading, worker, isForeman, router]);

    if (isLoading) {
        return (
            <MainLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <Alert severity="error" sx={{ mb: 3 }}>
                    작업반장 정보를 불러오는 중 오류가 발생했습니다.
                </Alert>
            </MainLayout>
        );
    }

    if (!worker || !isForeman) {
        return (
            <MainLayout>
                <Alert severity="error" sx={{ mb: 3 }}>
                    작업반장 정보를 찾을 수 없습니다.
                </Alert>
            </MainLayout>
        );
    }

    const foreman = worker as Foreman;

    return (
        <MainLayout>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => router.push('/workers/foremen')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        {foreman.name}
                        <Chip
                            size="small"
                            label="작업반장"
                            color="primary"
                            sx={{ ml: 1, verticalAlign: 'middle' }}
                        />
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/workers/foremen/${foreman.id}/edit`)}
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

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="worker details tabs"
                >
                    <Tab label="기본 정보" id="worker-tab-0" aria-controls="worker-tabpanel-0" />
                    <Tab label="작업 이력" id="worker-tab-1" aria-controls="worker-tabpanel-1" />
                    <Tab label="정산 내역" id="worker-tab-2" aria-controls="worker-tabpanel-2" />
                </Tabs>
            </Box>

            {/* Basic Info Tab */}
            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    {/* Personal Info */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                기본 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List disablePadding>
                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="이름"
                                        secondary={foreman.name}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="전화번호"
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {foreman.phoneNumber}
                                                <IconButton
                                                    size="small"
                                                    href={`tel:${foreman.phoneNumber}`}
                                                    sx={{ ml: 1 }}
                                                >
                                                    <PhoneIcon fontSize="small" color="primary" />
                                                </IconButton>
                                            </Box>
                                        }
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                {foreman.personalId && (
                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="주민등록번호"
                                            secondary={foreman.personalId}
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                        />
                                    </ListItem>
                                )}

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="등록일"
                                        secondary={foreman.createdAt ? new Date(foreman.createdAt).toLocaleDateString('ko-KR') : '-'}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    {/* Work Info */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <EngineeringIcon sx={{ mr: 1 }} />
                                업무 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List disablePadding>
                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="구분"
                                        secondary={foreman.foremanInfo.category}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{
                                            color: 'text.primary',
                                            variant: 'body1',
                                            fontWeight: 'medium'
                                        }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="단가 정보"
                                        secondary={
                                            <Box>
                                                {foreman.foremanInfo.rates.hourly > 0 ? (
                                                    <Typography variant="body1">
                                                        시급: {foreman.foremanInfo.rates.hourly.toLocaleString()}원
                                                    </Typography>
                                                ) : foreman.foremanInfo.rates.daily > 0 ? (
                                                    <Typography variant="body1">
                                                        일당: {foreman.foremanInfo.rates.daily.toLocaleString()}원
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body1">
                                                        협의가격 (작업별로 개별 협의)
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    {/* Address */}
                    {foreman.address?.full && (
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <HomeIcon sx={{ mr: 1 }} />
                                    주소 정보
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <List disablePadding>
                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="주소"
                                            secondary={
                                                <Box>
                                                    <Typography variant="body1">{foreman.address.full}</Typography>
                                                    {foreman.address.detail && (
                                                        <Typography variant="body1">{foreman.address.detail}</Typography>
                                                    )}
                                                </Box>
                                            }
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        />
                                    </ListItem>
                                </List>
                            </Paper>
                        </Grid>
                    )}

                    {/* Bank Info */}
                    {foreman.bankInfo?.bankName && (
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <BankIcon sx={{ mr: 1 }} />
                                    계좌 정보
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <List disablePadding>
                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="은행"
                                            secondary={foreman.bankInfo.bankName}
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                        />
                                    </ListItem>

                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="계좌번호"
                                            secondary={foreman.bankInfo.accountNumber}
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                        />
                                    </ListItem>

                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="예금주"
                                            secondary={foreman.bankInfo.accountHolder}
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                        />
                                    </ListItem>
                                </List>
                            </Paper>
                        </Grid>
                    )}

                    {/* Memo */}
                    {foreman.memo && (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>메모</Typography>
                                <Typography>{foreman.memo}</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            {/* Work History Tab */}
            <TabPanel value={tabValue} index={1}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="body1" color="text.secondary">
                            작업 이력 기능은 준비 중입니다.
                        </Typography>
                    </Box>
                </Paper>
            </TabPanel>

            {/* Payment History Tab */}
            <TabPanel value={tabValue} index={2}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="body1" color="text.secondary">
                            정산 내역 기능은 준비 중입니다.
                        </Typography>
                    </Box>
                </Paper>
            </TabPanel>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    작업반장 삭제 확인
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {`"${foreman.name}" 작업반장을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="inherit">
                        취소
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
}