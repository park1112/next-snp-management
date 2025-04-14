// src/components/fields/FieldList.tsx
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
    SelectChangeEvent,
    CircularProgress,
    Pagination,
    IconButton,
    Menu,
    ListItemIcon,
    ListItemText,
    FormControlLabel,
    Switch,
    useTheme,
    Tooltip,
    Paper,
    Tab,
    Tabs
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Sort as SortIcon,
    Add as AddIcon,
    Phone as PhoneIcon,
    Place as PlaceIcon,
    Terrain as TerrainIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    FormatListBulleted as ListIcon,
    Map as MapIcon,
    Category as CategoryIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    TableRows as TableRowsIcon,
    Dashboard as DashboardIcon,
    Grass as GrassIcon,
    AccountBalance as AccountBalanceIcon,
    LocationCity as LocationCityIcon,
    Flag as FlagIcon,
} from '@mui/icons-material';
import { Field } from '@/types';
import { getFields, getCropTypes, deleteField } from '@/services/firebase/fieldService';
import { getSubdistricts } from '@/services/firebase/farmerService';
import { stageOptions } from '@/types';

import FieldMap from './FieldMap';

interface FieldListProps {
    initialFields?: Field[];
}

const FieldList: React.FC<FieldListProps> = ({ initialFields = [] }) => {
    const router = useRouter();
    const theme = useTheme();

    // View mode state
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');

    // States
    const [fields, setFields] = useState<Field[]>(initialFields);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchType, setSearchType] = useState<'farmer' | 'address' | 'crop'>('farmer');
    const [searchSubmitted, setSearchSubmitted] = useState<boolean>(false);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [filterCropType, setFilterCropType] = useState<string>('');
    const [filterStage, setFilterStage] = useState<string>('');
    const [filterSubdistrict, setFilterSubdistrict] = useState<string>('');
    const [sortOption, setSortOption] = useState<string>('latest');
    const [cropTypeOptions, setCropTypeOptions] = useState<{ value: string; label: string }[]>([]);
    const [subdistrictOptions, setSubdistrictOptions] = useState<{ value: string; label: string }[]>([]);
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage] = useState<number>(12);

    // Context menu state
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);



    // Load fields on mount
    useEffect(() => {
        const loadFields = async () => {
            try {
                setLoading(true);
                const data = await getFields();
                setFields(data);

                // Load crop types for filter
                const cropTypes = await getCropTypes();
                setCropTypeOptions(
                    cropTypes.map((item) => ({ value: item, label: item }))
                );

                // Load subdistricts for filter
                const subdistricts = await getSubdistricts();
                setSubdistrictOptions(
                    subdistricts.map((item: string) => ({ value: item, label: item }))
                );
            } catch (error) {
                console.error('Error loading fields:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFields();
    }, []);

    // Filtered and sorted fields
    const processedFields = React.useMemo(() => {
        let result = [...fields];

        // Apply crop type filter
        if (filterCropType) {
            result = result.filter(field => field.cropType === filterCropType);
        }

        // Apply stage filter
        if (filterStage) {
            result = result.filter(field => field.currentStage?.stage === filterStage);
        }

        // Apply subdistrict filter (requires joining with farmer data)
        if (filterSubdistrict) {
            // In a real app, this would need to be optimized with a proper data model
            // For now, we'll assume the field data includes the necessary farmer info
            result = result.filter(field => {
                const farmerInfo = fields.find(f => f.id === field.id)?.farmerName;
                return farmerInfo?.includes(filterSubdistrict);
            });
        }

        // Apply sorting
        switch (sortOption) {
            case 'latest':
                result.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                break;
            case 'oldest':
                result.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateA - dateB;
                });
                break;
            case 'harvestDate':
                result.sort((a, b) => {
                    const dateA = a.estimatedHarvestDate ? new Date(a.estimatedHarvestDate).getTime() : Infinity;
                    const dateB = b.estimatedHarvestDate ? new Date(b.estimatedHarvestDate).getTime() : Infinity;
                    return dateA - dateB;
                });
                break;
            case 'areaDesc':
                result.sort((a, b) => {
                    // 단위 변환이 필요할 수 있음
                    return (b.area?.value || 0) - (a.area?.value || 0);
                });
                break;
            case 'areaAsc':
                result.sort((a, b) => {
                    // 단위 변환이 필요할 수 있음
                    return (a.area?.value || 0) - (b.area?.value || 0);
                });
                break;
        }

        return result;
    }, [fields, filterCropType, filterStage, filterSubdistrict, sortOption]);

    // Pagination
    const paginatedFields = React.useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return processedFields.slice(startIndex, startIndex + rowsPerPage);
    }, [processedFields, page, rowsPerPage]);

    // Search handler
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            const data = await getFields();
            setFields(data);
            setSearchSubmitted(false);
            return;
        }

        setLoading(true);
        try {
            // 실제 구현에서는 백엔드 검색 API 호출
            // 여기서는 클라이언트 측 필터링으로 대체
            const allFields = await getFields();

            let results: Field[] = [];
            if (searchType === 'farmer') {
                results = allFields.filter(f =>
                    f.farmerName?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            } else if (searchType === 'address') {
                results = allFields.filter(f =>
                    f.address.full.toLowerCase().includes(searchTerm.toLowerCase())
                );
            } else if (searchType === 'crop') {
                results = allFields.filter(f =>
                    f.cropType.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setFields(results);
            setSearchSubmitted(true);
            setPage(1);
        } catch (error) {
            console.error('Error searching fields:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reset search
    const handleResetSearch = async () => {
        if (searchSubmitted) {
            setLoading(true);
            try {
                const data = await getFields();
                setFields(data);
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

    // Handle filter changes
    const handleCropTypeChange = (event: SelectChangeEvent<string>) => {
        setFilterCropType(event.target.value);
        setPage(1);
    };

    const handleStageChange = (event: SelectChangeEvent<string>) => {
        setFilterStage(event.target.value);
        setPage(1);
    };

    const handleSubdistrictChange = (event: SelectChangeEvent<string>) => {
        setFilterSubdistrict(event.target.value);
        setPage(1);
    };

    const handleSortChange = (event: SelectChangeEvent<string>) => {
        setSortOption(event.target.value);
    };

    // Toggle view mode
    const handleViewModeChange = (newMode: 'grid' | 'list' | 'map') => {
        setViewMode(newMode);
    };

    // Handle context menu
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, fieldId: string) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedFieldId(fieldId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedFieldId(null);
    };

    // Pagination handler
    const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    // Context menu actions
    const handleViewField = () => {
        if (selectedFieldId) {
            router.push(`/fields/${selectedFieldId}`);
        }
        handleMenuClose();
    };

    const handleEditField = () => {
        if (selectedFieldId) {
            router.push(`/fields/${selectedFieldId}/edit`);
        }
        handleMenuClose();
    };

    const handleDeleteField = async () => {
        if (selectedFieldId) {
            try {
                await deleteField(selectedFieldId);
                // 필드 목록 업데이트
                setFields(prevFields => prevFields.filter(field => field.id !== selectedFieldId));
            } catch (error) {
                console.error('Error deleting field:', error);
            }
        }
        handleMenuClose();
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

    // Crop color helper
    const getCropColor = (cropType: string) => {
        // Implement crop color logic based on cropType
        return 'default';
    };

    return (
        <Box>
            {/* Header and actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    농지 관리
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                        <Button
                            variant={viewMode === 'grid' ? 'contained' : 'text'}
                            color="primary"
                            startIcon={<DashboardIcon />}
                            onClick={() => handleViewModeChange('grid')}
                            sx={{ borderRadius: viewMode === 'grid' ? 1 : 0 }}
                        >
                            그리드
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'contained' : 'text'}
                            color="primary"
                            startIcon={<TableRowsIcon />}
                            onClick={() => handleViewModeChange('list')}
                            sx={{ borderRadius: viewMode === 'list' ? 1 : 0 }}
                        >
                            목록
                        </Button>
                        <Button
                            variant={viewMode === 'map' ? 'contained' : 'text'}
                            color="primary"
                            startIcon={<MapIcon />}
                            onClick={() => handleViewModeChange('map')}
                            sx={{ borderRadius: viewMode === 'map' ? 1 : 0 }}
                        >
                            지도
                        </Button>
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/fields/add')}
                    >
                        농지 등록
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
                                        onChange={(e) => setSearchType(e.target.value as 'farmer' | 'address' | 'crop')}
                                    >
                                        <MenuItem value="farmer">농가명</MenuItem>
                                        <MenuItem value="address">주소</MenuItem>
                                        <MenuItem value="crop">작물</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`${searchType === 'farmer' ? '농가명' : searchType === 'address' ? '주소' : '작물'} 검색...`}
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
                                        value={sortOption}
                                        label="정렬"
                                        onChange={handleSortChange}
                                    >
                                        <MenuItem value="latest">최근 등록순</MenuItem>
                                        <MenuItem value="oldest">오래된순</MenuItem>
                                        <MenuItem value="harvestDate">수확일순</MenuItem>
                                        <MenuItem value="areaDesc">면적 큰순</MenuItem>
                                        <MenuItem value="areaAsc">면적 작은순</MenuItem>
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
                                        <InputLabel>작물 종류</InputLabel>
                                        <Select
                                            value={filterCropType}
                                            label="작물 종류"
                                            onChange={handleCropTypeChange}
                                        >
                                            <MenuItem value="">전체</MenuItem>
                                            {cropTypeOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl sx={{ minWidth: 200 }} size="small">
                                        <InputLabel>작업 단계</InputLabel>
                                        <Select
                                            value={filterStage}
                                            label="작업 단계"
                                            onChange={handleStageChange}
                                        >
                                            <MenuItem value="">전체</MenuItem>
                                            {stageOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl sx={{ minWidth: 200 }} size="small">
                                        <InputLabel>면단위</InputLabel>
                                        <Select
                                            value={filterSubdistrict}
                                            label="면단위"
                                            onChange={handleSubdistrictChange}
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
                    총 {processedFields.length}개의 농지
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
            {!loading && processedFields.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {searchSubmitted
                            ? '검색 결과가 없습니다.'
                            : '등록된 농지가 없습니다.'}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/fields/add')}
                    >
                        농지 등록
                    </Button>
                </Box>
            )}

            {/* Grid view */}
            {!loading && processedFields.length > 0 && viewMode === 'grid' && (
                <Grid container spacing={2}>
                    {paginatedFields.map((field) => {
                        // 여러 위치 처리를 위한 로직
                        const locations = field.locations && field.locations.length > 0
                            ? field.locations
                            : [{
                                id: field.id,
                                flagNumber: 0,
                                address: field.address,
                                area: field.area,
                                cropType: field.cropType
                            }];

                        return locations.map((location, locationIndex) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={`${field.id}-${location.id || locationIndex}`}>
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
                                    onClick={() => router.push(`/fields/${field.id}`)}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <FlagIcon color="primary" sx={{ mr: 1 }} />
                                                <Typography variant="h6" fontWeight="bold" noWrap>
                                                    #{location.flagNumber || '번호없음'}
                                                    {locations.length > 1 && ` (${locationIndex + 1}/${locations.length})`}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s ease-in-out',
                                                }}
                                                className="actionButton"
                                                onClick={(e) => handleMenuOpen(e, field.id)}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PersonIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {field.farmerName || '농가명 없음'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {field.phoneNumber || '전화번호 없음'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PlaceIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {location.address.full || field.address.full}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <AccountBalanceIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {field.paymentGroup || '결제소속 없음'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <LocationCityIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {location.address.subdistrict || field.subdistrict || '면단위 없음'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <TerrainIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {location.area.value} {location.area.unit}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <GrassIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {location.cropType || field.cropType || '작물 없음'}
                                            </Typography>
                                        </Box>

                                        {field.estimatedHarvestDate && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    수확예정: {new Date(field.estimatedHarvestDate).toLocaleDateString('ko-KR')}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box sx={{ mt: 'auto', pt: 2 }}>
                                            <Chip
                                                size="small"
                                                label={field.currentStage?.stage || '계약예정'}
                                                color={getStageColor(field.currentStage?.stage || '계약예정')}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ));
                    })}
                </Grid>
            )}

            {/* List view */}
            {!loading && processedFields.length > 0 && viewMode === 'list' && (
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
                        {/* Table header */}
                        <Box sx={{ display: 'table-header-group', bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'table-row' }}>
                                <Box sx={{ display: 'table-cell', py: 2, px: 2, fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>깃발</Box>
                                <Box sx={{ display: 'table-cell', py: 2, px: 2, fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>농지 주소</Box>
                                <Box sx={{ display: 'table-cell', py: 2, px: 2, fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>농가명</Box>
                                <Box sx={{ display: 'table-cell', py: 2, px: 2, fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>작물</Box>
                                <Box sx={{ display: 'table-cell', py: 2, px: 2, fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>면적</Box>
                                <Box sx={{ display: 'table-cell', py: 2, px: 2, fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>단계</Box>
                                <Box sx={{ display: 'table-cell', py: 2, px: 2, fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>수확예정일</Box>
                                <Box sx={{ display: 'table-cell', py: 2, px: 2, fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>작업</Box>
                            </Box>
                        </Box>

                        {/* Table body */}
                        <Box sx={{ display: 'table-row-group' }}>
                            {paginatedFields.flatMap((field) => {
                                // 여러 위치 처리를 위한 로직
                                const locations = field.locations && field.locations.length > 0
                                    ? field.locations
                                    : [{
                                        id: field.id,
                                        flagNumber: 0,
                                        address: field.address,
                                        area: field.area,
                                        cropType: field.cropType
                                    }];

                                return locations.map((location, locationIndex) => (
                                    <Box
                                        key={`${field.id}-${location.id || locationIndex}`}
                                        sx={{
                                            display: 'table-row',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                        onClick={() => router.push(`/fields/${field.id}`)}
                                    >
                                        <Box sx={{ display: 'table-cell', py: 2, px: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <FlagIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                                                <Typography variant="body2">
                                                    #{location.flagNumber || '번호없음'}
                                                    {locations.length > 1 && ` (${locationIndex + 1}/${locations.length})`}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'table-cell', py: 2, px: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="body2" noWrap>{location.address.full || field.address.full}</Typography>
                                            {location.address.detail && (
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {location.address.detail}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'table-cell', py: 2, px: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="body2">{field.farmerName || '-'}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'table-cell', py: 2, px: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="body2">{location.cropType || field.cropType}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'table-cell', py: 2, px: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="body2">{location.area.value} {location.area.unit}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'table-cell', py: 2, px: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Chip
                                                size="small"
                                                label={field.currentStage?.stage || '계약예정'}
                                                color={getStageColor(field.currentStage?.stage || '계약예정')}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'table-cell', py: 2, px: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="body2">
                                                {field.estimatedHarvestDate
                                                    ? new Date(field.estimatedHarvestDate).toLocaleDateString('ko-KR')
                                                    : '-'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'table-cell', py: 2, px: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMenuOpen(e, field.id);
                                                }}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ));
                            })}
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Map view */}
            {!loading && processedFields.length > 0 && viewMode === 'map' && (
                <Box
                    sx={{
                        height: 'calc(100vh - 320px)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    {paginatedFields.some(field =>
                        field.address?.coordinates?.latitude &&
                        field.address?.coordinates?.longitude
                    ) ? (
                        <FieldMap

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
                                좌표 정보가 있는 농지가 없습니다.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                농지 등록 시 주소를 정확히 입력하면 지도에 표시됩니다.
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Pagination */}
            {processedFields.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={Math.ceil(processedFields.length / rowsPerPage)}
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
                <MenuItem onClick={handleViewField}>
                    <ListItemIcon>
                        <ViewIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>상세 보기</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEditField}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>수정</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteField} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>삭제</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default FieldList;