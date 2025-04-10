// src/components/fields/FieldDetail.tsx
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
    useTheme,
    Menu,
    MenuItem,
    ListItemIcon
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Terrain as TerrainIcon,
    Category as CategoryIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Place as PlaceIcon,
    Note as NoteIcon,
    MoreVert as MoreVertIcon,
    EventNote as EventNoteIcon,
    Add as AddIcon,
    ArrowCircleUp as StageUpIcon,
    Navigation as NavigationIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon
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

// 지도 컴포넌트를 위한 타입
interface MapProps {
    address: string;
    latitude?: number;
    longitude?: number;
    zoom?: number;
}

// 간단한 지도 컴포넌트
const SimpleMap: React.FC<MapProps> = ({ address, latitude, longitude, zoom = 15 }) => {
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapRef = React.useRef<HTMLDivElement>(null);
    const [currentZoom, setCurrentZoom] = useState(zoom);
    const theme = useTheme();

    // 실제 프로젝트에서는 환경 변수 등으로 API 키를 관리해야 합니다
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // 실제 프로젝트에서는 환경 변수로 대체

    useEffect(() => {
        // 이미 로드되었는지 체크
        if (window.google?.maps) {
            setMapLoaded(true);
            return;
        }

        // 이미 스크립트 태그가 있는지 확인
        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]');
        if (existingScript) {
            // 이미 로드 중인 스크립트가 있으면 완료 이벤트 리스너만 추가
            existingScript.addEventListener('load', () => {
                setMapLoaded(true);
            });
            return;
        }

        // 새로운 스크립트 생성
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setMapLoaded(true);
        };
        document.head.appendChild(script);

        return () => {
            // 컴포넌트 언마운트 시 스크립트는 유지
        };
    }, [apiKey]);

    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        const google = window.google;
        let position;

        if (latitude && longitude) {
            position = { lat: latitude, lng: longitude };
        } else {
            // 임시 좌표 (기본값)
            position = { lat: 37.4812845080678, lng: 126.952713197762 }; // 서울 좌표
        }

        const mapOptions = {
            center: position,
            zoom: currentZoom,
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        };

        const map = new google.maps.Map(mapRef.current, mapOptions);
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: address,
            animation: google.maps.Animation.DROP
        });

        // 정보창 생성
        const infowindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px; max-width: 200px;"><strong>${address}</strong></div>`
        });

        // 마커 클릭시 정보창 표시
        marker.addListener('click', () => {
            infowindow.open(map, marker);
        });

        // 처음부터 정보창 표시
        infowindow.open(map, marker);

        // 장소 검색 - 실제 위도/경도가 없을 경우 주소로 검색
        if (!latitude || !longitude) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: address }, (results: any, status: any) => {
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                    const location = results[0].geometry.location;
                    map.setCenter(location);
                    marker.setPosition(location);
                }
            });
        }

    }, [mapLoaded, address, latitude, longitude, currentZoom]);

    // 줌 레벨 변경 함수
    const handleZoomIn = () => {
        setCurrentZoom(prev => Math.min(prev + 1, 20));
    };

    const handleZoomOut = () => {
        setCurrentZoom(prev => Math.max(prev - 1, 1));
    };

    // 네이버 지도 앱으로 길찾기 열기 (모바일)
    const openNaverMap = () => {
        window.open(`nmap://navigation?dlat=${latitude || ''}&dlng=${longitude || ''}&dname=${encodeURIComponent(address)}`);
    };

    // 카카오맵으로 길찾기 열기
    const openKakaoMap = () => {
        window.open(`https://map.kakao.com/link/to/${encodeURIComponent(address)},${latitude || ''},${longitude || ''}`);
    };

    // 지도를 로드할 수 없을 때 대체 UI
    const placeholderUI = (
        <Box
            sx={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.grey[100],
                borderRadius: 1,
                p: 3
            }}
        >
            <PlaceIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="body1" color="text.secondary" align="center">
                지도를 로드할 수 없습니다.
            </Typography>
            <Button
                variant="outlined"
                startIcon={<NavigationIcon />}
                sx={{ mt: 2 }}
                component="a"
                href={`https://map.kakao.com/link/search/${encodeURIComponent(address)}`}
                target="_blank"
            >
                카카오맵에서 보기
            </Button>
        </Box>
    );

    return (
        <Box sx={{ position: 'relative', height: 350, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
            {mapLoaded ? (
                <>
                    <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                    <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10 }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<NavigationIcon />}
                            onClick={openKakaoMap}
                            sx={{ mr: 1 }}
                        >
                            길찾기
                        </Button>
                    </Box>
                    <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                        <IconButton
                            size="small"
                            onClick={handleZoomIn}
                            sx={{ bgcolor: 'background.paper', mb: 1, boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
                        >
                            <ZoomInIcon />
                        </IconButton>
                        <br />
                        <IconButton
                            size="small"
                            onClick={handleZoomOut}
                            sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
                        >
                            <ZoomOutIcon />
                        </IconButton>
                    </Box>
                </>
            ) : placeholderUI}
        </Box>
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
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="body1" component="span">
                                                        {field.farmerName}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => router.push(`/farmers/${field.farmerId}`)}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        상세 보기
                                                    </Button>
                                                </Box>
                                            }
                                            // 기본 secondary를 <p> 대신 <div>로 렌더링합니다.
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />

                                    </ListItem>
                                </List>
                            ) : (
                                <Typography color="text.secondary">
                                    농가 정보를 찾을 수 없습니다.
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Address Info */}
                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PlaceIcon sx={{ mr: 1 }} />
                                위치 정보
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List disablePadding>
                                <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                        primary="주소"
                                        secondary={
                                            <Box>
                                                <Typography variant="body1" component="div">
                                                    {field.address.full}
                                                </Typography>
                                                {field.address.detail && (
                                                    <Typography variant="body1" component="div">
                                                        {field.address.detail}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        // 기본 secondary를 <p> 대신 <div>로 렌더링합니다.
                                        secondaryTypographyProps={{ component: 'div' }}
                                    />
                                </ListItem>
                            </List>


                            {/* 지도 표시: 좌표가 있는 경우 해당 좌표를 전달합니다. */}
                            <KakaoSimpleMap
                                address={field.address.full}
                                latitude={field.address.coordinates?.latitude}
                                longitude={field.address.coordinates?.longitude}
                                zoom={3} // 필요에 따라 줌 레벨 조정
                            />
                            {/* 추가적인 주소 또는 버튼 등의 정보 */}
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                {field.address.full}
                            </Typography>
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