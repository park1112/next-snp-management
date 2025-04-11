// src/components/farmers/FarmerDetail.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Divider,
    Button,
    Chip,
    IconButton,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Alert,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Phone as PhoneIcon,
    Home as HomeIcon,
    Person as PersonIcon,
    Place as PlaceIcon,
    AccountBalance as BankIcon,
    Add as AddIcon,
    ChevronRight as ChevronRightIcon,
    Terrain as TerrainIcon,
    FormatListBulleted as ListIcon,
    Map as MapIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { Farmer, Field, Contract } from '@/types';
import { deleteFarmer } from '@/services/firebase/farmerService';
import { getFieldsByFarmerId } from '@/services/firebase/fieldService'; // 추가: 농지 조회 API

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
            id={`farmer-tabpanel-${index}`}
            aria-labelledby={`farmer-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

interface FarmerDetailProps {
    farmer: Farmer;
    fields?: Field[];
    contracts?: Contract[];
}

const FarmerDetail: React.FC<FarmerDetailProps> = ({ farmer, fields: initialFields = [], contracts = [] }) => {
    const router = useRouter();
    const theme = useTheme();

    // 탭 및 삭제 관련 상태
    const [tabValue, setTabValue] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    // 농지 정보(Fields)를 props에서 받아오거나, 없는 경우 조회
    const [fields, setFields] = useState<Field[]>(initialFields);
    const [fieldsLoading, setFieldsLoading] = useState<boolean>(false);

    // 탭 변경 핸들러
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 삭제 관련 핸들러
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        setDeleteError(null);

        try {
            await deleteFarmer(farmer.id);
            setDeleteDialogOpen(false);
            router.push('/farmers');
        } catch (error) {
            console.error('Error deleting farmer:', error);
            setDeleteError('농가 삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    // 탭 "농지" 정보를 조회 (만약 props로 받아온 정보가 없다면)
    useEffect(() => {
        if (!initialFields || initialFields.length === 0) {
            setFieldsLoading(true);
            getFieldsByFarmerId(farmer.id)
                .then((fetchedFields) => {
                    setFields(fetchedFields);
                })
                .catch((error) => {
                    console.error('Error fetching fields:', error);
                })
                .finally(() => {
                    setFieldsLoading(false);
                });
        }
    }, [farmer.id, initialFields]);

    // 보기 모드 토글 (목록/지도)
    const toggleViewMode = () => {
        setViewMode(viewMode === 'list' ? 'map' : 'list');
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => router.push('/farmers')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        {farmer.name}
                    </Typography>
                    <Chip
                        size="small"
                        label={farmer.address.subdistrict}
                        color="primary"
                        sx={{ ml: 2 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/farmers/${farmer.id}/edit`)}
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
                    aria-label="farmer details tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="기본 정보" id="farmer-tab-0" aria-controls="farmer-tabpanel-0" />
                    <Tab
                        label={`농지 (${fields.length})`}
                        id="farmer-tab-1"
                        aria-controls="farmer-tabpanel-1"
                        disabled={fieldsLoading}
                    />
                    <Tab
                        label={`계약 (${contracts.length})`}
                        id="farmer-tab-2"
                        aria-controls="farmer-tabpanel-2"
                        disabled={contracts.length === 0}
                    />
                    <Tab label="작업 이력" id="farmer-tab-3" aria-controls="farmer-tabpanel-3" />
                </Tabs>
            </Box>

            {/* Basic Info Panel */}
            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
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
                                        secondary={farmer.name}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="전화번호"
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {farmer.phoneNumber}
                                                <Tooltip title="전화 걸기">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        href={`tel:${farmer.phoneNumber}`}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        <PhoneIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="면단위"
                                        secondary={farmer.address.subdistrict}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="결제소속"
                                        secondary={farmer.paymentGroup}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                {farmer.personalId && (
                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="주민등록번호"
                                            secondary={farmer.personalId}
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                        />
                                    </ListItem>
                                )}

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="등록일"
                                        secondary={farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString('ko-KR') : '-'}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="수정일"
                                        secondary={farmer.updatedAt ? new Date(farmer.updatedAt).toLocaleDateString('ko-KR') : '-'}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                        <Grid container spacing={3}>
                            {/* Address Info */}
                            <Grid size={{ xs: 12 }}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <HomeIcon sx={{ mr: 1 }} />
                                        주소 정보
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    {farmer.address?.full ? (
                                        <List disablePadding>
                                            <ListItem sx={{ px: 0, py: 1 }}>
                                                <ListItemText
                                                    primary="주소"
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body1">{farmer.address.full}</Typography>
                                                            {farmer.address.detail && (
                                                                <Typography variant="body1">{farmer.address.detail}</Typography>
                                                            )}
                                                            {farmer.address.zipcode && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    우편번호: {farmer.address.zipcode}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                    primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                                />
                                            </ListItem>
                                        </List>
                                    ) : (
                                        <Typography color="text.secondary">등록된 주소 정보가 없습니다.</Typography>
                                    )}
                                </Paper>
                            </Grid>

                            {/* Bank Info */}
                            <Grid size={{ xs: 12 }}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <BankIcon sx={{ mr: 1 }} />
                                        계좌 정보
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    {farmer.bankInfo?.bankName ? (
                                        <List disablePadding>
                                            <ListItem sx={{ px: 0, py: 1 }}>
                                                <ListItemText
                                                    primary="은행"
                                                    secondary={farmer.bankInfo.bankName}
                                                    primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                                    secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                                />
                                            </ListItem>

                                            <ListItem sx={{ px: 0, py: 1 }}>
                                                <ListItemText
                                                    primary="계좌번호"
                                                    secondary={farmer.bankInfo.accountNumber}
                                                    primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                                    secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                                />
                                            </ListItem>

                                            <ListItem sx={{ px: 0, py: 1 }}>
                                                <ListItemText
                                                    primary="예금주"
                                                    secondary={farmer.bankInfo.accountHolder}
                                                    primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                                    secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                                />
                                            </ListItem>
                                        </List>
                                    ) : (
                                        <Typography color="text.secondary">등록된 계좌 정보가 없습니다.</Typography>
                                    )}
                                </Paper>
                            </Grid>

                            {/* Memo */}
                            {farmer.memo && (
                                <Grid size={{ xs: 12 }}>
                                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>메모</Typography>
                                        <Typography>{farmer.memo}</Typography>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Fields Panel */}
            <TabPanel value={tabValue} index={1}>
                {fieldsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <CircularProgress />
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                            농지 정보를 불러오는 중입니다…
                        </Typography>
                    </Box>
                ) : fields.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            등록된 농지가 없습니다.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => router.push(`/fields/add?farmerId=${farmer.id}`)}
                        >
                            농지 추가
                        </Button>
                    </Box>
                ) : viewMode === 'list' ? (
                    <Grid container spacing={2}>
                        {fields.map((field) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field.id}>
                                <Card
                                    sx={{
                                        borderRadius: 2,
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        },
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => router.push(`/fields/${field.id}`)}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <TerrainIcon color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="h6" fontWeight="bold">
                                                {field.address.full.split(' ').pop() || '농지'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                주소
                                            </Typography>
                                            <Typography variant="body2" noWrap>
                                                {field.address.full}
                                            </Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    면적
                                                </Typography>
                                                <Typography variant="body2">
                                                    {field.area.value} {field.area.unit}
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    작물
                                                </Typography>
                                                <Typography variant="body2">
                                                    {field.cropType}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        <Box sx={{ mt: 2 }}>
                                            <Chip
                                                size="small"
                                                label={field.currentStage.stage}
                                                color={
                                                    field.currentStage.stage.includes('계약')
                                                        ? 'primary'
                                                        : field.currentStage.stage.includes('뽑기')
                                                            ? 'secondary'
                                                            : field.currentStage.stage.includes('자르기')
                                                                ? 'info'
                                                                : field.currentStage.stage.includes('담기')
                                                                    ? 'success'
                                                                    : 'default'
                                                }
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box
                        sx={{
                            height: 500,
                            bgcolor: '#f1f3f5',
                            borderRadius: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Typography>지도 뷰 구현 예정</Typography>
                    </Box>
                )}
            </TabPanel>

            {/* Contracts Panel */}
            <TabPanel value={tabValue} index={2}>
                {/* 계약 패널 내용 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                        계약 목록
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push(`/contracts/add?farmerId=${farmer.id}`)}
                    >
                        계약 추가
                    </Button>
                </Box>
                {/* 계약 정보 렌더링 */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="body1" color="text.secondary">
                            {contracts.length > 0
                                ? '계약 정보 기능이 준비 중입니다.'
                                : '등록된 계약 정보가 없습니다.'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => router.push(`/contracts/add?farmerId=${farmer.id}`)}
                            sx={{ mt: 2 }}
                        >
                            계약 추가
                        </Button>
                    </Box>
                </Paper>
            </TabPanel>

            {/* Work History Panel */}
            <TabPanel value={tabValue} index={3}>
                <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="body1" color="text.secondary">
                        작업 이력 기능은 준비 중입니다.
                    </Typography>
                </Box>
            </TabPanel>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    농가 삭제 확인
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {`"${farmer.name}" 농가를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                    </DialogContentText>
                    {deleteError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {deleteError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="inherit" disabled={deleting}>
                        취소
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FarmerDetail;



