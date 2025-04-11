// src/components/farmers/FarmerFormSections/BasicInfo.tsx
import React from 'react';
import {
    Grid,
    TextField,
    FormControl,
    FormHelperText,
    Typography,
    Divider,
    InputAdornment,
    Button,
    Chip,
    Paper,
    Box,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Person as PersonIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { Farmer, PaymentGroup } from '@/types';




interface BasicInfoProps {
    formData: Partial<Farmer>;
    errors: { [key: string]: string };
    onChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
    paymentGroups: PaymentGroup[];
    handleOpenDialog: (type: 'paymentGroup') => void;
}

// 수정된 BasicInfo 컴포넌트 - paymentGroupOptions 제거
const BasicInfo: React.FC<{
    formData: Partial<Farmer>;
    errors: { [key: string]: string };
    onChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
    paymentGroups: PaymentGroup[]; // paymentGroupOptions 대신 paymentGroups로 변경
    handleOpenDialog: (type: 'subdistrict' | 'paymentGroup') => void;
}> = ({ formData, errors, onChange, paymentGroups, handleOpenDialog }) => {

    // 결제소속 선택 핸들러
    const handleSelectPaymentGroup = (groupName: string) => {
        onChange({
            target: {
                name: 'paymentGroup',
                value: groupName
            }
        } as React.ChangeEvent<HTMLInputElement>);
    };




    return (
        <>
            <Grid size={12}>
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                >
                    <PersonIcon sx={{ mr: 1 }} />
                    기본 정보 *
                </Typography>
                <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* 이름 */}
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    required
                    fullWidth
                    label="이름"
                    name="name"
                    value={formData.name || ''}
                    onChange={(e) => onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)}
                    error={!!errors.name}
                    helperText={errors.name}
                    placeholder="농가 이름 또는 대표자 이름"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonIcon sx={{ color: 'action.active', mr: 1 }} />
                            </InputAdornment>
                        ),
                        inputProps: { maxLength: 50 },
                    }}
                />
            </Grid>

            {/* 전화번호 */}
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    required
                    fullWidth
                    label="전화번호"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber || '숫자만 입력하세요. 자동으로 하이픈(-)이 추가됩니다.'}
                    placeholder="010-1234-5678"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PhoneIcon sx={{ color: 'action.active', mr: 1 }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Grid>

            {/* 결제소속 - 버튼 기반 UI */}
            <Grid size={12}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>결제소속 *</Typography>
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        position: 'relative',
                        pb: 1
                    }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                flex: 1
                            }}
                        >
                            {paymentGroups.map((group) => (
                                <Button
                                    key={group.id}
                                    variant={formData.paymentGroup === group.name ? "contained" : "outlined"}
                                    color={formData.paymentGroup === group.name ? "primary" : "inherit"}
                                    onClick={() => handleSelectPaymentGroup(group.name)}
                                    sx={{
                                        height: 40,
                                        mb: 1,
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        boxShadow: formData.paymentGroup === group.name ? 2 : 'none',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 3
                                        }
                                    }}
                                >
                                    {group.name}
                                </Button>
                            ))}
                        </Paper>

                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => handleOpenDialog('paymentGroup')}
                            startIcon={<AddIcon />}
                            sx={{
                                height: 40,
                                borderRadius: 2,
                                textTransform: 'none',
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bgcolor: 'background.paper',
                                '&:hover': {
                                    boxShadow: 2
                                }
                            }}
                        >
                            새 결제소속
                        </Button>
                    </Box>
                    {errors.paymentGroup && (
                        <Typography color="error" variant="caption">
                            {errors.paymentGroup}
                        </Typography>
                    )}
                </Box>
            </Grid>

            {/* 주민등록번호 */}
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    fullWidth
                    label="주민등록번호 (선택)"
                    name="personalId"
                    value={formData.personalId || ''}
                    onChange={(e) => onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)}
                    error={!!errors.personalId}
                    helperText={errors.personalId || '주민등록번호는 암호화되어 저장됩니다.'}
                    placeholder="123456-1234567"
                />
            </Grid>
        </>
    );
};

export default BasicInfo;