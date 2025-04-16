// src/components/fields/FieldForm.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
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

    Tab,
    Tabs,
    useTheme,
    InputAdornment,
    SelectChangeEvent,
    Card,
    CardContent,
    CardActions,
    Tooltip,
    Avatar
} from '@mui/material';
import {
    Terrain as TerrainIcon,
    Home as HomeIcon,
    CalendarToday as CalendarIcon,
    Add as AddIcon,
    LocationOn as LocationIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Search as SearchIcon,
    Note as NoteIcon,
    Person as PersonIcon,
    Delete as DeleteIcon,
    Flag as FlagIcon,
    Calculate as CalculateIcon,
    Phone as PhoneIcon,
    Payment as PaymentIcon,
    SwapHoriz as SwapHorizIcon,
    ListAlt as ListAltIcon,
    LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { Field, Farmer, DropdownOption, PaymentGroup, LocationItem, stageOptions } from '@/types';
import { createField, updateField, getCropTypes } from '@/services/firebase/fieldService';
import { createFarmer, getFarmers, searchFarmers } from '@/services/firebase/farmerService';
import { getLastFlagNumber, updateLastFlagNumber } from '@/services/firebase/firestoreService';
import BasicInfo from '../form/BasicInfo';
import { getFirestore, collection, getDocs, } from 'firebase/firestore';
import CollectionSelector from '../common/AffiliationCollectionSelector';
import { useCropTypes } from '@/hooks/common/useCropTypes';
import { usePaymentGroups } from '@/hooks/common/usePaymentGroups';



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

interface DaumPostcodeData {
    address: string;
    zonecode: string;
    buildingName?: string;
    bname?: string;
}


const FieldForm: React.FC<FieldFormProps> = ({ initialData, isEdit = false }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const theme = useTheme();

    const { cropTypes, addCropType } = useCropTypes();
    const farmerId = searchParams?.get('farmerId');

    // Tab state
    const [tabValue, setTabValue] = useState(0);

    // 여러 위치 정보를 저장할 배열
    const [locations, setLocations] = useState<LocationItem[]>([]);

    // 농가 검색
    const [farmerSearchTerm, setFarmerSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Farmer[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // 농가 추가 다이얼로그 상태
    const [showAddFarmerDialog, setShowAddFarmerDialog] = useState<boolean>(false);
    const [newFarmer, setNewFarmer] = useState<{
        name: string;
        phoneNumber: string;
        paymentGroup: string;
        address?: {
            full: string;
            detail: string;
            zipcode: string;
            subdistrict: string;
        };
    }>({
        name: '',
        phoneNumber: '',
        paymentGroup: '',
        address: {
            full: '',
            detail: '',
            zipcode: '',
            subdistrict: ''
        }
    });
    const [isAddingFarmer, setIsAddingFarmer] = useState<boolean>(false);
    const [farmerErrors, setFarmerErrors] = useState<{ [key: string]: string }>({});

    // Form state
    const [formData, setFormData] = useState<Partial<Field>>(initialData || {
        farmerId: farmerId || '',
        farmerName: '',
        phoneNumber: '',
        paymentGroup: '',
        subdistrict: '',
        estimatedHarvestDate: undefined,
        currentStage: {
            stage: '계약예정',
            updatedAt: new Date(),
        },
        memo: '',
        totalArea: {
            value: 0,
            unit: '평',
        },
        locations: [],
    });

    // Dropdown options

    const [cropTypeOptions, setCropTypeOptions] = useState<DropdownOption[]>([]);
    const [areaUnitOptions] = useState<DropdownOption[]>([
        { value: '평', label: '평' },
        { value: '제곱미터', label: '제곱미터' },
        { value: '헥타르', label: '헥타르' },
    ]);


    // UI states
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
    const [dialogType, setDialogType] = useState<'cropType' | 'paymentGroup' | 'subdistrict'>('cropType');
    const [newValue, setNewValue] = useState<string>('');

    // 결제소속 목록 상태 추가
    const { paymentGroups: paymentGroupOptions, addPaymentGroup } = usePaymentGroups();

    // Tab change handler
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };


    const globalLastFlagNumberRef = useRef<number>(0);


    // 초기 데이터 로딩
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 마지막 깃발 번호 가져오기
                const lastFlagNumber = await getLastFlagNumber();
                globalLastFlagNumberRef.current = lastFlagNumber;






                // 기존 데이터가 있는 경우 위치 정보 설정
                if (isEdit && initialData) {
                    // locations 배열이 이미 있으면 그대로 사용
                    if (initialData.locations && Array.isArray(initialData.locations)) {
                        const loadedLocations = initialData.locations as LocationItem[];
                        setLocations(loadedLocations);

                        // 최대 깃발 번호 확인하여 전역 변수 업데이트
                        const maxFlag = Math.max(...loadedLocations.map(loc => loc.flagNumber), lastFlagNumber);
                        globalLastFlagNumberRef.current = maxFlag;

                        // Firebase에 최신 깃발 번호 업데이트
                        if (maxFlag > lastFlagNumber) {
                            await updateLastFlagNumber(maxFlag);
                        }
                    } else if (initialData.address) {
                        // 기존 단일 주소 정보를 위치 배열로 변환
                        const newLocation = {
                            id: `location-${Date.now()}`,
                            address: initialData.address as LocationItem['address'],
                            flagNumber: lastFlagNumber + 1,
                            area: initialData.area || { value: 0, unit: '평' },
                            cropType: initialData.cropType || '',
                        };
                        setLocations([newLocation]);

                        // Firebase에 깃발 번호 업데이트
                        await updateLastFlagNumber(lastFlagNumber + 1);
                        globalLastFlagNumberRef.current = lastFlagNumber + 1;
                    }
                } else {
                    // 신규 등록 시 빈 위치 정보 한 개만 추가
                    const nextFlagNumber = lastFlagNumber + 1;
                    const newLocation = {
                        id: `location-${Date.now()}`,
                        address: {
                            full: '',
                            detail: '',
                            zipcode: '',
                            subdistrict: '',
                        },
                        flagNumber: nextFlagNumber,
                        area: {
                            value: 0,
                            unit: formData.totalArea?.unit || '평',
                        },
                        cropType: '',
                    };
                    setLocations([newLocation]);

                    // Firebase에 깃발 번호 업데이트
                    await updateLastFlagNumber(nextFlagNumber);
                    globalLastFlagNumberRef.current = nextFlagNumber;
                }

                // Fetch farmers if farmerId is not provided
                if (!farmerId) {
                    const farmersData = await getFarmers();
                } else {
                    // If farmerId is provided, fetch specific farmer
                    try {
                        const farmerResponse = await getFarmers();
                        const farmer = farmerResponse.find(f => f.id === farmerId);
                        if (farmer) {
                            setFormData(prevData => ({
                                ...prevData,
                                farmerId: farmerId,
                                farmerName: farmer.name,
                                phoneNumber: farmer.phoneNumber,
                                paymentGroup: farmer.paymentGroup,
                            }));
                        }
                    } catch (error) {
                        console.error("Error fetching farmer:", error);
                    }
                }

                // Set crop type options from context or API
                if (cropTypes.length > 0) {
                    setCropTypeOptions(
                        cropTypes.map(type => ({ value: type.value, label: type.label }))
                    );
                } else {
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
    }, [farmerId, isEdit, initialData, cropTypes]);

    // 간단한 농가 추가 핸들러
    // 간단한 농가 추가 핸들러
    const handleAddNewFarmer = async () => {
        // 유효성 검사
        const newErrors: { [key: string]: string } = {};

        if (!newFarmer.name.trim()) {
            newErrors.name = '이름은 필수 항목입니다.';
        }

        if (!newFarmer.phoneNumber.trim()) {
            newErrors.phoneNumber = '전화번호는 필수 항목입니다.';
        } else if (!/^\d{3}-\d{3,4}-\d{4}$/.test(newFarmer.phoneNumber)) {
            newErrors.phoneNumber = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
        }

        if (!newFarmer.paymentGroup.trim()) {
            newErrors.paymentGroup = '결제소속은 필수 항목입니다.';
        }

        if (Object.keys(newErrors).length > 0) {
            setFarmerErrors(newErrors);
            return;
        }

        setIsAddingFarmer(true);

        try {
            // 농가 추가 함수 호출
            const newFarmerData = {
                name: newFarmer.name,
                phoneNumber: newFarmer.phoneNumber,
                paymentGroup: newFarmer.paymentGroup,
                address: {
                    full: newFarmer.address?.full || '',
                    detail: newFarmer.address?.detail || '',
                    zipcode: newFarmer.address?.zipcode || '',
                    subdistrict: newFarmer.address?.subdistrict || '', // 면단위 추가
                },
                bankInfo: {
                    bankName: '',
                    accountNumber: '',
                    accountHolder: '',
                },
                memo: '',
            };

            const farmerId = await createFarmer(newFarmerData);

            // 새 농가 정보 설정 및 선택
            const createdFarmer: Farmer = {
                id: farmerId,
                ...newFarmerData,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'current-user', // 실제 인증된 사용자 ID로 대체
            };

            // 농가 목록 업데이트


            // 새 농가 선택
            handleFarmerSelect(createdFarmer);

            // 다이얼로그 닫기
            setShowAddFarmerDialog(false);

            // 성공 메시지
            setSuccessMessage('새 농가가 성공적으로 추가되었습니다.');
            setSuccess(true);

        } catch (error) {
            console.error("Error adding new farmer:", error);
            setFarmerErrors({
                submit: '농가 추가 중 오류가 발생했습니다. 다시 시도해주세요.'
            });
        } finally {
            setIsAddingFarmer(false);
        }
    };

    // 전화번호 포맷팅 함수
    const formatPhoneNumber = (value: string): string => {
        const phoneNumber = value.replace(/[^0-9]/g, '');
        if (phoneNumber.length <= 11) {
            let formattedValue = phoneNumber;
            if (phoneNumber.length > 3 && phoneNumber.length <= 7) {
                formattedValue = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
            } else if (phoneNumber.length > 7) {
                formattedValue = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
            }
            return formattedValue;
        }
        return value;
    };

    // 새 농가 입력 핸들러
    const handleNewFarmerChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;

        if (!name) return;

        if (name === 'phoneNumber') {
            // 전화번호 포맷팅
            const formattedValue = formatPhoneNumber(value as string);
            setNewFarmer(prev => ({ ...prev, [name]: formattedValue }));

            // 오류 제거
            if (farmerErrors.phoneNumber && /^\d{3}-\d{3,4}-\d{4}$/.test(formattedValue)) {
                setFarmerErrors(prev => ({ ...prev, phoneNumber: '' }));
            }
            return;
        }

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            if (parent === 'address') {
                setNewFarmer(prev => ({
                    ...prev,
                    address: {
                        ...(prev.address || { full: '', detail: '', zipcode: '', subdistrict: '' }),
                        [child]: value
                    }
                }));
            }
            return;
        }

        setNewFarmer(prev => ({ ...prev, [name]: value }));

        // 오류 제거
        if (farmerErrors[name] && (value as string).trim()) {
            setFarmerErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // 3. 엔터키로 검색 지원
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 폼 제출 방지
            handleFarmerSearch();
        }
    };

    // 농가 검색 핸들러
    const handleFarmerSearch = async () => {
        if (!farmerSearchTerm.trim()) return;

        try {
            setIsSearching(true);
            const results = await searchFarmers('name', farmerSearchTerm);
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching farmers:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // 농가 선택 핸들러
    const handleFarmerSelect = (farmer: Farmer) => {
        setFormData({
            ...formData,
            farmerId: farmer.id,
            farmerName: farmer.name,
            phoneNumber: farmer.phoneNumber,
            paymentGroup: farmer.paymentGroup,
        });

        // 농가 관련 오류 제거
        if (errors.farmerId) {
            setErrors({
                ...errors,
                farmerId: '',
            });
        }
    };

    // 5. 새 위치 정보 추가 함수 수정 - Firebase 연동
    const addNewLocation = async () => {
        try {
            // 현재 가장 큰 깃발 번호 찾기
            const maxFlag = Math.max(...locations.map(loc => loc.flagNumber), globalLastFlagNumberRef.current);
            const nextFlagNumber = maxFlag + 1;

            const newLocation: LocationItem = {
                id: `location-${Date.now()}-${locations.length}`,
                address: {
                    full: '',
                    detail: '',
                    zipcode: '',
                    subdistrict: '',
                },
                flagNumber: nextFlagNumber,
                area: {
                    value: 0,
                    unit: formData.totalArea?.unit || '평',
                },
                cropType: '',
            };

            setLocations([...locations, newLocation]);

            // Firebase에 최신 깃발 번호 업데이트
            await updateLastFlagNumber(nextFlagNumber);
            globalLastFlagNumberRef.current = nextFlagNumber;
        } catch (error) {
            console.error("Error adding new location:", error);
            // 에러 처리 (예: 알림 표시)
        }
    };

    // 위치 정보 삭제
    const removeLocation = (id: string) => {
        if (locations.length <= 1) {
            // 최소 하나의 위치는 유지
            return;
        }

        const newLocations = locations.filter(loc => loc.id !== id);

        // 삭제 후 깃발 번호 재정렬
        const reorderedLocations = newLocations.map((loc, index) => ({
            ...loc,
            flagNumber: index + 1
        }));

        setLocations(reorderedLocations);

        // 총 면적 재계산
        calculateTotalArea(reorderedLocations);
    };

    // 위치 정보 업데이트
    const updateLocation = (id: string, field: string, value: string | number) => {
        const updatedLocations = locations.map(loc => {
            if (loc.id === id) {
                if (field.includes('.')) {
                    const [parent, child] = field.split('.');

                    if (parent === 'area' && child === 'value') {
                        // 면적 값은 숫자로 변환
                        const numValue = typeof value === 'string' ? parseFloat(value) : value;
                        if (!isNaN(numValue) && numValue >= 0) {
                            return {
                                ...loc,
                                area: {
                                    ...loc.area,
                                    value: numValue,
                                }
                            };
                        }
                        return loc;
                    }

                    if (parent === 'address') {
                        return {
                            ...loc,
                            address: {
                                ...loc.address,
                                [child]: value
                            }
                        };
                    }
                }

                return { ...loc, [field]: value };
            }
            return loc;
        });

        setLocations(updatedLocations);

        // 면적이 업데이트된 경우 총 면적 재계산
        if (field === 'area.value') {
            calculateTotalArea(updatedLocations);
        }
    };

    // 주소 정보 업데이트 (AddressInfo 컴포넌트로부터)
    const handleAddressUpdate = (locationId: string, addressUpdate: any) => {
        const updatedLocations = locations.map(loc => {
            if (loc.id === locationId) {
                return {
                    ...loc,
                    address: {
                        ...loc.address,
                        full: addressUpdate.full,
                        zipcode: addressUpdate.zipcode,
                        subdistrict: addressUpdate.subdistrict,
                        coordinates: addressUpdate.coordinates
                    }
                };
            }
            return loc;
        });

        setLocations(updatedLocations);
    };

    // 총 면적 계산
    const calculateTotalArea = (locs = locations) => {
        // 같은 단위의 면적만 합산 (단순화를 위해 첫 번째 항목의 단위를 기준으로 함)
        if (locs.length === 0) return;

        const unit = locs[0].area.unit;
        const totalValue = locs.reduce((sum, loc) => {
            if (loc.area.unit === unit) {
                return sum + (loc.area.value || 0);
            }
            return sum;
        }, 0);

        setFormData({
            ...formData,
            totalArea: {
                value: totalValue,
                unit: unit
            }
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

        // 모든 위치에 주소 정보가 있는지 확인
        const hasEmptyAddress = locations.some(loc => !loc.address.full);
        if (hasEmptyAddress) {
            newErrors.locations = '모든 위치에 주소를 입력해주세요.';
        }

        // 모든 위치에 작물 정보가 있는지 확인
        const hasEmptyCropType = locations.some(loc => !loc.cropType);
        if (hasEmptyCropType) {
            newErrors.cropTypes = '모든 위치에 작물 종류를 입력해주세요.';
        }

        // 면적 값 확인
        const hasInvalidArea = locations.some(loc => !loc.area.value || loc.area.value <= 0);
        if (hasInvalidArea) {
            newErrors.areas = '모든 위치의 면적은 0보다 커야 합니다.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            // 최종 데이터 구성
            const finalFormData = {
                ...formData,
                locations: locations,
            };

            // 호환성을 위해 첫 번째 위치 정보를 기본 필드로도 설정
            if (locations.length > 0) {
                finalFormData.address = locations[0].address;
                finalFormData.cropType = locations[0].cropType;
                finalFormData.area = locations[0].area;
            }
            // subdistrict가 비어 있는 경우, full 주소에서 한국의 다양한 행정 단위를 추출합니다.
            // "동", "면", "읍", "군", "구", "리" 등을 포함합니다.
            if (!finalFormData.address?.subdistrict && finalFormData.address?.full) {
                // 유니코드 정규표현식을 사용하여 한글 및 숫자 조합 뒤에 해당 단위가 나오는 패턴을 매칭
                const unitRegex = /([\uAC00-\uD7AF\d]+(?:동|면|읍|군|구|리))/u;
                const match = finalFormData.address.full.match(unitRegex);
                finalFormData.address.subdistrict = match ? match[1] : '미정';
            }

            // undefined 값 처리
            if (finalFormData.estimatedHarvestDate === undefined) {
                delete finalFormData.estimatedHarvestDate;
            }

            if (isEdit && initialData?.id) {
                // 농지 정보 수정
                await updateField(initialData.id, finalFormData);
                setSuccessMessage('농지 정보가 성공적으로 수정되었습니다.');
            } else {
                // 새 농지 등록
                const id = await createField(finalFormData as Omit<Field, 'id' | 'createdAt' | 'updatedAt'>);
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

    // 결제소속 선택 핸들러
    const handleSelectPaymentGroup = (groupName: string) => {
        setFormData({ ...formData, paymentGroup: groupName });
        if (errors.paymentGroup) {
            setErrors({ ...errors, paymentGroup: '' });
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
    const handleOpenDialog = (type: 'cropType' | 'paymentGroup' | 'subdistrict') => {
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
        }

        setShowAddDialog(false);
    };

    // 주소 검색 함수
    const openAddressSearch = (locationId: string) => {
        const daumObj = (window).daum;
        if (!daumObj || !daumObj.Postcode) {
            console.error('Daum 우편번호 서비스가 로드되지 않았습니다.');
            return;
        }

        new daumObj.Postcode({
            oncomplete: (data: DaumPostcodeData) => {
                const addressData = {
                    full: data.address,
                    zipcode: data.zonecode,
                    subdistrict: data.buildingName || '',
                    coordinates: {
                        latitude: 0,
                        longitude: 0
                    }
                };
                handleAddressUpdate(locationId, addressData);
            }
        }).open();
    };


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

                    {/* 농가 검색 및 선택 */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: '1px solid #e0e0e0',
                                    background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    fontWeight="600"
                                    sx={{
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#2e7d32'
                                    }}
                                >
                                    <PersonIcon sx={{ mr: 1, color: '#2e7d32' }} />
                                    농가 정보
                                </Typography>

                                {formData.farmerId ? (
                                    <Box
                                        sx={{
                                            mb: 2,
                                            p: 3,
                                            borderRadius: 2,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                            border: '1px solid rgba(46, 125, 50, 0.2)',
                                            transition: 'all 0.3s ease',
                                            backgroundColor: 'rgba(46, 125, 50, 0.03)'
                                        }}
                                    >
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6 }} >
                                                <Typography variant="body1" fontWeight="600" gutterBottom color="#2e7d32">
                                                    {formData.farmerName}
                                                </Typography>
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                    {formData.phoneNumber}
                                                </Typography>
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <PaymentIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                    결제 그룹: {formData.paymentGroup || '없음'}
                                                </Typography>
                                            </Grid>
                                            {!farmerId && (
                                                <Grid size={{ xs: 12, sm: 6 }} >
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                        startIcon={<SwapHorizIcon />}
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            farmerId: '',
                                                            farmerName: '',
                                                            phoneNumber: '',
                                                            paymentGroup: '',
                                                        })}
                                                        sx={{ mt: { xs: 1, sm: 0 } }}
                                                    >
                                                        다른 농가 선택
                                                    </Button>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                ) : (
                                    <>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid size={{ xs: 12, md: 7 }} >
                                                <TextField
                                                    fullWidth
                                                    label="농가 검색"
                                                    value={farmerSearchTerm}
                                                    onChange={(e) => setFarmerSearchTerm(e.target.value)}
                                                    onKeyDown={handleSearchKeyDown}
                                                    placeholder="농가 이름이나 전화번호로 검색"
                                                    error={!!errors.farmerId}
                                                    helperText={errors.farmerId}
                                                    variant="outlined"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            backgroundColor: '#ffffff'
                                                        }
                                                    }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SearchIcon color="action" />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 6, md: 2.5 }} >
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={handleFarmerSearch}
                                                    disabled={isSearching}
                                                    sx={{
                                                        height: '56px',
                                                        borderRadius: 2,
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                                        backgroundColor: '#1976d2',
                                                        '&:hover': {
                                                            backgroundColor: '#1565c0'
                                                        }
                                                    }}
                                                >
                                                    {isSearching ? <CircularProgress size={24} color="inherit" /> : '농가 검색'}
                                                </Button>
                                            </Grid>
                                            <Grid size={{ xs: 6, md: 2.5 }} >
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => setShowAddFarmerDialog(true)}
                                                    sx={{
                                                        height: '56px',
                                                        borderRadius: 2,
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                    }}
                                                    startIcon={<AddIcon />}
                                                >
                                                    농가 추가
                                                </Button>
                                            </Grid>
                                        </Grid>

                                        {/* 검색 결과 표시 - 모던한 카드 형태 */}
                                        {searchResults.length > 0 && (
                                            <Box sx={{ mt: 3, maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                                                >
                                                    <ListAltIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                                                    검색 결과 ({searchResults.length}건)
                                                </Typography>

                                                <Grid container spacing={2}>
                                                    {searchResults.map((farmer) => (
                                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={farmer.id}>
                                                            <Card
                                                                sx={{
                                                                    height: '100%',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    transition: 'all 0.2s ease',
                                                                    '&:hover': {
                                                                        transform: 'translateY(-3px)',
                                                                        boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
                                                                        cursor: 'pointer',
                                                                        borderColor: '#2e7d32'
                                                                    },
                                                                    border: '1px solid #e0e0e0',
                                                                }}
                                                                onClick={() => handleFarmerSelect(farmer)}
                                                            >
                                                                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                                        <Avatar
                                                                            sx={{
                                                                                bgcolor: 'primary.light',
                                                                                width: 32,
                                                                                height: 32,
                                                                                mr: 1.5,
                                                                                fontSize: '0.875rem'
                                                                            }}
                                                                        >
                                                                            {farmer.name.charAt(0)}
                                                                        </Avatar>
                                                                        <Typography variant="body1" fontWeight="600">
                                                                            {farmer.name}
                                                                        </Typography>
                                                                    </Box>

                                                                    <Divider sx={{ mb: 2 }} />

                                                                    <Box sx={{ pl: 1 }}>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                mb: 1,
                                                                                color: 'text.secondary'
                                                                            }}
                                                                        >
                                                                            <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                                                                            {farmer.phoneNumber}
                                                                        </Typography>

                                                                        {farmer.address?.full && (
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'flex-start',
                                                                                    mb: 1,
                                                                                    color: 'text.secondary'
                                                                                }}
                                                                            >
                                                                                <LocationOnIcon sx={{ fontSize: 16, mr: 1, mt: '2px' }} />
                                                                                <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                    {farmer.address.full} {farmer.address.detail || ''}
                                                                                </Box>
                                                                            </Typography>
                                                                        )}

                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                color: 'text.secondary'
                                                                            }}
                                                                        >
                                                                            <PaymentIcon sx={{ fontSize: 16, mr: 1 }} />
                                                                            결제 그룹: {farmer.paymentGroup || '없음'}
                                                                        </Typography>
                                                                    </Box>
                                                                </CardContent>
                                                                <CardActions sx={{ p: 1.5, pt: 0, justifyContent: 'flex-end' }}>
                                                                    <Button
                                                                        size="small"
                                                                        color="primary"
                                                                        sx={{ textTransform: 'none' }}
                                                                    >
                                                                        선택하기
                                                                    </Button>
                                                                </CardActions>
                                                            </Card>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* 위치 정보 섹션 */}
                    <Grid size={{ xs: 12 }} >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationIcon sx={{ mr: 1 }} />
                                위치 정보
                            </Typography>

                        </Box>

                        {errors.locations && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {errors.locations}
                            </Alert>
                        )}

                        {locations.map((location, index) => (
                            <Card key={location.id} sx={{ mb: 3, position: 'relative' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                            <FlagIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                            위치 #{location.flagNumber}
                                        </Typography>
                                        {locations.length > 1 && (
                                            <Tooltip title="위치 삭제">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => removeLocation(location.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>

                                    <Grid container spacing={2}>
                                        {/* 깃발 번호 */}
                                        <Grid size={{ xs: 12, sm: 3 }} >
                                            <TextField
                                                fullWidth
                                                label="깃발 번호"
                                                type="number"
                                                value={location.flagNumber}
                                                onChange={(e) => updateLocation(location.id, 'flagNumber', parseInt(e.target.value) || 1)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <FlagIcon sx={{ color: 'action.active' }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>

                                        {/* 주소 정보 */}
                                        <Grid size={{ xs: 12, sm: 9 }} >
                                            <TextField
                                                fullWidth
                                                required
                                                label="주소"
                                                value={location.address.full || ''}
                                                onClick={() => {
                                                    // 주소 검색 다이얼로그를 여기서 열 수 있습니다
                                                    const daumObj = (window).daum;
                                                    // AddressInfo 컴포넌트가 직접 호출되지 않고,
                                                    // 여기서는 주소 검색 기능만 호출합니다
                                                    if (!daumObj || !daumObj.Postcode) {
                                                        const script = document.createElement('script');
                                                        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                                                        script.async = true;
                                                        script.onload = () => openAddressSearch(location.id);
                                                        document.head.appendChild(script);
                                                    } else {
                                                        openAddressSearch(location.id);
                                                    }
                                                }}
                                                InputProps={{
                                                    startAdornment: <LocationIcon sx={{ color: 'action.active', mr: 1 }} />,
                                                    readOnly: true,
                                                }}
                                            />
                                        </Grid>

                                        {/* 상세 주소 */}
                                        <Grid size={{ xs: 12 }} >
                                            <TextField
                                                fullWidth
                                                label="상세주소"
                                                value={location.address.detail || ''}
                                                onChange={(e) => updateLocation(location.id, 'address.detail', e.target.value)}
                                                placeholder="상세주소를 입력하세요"
                                                sx={{ mt: 2 }}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }} >
                                            <Divider sx={{ my: 2 }} />
                                        </Grid>

                                        {/* 면적 정보 */}
                                        <Grid size={{ xs: 12, sm: 8 }} >
                                            <TextField
                                                fullWidth
                                                required
                                                type="number"
                                                label="면적"
                                                value={location.area.value || ''}
                                                onChange={(e) => updateLocation(location.id, 'area.value', parseFloat(e.target.value) || 0)}
                                                error={!location.area.value || location.area.value <= 0}
                                                helperText={!location.area.value || location.area.value <= 0 ? '면적은 0보다 커야 합니다.' : ''}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <TerrainIcon sx={{ color: 'action.active' }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }} >
                                            <FormControl fullWidth>
                                                <InputLabel>단위</InputLabel>
                                                <Select
                                                    value={location.area.unit || '평'}
                                                    onChange={(e) => updateLocation(location.id, 'area.unit', e.target.value)}
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

                                        {/* 작물 정보 */}
                                        <Grid size={{ xs: 12 }} >
                                            <CollectionSelector
                                                label="작물 종류"
                                                options={cropTypes}
                                                selectedValue={location.cropType || ''}
                                                onSelect={(value: string) => updateLocation(location.id, 'cropType', value)}
                                                onAddNew={async (newVal: string) => {
                                                    // addCropType를 호출하여 Firestore에 새 작물 종류를 저장
                                                    await addCropType(newVal);
                                                }}
                                                additionalButtonText="새 작물 추가"
                                            />
                                            {!location.cropType && (
                                                <FormHelperText>작물 종류를 선택해주세요</FormHelperText>
                                            )}
                                        </Grid>


                                        <Grid size={{ xs: 12 }} >
                                            <TextField
                                                fullWidth
                                                label="특이사항/메모"
                                                value={location.note || ''}
                                                onChange={(e) => updateLocation(location.id, 'note', e.target.value)}
                                                placeholder="이 위치에 대한 특이사항이나 메모를 입력하세요"
                                                multiline
                                                rows={2}
                                                sx={{ mt: 2 }}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}

                        {/* 총 면적 정보 */}
                        <Box sx={{
                            p: 2,
                            mt: 2,
                            border: `1px solid ${theme.palette.primary.main}`,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0, 150, 136, 0.05)'
                        }}>
                            <CalculateIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                            <Typography variant="h6" fontWeight="bold">
                                총 면적: {(formData.totalArea?.value || 0).toLocaleString()} {formData.totalArea?.unit || '평'}
                            </Typography>
                        </Box>

                        {/* 위치 추가 버튼 */}
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={addNewLocation}
                                fullWidth
                                sx={{ maxWidth: 400 }}
                            >
                                새 위치 추가
                            </Button>
                        </Box>
                    </Grid>

                </TabPanel>

                {/* 추가 정보 탭 */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        {/* 수확 예정일 */}
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
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
                        </LocalizationProvider>

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
                                onChange={(e) => setFormData({
                                    ...formData,
                                    memo: e.target.value
                                })}
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

            {/* 농가 추가 다이얼로그 - 다음 주소검색 통합 */}
            <Dialog
                open={showAddFarmerDialog}
                onClose={() => setShowAddFarmerDialog(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    새 농가 추가
                </DialogTitle>
                <DialogContent>
                    {farmerErrors.submit && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {farmerErrors.submit}
                        </Alert>
                    )}
                    <Box sx={{ mt: 2 }}>
                        <BasicInfo
                            formData={newFarmer}
                            errors={farmerErrors}
                            onChange={handleNewFarmerChange}
                            handleOpenDialog={handleOpenDialog}
                        />
                        <CollectionSelector
                            label="결제소속"
                            options={paymentGroupOptions}
                            selectedValue={formData.paymentGroup || ''}
                            onSelect={handleSelectPaymentGroup}
                            onAddNew={async (newVal: string) => {
                                await addPaymentGroup(newVal);
                                setFormData({ ...formData, paymentGroup: newVal });
                            }}
                            additionalButtonText="새 결제소속 추가"
                        />

                        {/* 주소 필드 - 다음 주소 검색 통합 */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>주소 정보</Typography>
                                <TextField
                                    fullWidth
                                    label="주소"
                                    name="address.full"
                                    value={newFarmer.address?.full || ''}
                                    onClick={() => {
                                        // 다음 주소 검색 실행
                                        if (!(window as any).daum || !(window as any).daum.Postcode) {
                                            const script = document.createElement('script');
                                            script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                                            script.async = true;
                                            script.onload = () => {
                                                // 스크립트 로드 후 주소 검색 실행
                                                new (window as any).daum.Postcode({
                                                    oncomplete: (data: any) => {
                                                        // 선택한 주소 데이터 저장
                                                        const addressUpdate = {
                                                            full: data.address,
                                                            zipcode: data.zonecode,
                                                            subdistrict: data.bname || '', // 면단위(법정동/법정리) 저장
                                                            detail: newFarmer.address?.detail || ''
                                                        };

                                                        // 주소 정보 업데이트
                                                        setNewFarmer(prev => ({
                                                            ...prev,
                                                            address: addressUpdate
                                                        }));
                                                    }
                                                }).open();
                                            };
                                            document.head.appendChild(script);
                                        } else {
                                            new (window as any).daum.Postcode({
                                                oncomplete: (data: any) => {
                                                    // 선택한 주소 데이터 저장
                                                    const addressUpdate = {
                                                        full: data.address,
                                                        zipcode: data.zonecode,
                                                        subdistrict: data.bname || '', // 면단위(법정동/법정리) 저장
                                                        detail: newFarmer.address?.detail || ''
                                                    };

                                                    // 주소 정보 업데이트
                                                    setNewFarmer(prev => ({
                                                        ...prev,
                                                        address: addressUpdate
                                                    }));
                                                }
                                            }).open();
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationOnIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        readOnly: true,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: 'background.paper'
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="상세주소"
                                    name="address.detail"
                                    value={newFarmer.address?.detail || ''}
                                    onChange={handleNewFarmerChange}
                                    placeholder="나머지 상세 주소를 입력하세요"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="면단위"
                                    name="address.subdistrict"
                                    value={newFarmer.address?.subdistrict || ''}
                                    onChange={handleNewFarmerChange}
                                    placeholder="면단위가 자동으로 입력됩니다"
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <HomeIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    helperText="주소 검색 시 자동으로 입력되는 면단위 정보입니다"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setShowAddFarmerDialog(false)}
                        color="inherit"
                        disabled={isAddingFarmer}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleAddNewFarmer}
                        color="primary"
                        variant="contained"
                        disabled={isAddingFarmer}
                        startIcon={isAddingFarmer ? <CircularProgress size={20} /> : null}
                    >
                        추가
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper >
    );
};

export default FieldForm;