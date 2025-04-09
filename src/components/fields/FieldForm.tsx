// src/components/fields/FieldForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    FormControl,
    FormHelperText,
    InputLabel,
    Select,
    Grid,
    Typography,
    Divider,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    Autocomplete,
    Tab,
    Tabs,
    useTheme,
    InputAdornment,
    SelectChangeEvent
} from '@mui/material';
import {
    Terrain as TerrainIcon,
    Home as HomeIcon,
    CalendarToday as CalendarIcon,
    Category as CategoryIcon,
    Add as AddIcon,
    LocationOn as LocationIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Search as SearchIcon,
    Map as MapIcon,
    Note as NoteIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { Field, Farmer, DropdownOption } from '@/types';
import { createField, updateField, getCropTypes } from '@/services/firebase/fieldService';
import { getFarmers } from '@/services/firebase/farmerService';
import { useAppContext } from '@/contexts/AppContext';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`field-tabpanel-${index}`}
            aria-labelledby={`field-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

interface FieldFormProps {
    initialData?: Partial<Field>;
    isEdit?: boolean;
}

const FieldForm: React.FC<FieldFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const theme = useTheme();
    const { cropTypes } = useAppContext();

    const farmerId = searchParams?.get('farmerId');

    // Tab state
    const [tabValue, setTabValue] = useState(0);

    // Form state
    const [formData, setFormData] = useState<Partial<Field>>(initialData || {
        farmerId: farmerId || '',
        farmerName: '',
        address: {
            full: '',
            detail: '',
        },
        area: {
            value: 0,
            unit: '평',
        },
        cropType: '',
        estimatedHarvestDate: undefined,
        currentStage: {
            stage: '계약예정',
            updatedAt: new Date(),
        },
        memo: '',
    });

    // Dropdown options
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [cropTypeOptions, setCropTypeOptions] = useState<DropdownOption[]>([]);
    const [areaUnitOptions] = useState<DropdownOption[]>([
        { value: '평', label: '평' },
        { value: '제곱미터', label: '제곱미터' },
        { value: '헥타르', label: '헥타르' },
    ]);
    const [stageOptions] = useState<DropdownOption[]>([
        { value: '계약예정', label: '계약예정' },
        { value: '계약보류', label: '계약보류' },
        { value: '계약완료', label: '계약완료' },
        { value: '뽑기준비', label: '뽑기준비' },
        { value: '뽑기진행', label: '뽑기진행' },
        { value: '뽑기완료', label: '뽑기완료' },
        { value: '자르기준비', label: '자르기준비' },
        { value: '자르기진행', label: '자르기진행' },
        { value: '자르기완료', label: '자르기완료' },
        { value: '담기준비', label: '담기준비' },
        { value: '담기진행', label: '담기진행' },
        { value: '담기완료', label: '담기완료' },
    ]);

    // UI states
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
    const [dialogType, setDialogType] = useState<'cropType'>('cropType');
    const [newValue, setNewValue] = useState<string>('');

    // Tab change handler
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Load farmers and crop types
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch farmers
                const farmersData = await getFarmers();
                setFarmers(farmersData);

                // If farmerId is provided, find farmer name
                if (farmerId && !isEdit) {
                    const farmer = farmersData.find(f => f.id === farmerId);
                    if (farmer) {
                        setFormData(prevData => ({
                            ...prevData,
                            farmerId: farmerId,
                            farmerName: farmer.name,
                        }));
                    }
                }

                // Set crop type options from context
                if (cropTypes.length > 0) {
                    setCropTypeOptions(
                        cropTypes.map(type => ({ value: type, label: type }))
                    );
                } else {
                    // Fallback to API call if context doesn't have crop types
                    const cropTypesData = await getCropTypes();
                    setCropTypeOptions(
                        cropTypesData.map(type => ({ value: type, label: type }))
                    );
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [farmerId, isEdit, cropTypes]);

    // 폼 입력 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
        const { name, value } = e.target;
        if (!name) return;

        // 중첩된 필드 처리 (address, area)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');

            if (parent === 'area' && child === 'value') {
                // 면적 값은 숫자로 변환
                const numValue = parseFloat(value as string);
                if (!isNaN(numValue) && numValue >= 0) {
                    setFormData({
                        ...formData,
                        area: {
                            ...formData.area!,
                            value: numValue,
                        },
                    });
                }
                return;
            }

            const parentValue = formData[parent as keyof Field];
            if (parentValue && typeof parentValue === 'object') {
                setFormData({
                    ...formData,
                    [parent]: {
                        ...parentValue,
                        [child]: value,
                    },
                });
            }
            return;
        }

        // 일반 필드
        setFormData({
            ...formData,
            [name]: value,
        });

        // 필수 필드 오류 제거
        if (errors[name] && value) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };

    // 농가 선택 핸들러
    const handleFarmerChange = (_event: any, newValue: Farmer | null) => {
        if (newValue) {
            setFormData({
                ...formData,
                farmerId: newValue.id,
                farmerName: newValue.name,
            });

            // 농가 관련 오류 제거
            if (errors.farmerId) {
                setErrors({
                    ...errors,
                    farmerId: '',
                });
            }
        } else {
            setFormData({
                ...formData,
                farmerId: '',
                farmerName: '',
            });
        }
    };

    // 날짜 핸들러
    const handleDateChange = (date: Date | null) => {
        setFormData({
            ...formData,
            estimatedHarvestDate: date || undefined,
        });
    };

    // 작업 단계 변경 핸들러
    const handleStageChange = (e: SelectChangeEvent<string>) => {
        const stage = e.target.value;
        setFormData({
            ...formData,
            currentStage: {
                stage: stage,
                updatedAt: new Date(),
            },
        });
    };

    // 다이얼로그 핸들러
    const handleOpenDialog = (type: 'cropType') => {
        setDialogType(type);
        setNewValue('');
        setShowAddDialog(true);
    };

    const handleCloseDialog = () => {
        setShowAddDialog(false);
    };

    const handleAddNewValue = () => {
        if (!newValue.trim()) return;

        if (dialogType === 'cropType') {
            const newOption = { value: newValue, label: newValue };
            setCropTypeOptions([...cropTypeOptions, newOption]);
            setFormData({
                ...formData,
                cropType: newValue,
            });
        }

        setShowAddDialog(false);
    };

    // 주소 검색 핸들러 (실제 구현은 주소 API 연동 필요)
    const handleAddressSearch = () => {
        // 주소 API 연동 필요 (Daum 주소 API 등)
        // 테스트용 주소 입력
        setFormData({
            ...formData,
            address: {
                ...formData.address,
                full: '경기도 화성시 동탄면 금곡리 123-45',
            },
        });
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: { [key: string]: string } = {};

        if (!formData.farmerId) {
            newErrors.farmerId = '농가는 필수 항목입니다.';
        }

        if (!formData.address?.full) {
            newErrors['address.full'] = '주소는 필수 항목입니다.';
        }

        if (!formData.area?.value || formData.area.value <= 0) {
            newErrors['area.value'] = '면적은 0보다 커야 합니다.';
        }

        if (!formData.cropType) {
            newErrors.cropType = '작물 종류는 필수 항목입니다.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            if (isEdit && initialData?.id) {
                // 농지 정보 수정
                await updateField(initialData.id, formData);
                setSuccessMessage('농지 정보가 성공적으로 수정되었습니다.');
            } else {
                // 새 농지 등록
                const id = await createField(formData as Omit<Field, 'id' | 'createdAt' | 'updatedAt'>);
                setSuccessMessage('농지가 성공적으로 등록되었습니다.');
            }

            setSuccess(true);

            // 3초 후 목록 페이지로 이동
            setTimeout(() => {
                router.push(farmerId ? `/farmers/${farmerId}` : '/fields');
            }, 3000);
        } catch (error) {
            console.error("Error saving field:", error);
            setErrors({
                submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
            });
        } finally {
            setLoading(false);
        }
    };

    // 현재 선택된 농가 찾기
    const selectedFarmer = farmers.find(farmer => farmer.id === formData.farmerId);

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => router.push(farmerId ? `/farmers/${farmerId}` : '/fields')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight="bold">
                    {isEdit ? '농지 정보 수정' : '새 농지 등록'}
                </Typography>
            </Box>

            {errors.submit && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.submit}
                </Alert>
            )}

            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="field form tabs"
                >
                    <Tab label="기본 정보" id="field-tab-0" aria-controls="field-tabpanel-0" />
                    <Tab label="추가 정보" id="field-tab-1" aria-controls="field-tabpanel-1" />
                </Tabs>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate>
                {/* 기본 정보 탭 */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* 농가 선택 */}
                        <Grid size={{ xs: 12 }} >
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                농가 정보
                            </Typography>

                            <Autocomplete
                                id="farmer-select"
                                options={farmers}
                                getOptionLabel={(option) => option.name}
                                value={selectedFarmer || null}
                                onChange={handleFarmerChange}
                                disabled={!!farmerId}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="농가 선택"
                                        required
                                        error={!!errors.farmerId}
                                        helperText={errors.farmerId}
                                        placeholder="농가를 선택하세요"
                                    />
                                )}
                            />
                        </Grid>

                        {/* 위치 정보 */}
                        <Grid size={{ xs: 12 }} >
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center' }}>
                                <HomeIcon sx={{ mr: 1 }} />
                                위치 정보
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 9 }} >
                                    <TextField
                                        fullWidth
                                        required
                                        label="주소"
                                        name="address.full"
                                        value={formData.address?.full || ''}
                                        onChange={handleChange}
                                        error={!!errors['address.full']}
                                        helperText={errors['address.full']}
                                        InputProps={{
                                            startAdornment: <LocationIcon sx={{ color: 'action.active', mr: 1 }} />,
                                            readOnly: true,
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3 }} >
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={handleAddressSearch}
                                        sx={{ height: '56px' }}
                                    >
                                        주소 검색
                                    </Button>
                                </Grid>
                                <Grid size={{ xs: 12 }} >
                                    <TextField
                                        fullWidth
                                        label="상세주소"
                                        name="address.detail"
                                        value={formData.address?.detail || ''}
                                        onChange={handleChange}
                                        placeholder="상세주소를 입력하세요"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* 면적 정보 */}
                        <Grid size={{ xs: 12 }} >
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center' }}>
                                <TerrainIcon sx={{ mr: 1 }} />
                                면적 정보
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 8 }} >
                                    <TextField
                                        fullWidth
                                        required
                                        type="number"
                                        label="면적"
                                        name="area.value"
                                        value={formData.area?.value || ''}
                                        onChange={handleChange}
                                        error={!!errors['area.value']}
                                        helperText={errors['area.value']}
                                        inputProps={{ min: 0 }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }} >
                                    <FormControl fullWidth>
                                        <InputLabel>단위</InputLabel>
                                        <Select
                                            name="area.unit"
                                            value={formData.area?.unit || '평'}
                                            onChange={handleChange}
                                            label="단위"
                                        >
                                            {areaUnitOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* 작물 종류 */}
                        <Grid size={{ xs: 12 }} >
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center' }}>
                                <CategoryIcon sx={{ mr: 1 }} />
                                작물 정보
                            </Typography>

                            <FormControl fullWidth required error={!!errors.cropType}>
                                <InputLabel>작물 종류</InputLabel>
                                <Select
                                    name="cropType"
                                    value={formData.cropType || ''}
                                    onChange={handleChange}
                                    label="작물 종류"
                                    endAdornment={
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDialog('cropType');
                                            }}
                                            sx={{ mr: 2 }}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    }
                                >
                                    {cropTypeOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.cropType && (
                                    <FormHelperText>{errors.cropType}</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* 추가 정보 탭 */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        {/* 수확 예정일 */}
                        <Grid size={{ xs: 12, sm: 6 }} >
                            <DatePicker
                                label="예상 수확일"
                                value={formData.estimatedHarvestDate || null}
                                onChange={handleDateChange}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        InputProps: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarIcon sx={{ color: 'action.active' }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    },
                                }}
                            />
                        </Grid>

                        {/* 작업 단계 */}
                        <Grid size={{ xs: 12, sm: 6 }} >
                            <FormControl fullWidth>
                                <InputLabel>작업 단계</InputLabel>
                                <Select
                                    value={formData.currentStage?.stage || '계약예정'}
                                    onChange={handleStageChange}
                                    label="작업 단계"
                                >
                                    {stageOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* 메모 */}
                        <Grid size={{ xs: 12 }} >
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center' }}>
                                <NoteIcon sx={{ mr: 1 }} />
                                메모
                            </Typography>
                            <TextField
                                fullWidth
                                label="메모"
                                name="memo"
                                value={formData.memo || ''}
                                onChange={handleChange}
                                multiline
                                rows={4}
                                placeholder="추가적인 참고 사항을 입력하세요"
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* 제출 버튼 */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => router.push(farmerId ? `/farmers/${farmerId}` : '/fields')}
                        disabled={loading}
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                        {isEdit ? '수정' : '등록'}
                    </Button>
                </Box>
            </Box>

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

            {/* 작물 종류 추가 다이얼로그 */}
            <Dialog open={showAddDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    새 작물 종류 추가
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="작물 종류"
                        fullWidth
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">
                        취소
                    </Button>
                    <Button onClick={handleAddNewValue} color="primary">
                        추가
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default FieldForm;