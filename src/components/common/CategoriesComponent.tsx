'use client';

import React, { useState, useEffect } from 'react';
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
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    ListItemIcon,
    Switch,
    FormControlLabel,
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
    FirstPage as FirstPageIcon,
    LastPage as LastPageIcon,
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
        moveCategoryPosition
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

    // 드래그 앤 드롭 처리 핸들러
    const handleDragEnd = async (result: DropResult) => {
        const { destination, source } = result;

        // 드롭 위치가 없거나 같은 위치로 드롭한 경우 처리하지 않음
        if (!destination || (destination.index === source.index)) {
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

    // 카테고리 위/아래로 이동 핸들러
    const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
        try {
            await moveCategoryPosition(categoryId, direction);
            setSuccessMessage(`카테고리가 성공적으로 ${direction === 'up' ? '위' : '아래'}로 이동되었습니다.`);
            setSuccess(true);
        } catch (error) {
            console.error(`Error moving category ${direction}:`, error);
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
        // 현재 카테고리와 현재 카테고리를 참조하는 카테고리들은 제외
        const isInPath = (categoryId: string, targetId: string): boolean => {
            const category = categories.find(c => c.id === categoryId);
            if (!category) return false;
            if (category.id === targetId) return true;
            return category.nextCategoryId ? isInPath(category.nextCategoryId, targetId) : false;
        };

        return categories.filter(category =>
            category.id !== currentCategoryId && !isInPath(category.id, currentCategoryId)
        );
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
                                <Droppable droppableId="categories">
                                    {(provided) => (
                                        <List
                                            sx={{ p: 0 }}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {categories.map((category, index) => (
                                                <Draggable
                                                    key={category.id}
                                                    draggableId={category.id}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <ListItem
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            sx={{
                                                                ...provided.draggableProps.style,
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
                                                                {...provided.dragHandleProps}
                                                                sx={{
                                                                    cursor: 'grab',
                                                                    '&:active': { cursor: 'grabbing' }
                                                                }}
                                                            >
                                                                <DragIndicatorIcon color="action" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                                                                    </Box>
                                                                }
                                                            />
                                                            <ListItemSecondaryAction>
                                                                <Tooltip title="맨 위로 이동">
                                                                    <IconButton
                                                                        edge="end"
                                                                        size="small"
                                                                        disabled={index === 0}
                                                                        onClick={() => {
                                                                            const newCategories = [...categories];
                                                                            const [removed] = newCategories.splice(index, 1);
                                                                            newCategories.unshift(removed);
                                                                            reorderCategories(newCategories);
                                                                        }}
                                                                    >
                                                                        <FirstPageIcon sx={{ transform: 'rotate(-90deg)' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="위로 이동">
                                                                    <IconButton
                                                                        edge="end"
                                                                        size="small"
                                                                        disabled={index === 0}
                                                                        onClick={() => handleMoveCategory(category.id, 'up')}
                                                                    >
                                                                        <ArrowUpwardIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="아래로 이동">
                                                                    <IconButton
                                                                        edge="end"
                                                                        size="small"
                                                                        disabled={index === categories.length - 1}
                                                                        onClick={() => handleMoveCategory(category.id, 'down')}
                                                                    >
                                                                        <ArrowDownwardIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="맨 아래로 이동">
                                                                    <IconButton
                                                                        edge="end"
                                                                        size="small"
                                                                        disabled={index === categories.length - 1}
                                                                        onClick={() => {
                                                                            const newCategories = [...categories];
                                                                            const [removed] = newCategories.splice(index, 1);
                                                                            newCategories.push(removed);
                                                                            reorderCategories(newCategories);
                                                                        }}
                                                                    >
                                                                        <LastPageIcon sx={{ transform: 'rotate(-90deg)' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </ListItemSecondaryAction>
                                                        </ListItem>
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
                                        <ListItem
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
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 1 }}>
                                                        {expandedCategory === category.id && renderCategoryPath(category.id)}
                                                    </Box>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Tooltip title="다음 단계 연결">
                                                    <IconButton
                                                        edge="end"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLinkCategory(category);
                                                            setSelectedNextCategoryId(category.nextCategoryId || '');
                                                            setOpenDialog('link');
                                                        }}
                                                    >
                                                        {category.nextCategoryId ? <LinkIcon color="primary" /> : <LinkOffIcon />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="수정">
                                                    <IconButton
                                                        edge="end"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditCategory(category);
                                                            setOpenDialog('edit');
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="삭제">
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
                                                </Tooltip>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={1} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ bgcolor: 'secondary.main', color: 'white', p: 2 }}>
                            <Typography variant="h6">작업 프로세스 흐름</Typography>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            {categories.length === 0 ? (
                                <Typography color="text.secondary">
                                    등록된 카테고리가 없습니다. 카테고리를 추가하여 작업 프로세스를 구성하세요.
                                </Typography>
                            ) : (
                                <>
                                    <Typography paragraph>
                                        각 작업 카테고리의 프로세스 흐름을 확인하세요. 첫 번째 단계부터 마지막 단계까지의 흐름이 표시됩니다.
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        {categories.filter(category => {
                                            // 다른 카테고리의 다음 단계로 연결되지 않은 카테고리만 표시 (시작점)
                                            return !categories.some(c => c.nextCategoryId === category.id);
                                        }).map(startCategory => (
                                            <Card key={startCategory.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                                                <CardContent>
                                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                        {startCategory.name} 프로세스
                                                    </Typography>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flexWrap: 'wrap',
                                                        gap: 1,
                                                        mt: 2
                                                    }}>
                                                        {getCategoryPath(startCategory.id).map((category, index, arr) => (
                                                            <React.Fragment key={category.id}>
                                                                <Chip
                                                                    label={`${index + 1}. ${category.name}`}
                                                                    color={index === 0 ? "primary" :
                                                                        index === arr.length - 1 ? "secondary" : "default"}
                                                                    variant="filled"
                                                                    sx={{ fontWeight: 'medium' }}
                                                                />
                                                                {index < arr.length - 1 && (
                                                                    <ArrowForwardIcon fontSize="small" color="action" />
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </Box>
                                                </CardContent>
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
                        '{categoryToDelete?.name}' 카테고리를 삭제하시겠습니까?
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
                        '{linkCategory?.name}' 카테고리의 다음 단계를 선택하세요:
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