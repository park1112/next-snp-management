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
    Badge,
    Paper,
    Avatar,
    Tooltip
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
    Category as CategoryIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowForwardIos as NextIcon,
    Money as MoneyIcon
} from '@mui/icons-material';
import { Foreman, Schedule, Category, WorkStage } from '@/types';
import { useSchedules } from '@/hooks/useSchedules';
import { format } from 'date-fns';
import { getWorkers } from '@/services/firebase/workerService';
import { updateSchedule } from '@/services/firebase/scheduleService';
import { Worker as AppWorker, Driver } from '@/types';
import { getCategories, getCategoryById } from '@/services/firebase/categoryService';


interface ScheduleListProps {
    farmerId?: string;
    workerId?: string;
    fieldId?: string;
    showCalendarView?: boolean;
}

type ScheduleStage = "예정" | "준비중" | "진행중" | "완료" | "취소";

interface CategorySchedule {
    categoryId: string;
    categoryName: string;
    stage: ScheduleStage;
    workerId: string;
    workerName?: string;
    scheduledDate: {
        start: Date;
    };
    amount?: number;
    memo?: string;   // 작업 메모 추가
}

type CategorySchedulesType = CategorySchedule[] | Record<string, CategorySchedule>;

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
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryStageDialog, setCategoryStageDialog] = useState(false);
    const [selectedStage, setSelectedStage] = useState<ScheduleStage>("예정");

    // 작업비 입력 관련 상태
    const [workAmountDialog, setWorkAmountDialog] = useState(false);
    const [workAmount, setWorkAmount] = useState<number>(0);
    const [workMemo, setWorkMemo] = useState<string>('');

    // 추가할 상태
    const [selectedWorkerForAmount, setSelectedWorkerForAmount] = useState<string>('');




    // 알림 메시지 상태
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        severity: 'success' | 'info' | 'warning' | 'error',
        message: string
    }>({
        severity: 'info',
        message: ''
    });

    // 카테고리 로드 업데이트 - 새 API 사용
    useEffect(() => {
        const loadCategories = async () => {
            try {
                // 새로운 카테고리 API 사용
                const categoriesData = await getCategories();
                setCategories(categoriesData);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadCategories();
    }, []);

    // 카테고리 경로 가져오기 함수
    const getCategoryPath = (startCategoryId: string): Array<Category> => {
        const path: Array<Category> = [];
        let currentId = startCategoryId;
        const visitedIds = new Set<string>();

        while (currentId && !visitedIds.has(currentId)) {
            const category = categories.find(c => c.id === currentId);
            if (!category) break;

            path.push(category);
            visitedIds.add(currentId);

            // 다음 카테고리가 없으면 종료
            if (!category.nextCategoryId) break;

            currentId = category.nextCategoryId;
        }

        return path;
    };

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
        // 고정된 색상 맵 대신 순환 색상 사용
        const colors = ['primary', 'secondary', 'success', 'warning', 'info'];

        // 카테고리 ID를 인덱스로 변환 (간단한 해시 함수)
        let hash = 0;
        for (let i = 0; i < categoryId.length; i++) {
            hash = (hash + categoryId.charCodeAt(i)) % colors.length;
        }

        return colors[hash] as 'primary' | 'secondary' | 'success' | 'warning' | 'info';
    };

    // 안전하게 스테이지 문자열을 추출하는 유틸리티 함수
    const extractStageString = (stage: string | { current?: string | { value?: string } }): string => {
        if (typeof stage === 'string') {
            return stage;
        }

        if (stage && typeof stage === 'object') {
            // 현재 단계가 current 속성에 있는 경우 (객체 구조)
            if (typeof stage.current === 'string') {
                return stage.current;
            }

            // React ref 같은 객체가 있는 경우
            if (stage.current && typeof stage.current === 'object' && typeof stage.current.value === 'string') {
                return stage.current.value;
            }
        }

        // 기본값 반환
        return '상태 없음';
    };

    // 안전한 스테이지 색상 가져오기 함수
    const getStageColor = (stage: string | { current?: string | { value?: string } }): string => {
        const stageStr = extractStageString(stage);

        switch (stageStr) {
            case '예정': return 'info';
            case '준비중': return 'warning';
            case '진행중': return 'primary';
            case '완료': return 'success';
            case '취소': return 'error';
            default: return 'default';
        }
    };

    // 다음 단계를 반환하는 함수
    const getNextStage = (stage: WorkStage): WorkStage => {
        switch (stage) {
            case '예정': return '준비중';
            case '준비중': return '진행중';
            case '진행중': return '완료';
            default: return stage; // '완료' or '취소' remain same
        }
    };




    // 다음 단계로 이동하는 핸들러
    const handleMoveToNextStage = async (schedule: Schedule, categoryId: string) => {
        // 현재 단계 찾기
        let currentStage: ScheduleStage = '예정';

        if (Array.isArray(schedule.categorySchedules)) {
            const categorySchedule = schedule.categorySchedules.find(cs => cs.categoryId === categoryId);
            if (categorySchedule) {
                currentStage = extractStageString(categorySchedule.stage) as ScheduleStage;
            }
        } else if (schedule.categorySchedules && typeof schedule.categorySchedules === 'object') {
            const categoryObj = schedule.categorySchedules as Record<string, CategorySchedule>;
            if (categoryObj[categoryId]) {
                currentStage = extractStageString(categoryObj[categoryId].stage) as ScheduleStage;
            }
        }

        const nextStage = getNextStage(currentStage);

        // 현재 단계와 다음 단계가 같으면 아무 작업도 하지 않음
        if (currentStage === nextStage) return;

        // 준비중 -> 진행중으로 가는 경우 작업자 확인
        if (currentStage === '준비중' && nextStage === '진행중') {
            // 작업자가 배정되어 있는지 확인
            let hasWorker = false;
            if (Array.isArray(schedule.categorySchedules)) {
                const categorySchedule = schedule.categorySchedules.find(cs => cs.categoryId === categoryId);
                hasWorker = !!(categorySchedule?.workerId);
            } else if (schedule.categorySchedules && typeof schedule.categorySchedules === 'object') {
                const categoryObj = schedule.categorySchedules as Record<string, CategorySchedule>;
                hasWorker = !!(categoryObj[categoryId]?.workerId);
            }

            if (!hasWorker) {
                // 작업자가 없으면 작업자 선택 다이얼로그 표시
                openWorkerSelectionDialog(schedule, categoryId);
                return;
            }
        }

        // 진행중 -> 완료로 가는 경우 작업비 입력
        if (currentStage === '진행중' && nextStage === '완료') {
            // 1) 해당 카테고리에 해당하는 작업자들 미리 로드
            const workers = await fetchAvailableWorkers(categoryId);
            setAvailableWorkers(workers);
            // 2) 다이얼로그 초기화
            setSelectedWorkerForAmount('');      // 선택 초기화
            setSelectedScheduleForStage(schedule);
            setSelectedCategoryId(categoryId);
            setWorkAmount(0);
            setWorkMemo('');
            // 3) 다이얼로그 오픈
            setWorkAmountDialog(true);
            return;
        }

        // 그 외의 경우 바로 상태 변경
        handleCategoryStageUpdate(schedule, categoryId, nextStage);
    };

    // 카테고리별 작업 상태 업데이트 핸들러
    const handleCategoryStageUpdate = async (schedule: Schedule, categoryId: string, newStage: ScheduleStage) => {
        try {
            if (!schedule.categorySchedules) return;

            let updatedCategorySchedules;
            if (Array.isArray(schedule.categorySchedules)) {
                updatedCategorySchedules = schedule.categorySchedules.map(cs =>
                    cs.categoryId === categoryId
                        ? { ...cs, stage: newStage as ScheduleStage }
                        : cs
                );
            } else {
                // 객체 형태인 경우
                const scheduleObj = { ...(schedule.categorySchedules as Record<string, CategorySchedule>) };
                if (scheduleObj[categoryId]) {
                    scheduleObj[categoryId] = {
                        ...scheduleObj[categoryId],
                        stage: newStage as ScheduleStage
                    };
                }
                // 객체를 배열로 변환
                updatedCategorySchedules = Object.values(scheduleObj);
            }

            await updateSchedule(schedule.id, {
                categorySchedules: updatedCategorySchedules
            });

            const categoryName = Array.isArray(schedule.categorySchedules)
                ? schedule.categorySchedules.find(cs => cs.categoryId === categoryId)?.categoryName
                : (schedule.categorySchedules as Record<string, CategorySchedule>)?.[categoryId]?.categoryName || categoryId;

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

    // 작업비 저장 핸들러
    const handleSaveWorkAmount = async () => {
        if (!selectedScheduleForStage || !selectedCategoryId) return;

        try {
            let updatedCategorySchedules;
            if (Array.isArray(selectedScheduleForStage.categorySchedules)) {
                updatedCategorySchedules = selectedScheduleForStage.categorySchedules.map(cs =>
                    cs.categoryId === selectedCategoryId
                        ? {
                            ...cs,
                            stage: '완료' as ScheduleStage,
                            amount: workAmount,
                            memo: workMemo,
                            workerId: selectedWorkerForAmount,
                            workerName: availableWorkers.find(w => w.id === selectedWorkerForAmount)?.name || '',
                        }
                        : cs
                );
            } else if (selectedScheduleForStage.categorySchedules) {
                // 작업비 저장 핸들러
                const scheduleObj = { ...(selectedScheduleForStage.categorySchedules as Record<string, CategorySchedule>) };
                if (scheduleObj[selectedCategoryId]) {
                    scheduleObj[selectedCategoryId] = {
                        ...scheduleObj[selectedCategoryId],
                        stage: '완료' as ScheduleStage,
                        amount: workAmount,
                        memo: workMemo
                    };
                }
                // 객체를 배열로 변환하고 타입 캐스팅
                updatedCategorySchedules = Object.values(scheduleObj) as CategorySchedule[];
            } else {
                throw new Error('Invalid categorySchedules structure');
            }

            await updateSchedule(selectedScheduleForStage.id, {
                categorySchedules: updatedCategorySchedules
            });

            setAlertMessage({
                severity: 'success',
                message: '작업비가 등록되고 작업이 완료 상태로 변경되었습니다.'
            });
            setAlertOpen(true);
            setWorkAmountDialog(false);
            await refreshSchedules();
        } catch (error) {
            console.error('Error updating work amount:', error);
            setAlertMessage({
                severity: 'error',
                message: '작업비 등록 중 오류가 발생했습니다.'
            });
            setAlertOpen(true);
        }
    };

    // 작업 상태 변경 처리
    const handleStageChange = async () => {
        if (!selectedScheduleForStage || !selectedCategoryId) return;

        try {
            const categorySchedule = Array.isArray(selectedScheduleForStage.categorySchedules)
                ? selectedScheduleForStage.categorySchedules.find(cs => cs.categoryId === selectedCategoryId)
                : selectedScheduleForStage.categorySchedules?.[selectedCategoryId] as CategorySchedule | undefined;

            const currentStage = categorySchedule?.stage || "예정";
            const hasWorkerId = categorySchedule?.workerId;

            const isChangingToPreparing = currentStage === '예정' && selectedStage === '준비중';
            const isChangingToInProgress = currentStage === '준비중' && selectedStage === '진행중';
            const isChangingToComplete = currentStage === '진행중' && selectedStage === '완료';

            if (isChangingToInProgress && !hasWorkerId) {
                // 작업자 선택 다이얼로그로 전환
                setCategoryStageDialog(false);
                openWorkerSelectionDialog(selectedScheduleForStage, selectedCategoryId);
                return;
            }

            if (isChangingToComplete) {
                // 작업비 입력 다이얼로그로 전환
                setCategoryStageDialog(false);
                setWorkAmount(0);
                setWorkMemo('');
                setWorkAmountDialog(true);
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

    // 작업 상태 다이얼로그 열기
    const openCategoryStageDialog = (schedule: Schedule, categoryId: string) => {
        setSelectedScheduleForStage(schedule);
        setSelectedCategoryId(categoryId);

        // categorySchedules가 배열 또는 객체일 경우를 모두 처리
        let currentStage = '예정'; // 기본값

        if (Array.isArray(schedule.categorySchedules)) {
            const categorySchedule = schedule.categorySchedules.find(cs => cs.categoryId === categoryId);
            if (categorySchedule) {
                currentStage = extractStageString(categorySchedule.stage);
            }
        } else if (schedule.categorySchedules && typeof schedule.categorySchedules === 'object') {
            // 객체인 경우 (키-값 형태)
            const categoryObj = schedule.categorySchedules as Record<string, CategorySchedule>;
            if (categoryObj[categoryId]) {
                currentStage = extractStageString(categoryObj[categoryId].stage);
            }
        }

        setSelectedStage(currentStage as ScheduleStage);
        setCategoryStageDialog(true);
    };

    // 작업자 가져오기 함수
    const fetchAvailableWorkers = async (categoryId: string) => {
        try {
            const workers = await getWorkers() as AppWorker[];
            // 카테고리 이름 조회
            const category = categories.find(c => c.id === categoryId);
            if (!category) {
                console.error('Category not found with ID:', categoryId);
                return [];
            }

            return workers.filter(worker => {
                if (worker.type === 'foreman') {
                    const foreman = worker as Foreman;
                    // 카테고리 ID로 확인
                    if (Array.isArray(foreman.foremanInfo?.categorysId)) {
                        return foreman.foremanInfo.categorysId.includes(categoryId);
                    }
                    // 카테고리 이름으로 확인 (호환성 유지)
                    if (Array.isArray(foreman.foremanInfo?.category?.name)) {
                        return foreman.foremanInfo.category.name.includes(category.name);
                    }
                }
                return false;
            });
        } catch (error) {
            console.error('Error fetching workers:', error);
            throw error;
        }
    };

    // 카테고리 이름을 안전하게 가져오는 유틸리티 함수
    const getCategoryNameFromSchedule = (schedule: Schedule | null, categoryId: string): string => {
        if (!schedule || !categoryId) return '선택된 카테고리';

        if (Array.isArray(schedule.categorySchedules)) {
            const category = schedule.categorySchedules.find(cs => cs.categoryId === categoryId);
            return category?.categoryName || '선택된 카테고리';
        }

        if (schedule.categorySchedules && typeof schedule.categorySchedules === 'object') {
            const categoryObj = schedule.categorySchedules as Record<string, CategorySchedule>;
            return categoryObj[categoryId]?.categoryName || '선택된 카테고리';
        }

        return '선택된 카테고리';
    };

    // 작업자 선택 다이얼로그 열기
    const openWorkerSelectionDialog = async (schedule: Schedule, categoryId: string) => {
        try {
            const workers = await fetchAvailableWorkers(categoryId);
            if (workers.length === 0) {
                setAlertMessage({
                    severity: 'warning',
                    message: `해당 작업 유형에 맞는 작업자가 없습니다. 먼저 작업자를 등록해주세요.`
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
            let updatedCategorySchedules;

            if (Array.isArray(selectedScheduleForStage.categorySchedules)) {
                updatedCategorySchedules = selectedScheduleForStage.categorySchedules.map(cs =>
                    cs.categoryId === selectedCategoryId
                        ? {
                            ...cs,
                            workerId: selectedWorker,
                            workerName: availableWorkers.find(w => w.id === selectedWorker)?.name || '',
                            stage: '진행중' as ScheduleStage // 작업자 선택 시 자동으로 진행중으로 변경
                        }
                        : cs
                );
            } else if (selectedScheduleForStage.categorySchedules && typeof selectedScheduleForStage.categorySchedules === 'object') {
                const scheduleObj = { ...(selectedScheduleForStage.categorySchedules as Record<string, CategorySchedule>) };
                if (scheduleObj[selectedCategoryId]) {
                    scheduleObj[selectedCategoryId] = {
                        ...scheduleObj[selectedCategoryId],
                        workerId: selectedWorker,
                        workerName: availableWorkers.find(w => w.id === selectedWorker)?.name || '',
                        stage: '진행중' as ScheduleStage // 작업자 선택 시 자동으로 진행중으로 변경
                    };
                }
                // 객체를 배열로 변환하고 타입 캐스팅
                updatedCategorySchedules = Object.values(scheduleObj) as CategorySchedule[];
            } else {
                throw new Error('Invalid categorySchedules structure');
            }

            await updateSchedule(selectedScheduleForStage.id, {
                categorySchedules: updatedCategorySchedules as CategorySchedule[]
            });

            setAlertMessage({
                severity: 'success',
                message: '작업자가 할당되고 작업이 진행중 상태로 변경되었습니다.'
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

    // 카테고리 프로세스 경로 렌더링
    const renderCategoryProcessPath = (schedule: Schedule) => {
        // 모든 카테고리 ID 추출
        const categoryIds = Array.isArray(schedule.categorySchedules)
            ? schedule.categorySchedules.map(cs => cs.categoryId)
            : Object.keys(schedule.categorySchedules || {});

        if (categoryIds.length === 0) return null;

        // 시작점이 되는 카테고리 찾기
        let startCategories = categoryIds.filter(id => {
            const category = categories.find(c => c.id === id);
            if (!category) return false;

            // 다른 카테고리에서 참조되는지 확인
            return !categories.some(c => c.nextCategoryId === id);
        });

        // 시작점이 없으면 첫 번째 카테고리 사용
        if (startCategories.length === 0 && categoryIds.length > 0) {
            startCategories = [categoryIds[0]];
        }

        return (
            <Box>
                {startCategories.map(startId => {
                    const path = getCategoryPath(startId).filter(cat =>
                        categoryIds.includes(cat.id)
                    );

                    if (path.length === 0) return null;

                    return (
                        <Box
                            key={`path-${startId}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1,
                                mb: 1
                            }}
                        >
                            {path.map((category, index) => {
                                const categorySchedule = Array.isArray(schedule.categorySchedules)
                                    ? schedule.categorySchedules.find(cs => cs.categoryId === category.id)
                                    : schedule.categorySchedules?.[category.id];

                                if (!categorySchedule) return null;

                                return (
                                    <React.Fragment key={`flow-${startId}-${category.id}`}>
                                        <Chip
                                            label={categorySchedule.categoryName}
                                            color={getTypeColor(categorySchedule.categoryName)}
                                            onClick={() => openCategoryStageDialog(schedule, category.id)}
                                            size="small"
                                            sx={{
                                                borderWidth: '2px',
                                                borderStyle: 'solid',
                                                borderColor: categorySchedule.stage === '완료' ? 'success.main' :
                                                    categorySchedule.stage === '진행중' ? 'primary.main' :
                                                        categorySchedule.stage === '준비중' ? 'warning.main' :
                                                            categorySchedule.stage === '취소' ? 'error.main' : 'info.main',
                                                fontWeight: 'medium'
                                            }}
                                        />
                                        {index < path.length - 1 && (
                                            <ArrowForwardIcon fontSize="small" color="action" />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </Box>
                    );
                })}
            </Box>
        );
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

            {/* 목록 뷰 - 새 디자인 */}
            {viewMode === 'list' && filteredSchedules.length > 0 && (
                <Grid container spacing={2}>
                    {paginatedSchedules.map((schedule) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={schedule.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    transform: 'translateY(-4px)'
                                }
                            }}>
                                <CardContent sx={{ '&:last-child': { pb: 2 }, flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {/* 깃대 번호를 원형 아바타로 표시 */}
                                            <Avatar
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    width: 36,
                                                    height: 36,
                                                    mr: 1.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Typography variant="body2" fontWeight="bold">

                                                    {'#' + (schedule as any).additionalInfo.flagNumber || '#'}
                                                </Typography>
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" noWrap sx={{ maxWidth: '100%', fontWeight: 'bold' }}>
                                                    {schedule.fieldFullAddress || '농지 정보 없음'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {schedule.farmerName || '농가 정보 없음'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, schedule.id)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            my: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        {schedule.fieldAddress || '주소 정보 없음'}
                                    </Typography>

                                    {/* 카테고리 프로세스 흐름 시각화 */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            mb: 2,
                                            backgroundColor: 'background.default',
                                            border: '1px dashed #ccc',
                                            borderRadius: 2
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <CategoryIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                                            작업 프로세스
                                        </Typography>

                                        {/* 카테고리 ID 추출 및 시작 카테고리 찾기 */}
                                        {(() => {
                                            // 모든 카테고리 ID 추출
                                            const categoryIds = Array.isArray(schedule.categorySchedules)
                                                ? schedule.categorySchedules.map(cs => cs.categoryId)
                                                : Object.keys(schedule.categorySchedules || {});

                                            // 시작점이 되는 카테고리 찾기
                                            const startCategories = categoryIds.filter(id => {
                                                const category = categories.find(c => c.id === id);
                                                if (!category) return false;

                                                // 다른 카테고리에서 참조되는지 확인
                                                return !categories.some(c => c.nextCategoryId === id);
                                            });

                                            // 시작점이 없으면 첫 번째 카테고리 사용
                                            if (startCategories.length === 0 && categoryIds.length > 0) {
                                                startCategories.push(categoryIds[0]);
                                            }

                                            return startCategories.map(startId => {
                                                const path = getCategoryPath(startId).filter(cat => categoryIds.includes(cat.id));
                                                if (path.length === 0) return null;

                                                // 전체 단계 수
                                                const totalSteps = path.length;
                                                // 현재 완료된 단계 수 계산 
                                                const completedSteps = path.filter(cat => {
                                                    const cs = Array.isArray(schedule.categorySchedules)
                                                        ? schedule.categorySchedules.find(cs => cs.categoryId === cat.id)
                                                        : schedule.categorySchedules?.[cat.id];
                                                    return cs && extractStageString(cs.stage) === '완료';
                                                }).length;

                                                // 진행 중인 단계 수 계산
                                                const inProgressSteps = path.filter(cat => {
                                                    const cs = Array.isArray(schedule.categorySchedules)
                                                        ? schedule.categorySchedules.find(cs => cs.categoryId === cat.id)
                                                        : schedule.categorySchedules?.[cat.id];
                                                    return cs && extractStageString(cs.stage) === '진행중';
                                                }).length;

                                                // 진행률 계산 (완료=100%, 진행중=50% 로 계산)
                                                const progressPercentage = Math.round((completedSteps + (inProgressSteps * 0.5)) / totalSteps * 100);

                                                return (
                                                    <Box key={`path-${startId}`} sx={{ mb: 3 }}>
                                                        {/* 진행률 표시 */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                작업 진행률: {progressPercentage}%
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {completedSteps}/{totalSteps} 완료
                                                            </Typography>
                                                        </Box>

                                                        {/* 진행률 바 */}
                                                        <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.100', borderRadius: 2, mb: 2 }}>
                                                            <Box
                                                                sx={{
                                                                    height: '100%',
                                                                    width: `${progressPercentage}%`,
                                                                    bgcolor: progressPercentage === 100 ? 'success.main' : 'primary.main',
                                                                    borderRadius: 2
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* 스텝퍼 UI */}
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                position: 'relative',
                                                                width: '100%'
                                                            }}
                                                        >
                                                            {/* 연결선 */}
                                                            <Box
                                                                sx={{
                                                                    position: 'absolute',
                                                                    top: '50%',
                                                                    left: '24px',
                                                                    right: '24px',
                                                                    height: 2,
                                                                    bgcolor: 'grey.200',
                                                                    zIndex: 0
                                                                }}
                                                            />

                                                            {/* 스텝 아이템들 */}
                                                            {path.map((category, index) => {
                                                                const categorySchedule = Array.isArray(schedule.categorySchedules)
                                                                    ? schedule.categorySchedules.find(cs => cs.categoryId === category.id)
                                                                    : schedule.categorySchedules?.[category.id];

                                                                if (!categorySchedule) return null;

                                                                const stageStr = extractStageString(categorySchedule.stage);
                                                                const isComplete = stageStr === '완료';
                                                                const isInProgress = stageStr === '진행중';
                                                                const isPreparing = stageStr === '준비중';

                                                                // 상태에 따른 색상 설정
                                                                const bgColor = isComplete ? 'success.main' :
                                                                    isInProgress ? 'primary.main' :
                                                                        isPreparing ? 'warning.main' : 'info.main';

                                                                return (
                                                                    <Box
                                                                        key={`step-${category.id}`}
                                                                        sx={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            zIndex: 1,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onClick={() => openCategoryStageDialog(schedule, category.id)}
                                                                    >
                                                                        {/* 스텝 원형 마커 */}
                                                                        <Avatar
                                                                            sx={{
                                                                                width: 36,
                                                                                height: 36,
                                                                                bgcolor: bgColor,
                                                                                boxShadow: isComplete || isInProgress ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                                                                            }}
                                                                        >
                                                                            {isComplete ? <CheckIcon fontSize="small" /> : index + 1}
                                                                        </Avatar>

                                                                        {/* 스텝 레이블 */}
                                                                        <Typography
                                                                            variant="caption"
                                                                            align="center"
                                                                            fontWeight={isComplete || isInProgress ? 'bold' : 'normal'}
                                                                            sx={{
                                                                                mt: 1,
                                                                                color: isComplete ? 'success.main' :
                                                                                    isInProgress ? 'primary.main' : 'text.primary',
                                                                                maxWidth: 80,
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis'
                                                                            }}
                                                                        >
                                                                            {categorySchedule.categoryName}
                                                                        </Typography>

                                                                        {/* 상태 표시 */}
                                                                        <Chip
                                                                            label={stageStr}
                                                                            size="small"
                                                                            color={getStageColor(categorySchedule.stage) as 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'}
                                                                            sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                                                                        />
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    </Box>
                                                );
                                            });
                                        })()}
                                    </Paper>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* 카테고리별 상태 표시 - 순서에 맞게 정렬 */}
                                    {(() => {
                                        // 카테고리 스케줄을 배열로 변환하고 순서에 맞게 정렬
                                        let categorySchedules: CategorySchedule[] = [];

                                        if (Array.isArray(schedule.categorySchedules)) {
                                            categorySchedules = [...schedule.categorySchedules];
                                        } else if (schedule.categorySchedules && typeof schedule.categorySchedules === 'object') {
                                            categorySchedules = Object.values(schedule.categorySchedules);
                                        }

                                        // 카테고리 경로에 따라 정렬
                                        const sortedCategoryIds: string[] = [];
                                        const startCategoryIds = categorySchedules
                                            .map(cs => cs.categoryId)
                                            .filter(id => {
                                                const category = categories.find(c => c.id === id);
                                                return category && !categories.some(c => c.nextCategoryId === id);
                                            });

                                        // 각 시작점에서 경로 따라가기
                                        startCategoryIds.forEach(startId => {
                                            let currentId = startId;
                                            while (currentId) {
                                                if (!sortedCategoryIds.includes(currentId)) {
                                                    sortedCategoryIds.push(currentId);
                                                }

                                                const category = categories.find(c => c.id === currentId);
                                                if (!category || !category.nextCategoryId) break;

                                                currentId = category.nextCategoryId;
                                            }
                                        });

                                        // 정렬되지 않은 나머지 카테고리 추가
                                        categorySchedules.forEach(cs => {
                                            if (!sortedCategoryIds.includes(cs.categoryId)) {
                                                sortedCategoryIds.push(cs.categoryId);
                                            }
                                        });

                                        // 정렬된 순서대로 렌더링
                                        return sortedCategoryIds.map(categoryId => {
                                            const cs = categorySchedules.find(cs => cs.categoryId === categoryId);
                                            if (!cs) return null;

                                            const stageStr = extractStageString(cs.stage);
                                            const isComplete = stageStr === '완료';
                                            const isInProgress = stageStr === '진행중';
                                            const isPreparing = stageStr === '준비중';
                                            const isCanceled = stageStr === '취소';

                                            return (
                                                <Box
                                                    key={`status-${schedule.id}-${cs.categoryId}`}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        mb: 1,
                                                        p: 1.5,
                                                        bgcolor: 'background.default',
                                                        borderRadius: 2,
                                                        border: '1px solid',
                                                        borderColor: isComplete ? 'success.light' :
                                                            isInProgress ? 'primary.light' :
                                                                isPreparing ? 'warning.light' :
                                                                    isCanceled ? 'error.light' : 'info.light',
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
                                                        {cs.amount && cs.amount > 0 && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    color: 'success.main',
                                                                    fontWeight: 'medium'
                                                                }}
                                                            >
                                                                <MoneyIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                                                작업비: {cs.amount.toLocaleString()}원
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {isCanceled ? (
                                                        <Chip
                                                            label="취소됨"
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                        />
                                                    ) : (
                                                        isComplete ? (
                                                            <Chip
                                                                label="완료됨"
                                                                size="small"
                                                                color="success"
                                                                icon={<CheckIcon />}
                                                            />
                                                        ) : (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                endIcon={<NextIcon fontSize="small" />}
                                                                color={getStageColor(cs.stage) as 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'}
                                                                onClick={() => handleMoveToNextStage(schedule, cs.categoryId)}
                                                            >
                                                                {stageStr === '예정' ? '준비하기' :
                                                                    stageStr === '준비중' ? '진행하기' :
                                                                        stageStr === '진행중' ? '완료하기' : stageStr}
                                                            </Button>
                                                        )
                                                    )}
                                                </Box>
                                            );
                                        });
                                    })()}
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

            {/* 작업자 선택 다이얼로그 */}
            <Dialog open={workerDialogOpen} onClose={() => setWorkerDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>작업자 선택</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        {getCategoryNameFromSchedule(selectedScheduleForStage, selectedCategoryId)} 작업의 담당자를 선택하세요.
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
            {/* 작업비 입력 다이얼로그 */}
            <Dialog open={workAmountDialog} onClose={() => setWorkAmountDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>작업비 입력</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        {getCategoryNameFromSchedule(selectedScheduleForStage, selectedCategoryId)} 작업의 작업비를 입력하세요.
                    </Typography>

                    {/* 1) 작업자 선택 */}
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>작업자</InputLabel>
                        <Select
                            value={selectedWorkerForAmount}
                            label="작업자"
                            onChange={(e) => setSelectedWorkerForAmount(e.target.value as string)}
                        >
                            {availableWorkers.map((w) => (
                                <MenuItem key={w.id} value={w.id}>
                                    {w.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="작업비"
                        type="number"
                        value={workAmount}
                        onChange={(e) => setWorkAmount(Number(e.target.value))}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">원</InputAdornment>,
                        }}
                        sx={{ mt: 2, mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="메모 (선택사항)"
                        multiline
                        rows={3}
                        value={workMemo}
                        onChange={(e) => setWorkMemo(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWorkAmountDialog(false)}>취소</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveWorkAmount}
                        color="success"
                    >
                        완료하기
                    </Button>
                    {/* 정산 없이 바로 완료 */}
                    <Button
                        variant="contained"
                        onClick={() => {
                            // settlement 없이 그냥 완료로 상태 변경
                            handleCategoryStageUpdate(
                                selectedScheduleForStage!,
                                selectedCategoryId,
                                '완료'
                            );
                            setWorkAmountDialog(false);
                        }}
                        color="warning"
                    >
                        skip
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 카테고리 상태 변경 다이얼로그 */}
            <Dialog open={categoryStageDialog} onClose={() => setCategoryStageDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>작업 상태 변경</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        {getCategoryNameFromSchedule(selectedScheduleForStage, selectedCategoryId)} 작업의 상태를 변경합니다.
                    </Typography>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>작업 상태</InputLabel>
                        <Select<ScheduleStage>
                            value={selectedStage}
                            onChange={(e) => {
                                const newStage = e.target.value;
                                const validStages: ScheduleStage[] = ["예정", "준비중", "진행중", "완료", "취소"];
                                if (validStages.includes(newStage as ScheduleStage)) {
                                    setSelectedStage(newStage as ScheduleStage);
                                }
                            }}
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

export default ScheduleList;