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
    Tabs
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
    AssignmentTurnedIn as CheckIcon
} from '@mui/icons-material';
import { Schedule } from '@/types';
import { useSchedules } from '@/hooks/useSchedules';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ScheduleListProps {
    farmerId?: string;
    workerId?: string;
    fieldId?: string;
    showCalendarView?: boolean;
}

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
        updateStage
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
        
        // 유형 필터링
        if (typeFilter) {
            result = result.filter(schedule => schedule.type === typeFilter);
        }
        
        // 상태 필터링
        if (stageFilter) {
            result = result.filter(schedule => schedule.stage.current === stageFilter);
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
            } catch (error) {
                // 오류 처리
                console.error('Error deleting schedule:', error);
            }
        }
        handleMenuClose();
    };

    // 작업 상태 업데이트 핸들러
    const handleUpdateStage = async (scheduleId: string, stage: string) => {
        try {
            await updateStage(scheduleId, stage);
            // 성공 메시지
        } catch (error) {
            // 오류 처리
            console.error('Error updating stage:', error);
        }
    };

    // 작업 유형별 칩 색상
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'pulling': return 'primary';
            case 'cutting': return 'secondary';
            case 'packing': return 'success';
            case 'transport': return 'warning';
            default: return 'default';
        }
    };

    // 작업 유형별 표시 텍스트
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'pulling': return '뽑기';
            case 'cutting': return '자르기';
            case 'packing': return '포장';
            case 'transport': return '운송';
            default: return type;
        }
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
                                <InputLabel>작업 유형</InputLabel>
                                <Select
                                    value={typeFilter}
                                    label="작업 유형"
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <MenuItem value="">전체</MenuItem>
                                    <MenuItem value="pulling">뽑기</MenuItem>
                                    <MenuItem value="cutting">자르기</MenuItem>
                                    <MenuItem value="packing">포장</MenuItem>
                                    <MenuItem value="transport">운송</MenuItem>
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
            {filteredSchedules.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {schedules.length === 0
                            ? '등록된 작업 일정이 없습니다.'
                            : '검색 결과가 없습니다.'}
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
            )}

            {/* 목록 뷰 */}
            {viewMode === 'list' && filteredSchedules.length > 0 && (
                <Grid container spacing={2}>
                    {paginatedSchedules.map((schedule) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={schedule.id}>
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
                                onClick={() => router.push(`/schedules/${schedule.id}`)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Chip
                                            size="small"
                                            label={getTypeLabel(schedule.type)}
                                            color={getTypeColor(schedule.type)}
                                            sx={{ mb: 1 }}
                                        />
                                        <IconButton
                                            size="small"
                                            sx={{
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease-in-out',
                                            }}
                                            className="actionButton"
                                            onClick={(e) => handleMenuOpen(e, schedule.id)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            작업 일시
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {schedule.scheduledDate.start && format(schedule.scheduledDate.start, 'yyyy-MM-dd HH:mm', { locale: ko })}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                            <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                                            작업자
                                        </Typography>
                                        <Typography variant="body1">
                                            {schedule.workerName || '배정 안됨'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                            <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
                                            작업 위치
                                        </Typography>
                                        <Typography variant="body1" noWrap>
                                            {schedule.fieldName ? `${schedule.fieldName} (${schedule.farmerName})` : '정보 없음'}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Chip
                                            size="small"
                                            label={schedule.stage.current}
                                            color={getStageColor(schedule.stage.current)}
                                        />
                                        {schedule.stage.current !== '완료' && schedule.stage.current !== '취소' && (
                                            <Button
                                                size="small"
                                                color="primary"
                                                startIcon={<CheckIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const nextStage = 
                                                        schedule.stage.current === '예정' ? '준비중' :
                                                        schedule.stage.current === '준비중' ? '진행중' : '완료';
                                                    handleUpdateStage(schedule.id, nextStage);
                                                }}
                                            >
                                                {schedule.stage.current === '예정' ? '준비중' :
                                                schedule.stage.current === '준비중' ? '진행중' : '완료'} 처리
                                            </Button>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* 캘린더 뷰 */}
            {viewMode === 'calendar' && filteredSchedules.length > 0 && (
                <Box>
                    {/* 캘린더 컴포넌트는 별도로 구현 필요 */}
                    <Typography variant="body1">캘린더 뷰는 ScheduleCalendar 컴포넌트에서 구현합니다.</Typography>
                </Box>
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
        </Box>
    );
};

export default ScheduleList;