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
    Tab,
    Tabs,
    DialogContent,
    DialogActions,
    Dialog,
    DialogTitle,
    Snackbar,
    Alert,
    Stack,
    Badge
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    AssignmentTurnedIn as CheckIcon,
    Flag as FlagIcon,
    Category as CategoryIcon
} from '@mui/icons-material';
import { Foreman, Schedule } from '@/types';
import { useSchedules } from '@/hooks/useSchedules';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getWorkers } from '@/services/firebase/workerService';
import { updateSchedule } from '@/services/firebase/scheduleService';
import { Worker as AppWorker, Driver } from '@/types';
import { getForemanCategories } from '@/services/firebase/workerService';

interface ScheduleListProps {
    farmerId?: string;
    workerId?: string;
    fieldId?: string;
    showCalendarView?: boolean;
}

type ScheduleStage = "예정" | "준비중" | "진행중" | "완료" | "취소";

const ScheduleList: React.FC<ScheduleListProps> = ({
    farmerId,
    workerId,
    fieldId,
    showCalendarView = false
}) => {
    const router = useRouter();

    // useSchedules 훅 사용
    const {
        schedules,
        isLoading,
        error,
        deleteSchedule,
        updateStage,
        refreshSchedules
    } = useSchedules(farmerId, workerId, fieldId);

    // 상태 변수들
    const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [stageFilter, setStageFilter] = useState<string>('');
    const [viewMode, setViewMode] = useState<string>(showCalendarView ? 'calendar' : 'list');
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage] = useState<number>(10);

    // 컨텍스트 메뉴 상태
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

    // 상태 추가
    const [stageDialogOpen, setStageDialogOpen] = useState(false);
    const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
    const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
    const [selectedScheduleForStage, setSelectedScheduleForStage] = useState<Schedule | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedWorker, setSelectedWorker] = useState('');
    const [availableWorkers, setAvailableWorkers] = useState<AppWorker[]>([]);

    // 카테고리 상태 관리
    const [categories, setCategories] = useState<Array<{ id: string, name: string }>>([]);
    const [categoryStageDialog, setCategoryStageDialog] = useState(false);
    const [selectedStage, setSelectedStage] = useState<string>('');

    // 알림 메시지 상태
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        severity: 'success' | 'info' | 'warning' | 'error',
        message: string
    }>({
        severity: 'info',
        message: ''
    });

    // 카테고리 로드
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const categoriesData = await getForemanCategories();
                if (Array.isArray(categoriesData)) {
                    setCategories(categoriesData.map(name => ({ id: name, name })));
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadCategories();
    }, []);

    // 필터링 효과
    useEffect(() => {
        let result = [...schedules];

        // 검색어 필터링
        if (searchTerm) {
            result = result.filter(schedule =>
                (schedule.farmerName && schedule.farmerName.includes(searchTerm)) ||
                (schedule.fieldName && schedule.fieldName.includes(searchTerm)) ||
                (schedule.workerName && schedule.workerName.includes(searchTerm))
            );
        }

        // 카테고리 유형 필터링
        if (typeFilter) {
            result = result.filter(schedule =>
                schedule.categorySchedules &&
                schedule.categorySchedules.some(cs => cs.categoryId === typeFilter)
            );
        }

        // 작업 상태 필터링
        if (stageFilter) {
            result = result.filter(schedule =>
                schedule.categorySchedules &&
                schedule.categorySchedules.some(cs => cs.stage === stageFilter)
            );
        }

        setFilteredSchedules(result);
        setPage(1); // 필터링 시 첫 페이지로 리셋
    }, [schedules, searchTerm, typeFilter, stageFilter]);

    // 페이지네이션
    const paginatedSchedules = React.useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredSchedules.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredSchedules, page, rowsPerPage]);

    // 페이지 변경 핸들러
    const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    // 컨텍스트 메뉴 핸들러
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, scheduleId: string) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedScheduleId(scheduleId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedScheduleId(null);
    };

    // 컨텍스트 메뉴 액션
    const handleViewSchedule = () => {
        if (selectedScheduleId) {
            router.push(`/schedules/${selectedScheduleId}`);
        }
        handleMenuClose();
    };

    const handleEditSchedule = () => {
        if (selectedScheduleId) {
            router.push(`/schedules/${selectedScheduleId}/edit`);
        }
        handleMenuClose();
    };

    const handleDeleteSchedule = async () => {
        if (selectedScheduleId) {
            try {
                await deleteSchedule(selectedScheduleId);
                // 삭제 성공 메시지
                setAlertMessage({
                    severity: 'success',
                    message: '작업 일정이 삭제되었습니다.'
                });
                setAlertOpen(true);
            } catch (error) {
                // 오류 처리
                console.error('Error deleting schedule:', error);
                setAlertMessage({
                    severity: 'error',
                    message: '작업 일정 삭제 중 오류가 발생했습니다.'
                });
                setAlertOpen(true);
            }
        }
        handleMenuClose();
    };

    // 작업 유형별 칩 색상
    const getTypeColor = (categoryId: string) => {
        // 간단한 해시 함수로 카테고리 ID를 색상으로 매핑
        const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
            '뽑기': 'primary',
            '자르기': 'secondary',
            '포장': 'success',
            '운송': 'warning',
            '수확': 'info'
        };

        return colorMap[categoryId] || 'default';
    };

    // 작업 상태별 칩 색상
    const getStageColor = (stage: string) => {
        switch (stage) {
            case '예정': return 'info';
            case '준비중': return 'warning';
            case '진행중': return 'primary';
            case '완료': return 'success';
            case '취소': return 'error';
            default: return 'default';
        }
    };

    // 카테고리별 작업 상태 업데이트 핸들러
    const handleCategoryStageUpdate = async (schedule: Schedule, categoryId: string, newStage: string) => {
        try {
            const updatedCategorySchedules = schedule.categorySchedules?.map(cs =>
                cs.categoryId === categoryId
                    ? { ...cs, stage: newStage as ScheduleStage }
                    : cs
            ) || [];

            await updateSchedule(schedule.id, {
                categorySchedules: updatedCategorySchedules
            });

            const categoryName = schedule.categorySchedules?.find(cs => cs.categoryId === categoryId)?.categoryName || categoryId;

            setAlertMessage({
                severity: 'success',
                message: `${categoryName} 작업이 ${newStage}(으)로 변경되었습니다.`
            });
            setAlertOpen(true);

            await refreshSchedules();
        } catch (error) {
            console.error('Error updating category stage:', error);
            setAlertMessage({
                severity: 'error',
                message: '작업 상태 변경 중 오류가 발생했습니다.'
            });
            setAlertOpen(true);
        }
    };

    // 작업 상태 다이얼로그 열기
    const openCategoryStageDialog = (schedule: Schedule, categoryId: string) => {
        setSelectedScheduleForStage(schedule);
        setSelectedCategoryId(categoryId);

        const currentStage = schedule.categorySchedules?.find(cs => cs.categoryId === categoryId)?.stage || '예정';
        setSelectedStage(currentStage);

        setCategoryStageDialog(true);
    };

    // 작업자 가져오기 함수
    const fetchAvailableWorkers = async (categoryId: string) => {
        try {
            const workers = await getWorkers() as AppWorker[];
            return workers.filter(worker => {
                if (worker.type === 'foreman') {
                    const foreman = worker as Foreman;
                    if (Array.isArray(foreman.foremanInfo.category.name)) {
                        return foreman.foremanInfo.category.name.includes(categoryId);
                    }
                }
                return false;
            });
        } catch (error) {
            console.error('Error fetching workers:', error);
            throw error;
        }
    };

    // 작업자 선택 다이얼로그 열기
    const openWorkerSelectionDialog = async (schedule: Schedule, categoryId: string) => {
        try {
            const workers = await fetchAvailableWorkers(categoryId);
            if (workers.length === 0) {
                setAlertMessage({
                    severity: 'warning',
                    message: `'${categoryId}' 유형에 맞는 작업자가 없습니다. 먼저 작업자를 등록해주세요.`
                });
                setAlertOpen(true);
                return;
            }

            setAvailableWorkers(workers);
            setSelectedScheduleForStage(schedule);
            setSelectedCategoryId(categoryId);
            setWorkerDialogOpen(true);
        } catch (error) {
            console.error('Error loading workers:', error);
            setAlertMessage({
                severity: 'error',
                message: '작업자 목록을 불러오는 데 실패했습니다.'
            });
            setAlertOpen(true);
        }
    };

    // 작업자 선택 처리
    const handleWorkerSelect = async () => {
        if (!selectedScheduleForStage || !selectedCategoryId || !selectedWorker) return;

        try {
            const updatedCategorySchedules = selectedScheduleForStage.categorySchedules?.map(cs =>
                cs.categoryId === selectedCategoryId
                    ? {
                        ...cs,
                        workerId: selectedWorker,
                        workerName: availableWorkers.find(w => w.id === selectedWorker)?.name || ''
                    }
                    : cs
            ) || [];

            await updateSchedule(selectedScheduleForStage.id, {
                categorySchedules: updatedCategorySchedules
            });

            setAlertMessage({
                severity: 'success',
                message: '작업자가 성공적으로 할당되었습니다.'
            });
            setAlertOpen(true);

            setWorkerDialogOpen(false);
            setSelectedWorker('');
            await refreshSchedules();
        } catch (error) {
            console.error('Error assigning worker:', error);
            setAlertMessage({
                severity: 'error',
                message: '작업자 할당 중 오류가 발생했습니다.'
            });
            setAlertOpen(true);
        }
    };

    // 작업 상태 변경 처리
    const handleStageChange = async () => {
        if (!selectedScheduleForStage || !selectedCategoryId || !selectedStage) return;

        try {
            // 작업 상태가 '예정'에서 '준비중'으로 변경될 때 작업자 확인
            const categorySchedule = selectedScheduleForStage.categorySchedules?.find(cs =>
                cs.categoryId === selectedCategoryId
            );

            const isChangingToPreparing = categorySchedule?.stage === '예정' && selectedStage === '준비중';

            if (isChangingToPreparing && !categorySchedule?.workerId) {
                // 작업자 선택 다이얼로그로 전환
                setCategoryStageDialog(false);
                openWorkerSelectionDialog(selectedScheduleForStage, selectedCategoryId);
                return;
            }

            // 일반적인 상태 변경 처리
            await handleCategoryStageUpdate(selectedScheduleForStage, selectedCategoryId, selectedStage);
            setCategoryStageDialog(false);
        } catch (error) {
            console.error('Error updating stage:', error);
            setAlertMessage({
                severity: 'error',
                message: '작업 상태 변경 중 오류가 발생했습니다.'
            });
            setAlertOpen(true);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Typography color="error">오류가 발생했습니다.</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* 헤더 및 액션 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    작업 일정 관리
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(
                        farmerId ? `/schedules/add?farmerId=${farmerId}` :
                            workerId ? `/schedules/add?workerId=${workerId}` :
                                fieldId ? `/schedules/add?fieldId=${fieldId}` :
                                    '/schedules/add'
                    )}
                >
                    작업 일정 등록
                </Button>
            </Box>

            {/* 검색 및 필터 */}
            <Card elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="농가, 농지, 작업자명 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>작업 카테고리</InputLabel>
                                <Select
                                    value={typeFilter}
                                    label="작업 카테고리"
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    {categories.map(category => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>작업 상태</InputLabel>
                                <Select
                                    value={stageFilter}
                                    label="작업 상태"
                                    onChange={(e) => setStageFilter(e.target.value)}
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    <MenuItem value="예정">예정</MenuItem>
                                    <MenuItem value="준비중">준비중</MenuItem>
                                    <MenuItem value="진행중">진행중</MenuItem>
                                    <MenuItem value="완료">완료</MenuItem>
                                    <MenuItem value="취소">취소</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 뷰 모드 전환 탭 */}
            {showCalendarView && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                        value={viewMode}
                        onChange={(e, newValue) => setViewMode(newValue)}
                        aria-label="view mode tabs"
                    >
                        <Tab label="목록 보기" value="list" />
                        <Tab label="캘린더 보기" value="calendar" />
                    </Tabs>
                </Box>
            )}

            {/* 결과 카운트 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    총 {filteredSchedules.length}개의 작업 일정
                </Typography>
            </Box>

            {/* 결과 없음 */}
            {!isLoading && filteredSchedules.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        등록된 작업 일정이 없습니다.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/schedules/add')}
                    >
                        작업 일정 등록
                    </Button>
                </Box>
            )}

            {/* 목록 뷰 */}
            {viewMode === 'list' && filteredSchedules.length > 0 && (
                <Grid container spacing={2}>
                    {paginatedSchedules.map((schedule) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={schedule.id}>
                            <Card>
                                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="h6" noWrap sx={{ maxWidth: '80%' }}>
                                            {schedule.fieldName || '농지 정보 없음'}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, schedule.id)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {schedule.farmerName || '농가 정보 없음'}
                                    </Typography>

                                    <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                        {schedule.fieldAddress || '주소 정보 없음'}
                                    </Typography>

                                    {/* 카테고리 칩 표시 */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                        {schedule.categorySchedules?.map((cs, index) => (
                                            <Chip
                                                key={`${schedule.id}-${cs.categoryId}-${index}`}
                                                size="small"
                                                label={cs.categoryName}
                                                color={getTypeColor(cs.categoryName)}
                                            />
                                        ))}
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* 카테고리별 상태 표시 */}
                                    {schedule.categorySchedules?.map((cs, index) => (
                                        <Box
                                            key={`status-${schedule.id}-${cs.categoryId}-${index}`}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 1,
                                                p: 1,
                                                bgcolor: 'background.default',
                                                borderRadius: 1
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {cs.categoryName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {cs.workerName ? `작업자: ${cs.workerName}` : '작업자 미배정'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {cs.scheduledDate?.start ? format(new Date(cs.scheduledDate.start), 'yyyy-MM-dd HH:mm') : '일정 미정'}
                                                </Typography>
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={getStageColor(cs.stage) as 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'}
                                                onClick={() => openCategoryStageDialog(schedule, cs.categoryId)}
                                            >
                                                {cs.stage}
                                            </Button>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* 페이지네이션 */}
            {viewMode === 'list' && filteredSchedules.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={Math.ceil(filteredSchedules.length / rowsPerPage)}
                        page={page}
                        onChange={handleChangePage}
                        color="primary"
                    />
                </Box>
            )}

            {/* 카테고리 상태 변경 다이얼로그 */}
            <Dialog open={categoryStageDialog} onClose={() => setCategoryStageDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>작업 상태 변경</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        {selectedScheduleForStage?.categorySchedules?.find(cs => cs.categoryId === selectedCategoryId)?.categoryName} 작업의 상태를 변경합니다.
                    </Typography>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>작업 상태</InputLabel>
                        <Select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value as string)}
                            label="작업 상태"
                        >
                            <MenuItem value="예정">예정</MenuItem>
                            <MenuItem value="준비중">준비중</MenuItem>
                            <MenuItem value="진행중">진행중</MenuItem>
                            <MenuItem value="완료">완료</MenuItem>
                            <MenuItem value="취소">취소</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCategoryStageDialog(false)}>취소</Button>
                    <Button
                        variant="contained"
                        onClick={handleStageChange}
                    >
                        변경하기
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 작업자 선택 다이얼로그 */}
            <Dialog open={workerDialogOpen} onClose={() => setWorkerDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>작업자 선택</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        {selectedScheduleForStage?.categorySchedules?.find(cs => cs.categoryId === selectedCategoryId)?.categoryName} 작업의 담당자를 선택하세요.
                    </Typography>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>작업자</InputLabel>
                        <Select
                            value={selectedWorker}
                            onChange={(e) => setSelectedWorker(e.target.value as string)}
                            label="작업자"
                        >
                            {availableWorkers.map((worker) => (
                                <MenuItem key={worker.id} value={worker.id}>
                                    {worker.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWorkerDialogOpen(false)}>취소</Button>
                    <Button
                        variant="contained"
                        onClick={handleWorkerSelect}
                        disabled={!selectedWorker}
                    >
                        선택 완료
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 컨텍스트 메뉴 */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { borderRadius: 2, width: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
                }}
            >
                <MenuItem onClick={handleViewSchedule}>
                    <ListItemIcon>
                        <ViewIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>상세 보기</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEditSchedule}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>수정</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteSchedule} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>삭제</ListItemText>
                </MenuItem>
            </Menu>

            {/* 알림 메시지 */}
            <Snackbar
                open={alertOpen}
                autoHideDuration={5000}
                onClose={() => setAlertOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setAlertOpen(false)}
                    severity={alertMessage.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {alertMessage.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ScheduleList