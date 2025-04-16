// src/components/fields/FieldDetail.tsx
'use client';

import React, { useState } from 'react';
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

    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Alert,

    useTheme,
    Menu,
    MenuItem,
    ListItemIcon,
    Avatar
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Terrain as TerrainIcon,

    Person as PersonIcon,
    Place as PlaceIcon,
    Note as NoteIcon,

    Add as AddIcon,
    ArrowCircleUp as StageUpIcon,
    Phone as PhoneIcon,
    Flag as FlagIcon,
} from '@mui/icons-material';
import { Field } from '@/types';
import { deleteField, updateFieldStage } from '@/services/firebase/fieldService';
import KakaoSimpleMap from '../KakaoSimpleMap';

// Google Maps 타입 선언
declare global {
    interface Window {
        google: any;
    }
}

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
            id={`field-tabpanel-${index}`}
            aria-labelledby={`field-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};





interface FieldDetailProps {
    field: Field;
    address: {
        full: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
}

const FieldDetail: React.FC<FieldDetailProps> = ({ field }) => {
    const router = useRouter();
    const theme = useTheme();

    // States
    const [tabValue, setTabValue] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [stageMenuAnchorEl, setStageMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [isUpdatingStage, setIsUpdatingStage] = useState(false);
    const [stageUpdateSuccess, setStageUpdateSuccess] = useState(false);
    const [stageUpdateError, setStageUpdateError] = useState<string | null>(null);

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
        setDeleting(true);
        setDeleteError(null);

        try {
            await deleteField(field.id);
            setDeleteDialogOpen(false);
            router.push('/fields');
        } catch (error) {
            console.error('Error deleting field:', error);
            setDeleteError('농지 삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    // Stage menu handlers
    const handleStageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setStageMenuAnchorEl(event.currentTarget);
    };

    const handleStageMenuClose = () => {
        setStageMenuAnchorEl(null);
    };

    // 위치 정보 관련 상태 추가
    const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);

    // 작물 색상 가져오기 함수
    const getCropColor = (cropType: string): string => {
        const colors: Record<string, string> = {
            '고구마': '#FF6B6B',
            '감자': '#4ECDC4',
            '양파': '#FFD166',
            '마늘': '#6A0572',
            '배추': '#1A535C',
            '무': '#FF9F1C',
            '기타': '#7B68EE'
        };

        return colors[cropType] || colors['기타'];
    };

    // Get next stage options
    const getNextStages = (currentStage: string): string[] => {
        const stageFlow = [
            '계약예정', '계약보류', '계약완료',
            '뽑기준비', '뽑기진행', '뽑기완료',
            '자르기준비', '자르기진행', '자르기완료',
            '담기준비', '담기진행', '담기완료'
        ];

        const currentIndex = stageFlow.indexOf(currentStage);

        if (currentIndex === -1 || currentIndex === stageFlow.length - 1) {
            return [];
        }

        // Return the next stage and also allow skipping one stage ahead
        const result = [];
        if (currentIndex + 1 < stageFlow.length) {
            result.push(stageFlow[currentIndex + 1]);
        }
        if (currentIndex + 2 < stageFlow.length) {
            result.push(stageFlow[currentIndex + 2]);
        }

        return result;
    };

    // Update stage handler
    const handleUpdateStage = async (newStage: string) => {
        setIsUpdatingStage(true);
        setStageUpdateSuccess(false);
        setStageUpdateError(null);

        try {
            await updateFieldStage(field.id, newStage, 'system');
            setStageUpdateSuccess(true);

            // Reload page after successful update
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Error updating field stage:', error);
            setStageUpdateError('농지 단계 변경 중 오류가 발생했습니다.');
        } finally {
            setIsUpdatingStage(false);
            handleStageMenuClose();
        }
    };

    // Stage color helper
    const getStageColor = (stage: string) => {
        if (stage.includes('계약')) {
            return 'primary';
        } else if (stage.includes('뽑기')) {
            return 'secondary';
        } else if (stage.includes('자르기')) {
            return 'info';
        } else if (stage.includes('담기')) {
            return 'success';
        }
        return 'default';
    };

    // Formatted stage name for display
    const formatStageName = (stage: string) => {
        const stageGroups: { [key: string]: string } = {
            '계약': '계약',
            '뽑기': '뽑기',
            '자르기': '자르기',
            '담기': '담기'
        };

        for (const prefix in stageGroups) {
            if (stage.includes(prefix)) {
                const groupName = stageGroups[prefix];
                const status = stage.replace(prefix, '');
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="span" fontWeight="bold">{groupName}</Typography>
                        <Typography component="span" color="text.secondary">{status}</Typography>
                    </Box>
                );
            }
        }

        return stage;
    };

    const nextStages = getNextStages(field.currentStage.stage);

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => router.push('/fields')} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight="bold">
                        {field.address.full.split(' ').slice(-2).join(' ')}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/fields/${field.id}/edit`)}
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

            {/* Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        현재 작업 단계
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                            label={field.currentStage.stage}
                            color={getStageColor(field.currentStage.stage)}
                            sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {field.currentStage.updatedAt
                                ? `마지막 업데이트: ${new Date(field.currentStage.updatedAt).toLocaleDateString('ko-KR')}`
                                : ''}
                        </Typography>
                    </Box>
                </Box>
                {nextStages.length > 0 && (
                    <Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<StageUpIcon />}
                            onClick={handleStageMenuOpen}
                            disabled={isUpdatingStage}
                        >
                            단계 변경
                        </Button>
                        <Menu
                            anchorEl={stageMenuAnchorEl}
                            open={Boolean(stageMenuAnchorEl)}
                            onClose={handleStageMenuClose}
                        >
                            {nextStages.map((stage) => (
                                <MenuItem
                                    key={stage}
                                    onClick={() => handleUpdateStage(stage)}
                                >
                                    <ListItemIcon>
                                        <StageUpIcon color={getStageColor(stage) as any} />
                                    </ListItemIcon>
                                    <ListItemText>
                                        {formatStageName(stage)}
                                    </ListItemText>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                )}
            </Box>

            {/* Stage update alerts */}
            {stageUpdateSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    작업 단계가 성공적으로 변경되었습니다. 페이지가 곧 새로고침됩니다.
                </Alert>
            )}
            {stageUpdateError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {stageUpdateError}
                </Alert>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="field details tabs"
                >
                    <Tab label="기본 정보" id="field-tab-0" aria-controls="field-tabpanel-0" />
                    <Tab label="작업 이력" id="field-tab-1" aria-controls="field-tabpanel-1" />
                    <Tab label="계약 정보" id="field-tab-2" aria-controls="field-tabpanel-2" />
                </Tabs>
            </Box>

            {/* Basic Info Panel */}
            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    {/* Field Info */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TerrainIcon sx={{ mr: 1 }} />
                                농지 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List disablePadding>
                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="면적"
                                        secondary={`${field.area.value} ${field.area.unit}`}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 'medium' }}
                                    />
                                </ListItem>

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="작물 종류"
                                        secondary={field.cropType}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>

                                {field.estimatedHarvestDate && (
                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="예상 수확일"
                                            secondary={new Date(field.estimatedHarvestDate).toLocaleDateString('ko-KR')}
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                        />
                                    </ListItem>
                                )}

                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="등록일"
                                        secondary={new Date(field.createdAt).toLocaleDateString('ko-KR')}
                                        primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                        secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    {/* Owner Info */}
                    {/* Owner Info */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                소유 농가 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {field.farmerName ? (
                                <List disablePadding>
                                    <ListItem sx={{ px: 0, py: 1 }}>
                                        <ListItemText
                                            primary="농가명"
                                            secondary={field.farmerName}
                                            primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                            secondaryTypographyProps={{ color: 'text.primary', variant: 'body1', fontWeight: 'medium' }}
                                        />
                                    </ListItem>

                                    {field.phoneNumber && (
                                        <ListItem sx={{ px: 0, py: 1 }}>
                                            <ListItemText
                                                primary="연락처"
                                                secondary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="body1" component="span">
                                                            {field.phoneNumber}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            sx={{ ml: 1 }}
                                                            component="a"
                                                            href={`tel:${field.phoneNumber}`}
                                                        >
                                                            <PhoneIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                }
                                                primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                                secondaryTypographyProps={{ component: 'div' }}
                                            />
                                        </ListItem>
                                    )}

                                    {field.address && (
                                        <ListItem sx={{ px: 0, py: 1 }}>
                                            <ListItemText
                                                primary="주소"
                                                secondary={field.address.full}
                                                primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                                                secondaryTypographyProps={{ color: 'text.primary', variant: 'body1' }}
                                            />
                                        </ListItem>
                                    )}

                                    {field.farmerId && (
                                        <ListItem sx={{ px: 0, pt: 2, pb: 0 }}>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                fullWidth
                                                onClick={() => router.push(`/farmers/${field.farmerId}`)}
                                                startIcon={<PersonIcon />}
                                            >
                                                농가 상세 정보 보기
                                            </Button>
                                        </ListItem>
                                    )}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                                        등록된 농가 정보가 없습니다.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => router.push('/farmers/add')}
                                    >
                                        농가 추가하기
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Address Info */}
                    <Grid size={{ xs: 12 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 0,
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid rgba(230, 235, 240, 0.9)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Box
                                sx={{
                                    p: 3,
                                    background: 'linear-gradient(145deg, #f7f9fc 0%, #eef1f5 100%)',
                                    borderBottom: '1px solid rgba(230, 235, 240, 0.9)'
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    fontWeight="700"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        letterSpacing: '-0.5px',
                                        color: '#2c3e50'
                                    }}
                                >
                                    <PlaceIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                                    위치 정보
                                </Typography>
                            </Box>

                            <Box sx={{ p: 0 }}>
                                {field.locations && field.locations.length > 0 ? (
                                    <>
                                        {/* 위치 선택 탭 - 현대적인 디자인 */}
                                        {/* 위치 선택 탭 - 향상된 레이아웃으로 수정 */}
                                        <Box
                                            sx={{
                                                px: 3,
                                                pt: 3,
                                                pb: 1,
                                                background: '#ffffff'
                                            }}
                                        >
                                            <Tabs
                                                value={selectedLocationIndex}
                                                onChange={(e, newValue) => setSelectedLocationIndex(newValue)}
                                                variant="scrollable"
                                                scrollButtons="auto"
                                                TabIndicatorProps={{
                                                    sx: { display: 'none' }
                                                }}
                                                sx={{
                                                    '& .MuiTabs-flexContainer': {
                                                        gap: 1.5
                                                    },
                                                    '& .MuiTab-root': {
                                                        minWidth: '130px', // 고정 너비 설정
                                                        px: 2,
                                                        py: 1.2,
                                                        borderRadius: '12px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 500,
                                                        textTransform: 'none',
                                                        color: '#64748b',
                                                        backgroundColor: '#f8fafc',
                                                        border: '1px solid',
                                                        borderColor: '#e2e8f0',
                                                        transition: 'all 0.2s ease-in-out',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        '&:hover': {
                                                            backgroundColor: '#f1f5f9',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                        }
                                                    },
                                                    '& .Mui-selected': {
                                                        color: theme.palette.primary.main,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                                        borderColor: alpha(theme.palette.primary.main, 0.3),
                                                        boxShadow: '0 4px 10px rgba(0,118,255,0.1)',
                                                        fontWeight: 600
                                                    }
                                                }}
                                            >
                                                {field.locations.map((location, index) => (
                                                    <Tab
                                                        key={location.id || index}
                                                        sx={{
                                                            // 탭 내부 아이콘과 텍스트의 일관된 배치를 위한 스타일
                                                            '& .MuiTab-iconWrapper': {
                                                                opacity: 1, // 항상 보이게
                                                                mr: 1,
                                                                transition: 'opacity 0.2s ease',
                                                            }
                                                        }}
                                                        icon={
                                                            <FlagIcon
                                                                sx={{
                                                                    fontSize: 18,
                                                                    color: selectedLocationIndex === index
                                                                        ? theme.palette.primary.main
                                                                        : alpha('#64748b', 0.7), // 선택되지 않은 상태에선 약간 투명하게
                                                                    transition: 'color 0.2s ease'
                                                                }}
                                                            />
                                                        }
                                                        label={`위치 #${location.flagNumber || index + 1}`}
                                                        iconPosition="start"
                                                    />
                                                ))}
                                            </Tabs>
                                        </Box>

                                        {/* 위치 컨텐츠 - 애니메이션 효과 추가 */}
                                        <Box sx={{ position: 'relative' }}>
                                            {field.locations.map((location, index) => (
                                                <Box
                                                    key={location.id || index}
                                                    sx={{
                                                        opacity: selectedLocationIndex === index ? 1 : 0,
                                                        position: selectedLocationIndex === index ? 'relative' : 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: selectedLocationIndex === index ? 'auto' : 0,
                                                        overflow: 'hidden',
                                                        transition: 'opacity 0.3s ease, height 0.3s ease',
                                                        zIndex: selectedLocationIndex === index ? 1 : 0
                                                    }}
                                                >
                                                    {/* 작물 및 면적 정보 카드 */}
                                                    <Box sx={{ p: 3 }}>
                                                        <Box
                                                            sx={{
                                                                p: 0,
                                                                mb: 3,
                                                                borderRadius: '16px',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            <Grid container>
                                                                {/* 작물 타입 카드 */}
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Box
                                                                        sx={{
                                                                            p: 3,
                                                                            height: '100%',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            bgcolor: alpha(getCropColor(location.cropType || field.cropType), 0.07),
                                                                            borderRight: { xs: 'none', sm: '1px solid rgba(230, 235, 240, 0.6)' },
                                                                            borderBottom: { xs: '1px solid rgba(230, 235, 240, 0.6)', sm: 'none' }
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                                            <Avatar
                                                                                sx={{
                                                                                    width: 42,
                                                                                    height: 42,
                                                                                    bgcolor: getCropColor(location.cropType || field.cropType),
                                                                                    color: '#fff',
                                                                                    fontSize: '1.2rem',
                                                                                    fontWeight: 600,
                                                                                    mr: 2,
                                                                                    boxShadow: `0 6px 16px ${alpha(getCropColor(location.cropType || field.cropType), 0.3)}`
                                                                                }}
                                                                            >
                                                                                {location.flagNumber || index + 1}
                                                                            </Avatar>
                                                                            <Box>
                                                                                <Typography variant="overline" sx={{ color: alpha('#000', 0.6), letterSpacing: 1 }}>
                                                                                    깃발 번호
                                                                                </Typography>
                                                                                <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.1 }}>
                                                                                    #{location.flagNumber || index + 1}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>

                                                                        <Typography variant="body2" sx={{ color: alpha('#000', 0.6), mb: 1 }}>
                                                                            작물 종류
                                                                        </Typography>
                                                                        <Box sx={{ mt: 'auto' }}>
                                                                            <Chip
                                                                                label={location.cropType || field.cropType}
                                                                                sx={{
                                                                                    bgcolor: alpha(getCropColor(location.cropType || field.cropType), 0.15),
                                                                                    color: getCropColor(location.cropType || field.cropType),
                                                                                    fontWeight: 600,
                                                                                    borderRadius: '8px',
                                                                                    px: 1,
                                                                                    '& .MuiChip-label': { px: 1 }
                                                                                }}
                                                                            />
                                                                        </Box>
                                                                    </Box>
                                                                </Grid>

                                                                {/* 면적 카드 */}
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Box
                                                                        sx={{
                                                                            p: 3,
                                                                            height: '100%',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            bgcolor: '#fff'
                                                                        }}
                                                                    >
                                                                        <Typography variant="overline" sx={{ color: alpha('#000', 0.6), letterSpacing: 1 }}>
                                                                            면적
                                                                        </Typography>
                                                                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'baseline' }}>
                                                                            <Typography
                                                                                variant="h3"
                                                                                fontWeight="700"
                                                                                sx={{
                                                                                    color: '#1e293b',
                                                                                    letterSpacing: '-1px'
                                                                                }}
                                                                            >
                                                                                {location.area?.value || field.area?.value || 0}
                                                                            </Typography>
                                                                            <Typography
                                                                                variant="h6"
                                                                                sx={{
                                                                                    color: '#64748b',
                                                                                    ml: 1
                                                                                }}
                                                                            >
                                                                                {location.area?.unit || field.area?.unit || '평'}
                                                                            </Typography>
                                                                        </Box>

                                                                        {location.note && (
                                                                            <Box
                                                                                sx={{
                                                                                    mt: 'auto',
                                                                                    pt: 2,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center'
                                                                                }}
                                                                            >
                                                                                <Box
                                                                                    sx={{
                                                                                        width: 4,
                                                                                        height: 4,
                                                                                        borderRadius: '50%',
                                                                                        bgcolor: 'primary.main',
                                                                                        mr: 1
                                                                                    }}
                                                                                />
                                                                                <Typography variant="caption" sx={{ color: alpha('#000', 0.6) }}>
                                                                                    메모 있음
                                                                                </Typography>
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                </Grid>
                                                            </Grid>
                                                        </Box>

                                                        {/* 주소 정보 카드 */}
                                                        <Box
                                                            sx={{
                                                                p: 3,
                                                                mb: 3,
                                                                borderRadius: '16px',
                                                                bgcolor: '#fff',
                                                                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                                                border: '1px solid rgba(230, 235, 240, 0.9)'
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                                <Box
                                                                    sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        borderRadius: '10px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                        color: theme.palette.primary.main,
                                                                        mr: 2
                                                                    }}
                                                                >
                                                                    <PlaceIcon />
                                                                </Box>
                                                                <Typography variant="subtitle1" fontWeight="600">
                                                                    주소 정보
                                                                </Typography>
                                                            </Box>

                                                            <Box sx={{ pl: 1 }}>
                                                                <Typography
                                                                    variant="body1"
                                                                    sx={{
                                                                        mb: 0.5,
                                                                        fontWeight: '500',
                                                                        color: '#334155'
                                                                    }}
                                                                >
                                                                    {location.address?.full || field.address?.full}
                                                                </Typography>

                                                                {(location.address?.detail || field.address?.detail) && (
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            mb: 1,
                                                                            color: '#64748b',
                                                                            fontStyle: 'italic'
                                                                        }}
                                                                    >
                                                                        {location.address?.detail || field.address?.detail}
                                                                    </Typography>
                                                                )}
                                                            </Box>

                                                            {/* 메모 */}
                                                            {location.note && (
                                                                <Box
                                                                    sx={{
                                                                        mt: 2,
                                                                        pt: 2,
                                                                        borderTop: '1px dashed rgba(203, 213, 225, 0.8)'
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: '#64748b',
                                                                            fontStyle: 'italic',
                                                                            display: 'flex',
                                                                            alignItems: 'flex-start'
                                                                        }}
                                                                    >
                                                                        <NoteIcon sx={{ fontSize: 16, mr: 1, mt: 0.3, color: alpha(theme.palette.warning.main, 0.8) }} />
                                                                        {location.note}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>

                                                        {/* 지도 컨테이너 - 스타일 개선 */}
                                                        <Box
                                                            sx={{
                                                                borderRadius: '16px',
                                                                overflow: 'hidden',
                                                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                                                border: '1px solid rgba(230, 235, 240, 0.9)',
                                                                position: 'relative',
                                                                height: 350,
                                                                '&:hover': {
                                                                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                                                                }
                                                            }}
                                                        >
                                                            {/* 지도 표시 */}
                                                            <KakaoSimpleMap
                                                                address={location.address?.full || field.address?.full}
                                                                latitude={location.address?.coordinates?.latitude || field.address?.coordinates?.latitude}
                                                                longitude={location.address?.coordinates?.longitude || field.address?.coordinates?.longitude}
                                                                zoom={3}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </>
                                ) : (
                                    <Box sx={{ p: 3 }}>
                                        {/* 단일 위치 정보 - 기존 디자인 */}
                                        <Box
                                            sx={{
                                                p: 3,
                                                mb: 3,
                                                borderRadius: '16px',
                                                bgcolor: '#fff',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                                border: '1px solid rgba(230, 235, 240, 0.9)'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '10px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main,
                                                        mr: 2
                                                    }}
                                                >
                                                    <PlaceIcon />
                                                </Box>
                                                <Typography variant="subtitle1" fontWeight="600">
                                                    주소 정보
                                                </Typography>
                                            </Box>

                                            <Box sx={{ pl: 1 }}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        mb: 0.5,
                                                        fontWeight: '500',
                                                        color: '#334155'
                                                    }}
                                                >
                                                    {field.address.full}
                                                </Typography>

                                                {field.address.detail && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mb: 1,
                                                            color: '#64748b',
                                                            fontStyle: 'italic'
                                                        }}
                                                    >
                                                        {field.address.detail}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* 지도 컨테이너 - 스타일 개선 */}
                                        <Box
                                            sx={{
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                                border: '1px solid rgba(230, 235, 240, 0.9)',
                                                position: 'relative',
                                                height: 350,
                                                '&:hover': {
                                                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                                                }
                                            }}
                                        >
                                            {/* 지도 표시 */}
                                            <KakaoSimpleMap
                                                address={field.address.full}
                                                latitude={field.address.coordinates?.latitude}
                                                longitude={field.address.coordinates?.longitude}
                                                zoom={3}
                                            />
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>


                    {/* Memo */}
                    {field.memo && (
                        <Grid size={{ xs: 12 }}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <NoteIcon sx={{ mr: 1 }} />
                                    메모
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Typography>{field.memo}</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            {/* Work History Tab */}
            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                        작업 이력
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push(`/schedules/add?fieldId=${field.id}`)}
                    >
                        작업 추가
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="body1" color="text.secondary">
                            {field.schedules && field.schedules.length > 0
                                ? '작업 이력 기능이 준비 중입니다.'
                                : '등록된 작업 이력이 없습니다.'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => router.push(`/schedules/add?fieldId=${field.id}`)}
                            sx={{ mt: 2 }}
                        >
                            작업 추가
                        </Button>
                    </Box>
                </Paper>
            </TabPanel>

            {/* Contract Tab */}
            <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                        계약 정보
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push(`/contracts/add?fieldId=${field.id}`)}
                    >
                        계약 추가
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="body1" color="text.secondary">
                            {field.contractIds && field.contractIds.length > 0
                                ? '계약 정보 기능이 준비 중입니다.'
                                : '등록된 계약 정보가 없습니다.'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => router.push(`/contracts/add?fieldId=${field.id}`)}
                            sx={{ mt: 2 }}
                        >
                            계약 추가
                        </Button>
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
                    농지 삭제 확인
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {`"${field.address.full.split(' ').slice(-2).join(' ')}" 농지를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
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

export default FieldDetail;