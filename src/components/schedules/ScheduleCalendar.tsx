'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, momentLocalizer, Views, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Box,
    Typography,
    Paper,
    Tooltip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Info as InfoIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    MoreVert as MoreVertIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { useSchedules } from '@/hooks/useSchedules';
import { Schedule } from '@/types';

// 로컬라이저 설정
moment.locale('ko');
const localizer = momentLocalizer(moment);

interface ScheduleCalendarProps {
    farmerId?: string;
    workerId?: string;
    fieldId?: string;
}

// 이벤트 타입 정의
interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: Schedule;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ farmerId, workerId, fieldId }) => {
    const router = useRouter();
    
    // useSchedules 훅 사용
    const { 
        schedules, 
        isLoading, 
        error, 
        deleteSchedule, 
        updateStage
    } = useSchedules(farmerId, workerId, fieldId);

    // 캘린더 이벤트 상태
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    
    // 메뉴 상태
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [eventDialogOpen, setEventDialogOpen] = useState<boolean>(false);
    
    // 필터 상태
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [stageFilter, setStageFilter] = useState<string>('');

    // 스케줄 → 캘린더 이벤트 변환
    useEffect(() => {
        if (!schedules) return;
        
        const filteredSchedules = schedules.filter(schedule => {
            if (typeFilter && schedule.type !== typeFilter) return false;
            if (stageFilter && schedule.stage.current !== stageFilter) return false;
            return true;
        });
        
        const calendarEvents = filteredSchedules.map(schedule => {
            // 기본값 설정
            const startDate = schedule.scheduledDate.start || new Date();
            const endDate = schedule.scheduledDate.end || new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 기본 2시간
            
            const title = `${getTypeLabel(schedule.type)}: ${schedule.fieldName || ''} (${schedule.workerName || '미배정'})`;
            
            return {
                id: schedule.id,
                title,
                start: startDate,
                end: endDate,
                resource: schedule
            };
        });
        
        setEvents(calendarEvents);
    }, [schedules, typeFilter, stageFilter]);
    
    // 메뉴 핸들러
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, calendarEvent: CalendarEvent) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedEvent(calendarEvent);
    };
    
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };
    
    // 이벤트 액션 핸들러
    const handleViewSchedule = () => {
        if (selectedEvent) {
            router.push(`/schedules/${selectedEvent.id}`);
        }
        handleMenuClose();
    };
    
    const handleEditSchedule = () => {
        if (selectedEvent) {
            router.push(`/schedules/${selectedEvent.id}/edit`);
        }
        handleMenuClose();
    };
    
    const handleDeleteSchedule = async () => {
        if (selectedEvent) {
            try {
                await deleteSchedule(selectedEvent.id);
                // 성공 메시지
            } catch (error) {
                console.error('Error deleting schedule:', error);
            }
        }
        handleMenuClose();
    };
    
    const handleUpdateStage = async (scheduleId: string, stage: string) => {
        try {
            await updateStage(scheduleId, stage);
            // 성공 메시지
        } catch (error) {
            console.error('Error updating stage:', error);
        }
        handleMenuClose();
    };
    
    // 캘린더 이벤트 핸들러
    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setEventDialogOpen(true);
    };
    
    const handleSelectSlot = (slotInfo: SlotInfo) => {
        setSelectedDate(slotInfo.start);
        // 새 일정 등록 페이지로 이동하되 선택한 날짜 정보 포함
        const startDateISO = moment(slotInfo.start).format('YYYY-MM-DDTHH:mm');
        const endDateISO = moment(slotInfo.end).format('YYYY-MM-DDTHH:mm');
        
        const queryParams = new URLSearchParams();
        if (farmerId) queryParams.append('farmerId', farmerId);
        if (workerId) queryParams.append('workerId', workerId);
        if (fieldId) queryParams.append('fieldId', fieldId);
        queryParams.append('startDate', startDateISO);
        queryParams.append('endDate', endDateISO);
        
        router.push(`/schedules/add?${queryParams.toString()}`);
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
    
    // 이벤트 스타일 지정
    const eventStyleGetter = (event: CalendarEvent) => {
        const schedule = event.resource;
        let backgroundColor = '#3174ad'; // 기본 색상
        
        switch (schedule.type) {
            case 'pulling':
                backgroundColor = '#1976d2'; // primary
                break;
            case 'cutting':
                backgroundColor = '#9c27b0'; // secondary
                break;
            case 'packing':
                backgroundColor = '#2e7d32'; // success
                break;
            case 'transport':
                backgroundColor = '#ed6c02'; // warning
                break;
        }
        
        // 상태에 따라 불투명도 조절
        let opacity = 0.8;
        if (schedule.stage.current === '완료') {
            opacity = 0.6;
        } else if (schedule.stage.current === '취소') {
            opacity = 0.4;
        }
        
        return {
            style: {
                backgroundColor,
                opacity,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px'
            }
        };
    };
    
    // 이벤트 컴포넌트
    const EventComponent = ({ event }: { event: CalendarEvent }) => {
        const schedule = event.resource;
        
        return (
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: 'pointer'
            }}>
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {event.title}
                </Typography>
                <IconButton 
                    size="small" 
                    sx={{ color: 'white', p: 0.25 }}
                    onClick={(e) => handleMenuOpen(e, event)}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>
        );
    };
    
    // 툴바 커스터마이징
    const CustomToolbar = ({ label, onNavigate, onView }: any) => {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                p: 1
            }}>
                <Box>
                    <Button 
                        onClick={() => onNavigate('TODAY')}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                    >
                        오늘
                    </Button>
                    <Button 
                        onClick={() => onNavigate('PREV')}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                    >
                        이전
                    </Button>
                    <Button 
                        onClick={() => onNavigate('NEXT')}
                        variant="outlined"
                        size="small"
                    >
                        다음
                    </Button>
                </Box>
                
                <Typography variant="h6" fontWeight="bold">
                    {label}
                </Typography>
                
                <Box>
                    <Button 
                        onClick={() => onView(Views.MONTH)}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                    >
                        월
                    </Button>
                    <Button 
                        onClick={() => onView(Views.WEEK)}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                    >
                        주
                    </Button>
                    <Button 
                        onClick={() => onView(Views.DAY)}
                        variant="outlined"
                        size="small"
                    >
                        일
                    </Button>
                </Box>
            </Box>
        );
    };
    
    // 캘린더 메시지 커스터마이징
    const messages = useMemo(() => ({
        allDay: '종일',
        previous: '이전',
        next: '다음',
        today: '오늘',
        month: '월',
        week: '주',
        day: '일',
        agenda: '목록',
        date: '날짜',
        time: '시간',
        event: '일정',
        noEventsInRange: '표시할 일정이 없습니다',
        showMore: (total: number) => `+${total}개 더보기`
    }), []);
    
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
            {/* 필터 영역 */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
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
                    
                    <FormControl size="small" sx={{ minWidth: 150 }}>
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
                    
                    <Box sx={{ flex: 1 }} />
                    
                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            const queryParams = new URLSearchParams();
                            if (farmerId) queryParams.append('farmerId', farmerId);
                            if (workerId) queryParams.append('workerId', workerId);
                            if (fieldId) queryParams.append('fieldId', fieldId);
                            router.push(`/schedules/add?${queryParams.toString()}`);
                        }}
                    >
                        일정 추가
                    </Button>
                </Box>
            </Paper>
            
            {/* 캘린더 영역 */}
            <Paper elevation={0} sx={{ p: 1, borderRadius: 2, height: 'calc(100vh - 220px)', minHeight: 600 }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'day']}
                    defaultView={Views.WEEK}
                    selectable
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventStyleGetter}
                    components={{
                        event: EventComponent,
                        toolbar: CustomToolbar
                    }}
                    messages={messages}
                    formats={{
                        dateFormat: 'D',
                        dayFormat: 'ddd M/D',
                        monthHeaderFormat: 'YYYY년 MMMM',
                        dayHeaderFormat: 'YYYY년 MMMM D일 dddd',
                        dayRangeHeaderFormat: ({ start, end }: { start: Date, end: Date }) => 
                            `${moment(start).format('YYYY년 MMMM D일')} - ${moment(end).format('MMMM D일')}`
                    }}
                />
            </Paper>
            
            {/* 이벤트 상세 다이얼로그 */}
            <Dialog 
                open={eventDialogOpen} 
                onClose={() => setEventDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                {selectedEvent && (
                    <>
                        <DialogTitle sx={{ 
                            pb: 1, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip 
                                    label={getTypeLabel(selectedEvent.resource.type)}
                                    color={getTypeColor(selectedEvent.resource.type)}
                                    size="small"
                                    sx={{ mr: 1 }}
                                />
                                <Typography variant="h6">
                                    작업 일정 상세
                                </Typography>
                            </Box>
                            <Chip 
                                label={selectedEvent.resource.stage.current}
                                color={getStageColor(selectedEvent.resource.stage.current)}
                                size="small"
                            />
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    작업 일시
                                </Typography>
                                <Typography variant="body1">
                                    {moment(selectedEvent.start).format('YYYY년 M월 D일(ddd) HH:mm')} ~ 
                                    {moment(selectedEvent.end).format(' HH:mm')}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    농가 / 농지
                                </Typography>
                                <Typography variant="body1">
                                    {selectedEvent.resource.farmerName} / {selectedEvent.resource.fieldName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedEvent.resource.fieldAddress}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    작업자
                                </Typography>
                                <Typography variant="body1">
                                    {selectedEvent.resource.workerName || '미배정'}
                                </Typography>
                            </Box>
                            
                            {selectedEvent.resource.rateInfo && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        작업 단가
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedEvent.resource.rateInfo.baseRate.toLocaleString()}원 
                                        / {selectedEvent.resource.rateInfo.unit}
                                    </Typography>
                                </Box>
                            )}
                            
                            {selectedEvent.resource.type === 'transport' && selectedEvent.resource.transportInfo && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            출발지
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedEvent.resource.transportInfo.origin.address}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            도착지
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedEvent.resource.transportInfo.destination.address}
                                        </Typography>
                                        {selectedEvent.resource.transportInfo.destination.contactName && (
                                            <Typography variant="body2">
                                                연락처: {selectedEvent.resource.transportInfo.destination.contactName} 
                                                ({selectedEvent.resource.transportInfo.destination.contactPhone})
                                            </Typography>
                                        )}
                                    </Box>
                                    
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            화물 정보
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedEvent.resource.transportInfo.cargo.type} 
                                            ({selectedEvent.resource.transportInfo.cargo.quantity} 
                                            {selectedEvent.resource.transportInfo.cargo.unit})
                                        </Typography>
                                    </Box>
                                </>
                            )}
                            
                            {selectedEvent.resource.memo && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        메모
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedEvent.resource.memo}
                                    </Typography>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                            <Box>
                                {selectedEvent.resource.stage.current !== '완료' && selectedEvent.resource.stage.current !== '취소' && (
                                    <>
                                        <Button 
                                            color="primary" 
                                            onClick={() => {
                                                const nextStage = 
                                                    selectedEvent.resource.stage.current === '예정' ? '준비중' :
                                                    selectedEvent.resource.stage.current === '준비중' ? '진행중' : '완료';
                                                handleUpdateStage(selectedEvent.id, nextStage);
                                                setEventDialogOpen(false);
                                            }}
                                            startIcon={<CheckIcon />}
                                            sx={{ mr: 1 }}
                                        >
                                            {selectedEvent.resource.stage.current === '예정' ? '준비중' :
                                            selectedEvent.resource.stage.current === '준비중' ? '진행중' : '완료'} 처리
                                        </Button>
                                        
                                        <Button
                                            color="error"
                                            onClick={() => {
                                                handleUpdateStage(selectedEvent.id, '취소');
                                                setEventDialogOpen(false);
                                            }}
                                            startIcon={<CancelIcon />}
                                        >
                                            취소 처리
                                        </Button>
                                    </>
                                )}
                            </Box>
                            
                            <Box>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        router.push(`/schedules/${selectedEvent.id}/edit`);
                                        setEventDialogOpen(false);
                                    }}
                                    sx={{ mr: 1 }}
                                >
                                    수정
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => setEventDialogOpen(false)}
                                >
                                    닫기
                                </Button>
                            </Box>
                        </DialogActions>
                    </>
                )}
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
        </Box>
    );
};

export default ScheduleCalendar;