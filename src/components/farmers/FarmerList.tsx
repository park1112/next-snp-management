// src/components/farmers/FarmerList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Grid,
    Divider,
    InputAdornment,
    Chip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Pagination,
    IconButton,
    Menu,
    ListItemIcon,
    ListItemText,

} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Add as AddIcon,
    Phone as PhoneIcon,
    Place as PlaceIcon,
    Business as BusinessIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    FormatListBulleted as ListIcon,
    Map as MapIcon
} from '@mui/icons-material';
import { Farmer } from '@/types';
import { getFarmers, searchFarmers, getSubdistricts } from '@/services/firebase/farmerService';
import KakaoSimpleMap from '../KakaoSimpleMap';

interface FarmerListProps {
    initialFarmers?: Farmer[];
}

const FarmerList: React.FC<FarmerListProps> = ({ initialFarmers = [] }) => {
    const router = useRouter();

    // States
    const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchType, setSearchType] = useState<'name' | 'phoneNumber' | 'subdistrict'>('name');
    const [searchSubmitted, setSearchSubmitted] = useState<boolean>(false);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [filterSubdistrict, setFilterSubdistrict] = useState<string>('');
    const [subdistrictOptions, setSubdistrictOptions] = useState<{ value: string; label: string }[]>([]);
    const [isMapView, setIsMapView] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage] = useState<number>(10);

    // Context menu state
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

    // Load farmers on mount
    useEffect(() => {
        const loadFarmers = async () => {
            try {
                setLoading(true);
                const data = await getFarmers();
                setFarmers(data);

                // Load subdistricts for filter
                const subdistricts = await getSubdistricts();
                setSubdistrictOptions(
                    subdistricts.map((item: string) => ({ value: item, label: item }))
                );
            } catch (error) {
                console.error('Error loading farmers:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFarmers();
    }, []);

    // Filtered farmers
    const filteredFarmers = React.useMemo(() => {
        let result = [...farmers];

        // Apply subdistrict filter
        if (filterSubdistrict) {
            result = result.filter(farmer => farmer.address.subdistrict === filterSubdistrict);
        }

        return result;
    }, [farmers, filterSubdistrict]);

    // Pagination
    const paginatedFarmers = React.useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredFarmers.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredFarmers, page, rowsPerPage]);

    // Search handler
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            const data = await getFarmers();
            setFarmers(data);
            setSearchSubmitted(false);
            return;
        }

        setLoading(true);
        try {
            const results = await searchFarmers(searchType, searchTerm);
            setFarmers(results);
            setSearchSubmitted(true);
            setPage(1);
        } catch (error) {
            console.error('Error searching farmers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reset search
    const handleResetSearch = async () => {
        if (searchSubmitted) {
            setLoading(true);
            try {
                const data = await getFarmers();
                setFarmers(data);
                setSearchTerm('');
                setSearchSubmitted(false);
                setPage(1);
            } catch (error) {
                console.error('Error resetting search:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Toggle view mode
    const toggleViewMode = () => {
        setIsMapView(!isMapView);
    };

    // Handle context menu
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, farmerId: string) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedFarmerId(farmerId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedFarmerId(null);
    };

    // Pagination handler
    const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    // Context menu actions
    const handleViewFarmer = () => {
        if (selectedFarmerId) {
            router.push(`/farmers/${selectedFarmerId}`);
        }
        handleMenuClose();
    };

    const handleEditFarmer = () => {
        if (selectedFarmerId) {
            router.push(`/farmers/${selectedFarmerId}/edit`);
        }
        handleMenuClose();
    };

    const handleDeleteFarmer = () => {
        if (selectedFarmerId) {
            // Implement delete confirmation dialog
            console.log('Delete farmer:', selectedFarmerId);
        }
        handleMenuClose();
    };

    return (
        <Box>
            {/* Header and actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    농가 관리
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={isMapView ? <ListIcon /> : <MapIcon />}
                        onClick={toggleViewMode}
                    >
                        {isMapView ? '목록 보기' : '지도 보기'}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/farmers/add')}
                    >
                        농가 등록
                    </Button>
                </Box>
            </Box>

            {/* Search and filters */}
            <Card elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 7 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>검색 유형</InputLabel>
                                    <Select
                                        value={searchType}
                                        label="검색 유형"
                                        onChange={(e) => setSearchType(e.target.value as 'name' | 'phoneNumber' | 'subdistrict')}
                                    >
                                        <MenuItem value="name">이름</MenuItem>
                                        <MenuItem value="phoneNumber">전화번호</MenuItem>
                                        <MenuItem value="subdistrict">면단위</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`${searchType === 'name' ? '농가 이름' : searchType === 'phoneNumber' ? '전화번호' : '면단위'} 검색...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchSubmitted && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={handleResetSearch}>
                                                    <Chip
                                                        label="초기화"
                                                        size="small"
                                                        onDelete={handleResetSearch}
                                                    />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSearch}
                                    sx={{ minWidth: 80 }}
                                >
                                    검색
                                </Button>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<FilterListIcon />}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    필터
                                </Button>
                                <FormControl sx={{ minWidth: 150 }} size="small">
                                    <InputLabel>정렬</InputLabel>
                                    <Select
                                        value="name"
                                        label="정렬"
                                    >
                                        <MenuItem value="name">이름순</MenuItem>
                                        <MenuItem value="latest">최근 등록순</MenuItem>
                                        <MenuItem value="subdistrict">면단위순</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>

                        {/* Filters */}
                        {showFilters && (
                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <FormControl sx={{ minWidth: 200 }} size="small">
                                        <InputLabel>면단위</InputLabel>
                                        <Select
                                            value={filterSubdistrict}
                                            label="면단위"
                                            onChange={(e) => setFilterSubdistrict(e.target.value)}
                                        >
                                            <MenuItem value="">전체</MenuItem>
                                            {subdistrictOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>

            {/* Results count */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    총 {filteredFarmers.length}개의 농가
                    {searchSubmitted && (
                        <Typography component="span" variant="body2" color="primary.main" sx={{ ml: 1 }}>
                            (검색 결과)
                        </Typography>
                    )}
                </Typography>
            </Box>

            {/* Loading indicator */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* No results */}
            {!loading && filteredFarmers.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {searchSubmitted
                            ? '검색 결과가 없습니다.'
                            : '등록된 농가가 없습니다.'}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/farmers/add')}
                    >
                        농가 등록
                    </Button>
                </Box>
            )}

            {/* Farmer list */}
            {!loading && filteredFarmers.length > 0 && !isMapView && (
                <Grid container spacing={2}>
                    {paginatedFarmers.map((farmer) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={farmer.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 2,
                                    position: 'relative',
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        '& .actionButton': {
                                            opacity: 1,
                                        },
                                    },
                                    cursor: 'pointer',
                                }}
                                onClick={() => router.push(`/farmers/${farmer.id}`)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                                            {farmer.name}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            sx={{
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease-in-out',
                                            }}
                                            className="actionButton"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMenuOpen(e, farmer.id);
                                            }}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {farmer.phoneNumber}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <PlaceIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {farmer.address.subdistrict}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <BusinessIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {farmer.paymentGroup}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mt: 'auto', pt: 2 }}>
                                        <Chip
                                            size="small"
                                            label={`농지 ${farmer.fields?.length || 0}개`}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ mr: 1 }}
                                        />
                                        {farmer.activeContracts ? (
                                            <Chip
                                                size="small"
                                                label={`계약 ${farmer.activeContracts}건`}
                                                color="success"
                                                variant="outlined"
                                            />
                                        ) : null}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Map view */}
            {!loading && filteredFarmers.length > 0 && isMapView && (
                <Box
                    sx={{
                        height: 500,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    {paginatedFarmers.some(farmer =>
                        farmer.address?.coordinates?.latitude &&
                        farmer.address?.coordinates?.longitude
                    ) ? (
                        <KakaoSimpleMap
                            address={paginatedFarmers[0].address.full}
                            latitude={paginatedFarmers[0].address?.coordinates?.latitude}
                            longitude={paginatedFarmers[0].address?.coordinates?.longitude}
                            zoom={3}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                bgcolor: '#f1f3f5',
                            }}
                        >
                            <Typography variant="body1" gutterBottom>
                                좌표 정보가 있는 농가가 없습니다.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                농가 등록 시 주소를 정확히 입력하면 지도에 표시됩니다.
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Pagination */}
            {filteredFarmers.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={Math.ceil(filteredFarmers.length / rowsPerPage)}
                        page={page}
                        onChange={handleChangePage}
                        color="primary"
                    />
                </Box>
            )}

            {/* Context menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { borderRadius: 2, width: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
                }}
            >
                <MenuItem onClick={handleViewFarmer}>
                    <ListItemIcon>
                        <ViewIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>상세 보기</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEditFarmer}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>수정</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteFarmer} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>삭제</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default FarmerList;