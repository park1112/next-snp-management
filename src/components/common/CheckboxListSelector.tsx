// src/components/common/CheckboxListSelector.tsx
import React, { useState } from 'react';
import {
    Box,
    Checkbox,
    FormControlLabel,
    Typography,
    Paper,
    IconButton,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Collapse,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    KeyboardArrowDown as ExpandMoreIcon,
    KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';

export interface CheckboxOption {
    id?: string;
    value: string;
    label: string;
    defaultRate?: number;
    rateUnit?: string;
    checked?: boolean;
    customRate?: number;
}

interface CheckboxListSelectorProps {
    options: CheckboxOption[];
    selectedValues: string[];
    customRates?: { [key: string]: number };
    onSelectionChange: (selected: string[]) => void;
    onCustomRatesChange?: (rates: { [key: string]: number }) => void;
    onAddNew?: (newItem: { name: string; defaultRate?: number; rateUnit?: string; }) => Promise<string>;
    title?: string;
    allowAddNew?: boolean;
    isLoading?: boolean;
    error?: Error | null;
}

const CheckboxListSelector: React.FC<CheckboxListSelectorProps> = ({
    options,
    selectedValues,
    customRates = {},
    onSelectionChange,
    onCustomRatesChange,
    onAddNew,
    title = "항목 선택",
    allowAddNew = true,
    isLoading = false,
    error = null
}) => {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemRate, setNewItemRate] = useState<number | ''>('');
    const [newItemRateUnit, setNewItemRateUnit] = useState('시간');
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);

    // 선택 상태 변경 핸들러
    const handleToggle = (value: string) => {
        const currentIndex = selectedValues.indexOf(value);
        const newSelected = [...selectedValues];

        if (currentIndex === -1) {
            newSelected.push(value);
        } else {
            newSelected.splice(currentIndex, 1);
        }

        onSelectionChange(newSelected);
    };

    // 커스텀 단가 변경 핸들러
    const handleRateChange = (value: string, rate: number) => {
        if (onCustomRatesChange) {
            const newRates = { ...customRates, [value]: rate };
            onCustomRatesChange(newRates);
        }
    };

    // 새 항목 추가 다이얼로그 핸들러
    const handleOpenAddDialog = () => {
        setNewItemName('');
        setNewItemRate('');
        setNewItemRateUnit('시간');
        setAddError(null);
        setShowAddDialog(true);
    };

    const handleCloseAddDialog = () => {
        setShowAddDialog(false);
    };

    const handleAddNewItem = async () => {
        if (!newItemName.trim()) {
            setAddError('항목 이름을 입력해주세요');
            return;
        }

        setIsAdding(true);
        setAddError(null);

        try {
            if (onAddNew) {
                const rateValue = typeof newItemRate === 'number' ? newItemRate : 0;
                await onAddNew({
                    name: newItemName.trim(),
                    defaultRate: rateValue,
                    rateUnit: newItemRateUnit
                });
                handleCloseAddDialog();
            }
        } catch (error) {
            setAddError('항목 추가 중 오류가 발생했습니다');
            console.error('Error adding new item:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    // 단위 옵션
    const rateUnitOptions = [
        { value: '시간', label: '시간' },
        { value: '일', label: '일' },
        { value: '건', label: '건' },
        { value: '회', label: '회' },
    ];

    return (
        <Paper elevation={0} sx={{
            p: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden'
        }}>
            {/* 헤더 */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper',
                    borderBottom: expanded ? '1px solid' : 'none',
                    borderColor: 'divider'
                }}
                onClick={toggleExpand}
                style={{ cursor: 'pointer' }}
            >
                <Typography variant="subtitle1" fontWeight="600">
                    {title} {selectedValues.length > 0 && `(${selectedValues.length}개 선택됨)`}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {allowAddNew && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddDialog();
                            }}
                            sx={{ mr: 1 }}
                        >
                            <AddIcon />
                        </IconButton>
                    )}
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
            </Box>

            {/* 에러 메시지 */}
            {error && (
                <Alert severity="error" sx={{ m: 2, mt: 0 }}>
                    {error.message}
                </Alert>
            )}

            {/* 체크박스 목록 */}
            <Collapse in={expanded}>
                <Box
                    sx={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        p: 2,
                        pt: 1
                    }}
                >
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : options.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', py: 2 }}
                        >
                            등록된 항목이 없습니다
                        </Typography>
                    ) : (
                        options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <Box
                                    key={option.value}
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: isSelected ? 'primary.light' : 'divider',
                                        bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => handleToggle(option.value)}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Typography
                                                fontWeight={isSelected ? 600 : 400}
                                                sx={{ color: isSelected ? 'primary.main' : 'text.primary' }}
                                            >
                                                {option.label}
                                            </Typography>
                                        }
                                        sx={{ width: '100%', mb: isSelected ? 1 : 0 }}
                                    />

                                    {isSelected && (
                                        <Box sx={{ pl: 4, pt: 1 }}>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid size={{ xs: 7 }}>
                                                    <TextField
                                                        label="단가"
                                                        type="number"
                                                        size="small"
                                                        value={customRates[option.value] || option.defaultRate || 0}
                                                        onChange={(e) => handleRateChange(
                                                            option.value,
                                                            parseFloat(e.target.value) || 0
                                                        )}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <InputAdornment position="end">원</InputAdornment>
                                                            ),
                                                            inputProps: { min: 0 }
                                                        }}
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        / {option.rateUnit || '시간'}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Collapse>

            {/* 새 항목 추가 다이얼로그 */}
            <Dialog
                open={showAddDialog}
                onClose={handleCloseAddDialog}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>
                    새 업무 종류 추가
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                autoFocus
                                label="업무 이름"
                                fullWidth
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                margin="dense"
                                error={!!addError && !newItemName.trim()}
                                helperText={addError && !newItemName.trim() ? addError : ''}
                            />
                        </Grid>
                        <Grid size={{ xs: 7 }}>
                            <TextField
                                label="기본 단가"
                                type="number"
                                fullWidth
                                value={newItemRate}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                    setNewItemRate(val);
                                }}
                                margin="dense"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">원</InputAdornment>,
                                    inputProps: { min: 0 }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 5 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>단위</InputLabel>
                                <Select
                                    value={newItemRateUnit}
                                    onChange={(e) => setNewItemRateUnit(e.target.value)}
                                    label="단위"
                                >
                                    {rateUnitOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {addError && newItemName.trim() && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {addError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseAddDialog}
                        color="inherit"
                        disabled={isAdding}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleAddNewItem}
                        color="primary"
                        variant="contained"
                        disabled={isAdding || !newItemName.trim()}
                        startIcon={isAdding ? <CircularProgress size={20} /> : <CheckIcon />}
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default CheckboxListSelector;