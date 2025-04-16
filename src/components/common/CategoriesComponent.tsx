'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Divider,
    Alert,
    Snackbar,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Card,
    CardContent,
    CardActions,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Switch,
    FormControlLabel,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowForward as ArrowForwardIcon,
    LinkOff as LinkOffIcon,
    Link as LinkIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    DragIndicator as DragIndicatorIcon,
    SwapVert as SwapVertIcon,

} from '@mui/icons-material';
import { useCategories } from '@/hooks/common/useCategories';
import { Category } from '@/types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const CategoriesComponent: React.FC = () => {
    const {
        categories,
        isLoading,
        error,
        refreshCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        setNextCategory,
        getCategoryPath,
        reorderCategories,
    } = useCategories();

    // 상태 관리
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [linkCategory, setLinkCategory] = useState<Category | null>(null);
    const [selectedNextCategoryId, setSelectedNextCategoryId] = useState<string>('');
    const [openDialog, setOpenDialog] = useState<'add' | 'edit' | 'delete' | 'link' | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [isOrderingMode, setIsOrderingMode] = useState(false);

    // 시작점 카테고리들(다른 카테고리에서 참조되지 않는 카테고리들) 계산
    const startCategories = categories.filter(category =>
        !categories.some(c => c.nextCategoryId === category.id)
    );

    // 카테고리 추가 핸들러
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;

        try {
            await addCategory(newCategoryName.trim());
            setNewCategoryName('');
            setOpenDialog(null);
            setSuccessMessage('카테고리가 성공적으로 추가되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    // 카테고리 수정 핸들러
    const handleUpdateCategory = async () => {
        if (!editCategory || !editCategory.name.trim()) return;

        try {
            await updateCategory(editCategory.id, { name: editCategory.name.trim() });
            setEditCategory(null);
            setOpenDialog(null);
            setSuccessMessage('카테고리가 성공적으로 수정되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error updating category:', error);
        }
    };

    // 카테고리 삭제 핸들러
    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        try {
            await deleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
            setOpenDialog(null);
            setSuccessMessage('카테고리가 성공적으로 삭제되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    // 다음 단계 연결 핸들러
    const handleLinkNextCategory = async () => {
        if (!linkCategory) return;

        try {
            await setNextCategory(linkCategory.id, selectedNextCategoryId || null);
            setLinkCategory(null);
            setSelectedNextCategoryId('');
            setOpenDialog(null);
            setSuccessMessage('다음 단계가 성공적으로 연결되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error linking next category:', error);
        }
    };

    // 드래그 앤 드롭 처리 핸들러 (리스트)
    const handleDragEnd = async (result: DropResult) => {
        const { destination, source } = result;

        // 드롭 위치가 없거나 같은 위치로 드롭한 경우 처리하지 않음
        if (!destination || (destination.index === source.index && destination.droppableId === source.droppableId)) {
            return;
        }

        try {
            // 카테고리 배열을 복사
            const reorderedCategories = Array.from(categories);

            // 드래그한 항목을 제거
            const [removedCategory] = reorderedCategories.splice(source.index, 1);

            // 새 위치에 항목 삽입
            reorderedCategories.splice(destination.index, 0, removedCategory);

            // 순서 업데이트
            await reorderCategories(reorderedCategories);

            setSuccessMessage('카테고리 순서가 성공적으로 변경되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error reordering categories:', error);
        }
    };

    // 프로세스 플로우 드래그 앤 드롭 처리 핸들러
    const handleFlowDragEnd = async (result: DropResult, startCategoryId: string) => {
        const { destination, source } = result;

        // 드롭 위치가 없거나 같은 위치로 드롭한 경우 처리하지 않음
        if (!destination || (destination.index === source.index)) {
            return;
        }

        try {
            // 현재 경로 가져오기
            const path = getCategoryPath(startCategoryId);

            // 새로운 순서로 경로 재구성
            const reorderedPath = Array.from(path);
            const [movedCategory] = reorderedPath.splice(source.index, 1);
            reorderedPath.splice(destination.index, 0, movedCategory);

            // 연결 업데이트
            for (let i = 0; i < reorderedPath.length - 1; i++) {
                await setNextCategory(reorderedPath[i].id, reorderedPath[i + 1].id);
            }

            // 마지막 항목은 다음 단계 없음
            await setNextCategory(reorderedPath[reorderedPath.length - 1].id, null);

            setSuccessMessage('작업 프로세스 흐름이 성공적으로 변경되었습니다.');
            setSuccess(true);
        } catch (error) {
            console.error('Error reordering flow:', error);
        }
    };



    // 프로세스 내에서 카테고리 이동 핸들러
    const handleMoveInProcess = async (startCategoryId: string, categoryIndex: number, direction: 'up' | 'down') => {
        try {
            const path = getCategoryPath(startCategoryId);

            // 첫 번째 항목을 위로 또는 마지막 항목을 아래로 이동할 수 없음
            if ((direction === 'up' && categoryIndex === 0) ||
                (direction === 'down' && categoryIndex === path.length - 1)) {
                return;
            }

            // 새 경로 생성
            const newPath = [...path];
            const targetIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;

            // 위치 교환
            [newPath[categoryIndex], newPath[targetIndex]] = [newPath[targetIndex], newPath[categoryIndex]];

            // 연결 업데이트
            for (let i = 0; i < newPath.length - 1; i++) {
                await setNextCategory(newPath[i].id, newPath[i + 1].id);
            }

            // 마지막 항목은 다음 단계 없음
            await setNextCategory(newPath[newPath.length - 1].id, null);

            setSuccessMessage(`프로세스 내 카테고리가 성공적으로 ${direction === 'up' ? '위' : '아래'}로 이동되었습니다.`);
            setSuccess(true);
        } catch (error) {
            console.error(`Error moving category in process ${direction}:`, error);
        }
    };

    // 카테고리 경로 (프로세스 흐름) 표시
    const renderCategoryPath = (categoryId: string) => {
        const path = getCategoryPath(categoryId);

        if (path.length <= 1) {
            return (
                <Typography color="text.secondary" variant="body2">
                    다음 단계 없음
                </Typography>
            );
        }

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                {path.map((category, index) => (
                    <React.Fragment key={category.id}>
                        <Chip
                            label={category.name}
                            size="small"
                            color={index === 0 ? "primary" : "default"}
                        />
                        {index < path.length - 1 && (
                            <ArrowForwardIcon fontSize="small" color="action" />
                        )}
                    </React.Fragment>
                ))}
            </Box>
        );
    };

    // 다음 단계 선택 옵션 생성 (순환 참조 방지)
    const getNextCategoryOptions = (currentCategoryId: string) => {
        // 방문한 카테고리 추적을 위한 Set
        const visitedSet = new Set<string>();

        // 현재 카테고리와 현재 카테고리를 참조하는 카테고리들은 제외
        const isInPath = (categoryId: string, targetId: string): boolean => {
            // 이미 방문했다면 순환 참조 방지
            if (visitedSet.has(categoryId)) {
                return false;
            }

            visitedSet.add(categoryId);

            const category = categories.find(c => c.id === categoryId);
            if (!category) return false;
            if (category.id === targetId) return true;

            if (category.nextCategoryId) {
                return isInPath(category.nextCategoryId, targetId);
            }

            return false;
        };

        return categories.filter(category => {
            // 매번 새로운 방문 세트 생성
            visitedSet.clear();
            return category.id !== currentCategoryId && !isInPath(category.id, currentCategoryId);
        });
    };

    // 순서 조절 모드 토글
    const handleToggleOrderingMode = () => {
        setIsOrderingMode(!isOrderingMode);
        if (expandedCategory) {
            setExpandedCategory(null);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    카테고리 데이터를 불러오는 중 오류가 발생했습니다.
                </Alert>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={refreshCategories}
                    sx={{ mt: 2 }}
                >
                    다시 시도
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    작업 카테고리 관리
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isOrderingMode}
                                onChange={handleToggleOrderingMode}
                                color="primary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SwapVertIcon fontSize="small" />
                                <Typography variant="body2">순서 조절 모드</Typography>
                            </Box>
                        }
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog('add')}
                    >
                        카테고리 추가
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={1} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">카테고리 목록</Typography>
                            {isOrderingMode && (
                                <Chip
                                    icon={<DragIndicatorIcon />}
                                    label="카테고리를 드래그하여 순서 변경"
                                    variant="outlined"
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'medium' }}
                                />
                            )}
                        </Box>

                        {categories.length === 0 ? (
                            <List sx={{ p: 0 }}>
                                <ListItem>
                                    <ListItemText primary="등록된 카테고리가 없습니다." />
                                </ListItem>
                            </List>
                        ) : isOrderingMode ? (
                            // 순서 조절 모드 UI
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="categories" isDropDisabled={false} isCombineEnabled={false}>
                                    {(provided) => (
                                        <List
                                            sx={{ p: 0 }}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {categories.map((category, index) => (
                                                <Draggable
                                                    key={category.id}
                                                    draggableId={String(category.id)}
                                                    index={index}
                                                    isDragDisabled={false}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                            }}
                                                        >
                                                            <ListItemButton
                                                                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                                                                sx={{
                                                                    background: snapshot.isDragging ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
                                                                    borderLeft: '0px solid',
                                                                    borderLeftColor: 'primary.main',
                                                                    transition: 'all 0.2s',
                                                                    '&:hover': {
                                                                        bgcolor: 'action.hover',
                                                                    },
                                                                }}
                                                            >
                                                                <ListItemIcon
                                                                    sx={{
                                                                        cursor: 'grab',
                                                                        '&:active': { cursor: 'grabbing' }
                                                                    }}
                                                                >
                                                                    <DragIndicatorIcon color="action" />
                                                                </ListItemIcon>
                                                                <ListItemText
                                                                    primary={
                                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                            <Chip
                                                                                label={index + 1}
                                                                                size="small"
                                                                                sx={{ mr: 1, minWidth: 28 }}
                                                                            />
                                                                            <Typography>
                                                                                {category.name}
                                                                            </Typography>
                                                                            {category.nextCategoryId && (
                                                                                <Tooltip title="다음 단계 연결됨">
                                                                                    <LinkIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                                                                                </Tooltip>
                                                                            )}
                                                                        </div>
                                                                    }
                                                                />
                                                            </ListItemButton>
                                                            <Divider />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </List>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        ) : (
                            // 일반 모드 UI
                            <List sx={{ p: 0 }}>
                                {categories.map((category) => (
                                    <React.Fragment key={category.id}>
                                        <ListItemButton
                                            onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                                            sx={{
                                                borderLeft: expandedCategory === category.id ?
                                                    '4px solid' : '0px solid',
                                                borderLeftColor: 'primary.main',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <Chip
                                                            label={category.order || '?'}
                                                            size="small"
                                                            sx={{ mr: 1, minWidth: 28 }}
                                                        />
                                                        <Typography fontWeight={expandedCategory === category.id ? 'bold' : 'normal'}>
                                                            {category.name}
                                                        </Typography>
                                                        {category.nextCategoryId && (
                                                            <Tooltip title="다음 단계 연결됨">
                                                                <LinkIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                }
                                                secondary={
                                                    expandedCategory === category.id ? renderCategoryPath(category.id) : null
                                                }
                                            />
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLinkCategory(category);
                                                    setSelectedNextCategoryId(category.nextCategoryId || '');
                                                    setOpenDialog('link');
                                                }}
                                                sx={{ mr: 0.5 }}
                                            >
                                                {category.nextCategoryId ? <LinkIcon color="primary" /> : <LinkOffIcon />}
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditCategory(category);
                                                    setOpenDialog('edit');
                                                }}
                                                sx={{ mr: 0.5 }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCategoryToDelete(category);
                                                    setOpenDialog('delete');
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemButton>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={1} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ bgcolor: 'secondary.main', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">작업 프로세스 흐름</Typography>
                            {isOrderingMode && (
                                <Chip
                                    icon={<SwapVertIcon />}
                                    label="프로세스 내 순서 변경 가능"
                                    variant="outlined"
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'medium' }}
                                />
                            )}
                        </Box>
                        <Box sx={{ p: 3 }}>
                            {categories.length === 0 ? (
                                <Typography color="text.secondary">
                                    등록된 카테고리가 없습니다. 카테고리를 추가하여 작업 프로세스를 구성하세요.
                                </Typography>
                            ) : (
                                <>
                                    <Typography paragraph>
                                        각 작업 카테고리의 프로세스 흐름을 확인하세요. {isOrderingMode && '순서 조절 모드에서는 프로세스 내 단계를 드래그하거나 버튼을 눌러 순서를 변경할 수 있습니다.'}
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        {startCategories.map(startCategory => (
                                            <Card
                                                key={startCategory.id}
                                                sx={{
                                                    mb: 3,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    boxShadow: isOrderingMode ? '0px 2px 10px rgba(0,0,0,0.1)' : 'inherit'
                                                }}
                                            >
                                                <CardContent sx={{ pb: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                        {startCategory.name} 프로세스
                                                    </Typography>

                                                    {isOrderingMode ? (
                                                        // 순서 조절 모드 UI - 드래그 앤 드롭 및 버튼으로 조절
                                                        <DragDropContext onDragEnd={(result) => handleFlowDragEnd(result, startCategory.id)}>
                                                            <Droppable droppableId={`flow-${startCategory.id}`} isDropDisabled={false} isCombineEnabled={false}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.droppableProps}
                                                                        style={{
                                                                            marginTop: '16px',
                                                                            border: '1px dashed #ccc',
                                                                            borderRadius: '4px',
                                                                            padding: '16px'
                                                                        }}
                                                                    >
                                                                        {getCategoryPath(startCategory.id).map((category, index, arr) => (
                                                                            <Draggable
                                                                                key={category.id}
                                                                                draggableId={`flow-item-${category.id}`}
                                                                                index={index}
                                                                                isDragDisabled={false}
                                                                            >
                                                                                {(provided, snapshot) => (
                                                                                    <div
                                                                                        ref={provided.innerRef}
                                                                                        {...provided.draggableProps}
                                                                                        style={{
                                                                                            ...provided.draggableProps.style,
                                                                                            marginBottom: index < arr.length - 1 ? '16px' : 0,
                                                                                            position: 'relative',
                                                                                            padding: '8px',
                                                                                            borderRadius: '4px',
                                                                                            backgroundColor: snapshot.isDragging ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                                                                                        }}
                                                                                    >
                                                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                                            <div
                                                                                                {...provided.dragHandleProps}
                                                                                                style={{
                                                                                                    marginRight: '8px',
                                                                                                    cursor: 'grab',
                                                                                                }}
                                                                                            >
                                                                                                <DragIndicatorIcon color="action" />
                                                                                            </div>
                                                                                            <Chip
                                                                                                label={`${index + 1}. ${category.name}`}
                                                                                                color={index === 0 ? "primary" :
                                                                                                    index === arr.length - 1 ? "secondary" : "default"}
                                                                                                style={{ flexGrow: 1 }}
                                                                                            />

                                                                                            <div style={{ display: 'flex', marginLeft: '8px' }}>
                                                                                                <IconButton
                                                                                                    size="small"
                                                                                                    disabled={index === 0}
                                                                                                    onClick={() => handleMoveInProcess(startCategory.id, index, 'up')}
                                                                                                >
                                                                                                    <ArrowUpwardIcon fontSize="small" />
                                                                                                </IconButton>
                                                                                                <IconButton
                                                                                                    size="small"
                                                                                                    disabled={index === arr.length - 1}
                                                                                                    onClick={() => handleMoveInProcess(startCategory.id, index, 'down')}
                                                                                                >
                                                                                                    <ArrowDownwardIcon fontSize="small" />
                                                                                                </IconButton>
                                                                                            </div>
                                                                                        </div>

                                                                                        {index < arr.length - 1 && (
                                                                                            <div style={{
                                                                                                position: 'absolute',
                                                                                                bottom: '-12px',
                                                                                                left: '50%',
                                                                                                transform: 'translateX(-50%)',
                                                                                                color: '#999',
                                                                                                zIndex: 1
                                                                                            }}>
                                                                                                <ArrowDownwardIcon fontSize="small" />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        ))}
                                                                        {provided.placeholder}
                                                                    </div>
                                                                )}
                                                            </Droppable>
                                                        </DragDropContext>
                                                    ) : (
                                                        // 일반 모드 UI - 단순 표시
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '8px',
                                                            marginTop: '16px'
                                                        }}>
                                                            {getCategoryPath(startCategory.id).map((category, index, arr) => (
                                                                <div
                                                                    key={category.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        position: 'relative'
                                                                    }}
                                                                >
                                                                    <Chip
                                                                        label={`${index + 1}. ${category.name}`}
                                                                        color={index === 0 ? "primary" :
                                                                            index === arr.length - 1 ? "secondary" : "default"}
                                                                        variant="filled"
                                                                        style={{ fontWeight: 500 }}
                                                                    />

                                                                    {index < arr.length - 1 && (
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            margin: '8px 0'
                                                                        }}>
                                                                            <ArrowDownwardIcon fontSize="small" color="action" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>

                                                {isOrderingMode && (
                                                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                                        <Button
                                                            size="small"
                                                            onClick={() => {
                                                                setLinkCategory(startCategory);
                                                                setSelectedNextCategoryId(startCategory.nextCategoryId || '');
                                                                setOpenDialog('link');
                                                            }}
                                                            startIcon={<LinkIcon />}
                                                        >
                                                            연결 변경
                                                        </Button>
                                                    </CardActions>
                                                )}
                                            </Card>
                                        ))}
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* 다이얼로그 - 카테고리 추가 */}
            <Dialog open={openDialog === 'add'} onClose={() => setOpenDialog(null)}>
                <DialogTitle>새 작업 카테고리 추가</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="카테고리 이름"
                        fullWidth
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(null)}>취소</Button>
                    <Button
                        onClick={handleAddCategory}
                        color="primary"
                        disabled={!newCategoryName.trim()}
                        startIcon={<SaveIcon />}
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 다이얼로그 - 카테고리 수정 */}
            <Dialog open={openDialog === 'edit'} onClose={() => setOpenDialog(null)}>
                <DialogTitle>카테고리 수정</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="카테고리 이름"
                        fullWidth
                        value={editCategory?.name || ''}
                        onChange={(e) => setEditCategory(editCategory ? { ...editCategory, name: e.target.value } : null)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(null)}>취소</Button>
                    <Button
                        onClick={handleUpdateCategory}
                        color="primary"
                        disabled={!editCategory?.name?.trim()}
                        startIcon={<SaveIcon />}
                    >
                        수정
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 다이얼로그 - 카테고리 삭제 */}
            <Dialog open={openDialog === 'delete'} onClose={() => setOpenDialog(null)}>
                <DialogTitle>카테고리 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        &apos;{categoryToDelete?.name}&apos; 카테고리를 삭제하시겠습니까?
                    </Typography>
                    {categoryToDelete?.nextCategoryId && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            이 카테고리를 삭제하면 다음 단계 연결도 함께 삭제됩니다.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(null)}>취소</Button>
                    <Button
                        onClick={handleDeleteCategory}
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 다이얼로그 - 다음 단계 연결 */}
            <Dialog open={openDialog === 'link'} onClose={() => setOpenDialog(null)}>
                <DialogTitle>다음 작업 단계 연결</DialogTitle>
                <DialogContent>
                    <Typography paragraph>
                        &apos;{linkCategory?.name}&apos; 카테고리의 다음 단계를 선택하세요:
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>다음 단계</InputLabel>
                        <Select
                            value={selectedNextCategoryId}
                            onChange={(e) => setSelectedNextCategoryId(e.target.value)}
                            label="다음 단계"
                        >
                            <MenuItem value="">
                                <em>다음 단계 없음 (마지막 단계)</em>
                            </MenuItem>
                            {linkCategory && getNextCategoryOptions(linkCategory.id).map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {selectedNextCategoryId && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                연결 후 프로세스 흐름 미리보기:
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1,
                                mt: 1,
                                bgcolor: 'action.hover',
                                p: 2,
                                borderRadius: 1
                            }}>
                                <Chip label={linkCategory?.name} color="primary" />
                                <ArrowForwardIcon fontSize="small" color="action" />
                                {selectedNextCategoryId && (
                                    <>
                                        <Chip
                                            label={categories.find(c => c.id === selectedNextCategoryId)?.name}
                                            color="default"
                                        />
                                        {categories.find(c => c.id === selectedNextCategoryId)?.nextCategoryId && (
                                            <>
                                                <ArrowForwardIcon fontSize="small" color="action" />
                                                <Chip
                                                    label="..."
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </>
                                        )}
                                    </>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(null)}>취소</Button>
                    <Button
                        onClick={handleLinkNextCategory}
                        color="primary"
                        startIcon={<LinkIcon />}
                    >
                        연결
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 성공 알림 */}
            <Snackbar
                open={success}
                autoHideDuration={3000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CategoriesComponent;