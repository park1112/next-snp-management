// src/components/workers/WorkerList.tsx
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
    useTheme,
    Tabs,
    Tab,
    Paper,
    Stack
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Sort as SortIcon,
    Add as AddIcon,
    Phone as PhoneIcon,
    Place as PlaceIcon,
    Person as PersonIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Engineering as EngineeringIcon,
    DirectionsCar as CarIcon,
    AccountBalance as BankIcon
} from '@mui/icons-material';
import { Worker, Foreman, Driver } from '@/types';
import { useWorkers } from '@/hooks/useWorkers';
import { useWorkCategories } from '@/hooks/common/useWorkCategories';
import { alpha } from '@mui/material/styles';
import { deleteWorker } from '@/services/firebase/workerService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// 탭 패널 컴포넌트
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
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
};

interface WorkerListProps {
    initialWorkers?: Worker[];
    defaultTab?: number;
}

const WorkerList: React.FC<WorkerListProps> = ({ initialWorkers = [], defaultTab = 0 }) => {
    const router = useRouter();
    const theme = useTheme();
    const { workers, foremen, drivers, isLoading, searchWorkers } = useWorkers();
    const { categories, isLoading: isCategoriesLoading } = useWorkCategories();

    // Tab state
    const [tabValue, setTabValue] = useState(defaultTab);

    // States
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchType, setSearchType] = useState<'name' | 'phoneNumber' | 'vehicleNumber'>('name');
    const [searchSubmitted, setSearchSubmitted] = useState<boolean>(false);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [sortOption, setSortOption] = useState<string>('nameAsc');
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage] = useState<number>(12);

    // Context menu state
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    // 탭 변경 핸들러
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        setPage(1); // 탭 변경 시 페이지 초기화
    };

    // 필터링 및 정렬된 작업자 목록
    const filteredForemen = React.useMemo(() => {
        let result = [...foremen];

        // 필터 적용
        if (filterCategory) {
            result = result.filter(foreman =>
                // 다중 카테고리 지원을 위해 workCategories 배열을 확인
                foreman.foremanInfo.category.id.includes(filterCategory)
            );
        }

        // 정렬 적용
        switch (sortOption) {
            case 'nameAsc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'nameDesc':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
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
        }

        return result;
    }, [foremen, filterCategory, sortOption]);

    const filteredDrivers = React.useMemo(() => {
        let result = [...drivers];

        // 필터 적용
        if (filterCategory) {
            result = result.filter(driver =>
                driver.driverInfo.category === filterCategory ||
                driver.driverInfo.vehicleType === filterCategory
            );
        }

        // 정렬 적용
        switch (sortOption) {
            case 'nameAsc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'nameDesc':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
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
        }

        return result;
    }, [drivers, filterCategory, sortOption]);

    // 페이지네이션
    const paginatedForemen = React.useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredForemen.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredForemen, page, rowsPerPage]);

    const paginatedDrivers = React.useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredDrivers.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredDrivers, page, rowsPerPage]);

    // 현재 활성화된 탭의 항목 수
    const getCurrentTabCount = () => {
        if (tabValue === 0) {
            return filteredForemen.length + filteredDrivers.length;
        } else if (tabValue === 1) {
            return filteredForemen.length;
        } else {
            return filteredDrivers.length;
        }
    };

    // 검색 핸들러
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchSubmitted(false);
            return;
        }

        setPage(1);
        setSearchSubmitted(true);

        try {
            // 이미 훅에서 가져온 데이터 내에서 필터링
            // 실제 애플리케이션에서는 서버측 검색이 더 효율적일 수 있음
        } catch (error) {
            console.error('Error searching workers:', error);
        }
    };

    // 검색 초기화
    const handleResetSearch = () => {
        setSearchTerm('');
        setSearchSubmitted(false);
        setPage(1);
    };

    // 정렬 변경 핸들러
    const handleSortChange = (event: SelectChangeEvent<string>) => {
        setSortOption(event.target.value);
    };

    // 카테고리 필터 변경 핸들러
    const handleCategoryFilterChange = (event: SelectChangeEvent<string>) => {
        setFilterCategory(event.target.value);
        setPage(1);
    };

    // 페이지 변경 핸들러
    const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    // 컨텍스트 메뉴 핸들러
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, workerId: string) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedWorkerId(workerId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedWorkerId(null);
    };

    // 작업자 액션 핸들러
    const handleViewWorker = () => {
        if (!selectedWorkerId) return;

        const worker = workers.find(w => w.id === selectedWorkerId);
        if (!worker) return;

        if (worker.type === 'foreman') {
            router.push(`/workers/foremen/${selectedWorkerId}`);
        } else {
            router.push(`/workers/drivers/${selectedWorkerId}`);
        }

        handleMenuClose();
    };

    const handleEditWorker = () => {
        if (!selectedWorkerId) return;

        const worker = workers.find(w => w.id === selectedWorkerId);
        if (!worker) return;

        if (worker.type === 'foreman') {
            router.push(`/workers/foremen/${selectedWorkerId}/edit`);
        } else {
            router.push(`/workers/drivers/${selectedWorkerId}/edit`);
        }

        handleMenuClose();
    };

    const handleDeleteWorker = async () => {
        if (!selectedWorkerId) return;

        try {
            await deleteWorker(selectedWorkerId);
            router.push('/workers/foremen');
        } catch (error) {
            console.error('Failed to delete foreman:', error);
        } finally {
            setDeleteDialogOpen(false);
        }
        handleMenuClose();
    };

    // 카테고리별 색상 지정
    const getCategoryColor = (category: string) => {
        const categoryColors: { [key: string]: string } = {
            '망담기': theme.palette.primary.main,
            '상차팀': theme.palette.secondary.main,
            '하차팀': theme.palette.info.main,
            '뽑기': theme.palette.success.main,
            '자르기': theme.palette.warning.main,
            '직영차량': theme.palette.primary.main,
            '콜차량': theme.palette.secondary.main,
            '팀': theme.palette.info.main,
            '5톤': theme.palette.success.main,
            '11톤': theme.palette.warning.main,
        };

        return categoryColors[category] || theme.palette.primary.main;
    };

    // 작업반장의 카테고리 이름들을 가져오는 함수
    const getForemanCategoryNames = (foreman: Foreman) => {
        if (!foreman.foremanInfo.categorysId || foreman.foremanInfo.categorysId.length === 0) {
            // 기존 방식의 단일 카테고리
            return foreman.foremanInfo.category ? [foreman.foremanInfo.category] : [];
        }

        // 새로운 방식의 다중 카테고리
        return foreman.foremanInfo.categorysId.map(categoryId => {
            const category = categories.find((c: { id: string; name: string }) => c.id === categoryId);
            return category ? category.name : '';
        }).filter(name => name); // 빈 문자열 제거
    };

    return (
        <Box>
            {/* Header and tabs */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        작업자 관리
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {tabValue === 1 && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => router.push('/workers/foremen/add')}
                            >
                                작업반장 등록
                            </Button>
                        )}
                        {tabValue === 2 && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => router.push('/workers/drivers/add')}
                            >
                                운송기사 등록
                            </Button>
                        )}
                        {tabValue === 0 && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={() => router.push('/workers/foremen/add')}
                                >
                                    작업반장 등록
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={() => router.push('/workers/drivers/add')}
                                >
                                    운송기사 등록
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="worker type tabs"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        label={`전체 작업자 (${workers.length})`}
                        icon={<PersonIcon />}
                        iconPosition="start"
                        id="worker-tab-0"
                        aria-controls="worker-tabpanel-0"
                    />
                    <Tab
                        label={`작업반장 (${foremen.length})`}
                        icon={<EngineeringIcon />}
                        iconPosition="start"
                        id="worker-tab-1"
                        aria-controls="worker-tabpanel-1"
                    />
                    <Tab
                        label={`운송기사 (${drivers.length})`}
                        icon={<CarIcon />}
                        iconPosition="start"
                        id="worker-tab-2"
                        aria-controls="worker-tabpanel-2"
                    />
                </Tabs>
            </Box>

            {/* Search and filters */}
            <Card elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>검색 유형</InputLabel>
                                    <Select
                                        value={searchType}
                                        label="검색 유형"
                                        onChange={(e) => setSearchType(e.target.value as 'name' | 'phoneNumber' | 'vehicleNumber')}
                                    >
                                        <MenuItem value="name">이름</MenuItem>
                                        <MenuItem value="phoneNumber">전화번호</MenuItem>
                                        {tabValue === 2 && (
                                            <MenuItem value="vehicleNumber">차량번호</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`${searchType === 'name'
                                        ? '이름 검색...'
                                        : searchType === 'phoneNumber'
                                            ? '전화번호 검색...'
                                            : '차량번호 검색...'
                                        }`}
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

                        <Grid size={{ xs: 12, md: 5 }}>
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
                                        <MenuItem value="nameAsc">이름 오름차순</MenuItem>
                                        <MenuItem value="nameDesc">이름 내림차순</MenuItem>
                                        <MenuItem value="latest">최근 등록순</MenuItem>
                                        <MenuItem value="oldest">오래된순</MenuItem>
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
                                        <InputLabel>구분</InputLabel>
                                        <Select
                                            value={filterCategory}
                                            label="구분"
                                            onChange={handleCategoryFilterChange}
                                        >
                                            <MenuItem value="">전체</MenuItem>
                                            {/* 작업반장 카테고리 필터링을 위한 옵션 */}
                                            {tabValue === 0 || tabValue === 1 ? (
                                                <>
                                                    {/* 기존 카테고리 목록 */}
                                                    <MenuItem value="망담기">망담기</MenuItem>
                                                    <MenuItem value="상차팀">상차팀</MenuItem>
                                                    <MenuItem value="하차팀">하차팀</MenuItem>
                                                    <MenuItem value="뽑기">뽑기</MenuItem>
                                                    <MenuItem value="자르기">자르기</MenuItem>

                                                    {/* 신규 작업 카테고리 목록 */}
                                                    {!isCategoriesLoading && categories.map((category: { id: string; name: string }) => (
                                                        <MenuItem key={category.id} value={category.id}>
                                                            {category.name}
                                                        </MenuItem>
                                                    ))}
                                                </>
                                            ) : null}
                                            {tabValue === 0 || tabValue === 2 ? (
                                                <>
                                                    <MenuItem value="직영차량">직영차량</MenuItem>
                                                    <MenuItem value="콜차량">콜차량</MenuItem>
                                                    <MenuItem value="팀">팀</MenuItem>
                                                    <MenuItem value="5톤">5톤</MenuItem>
                                                    <MenuItem value="11톤">11톤</MenuItem>
                                                </>
                                            ) : null}
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
                    총 {getCurrentTabCount()}명의 작업자
                    {searchSubmitted && (
                        <Typography component="span" variant="body2" color="primary.main" sx={{ ml: 1 }}>
                            (검색 결과)
                        </Typography>
                    )}
                </Typography>
            </Box>

            {/* Loading indicator */}
            {(isLoading || isCategoriesLoading) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* All Workers Tab Panel */}
            <TabPanel value={tabValue} index={0}>
                {!(isLoading || isCategoriesLoading) && workers.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            등록된 작업자가 없습니다.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => router.push('/workers/foremen/add')}
                            >
                                작업반장 등록
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => router.push('/workers/drivers/add')}
                            >
                                운송기사 등록
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {/* 반장과 기사를 함께 표시 */}
                        {[...paginatedForemen, ...paginatedDrivers].map((worker) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={worker.id}>
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
                                    onClick={() => {
                                        if (worker.type === 'foreman') {
                                            router.push(`/workers/foremen/${worker.id}`);
                                        } else {
                                            router.push(`/workers/drivers/${worker.id}`);
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                    {worker.name}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={worker.type === 'foreman' ? '작업반장' : '운송기사'}
                                                    color={worker.type === 'foreman' ? 'primary' : 'secondary'}
                                                    sx={{ mb: 1 }}
                                                />
                                            </Box>
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s ease-in-out',
                                                }}
                                                className="actionButton"
                                                onClick={(e) => handleMenuOpen(e, worker.id)}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {worker.phoneNumber}
                                            </Typography>
                                        </Box>

                                        {worker.type === 'foreman' ? (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <EngineeringIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                    <Box>
                                                        {/* 작업 카테고리 표시 - 신규 다중 카테고리 지원 */}
                                                        {getForemanCategoryNames(worker as Foreman).length > 0 ? (
                                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                                {getForemanCategoryNames(worker as Foreman).map((catName, index) => (
                                                                    <Chip
                                                                        key={index}
                                                                        label={typeof catName === 'string' ? catName : catName.name}
                                                                        size="small"
                                                                        sx={{
                                                                            fontSize: '0.65rem',
                                                                            height: '20px'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                                분류 없음
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </>
                                        ) : (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {(worker as Driver).driverInfo.vehicleNumber} ({(worker as Driver).driverInfo.vehicleType})
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <PersonIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {(worker as Driver).driverInfo.category}
                                                    </Typography>
                                                </Box>
                                            </>
                                        )}

                                        {worker.bankInfo?.bankName && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <BankIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {worker.bankInfo.bankName} {worker.bankInfo.accountNumber.slice(-4).padStart(worker.bankInfo.accountNumber.length, '*')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Pagination for all workers */}
                {(filteredForemen.length + filteredDrivers.length > rowsPerPage) && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={Math.ceil((filteredForemen.length + filteredDrivers.length) / rowsPerPage)}
                            page={page}
                            onChange={handleChangePage}
                            color="primary"
                        />
                    </Box>
                )}
            </TabPanel>

            {/* Foremen Tab Panel */}
            <TabPanel value={tabValue} index={1}>
                {!(isLoading || isCategoriesLoading) && filteredForemen.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {searchSubmitted
                                ? '검색 결과가 없습니다.'
                                : '등록된 작업반장이 없습니다.'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => router.push('/workers/foremen/add')}
                        >
                            작업반장 등록
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {paginatedForemen.map((foreman) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={foreman.id}>
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
                                    onClick={() => router.push(`/workers/foremen/${foreman.id}`)}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                {foreman.name}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s ease-in-out',
                                                }}
                                                className="actionButton"
                                                onClick={(e) => handleMenuOpen(e, foreman.id)}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {foreman.phoneNumber}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <EngineeringIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Box>
                                                {/* 작업 카테고리 표시 - 신규 다중 카테고리 지원 */}
                                                {getForemanCategoryNames(foreman).length > 0 ? (
                                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                                        {getForemanCategoryNames(foreman).map((catName, index) => (
                                                            <Chip
                                                                key={index}
                                                                label={typeof catName === 'string' ? catName : catName.name}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: '0.65rem',
                                                                    height: '20px'
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        분류 없음
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {foreman.bankInfo?.bankName && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <BankIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {foreman.bankInfo.bankName} {foreman.bankInfo.accountNumber.slice(-4).padStart(foreman.bankInfo.accountNumber.length, '*')}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Divider sx={{ my: 1 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                단가
                                            </Typography>
                                            <Typography variant="body2">
                                                {foreman.foremanInfo.rates.detailedRates && foreman.foremanInfo.rates.detailedRates.length > 0
                                                    ? `시급 ${foreman.foremanInfo.rates.detailedRates[0].defaultPrice.toLocaleString()}원`
                                                    : foreman.foremanInfo.rates.detailedRates && foreman.foremanInfo.rates.detailedRates.length > 0
                                                        ? `일당 ${foreman.foremanInfo.rates.detailedRates[0].defaultPrice.toLocaleString()}원`
                                                        : '협의가격'}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Pagination for foremen */}
                {filteredForemen.length > rowsPerPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={Math.ceil(filteredForemen.length / rowsPerPage)}
                            page={page}
                            onChange={handleChangePage}
                            color="primary"
                        />
                    </Box>
                )}
            </TabPanel>

            {/* Drivers Tab Panel */}
            <TabPanel value={tabValue} index={2}>
                {!(isLoading || isCategoriesLoading) && filteredDrivers.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {searchSubmitted
                                ? '검색 결과가 없습니다.'
                                : '등록된 운송기사가 없습니다.'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => router.push('/workers/drivers/add')}
                        >
                            운송기사 등록
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {paginatedDrivers.map((driver) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={driver.id}>
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
                                    onClick={() => router.push(`/workers/drivers/${driver.id}`)}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                {driver.name}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s ease-in-out',
                                                }}
                                                className="actionButton"
                                                onClick={(e) => handleMenuOpen(e, driver.id)}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {driver.phoneNumber}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <CarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {driver.driverInfo.vehicleNumber} ({driver.driverInfo.vehicleType})
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PersonIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                            <Chip
                                                size="small"
                                                label={driver.driverInfo.category}
                                                sx={{
                                                    bgcolor: alpha(getCategoryColor(driver.driverInfo.category), 0.1),
                                                    color: getCategoryColor(driver.driverInfo.category),
                                                }}
                                            />
                                        </Box>

                                        {driver.bankInfo?.bankName && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <BankIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {driver.bankInfo.bankName} {driver.bankInfo.accountNumber.slice(-4).padStart(driver.bankInfo.accountNumber.length, '*')}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Divider sx={{ my: 1 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                기본 운송료
                                            </Typography>
                                            <Typography variant="body2">
                                                {driver.driverInfo.rates.baseRate > 0
                                                    ? `${driver.driverInfo.rates.baseRate.toLocaleString()}원`
                                                    : '협의가격'}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Pagination for drivers */}
                {filteredDrivers.length > rowsPerPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={Math.ceil(filteredDrivers.length / rowsPerPage)}
                            page={page}
                            onChange={handleChangePage}
                            color="primary"
                        />
                    </Box>
                )}
            </TabPanel>

            {/* Context menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { borderRadius: 2, width: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
                }}
            >
                <MenuItem onClick={handleViewWorker}>
                    <ListItemIcon>
                        <ViewIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>상세 보기</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEditWorker}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>수정</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteWorker} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>삭제</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default WorkerList;
