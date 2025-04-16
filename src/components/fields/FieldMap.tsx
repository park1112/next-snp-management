// src/components/fields/FieldMap.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Typography,
    Paper,
    TextField,
    InputAdornment,
    IconButton,
    CircularProgress,
    List,
    ListItemButton,
    Chip,
    Badge,
    Avatar,
    Drawer,
    AppBar,
    Toolbar,
    Fab,
    Card,
    CardContent,
    Grid,
    useTheme,
    useMediaQuery,
    FormControl,
    InputLabel,
    Select,
    Menu,
    MenuItem,
    SelectChangeEvent,
    Tabs,
    Tab,
    Tooltip,
    Divider,
    alpha,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterAlt as FilterIcon,
    MyLocation as MyLocationIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    Place as PlaceIcon,
    List as ListIcon,
    Map as MapIcon,
    Grass as GrassIcon,
    LocationCity as LocationCityIcon,
    Close as CloseIcon,
    Tune as TuneIcon,
    ViewList as ViewListIcon,
    Layers as LayersIcon,
    Phone as PhoneIcon,
    MoreVert,
    NavigateNext,
} from '@mui/icons-material';
import { Field, getStageColor, stageOptions } from '@/types';
import { getFields, getCropTypes } from '@/services/firebase/fieldService';
import { getSubdistricts } from '@/services/firebase/farmerService';

interface FieldMapProps {
    initialFields?: Field[];
}

const FieldMap: React.FC<FieldMapProps> = ({ initialFields = [] }) => {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
    const mapRef = useRef<HTMLDivElement>(null);
    const kakaoMapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const infoWindowRef = useRef<any>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedField, setSelectedField] = useState<Field | null>(null);

    // States
    const [fields, setFields] = useState<Field[]>(initialFields);
    const [filteredFields, setFilteredFields] = useState<Field[]>(initialFields);
    const [loading, setLoading] = useState<boolean>(true);
    const [mapLoaded, setMapLoaded] = useState<boolean>(false);
    const [filterCropType, setFilterCropType] = useState<string>('');
    const [filterSubdistrict, setFilterSubdistrict] = useState<string>('');
    const [cropTypeOptions, setCropTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [subdistrictOptions, setSubdistrictOptions] = useState<{ value: string; label: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [mapZoom, setMapZoom] = useState<number>(3);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(!isMobile);
    const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<number>(0); // 0: 지도+목록, 1: 지도, 2: 목록

    // 기본 지도 중심 (서울시청)
    const DEFAULT_LAT = 37.566;
    const DEFAULT_LNG = 126.978;


    // API Key - 환경 변수 사용
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAPS_API_KEY;

    // Kakao Maps 스크립트 로딩
    useEffect(() => {
        if (window.kakao && window.kakao.maps) {
            setMapLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'kakao-maps-sdk';
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.kakao.maps.load(() => {
                console.log('카카오맵 로드 완료');
                setMapLoaded(true);
            });
        };
        document.head.appendChild(script);
        return () => {
            const existingScript = document.getElementById('kakao-maps-sdk');
            if (existingScript) {
                document.head.removeChild(existingScript);
            }
        };
    }, [apiKey]);

    // 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await getFields();
                setFields(data);
                setFilteredFields(data);

                const cropTypes = await getCropTypes();
                setCropTypeOptions(cropTypes.map(type => ({ value: type, label: type })));

                const subdistricts = await getSubdistricts();
                setSubdistrictOptions(subdistricts.map(item => ({ value: item, label: item })));
            } catch (error) {
                console.error('Error loading field data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 지도 초기화 (최초 실행)
    useEffect(() => {
        if (!mapLoaded || !mapRef.current || !window.kakao || !window.kakao.maps) return;
        try {
            const options = {
                center: new window.kakao.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG),
                level: mapZoom,
                // 기본 지도 타입을 위성/하이브리드 뷰로 설정
                mapTypeId: window.kakao.maps.MapTypeId.HYBRID,
            };
            const map = new window.kakao.maps.Map(mapRef.current, options);
            kakaoMapRef.current = map;

            const mapTypeControl = new window.kakao.maps.MapTypeControl();
            map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

            const zoomControl = new window.kakao.maps.ZoomControl();
            map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

            const infoWindow = new window.kakao.maps.InfoWindow({
                zIndex: 1,
                removable: true,
                content: '',
            });
            infoWindowRef.current = infoWindow;

            if (filteredFields.length > 0) {
                addMarkers(filteredFields);
            }
        } catch (error) {
            console.error('지도 초기화 오류:', error);
        }
    }, [mapLoaded, mapZoom, filteredFields]);

    // 반응형에 따른 드로어 상태 조정
    useEffect(() => {
        setDrawerOpen(!isMobile);
    }, [isMobile]);

    // 필터 또는 검색어 변경 시 filteredFields 업데이트
    useEffect(() => {
        let result = [...fields];
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            result = result.filter(field =>
                field.address.full.toLowerCase().includes(lowerSearchTerm) ||
                field.cropType.toLowerCase().includes(lowerSearchTerm) ||
                (field.farmerName && field.farmerName.toLowerCase().includes(lowerSearchTerm))
            );
        }
        if (filterCropType) {
            result = result.filter(field => field.cropType === filterCropType);
        }
        if (filterSubdistrict) {
            result = result.filter(field => field.address.full.includes(filterSubdistrict));
        }
        setFilteredFields(result);
    }, [fields, searchTerm, filterCropType, filterSubdistrict]);

    const getCoordinatesFromAddress = (address: string): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            if (!window.kakao?.maps) {
                reject(new Error('Kakao Maps API not loaded'));
                return;
            }
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result: any[], status: any) => {
                if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                    resolve({
                        latitude: parseFloat(result[0].y),
                        longitude: parseFloat(result[0].x),
                    });
                } else {
                    reject(new Error('Failed to get coordinates for address: ' + address));
                }
            });
        });
    };

    const addMarkers = useCallback(async (fields: Field[]) => {
        if (!kakaoMapRef.current) return;
        const map = kakaoMapRef.current;
        const kakao = window.kakao;

        // 기존 마커들 제거
        markersRef.current.forEach(marker => {
            if (marker && typeof marker.setMap === 'function') {
                marker.setMap(null);
            }
        });
        markersRef.current = [];

        const bounds = new kakao.maps.LatLngBounds();
        let hasValidCoordinates = false;

        for (const field of fields) {
            // 좌표가 없는 경우 지오코딩 시도
            if (!field.address.coordinates?.latitude || !field.address.coordinates?.longitude) {
                try {
                    if (field.address.full) {
                        const coordinates = await getCoordinatesFromAddress(field.address.full);
                        field.address.coordinates = coordinates;
                    }
                } catch (error) {
                    console.error('좌표 변환 실패:', error);
                    continue;
                }
            }

            if (field.address.coordinates?.latitude && field.address.coordinates?.longitude) {
                const position = new kakao.maps.LatLng(
                    field.address.coordinates.latitude,
                    field.address.coordinates.longitude
                );

                // 마커 색상 정의
                const markerColors: Record<string, string> = {
                    '고구마': '#FF6B6B',
                    '감자': '#4ECDC4',
                    '양파': '#FFD166',
                    '마늘': '#6A0572',
                    '배추': '#1A535C',
                    '무': '#FF9F1C',
                    '기타': '#7B68EE'
                };

                // 위치 정보(locations) 처리
                const locations = field.locations && field.locations.length > 0
                    ? field.locations
                    : [{ id: field.id, flagNumber: 0, address: field.address, area: field.area, cropType: field.cropType }];

                // 각 위치(location)에 대한 마커 생성
                locations.forEach((location, locationIndex) => {
                    const markerColor = markerColors[location.cropType] || markerColors['기타'];
                    const stageColor = getStageColor(field.currentStage?.stage || '계약예정');

                    // 고유한 ID 생성 - 필드 ID와 위치 인덱스 조합
                    const uniqueMarkerId = `marker-${field.id}-${locationIndex}`;

                    // 마커 콘텐츠 수정 - 깃발 번호와 작업 단계를 표시
                    const customContent = `
                        <div style="
                            position: relative; 
                            bottom: 40px; 
                            cursor: pointer;
                            width: 40px;
                            height: 40px;
                            z-index: 1;
                        ">
                            <div style="
                                position: relative;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                            ">
                                <div id="${uniqueMarkerId}" class="flag-marker" style="
                                    background-color: ${markerColor};
                                    color: white;
                                    border-radius: 50%;
                                    width: 40px;
                                    height: 40px;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    font-size: 14px;
                                    font-weight: bold;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                ">
                                    ${location.flagNumber || '?'}
                                </div>
                                <div style="
                                    margin-top: 4px;
                                    background-color: ${stageColor};
                                    color: white;
                                    border-radius: 10px;
                                    padding: 2px 6px;
                                    font-size: 10px;
                                    font-weight: bold;
                                    white-space: nowrap;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                ">
                                    ${field.currentStage?.stage || '계약예정'}
                                </div>
                            </div>
                        </div>
                    `;

                    // CustomOverlay 생성
                    const customOverlay = new kakao.maps.CustomOverlay({
                        position,
                        content: customContent,
                        yAnchor: 1
                    });
                    customOverlay.setMap(map);
                    markersRef.current.push(customOverlay);

                    // 마커 클릭 시 지도 중심 이동만 수행
                    const handleMarkerClick = () => {
                        // 지도 중심 이동
                        map.panTo(position);
                        map.setLevel(3); // 적절한 줌 레벨 설정
                    };

                    // 커스텀 오버레이에 클릭 이벤트 추가
                    kakao.maps.event.addListener(customOverlay, 'click', handleMarkerClick);

                    // DOM 요소에 클릭 이벤트 연결
                    setTimeout(() => {
                        const markerElement = document.getElementById(uniqueMarkerId);
                        if (markerElement) {
                            markerElement.addEventListener('click', handleMarkerClick);
                        }
                    }, 500);

                    bounds.extend(position);
                    hasValidCoordinates = true;
                });
            }
        }

        if (hasValidCoordinates && fields.length > 0) {
            map.setBounds(bounds);
            if (map.getLevel() < 1) {
                map.setLevel(1);
            }
        }
    }, []);

    // 메뉴 핸들러 함수
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, field: Field) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedField(field);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleGoToDetail = () => {
        if (selectedField) {
            router.push(`/fields/${selectedField.id}`);
        }
        handleMenuClose();
    };

    const handleCallFarmer = () => {
        if (selectedField && selectedField.phoneNumber) {
            window.location.href = `tel:${selectedField.phoneNumber}`;
        }
        handleMenuClose();
    };

    // 리스트 항목 클릭 시 해당 필드 좌표로 지도 중심 이동
    const handleFieldItemClick = (field: Field) => {
        if (kakaoMapRef.current && field.address.coordinates) {
            const { latitude, longitude } = field.address.coordinates;
            const newPos = new window.kakao.maps.LatLng(latitude, longitude);
            // 현재 중심과 비교해서 위치가 다를 때에만 panTo를 호출할 수 있음
            const currentCenter = kakaoMapRef.current.getCenter();
            if (!currentCenter.equals(newPos)) {
                kakaoMapRef.current.panTo(newPos);
            } else {
                // 동일 좌표인 경우 인포윈도우를 열어 피드백 제공 (예시)
                if (infoWindowRef.current) {
                    infoWindowRef.current.setContent(`<div style="padding: 10px;">이미 이 위치입니다.</div>`);
                    infoWindowRef.current.open(kakaoMapRef.current, newPos);
                }
            }
            // 필요에 따라 줌 레벨 재설정 등 추가 처리
            kakaoMapRef.current.setLevel(3);
        }
    };


    // 필터 옵션 핸들러
    const handleCropTypeChange = (event: SelectChangeEvent<string>) => {
        setFilterCropType(event.target.value);
    };

    const handleSubdistrictChange = (event: SelectChangeEvent<string>) => {
        setFilterSubdistrict(event.target.value);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleZoomIn = () => {
        if (kakaoMapRef.current) {
            kakaoMapRef.current.setLevel(kakaoMapRef.current.getLevel() - 1);
        }
    };

    const handleZoomOut = () => {
        if (kakaoMapRef.current) {
            kakaoMapRef.current.setLevel(kakaoMapRef.current.getLevel() + 1);
        }
    };

    const handleGoToCurrentLocation = () => {
        if (!kakaoMapRef.current || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const currentPosition = new window.kakao.maps.LatLng(latitude, longitude);
                kakaoMapRef.current.panTo(currentPosition);
                kakaoMapRef.current.setLevel(3);
            },
            (error) => {
                console.error('Error getting current location:', error);
            },
            { timeout: 10000 }
        );
    };

    const handleViewModeChange = (event: React.SyntheticEvent, newValue: number) => {
        setViewMode(newValue);
    };

    const handleToggleFilterDrawer = () => {
        setFilterDrawerOpen(!filterDrawerOpen);
    };

    const resetFilters = () => {
        setFilterCropType('');
        setFilterSubdistrict('');
        setSearchTerm('');
    };

    // 색상 가져오기 함수
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
    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: alpha(theme.palette.background.default, 0.95)
        }}>
            {/* 앱바 */}
            <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        농지 지도
                    </Typography>

                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <TextField
                            placeholder="검색..."
                            size="small"
                            value={searchTerm}
                            onChange={handleSearch}
                            sx={{
                                width: 250,
                                mr: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '20px'
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Tooltip title="필터">
                        <IconButton
                            onClick={handleToggleFilterDrawer}
                            sx={{ mr: 1 }}
                            color={filterCropType || filterSubdistrict ? "primary" : "default"}
                        >
                            <Badge
                                color="error"
                                variant="dot"
                                invisible={!filterCropType && !filterSubdistrict}
                            >
                                <FilterIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {isMobile && (
                        <Tabs
                            value={viewMode}
                            onChange={handleViewModeChange}
                            aria-label="view mode"
                            indicatorColor="primary"
                            textColor="primary"
                            sx={{ ml: 1 }}
                        >
                            <Tab
                                icon={<ViewListIcon fontSize="small" />}
                                aria-label="list"
                                sx={{ minWidth: 40, p: 1 }}
                            />
                            <Tab
                                icon={<MapIcon fontSize="small" />}
                                aria-label="map"
                                sx={{ minWidth: 40, p: 1 }}
                            />
                        </Tabs>
                    )}
                </Toolbar>

                {/* 모바일 검색창 */}
                <Box sx={{
                    display: { xs: 'block', md: 'none' },
                    px: 2,
                    pb: 2,
                }}>
                    <TextField
                        placeholder="주소, 작물, 농가명 검색..."
                        fullWidth
                        size="small"
                        value={searchTerm}
                        onChange={handleSearch}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '20px'
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </AppBar>

            {/* 필드 상세 메뉴 */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        borderRadius: 2,
                        minWidth: 180
                    }
                }}
            >
                <MenuItem onClick={handleGoToDetail} sx={{ py: 1.5 }}>
                    <ListIcon sx={{ mr: 1.5, fontSize: 20 }} />
                    농가 상세 보기
                    <NavigateNext sx={{ ml: 'auto', color: 'text.secondary', fontSize: 18 }} />
                </MenuItem>
                <MenuItem
                    onClick={handleCallFarmer}
                    disabled={!selectedField?.phoneNumber}
                    sx={{ py: 1.5 }}
                >
                    <PhoneIcon sx={{ mr: 1.5, fontSize: 20 }} />
                    전화 걸기
                    <NavigateNext sx={{ ml: 'auto', color: 'text.secondary', fontSize: 18 }} />
                </MenuItem>
            </Menu>{/* 필터 드로어 */}
            <Drawer
                anchor="right"
                open={filterDrawerOpen}
                onClose={handleToggleFilterDrawer}
                PaperProps={{
                    sx: {
                        width: { xs: '80%', sm: 400 },
                        p: 3
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">필터 설정</Typography>
                    <IconButton onClick={handleToggleFilterDrawer}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <GrassIcon fontSize="small" sx={{ mr: 1 }} />
                        작물 유형
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                        <InputLabel id="crop-type-select-label">작물 선택</InputLabel>
                        <Select
                            labelId="crop-type-select-label"
                            value={filterCropType}
                            label="작물 선택"
                            onChange={handleCropTypeChange}
                        >
                            <MenuItem value="">전체</MenuItem>
                            {cropTypeOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                bgcolor: getCropColor(option.value),
                                                mr: 1
                                            }}
                                        />
                                        {option.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationCityIcon fontSize="small" sx={{ mr: 1 }} />
                        지역 필터
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                        <InputLabel id="subdistrict-select-label">지역 선택</InputLabel>
                        <Select
                            labelId="subdistrict-select-label"
                            value={filterSubdistrict}
                            label="지역 선택"
                            onChange={handleSubdistrictChange}
                        >
                            <MenuItem value="">전체</MenuItem>
                            {subdistrictOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        variant="outlined"
                        onClick={resetFilters}
                        startIcon={<TuneIcon />}
                    >
                        필터 초기화
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleToggleFilterDrawer}
                    >
                        적용하기
                    </Button>
                </Box>
            </Drawer>

            {/* 필터 표시 부분 */}
            {(filterCropType || filterSubdistrict) && (
                <Box sx={{
                    px: 2,
                    py: 1,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    bgcolor: alpha(theme.palette.primary.light, 0.1),
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    {filterCropType && (
                        <Chip
                            label={`작물: ${filterCropType}`}
                            onDelete={() => setFilterCropType('')}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{
                                borderRadius: '16px',
                                '& .MuiChip-label': { px: 1 }
                            }}
                        />
                    )}
                    {filterSubdistrict && (
                        <Chip
                            label={`지역: ${filterSubdistrict}`}
                            onDelete={() => setFilterSubdistrict('')}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{
                                borderRadius: '16px',
                                '& .MuiChip-label': { px: 1 }
                            }}
                        />
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <Typography variant="body2" color="text.secondary">
                        {filteredFields.length}개의 농지
                    </Typography>
                </Box>
            )}{/* 메인 콘텐츠 */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* 모바일 뷰 */}
                {isMobile ? (
                    <>
                        {/* 목록 뷰 */}
                        <Box
                            sx={{
                                display: viewMode === 0 ? 'block' : 'none',
                                height: '100%',
                                width: '100%',
                                overflow: 'auto',
                                p: 2
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                                농지 목록 ({filteredFields.length})
                            </Typography>

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : filteredFields.length === 0 ? (
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 4,
                                    bgcolor: 'background.paper',
                                    borderRadius: 2
                                }}>
                                    <Typography color="text.secondary">
                                        조건에 맞는 농지가 없습니다
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {filteredFields.flatMap((field) => {
                                        // 여러 위치 처리를 위한 로직
                                        const locations = field.locations && field.locations.length > 0
                                            ? field.locations
                                            : [{ id: field.id, flagNumber: 0, address: field.address, area: field.area, cropType: field.cropType }];

                                        return locations.map((location, locationIndex) => (
                                            <Grid size={{ xs: 12 }} key={`${field.id}-${location.id || locationIndex}`}>
                                                <Card
                                                    elevation={0}
                                                    variant="outlined"
                                                    sx={{
                                                        borderRadius: 2,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.primary.light, 0.05),
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                                                        }
                                                    }}
                                                    onClick={() => handleFieldItemClick(field)}
                                                >
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                                            <Avatar
                                                                sx={{
                                                                    bgcolor: getCropColor(location.cropType || field.cropType),
                                                                    width: 40,
                                                                    height: 40,
                                                                    mr: 2,
                                                                    position: 'relative'
                                                                }}
                                                            >
                                                                {location.flagNumber || '?'}
                                                                <Box sx={{
                                                                    position: 'absolute',
                                                                    top: -5,
                                                                    right: -5,
                                                                    width: 15,
                                                                    height: 15,
                                                                    borderRadius: '50%',
                                                                    bgcolor: getStageColor(field.currentStage?.stage || '계약예정'),
                                                                    border: '2px solid white'
                                                                }} />
                                                            </Avatar>

                                                            <Box sx={{ flex: 1 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                                        {field.farmerName || '농지명 없음'}
                                                                        {locations.length > 1 &&
                                                                            <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                                                                (위치 {locationIndex + 1}/{locations.length})
                                                                            </Typography>
                                                                        }
                                                                    </Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        aria-label="more options"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation(); // 카드 클릭 이벤트 방지
                                                                            handleMenuClick(e, field);
                                                                        }}
                                                                    >
                                                                        <MoreVert />
                                                                    </IconButton>
                                                                </Box>

                                                                {field.phoneNumber && (
                                                                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                                                                        <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                                                        {field.phoneNumber || '010-0000-0000'}
                                                                    </Typography>
                                                                )}

                                                                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                                                                    {location.address.full || field.address.full}
                                                                </Typography>

                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexWrap: 'wrap',
                                                                    gap: 1
                                                                }}>
                                                                    <Chip
                                                                        label={location.cropType || field.cropType}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: alpha(getCropColor(location.cropType || field.cropType), 0.1),
                                                                            color: getCropColor(location.cropType || field.cropType),
                                                                            fontWeight: 500,
                                                                            borderRadius: '12px'
                                                                        }}
                                                                    />
                                                                    <Chip
                                                                        label={`${location.area.value || field.area.value} ${location.area.unit || field.area.unit}`}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                                                                            color: theme.palette.text.secondary,
                                                                            borderRadius: '12px'
                                                                        }}
                                                                    />
                                                                    <Chip
                                                                        label={field.currentStage?.stage || '계약예정'}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: alpha(getStageColor(field.currentStage?.stage || '계약예정'), 0.1),
                                                                            color: getStageColor(field.currentStage?.stage || '계약예정'),
                                                                            fontWeight: 500,
                                                                            borderRadius: '12px'
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ));
                                    })}
                                </Grid>
                            )}
                        </Box>{/* 지도 뷰 */}
                        <Box
                            sx={{
                                display: viewMode === 1 ? 'block' : 'none',
                                height: '100%',
                                width: '100%',
                                position: 'relative'
                            }}
                        >
                            {(loading || !mapLoaded) && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                                    zIndex: 20,
                                }}>
                                    <CircularProgress />
                                </Box>
                            )}
                            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

                            {/* 지도 컨트롤 */}
                            <Box sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                            }}>
                                <IconButton
                                    onClick={handleZoomIn}
                                    sx={{
                                        bgcolor: 'white',
                                        boxShadow: 2,
                                        '&:hover': { bgcolor: 'white' }
                                    }}
                                    size="small"
                                >
                                    <ZoomInIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    onClick={handleZoomOut}
                                    sx={{
                                        bgcolor: 'white',
                                        boxShadow: 2,
                                        '&:hover': { bgcolor: 'white' }
                                    }}
                                    size="small"
                                >
                                    <ZoomOutIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    onClick={handleGoToCurrentLocation}
                                    sx={{
                                        bgcolor: 'white',
                                        boxShadow: 2,
                                        '&:hover': { bgcolor: 'white' }
                                    }}
                                    size="small"
                                >
                                    <MyLocationIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            {/* 필터링된 필드 아이템들을 하단에 카드로 표시 */}
                            <Box sx={{
                                position: 'absolute',
                                bottom: 16,
                                left: 16,
                                right: 16,
                                maxHeight: '30%',
                                overflow: 'auto',
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                boxShadow: 3,
                                p: 2
                            }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                    농지 목록 ({filteredFields.length})
                                </Typography>

                                <Box sx={{
                                    display: 'flex',
                                    gap: 1,
                                    overflowX: 'auto',
                                    pb: 1
                                }}>
                                    {filteredFields.flatMap((field) => {
                                        // 여러 위치 처리
                                        const locations = field.locations && field.locations.length > 0
                                            ? field.locations
                                            : [{ id: field.id, flagNumber: 0, address: field.address, area: field.area, cropType: field.cropType }];

                                        return locations.map((location, locationIndex) => (
                                            <Card
                                                key={`${field.id}-${location.id || locationIndex}`}
                                                variant="outlined"
                                                sx={{
                                                    minWidth: 200,
                                                    borderRadius: 2,
                                                    flexShrink: 0,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.light, 0.05),
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                                onClick={() => handleFieldItemClick(field)}
                                            >
                                                <CardContent sx={{ p: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: getCropColor(location.cropType || field.cropType),
                                                                width: 24,
                                                                height: 24,
                                                                mr: 1,
                                                                fontSize: '0.7rem'
                                                            }}
                                                        >
                                                            {location.flagNumber || '?'}
                                                        </Avatar>
                                                        <Typography variant="subtitle2" noWrap>
                                                            {field.farmerName || '농지명 없음'}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            aria-label="more options"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMenuClick(e, field);
                                                            }}
                                                            sx={{ ml: 'auto', p: 0.5 }}
                                                        >
                                                            <MoreVert fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                    {field.phoneNumber && (
                                                        <Typography variant="caption" sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            mb: 0.5,
                                                            color: 'text.secondary'
                                                        }}>
                                                            <PhoneIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                                            {field.phoneNumber}
                                                        </Typography>
                                                    )}
                                                    <Chip
                                                        label={field.currentStage?.stage || '계약예정'}
                                                        size="small"
                                                        sx={{
                                                            mt: 0.5,
                                                            bgcolor: alpha(getStageColor(field.currentStage?.stage || '계약예정'), 0.1),
                                                            color: getStageColor(field.currentStage?.stage || '계약예정'),
                                                            fontWeight: 500,
                                                            borderRadius: '12px',
                                                            fontSize: '0.7rem'
                                                        }}
                                                    />
                                                </CardContent>
                                            </Card>
                                        ));
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    </>
                ) : (// 데스크톱 뷰 - 지도와 목록을 나란히 표시
                    <>
                        {/* 지도 영역 */}
                        <Box sx={{
                            flex: 2,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {(loading || !mapLoaded) && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                                    zIndex: 20,
                                }}>
                                    <CircularProgress />
                                </Box>
                            )}
                            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

                            {/* 지도 컨트롤 */}
                            <Box sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                            }}>
                                <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <IconButton
                                        onClick={handleZoomIn}
                                        sx={{
                                            bgcolor: 'white',
                                            borderRadius: 0,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.1) }
                                        }}
                                        size="small"
                                    >
                                        <ZoomInIcon fontSize="small" />
                                    </IconButton>
                                </Paper>
                                <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <IconButton
                                        onClick={handleZoomOut}
                                        sx={{
                                            bgcolor: 'white',
                                            borderRadius: 0,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.1) }
                                        }}
                                        size="small"
                                    >
                                        <ZoomOutIcon fontSize="small" />
                                    </IconButton>
                                </Paper>
                                <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <IconButton
                                        onClick={handleGoToCurrentLocation}
                                        sx={{
                                            bgcolor: 'white',
                                            borderRadius: 0,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.1) }
                                        }}
                                        size="small"
                                    >
                                        <MyLocationIcon fontSize="small" />
                                    </IconButton>
                                </Paper>
                                <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <IconButton
                                        onClick={handleToggleFilterDrawer}
                                        sx={{
                                            bgcolor: 'white',
                                            borderRadius: 0,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.1) },
                                            color: filterCropType || filterSubdistrict ? theme.palette.primary.main : 'inherit'
                                        }}
                                        size="small"
                                    >
                                        <Badge
                                            color="error"
                                            variant="dot"
                                            invisible={!filterCropType && !filterSubdistrict}
                                        >
                                            <LayersIcon fontSize="small" />
                                        </Badge>
                                    </IconButton>
                                </Paper>
                            </Box>
                        </Box>{/* 목록 영역 */}
                        <Box sx={{
                            flex: 1,
                            overflow: 'auto',
                            borderLeft: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Box sx={{
                                p: 2,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    농지 목록 ({filteredFields.length})
                                </Typography>
                            </Box>

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, flex: 1 }}>
                                    <CircularProgress />
                                </Box>
                            ) : filteredFields.length === 0 ? (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    py: 4,
                                    flex: 1
                                }}>
                                    <PlaceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                    <Typography color="text.secondary" variant="body2">
                                        조건에 맞는 농지가 없습니다
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={resetFilters}
                                        sx={{ mt: 2 }}
                                    >
                                        필터 초기화
                                    </Button>
                                </Box>
                            ) : (
                                <List sx={{ p: 0, flex: 1 }}>
                                    {filteredFields.flatMap((field) => {
                                        // 여러 위치 처리를 위한 로직
                                        const locations = field.locations && field.locations.length > 0
                                            ? field.locations
                                            : [{ id: field.id, flagNumber: 0, address: field.address, area: field.area, cropType: field.cropType }];

                                        return locations.map((location, locationIndex) => (
                                            <React.Fragment key={`${field.id}-${location.id || locationIndex}`}>
                                                <ListItemButton
                                                    onClick={() => handleFieldItemClick(field)}
                                                    sx={{
                                                        px: 2,
                                                        py: 1.5,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.primary.light, 0.05),
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                                                        <Badge
                                                            overlap="circular"
                                                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                            badgeContent={
                                                                <Box sx={{
                                                                    width: 12,
                                                                    height: 12,
                                                                    borderRadius: '50%',
                                                                    bgcolor: getStageColor(field.currentStage?.stage || '계약예정'),
                                                                    border: '2px solid white'
                                                                }} />
                                                            }
                                                        >
                                                            <Avatar
                                                                sx={{
                                                                    bgcolor: getCropColor(location.cropType || field.cropType),
                                                                    width: 36,
                                                                    height: 36,
                                                                    mr: 2,
                                                                    fontSize: '0.9rem'
                                                                }}
                                                            >
                                                                {location.flagNumber || '?'}
                                                            </Avatar>
                                                        </Badge>

                                                        <Box sx={{ flex: 1, ml: 2 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold">
                                                                {field.farmerName || '농지명 없음'}
                                                                {field.phoneNumber &&
                                                                    <Typography
                                                                        component="span"
                                                                        variant="body2"
                                                                        sx={{ ml: 1, color: 'text.secondary' }}
                                                                    >
                                                                        {field.phoneNumber || '010-0000-0000'}
                                                                    </Typography>
                                                                }
                                                                {locations.length > 1 &&
                                                                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                                                        (위치 {locationIndex + 1}/{locations.length})
                                                                    </Typography>
                                                                }
                                                            </Typography>

                                                            <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }} noWrap>
                                                                {location.address.full || field.address.full}
                                                            </Typography>

                                                            <Box sx={{
                                                                display: 'flex',
                                                                gap: 1
                                                            }}>
                                                                <Chip
                                                                    label={location.cropType || field.cropType}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: alpha(getCropColor(location.cropType || field.cropType), 0.1),
                                                                        color: getCropColor(location.cropType || field.cropType),
                                                                        fontWeight: 500,
                                                                        height: 20,
                                                                        '& .MuiChip-label': { px: 1 },
                                                                        borderRadius: '10px'
                                                                    }}
                                                                />
                                                                <Chip
                                                                    label={`${location.area.value || field.area.value} ${location.area.unit || field.area.unit}`}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: alpha(getStageColor(field.currentStage?.stage || '계약예정'), 0.1),
                                                                        color: getStageColor(field.currentStage?.stage || '계약예정'),
                                                                        fontWeight: 500,
                                                                        height: 20,
                                                                        '& .MuiChip-label': { px: 1 },
                                                                        borderRadius: '10px'
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Box>

                                                        <Box>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="more options"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // 리스트 아이템 클릭 이벤트 방지
                                                                    handleMenuClick(e, field);
                                                                }}
                                                                sx={{ ml: 1 }}
                                                            >
                                                                <MoreVert />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                </ListItemButton>
                                                <Divider component="li" />
                                            </React.Fragment>
                                        ));
                                    })}
                                </List>
                            )}
                        </Box>
                    </>
                )}
            </Box>{/* 모바일에서 하단에 고정 액션 버튼 */}
            {isMobile && (
                <Fab
                    color="primary"
                    aria-label="현재 위치"
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        display: viewMode === 1 ? 'flex' : 'none'
                    }}
                    onClick={handleGoToCurrentLocation}
                >
                    <MyLocationIcon />
                </Fab>
            )}

            {/* 작업 단계 레전드 (범례) */}
            <Paper
                elevation={2}
                sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    maxWidth: 200,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    visibility: { xs: viewMode === 1 ? 'visible' : 'hidden', md: 'visible' }
                }}
            >
                <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5 }}>작업 단계</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {stageOptions.map((option) => (
                        <Box
                            key={option.value}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mr: 1,
                                mb: 0.5
                            }}
                        >
                            <Box
                                sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: getStageColor(option.value),
                                    mr: 0.5
                                }}
                            />
                            <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                                {option.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
};

export default FieldMap;