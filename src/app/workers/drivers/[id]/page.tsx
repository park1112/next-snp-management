'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, CircularProgress, Alert, Paper, Typography, Grid, Divider, Button, Chip, IconButton, Tabs, Tab, List, ListItem, ListItemText, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Delete as DeleteIcon, Phone as PhoneIcon, Home as HomeIcon, Person as PersonIcon, Place as PlaceIcon, AccountBalance as BankIcon, DirectionsCar as CarIcon, Money as MoneyIcon, Event as EventIcon } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { useWorker } from '@/hooks/useWorkers';

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

export default function DriverDetailPage() {
    const params = useParams();
    const router = useRouter();
    const driverId = params.id as string;

    // State
    const [tabValue, setTabValue] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Hook
    const { worker, isDriver, isLoading, error, deleteWorker } = useWorker(driverId);

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
            router.push('/workers/drivers');
        } catch (error) {
            console.error('Failed to delete driver:', error);
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Redirect if not a driver
    useEffect(() => {
        if (!isLoading && worker && !isDriver) {
            router.push(`/workers/foremen/${worker.id}`);
        }
    }, [isLoading, worker, isDriver, router]);

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
                    운송기사 정보를 불러오는 중 오류가 발생했습니다.
                </Alert>
            </MainLayout>
        );
    }

    if (!worker || !isDriver) {
        return (
            <MainLayout>
                <Alert severity="error" sx={{ mb: 3 }}>
                    운송기사 정보를 찾을 수 없습니다.
                </Alert>
            </MainLayout>
        );
    }

    const driver = worker;

    return (
        <MainLayout>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => router.push('/workers/drivers')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        {driver.name}
                        <Chip
                            size="small"
                            label="운송기사"
                            color="secondary"
                            sx={{ ml: 1, verticalAlign: 'middle' }}
                        />
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/workers/drivers/${driver.id}/edit`)}
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
                    <Tab label="운송 이력" id="worker-tab-1" aria-controls="worker-tabpanel-1" />
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
                                        secondary={driver.name}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="전화번호"
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {driver.phoneNumber}
                                                <IconButton
                                                    size="small"
                                                    href={`tel:${driver.phoneNumber}`}
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

                                {driver.personalId && (
                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="주민등록번호"
                                            secondary={driver.personalId}
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                        />
                                    </ListItem>
                                )}

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="등록일"
                                        secondary={driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('ko-KR') : '-'}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    {/* Vehicle Info */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <CarIcon sx={{ mr: 1 }} />
                                차량 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List disablePadding>
                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="차량번호"
                                        secondary={driver.driverInfo.vehicleNumber}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 'medium' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="차량 종류"
                                        secondary={driver.driverInfo.vehicleType}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="구분"
                                        secondary={driver.driverInfo.category}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="운송료 정보"
                                        secondary={
                                            <Box>
                                                {driver.driverInfo.rates.baseRate > 0 ? (
                                                    <Typography variant="body1">
                                                        기본 운송료: {driver.driverInfo.rates.baseRate.toLocaleString()}원
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body1">
                                                        협의가격 (운송별로 개별 협의)
                                                    </Typography>
                                                )}

                                                {driver.driverInfo.rates.distanceRate > 0 && (
                                                    <Typography variant="body1">
                                                        거리별 추가 요금: km당 {driver.driverInfo.rates.distanceRate.toLocaleString()}원
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
                    {driver.address?.full && (
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <HomeIcon sx={{ mr: 1 }} />
                                    주소 정보
                                </Typography>