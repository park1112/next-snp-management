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
} from '@mui/icons-material';
import { Field } from '@/types';
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
    const DEFAULT_ZOOM = 3;

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
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        const bounds = new kakao.maps.LatLngBounds();
        let hasValidCoordinates = false;

        for (const field of fields) {
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

                // 마커 이미지를 더 모던하게 변경
                const markerColors: Record<string, string> = {
                    '고구마': '#FF6B6B',
                    '감자': '#4ECDC4',
                    '양파': '#FFD166',
                    '마늘': '#6A0572',
                    '배추': '#1A535C',
                    '무': '#FF9F1C',
                    '기타': '#7B68EE'
                };

                const markerColor = markerColors[field.cropType] || markerColors['기타'];
                const customContent = `
                    <div style="position: relative; bottom: 40px;">
                        <div style="
                            background-color: ${markerColor};
                            color: white;
                            border-radius: 50%;
                            width: 32px;
                            height: 32px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            font-size: 12px;
                            font-weight: bold;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                        ">
                            ${field.cropType.substring(0, 1)}
                        </div>
                    </div>
                `;

                const customOverlay = new kakao.maps.CustomOverlay({
                    position,
                    content: customContent,
                    yAnchor: 1,
                });

                customOverlay.setMap(map);
                markersRef.current.push(customOverlay);

                // 클릭 이벤트 추가
                kakao.maps.event.addListener(customOverlay, 'click', function () {
                    const content = `
                        <div style="padding: 15px; max-width: 300px; font-family: 'Noto Sans KR', sans-serif;">
                            <h4 style="margin-top: 0; color: #333; font-weight: bold;">${field.farmerName || '이름 없음'}</h4>
                            <p style="margin: 8px 0; color: #666; font-size: 14px;">
                                <strong>주소:</strong> ${field.address.full}
                            </p>
                            <p style="margin: 4px 0; color: #666; font-size: 14px;">
                                <strong>작물:</strong> ${field.cropType}
                            </p>
                            <p style="margin: 4px 0; color: #666; font-size: 14px;">
                                <strong>면적:</strong> ${field.area.value} ${field.area.unit}
                            </p>
                            <button onclick="window.location.href='/fields/${field.id}'" 
                                style="
                                    background-color: #3f51b5; 
                                    color: white; 
                                    border: none;
                                    padding: 8px 12px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    margin-top: 8px;
                                    font-size: 13px;
                                "
                            >
                                상세 보기
                            </button>
                        </div>
                    `;

                    const infowindow = new kakao.maps.InfoWindow({
                        content: content,
                        removable: true
                    });

                    infowindow.open(map, position);
                    map.panTo(position);
                });

                bounds.extend(position);
                hasValidCoordinates = true;
            }
        }

        if (hasValidCoordinates && fields.length > 0) {
            map.setBounds(bounds);
            if (map.getLevel() < 1) {
                map.setLevel(1);
            }
        }
    }, []);

    useEffect(() => {
        if (mapLoaded && kakaoMapRef.current && filteredFields.length > 0) {
            addMarkers(filteredFields);
        }
    }, [filteredFields, mapLoaded, addMarkers]);

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

            {/* 필터 드로어 */}
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
            )}

            {/* 메인 콘텐츠 */}
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
                                    {filteredFields.map((field) => (
                                        <Grid size={{ xs: 12 }} key={field.id}>
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
                                                                bgcolor: getCropColor(field.cropType),
                                                                width: 40,
                                                                height: 40,
                                                                mr: 2
                                                            }}
                                                        >
                                                            {field.cropType.substring(0, 1)}
                                                        </Avatar>

                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {field.farmerName || '농지명 없음'}
                                                            </Typography>

                                                            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                                                                {field.address.full}
                                                            </Typography>

                                                            <Box sx={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: 1
                                                            }}>
                                                                <Chip
                                                                    label={field.cropType}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: alpha(getCropColor(field.cropType), 0.1),
                                                                        color: getCropColor(field.cropType),
                                                                        fontWeight: 500,
                                                                        borderRadius: '12px'
                                                                    }}
                                                                />
                                                                <Chip
                                                                    label={`${field.area.value} ${field.area.unit}`}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: alpha(theme.palette.grey[500], 0.1),
                                                                        color: theme.palette.text.secondary,
                                                                        borderRadius: '12px'
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card></Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>

                        {/* 지도 뷰 */}
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
                                    {filteredFields.map((field) => (
                                        <Card
                                            key={field.id}
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
                                                <Typography variant="subtitle2" noWrap>
                                                    {field.farmerName || '농지명 없음'}
                                                </Typography>
                                                <Chip
                                                    label={field.cropType}
                                                    size="small"
                                                    sx={{
                                                        mt: 0.5,
                                                        bgcolor: alpha(getCropColor(field.cropType), 0.1),
                                                        color: getCropColor(field.cropType),
                                                        fontWeight: 500,
                                                        borderRadius: '12px',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </>
                ) : (
                    // 데스크톱 뷰 - 지도와 목록을 나란히 표시
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
                        </Box>

                        {/* 목록 영역 */}
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
                                    {filteredFields.map((field) => (
                                        <React.Fragment key={field.id}>
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
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: getCropColor(field.cropType),
                                                            width: 36,
                                                            height: 36,
                                                            mr: 2,
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        {field.cropType.substring(0, 1)}
                                                    </Avatar>

                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {field.farmerName || '농지명 없음'}
                                                        </Typography>

                                                        <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }} noWrap>
                                                            {field.address.full}
                                                        </Typography>

                                                        <Box sx={{
                                                            display: 'flex',
                                                            gap: 1
                                                        }}>
                                                            <Chip
                                                                label={field.cropType}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(getCropColor(field.cropType), 0.1),
                                                                    color: getCropColor(field.cropType),
                                                                    fontWeight: 500,
                                                                    height: 20,
                                                                    '& .MuiChip-label': { px: 1 },
                                                                    borderRadius: '10px'
                                                                }}
                                                            />
                                                            <Chip
                                                                label={`${field.area.value} ${field.area.unit}`}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.grey[500], 0.1),
                                                                    color: theme.palette.text.secondary,
                                                                    height: 20,
                                                                    '& .MuiChip-label': { px: 1 },
                                                                    borderRadius: '10px'
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </ListItemButton>
                                            <Divider component="li" />
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </>
                )}
            </Box>

            {/* 모바일에서 하단에 고정 액션 버튼 */}
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
        </Box>
    );
};

export default FieldMap;