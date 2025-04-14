// src/components/form/BankInfo.tsx
import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider } from '@mui/material';
import { AccountBalance as BankIcon } from '@mui/icons-material';
import { Farmer, DropdownOption } from '@/types';

interface BankInfoProps {
    formData: Partial<Farmer>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
    bankOptions: DropdownOption[];
}

const BankInfo: React.FC<BankInfoProps> = ({ formData, onChange, bankOptions }) => {
    return (
        <>
            <Grid size={{ xs: 12 }}>
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}
                >
                    <BankIcon sx={{ mr: 1 }} />
                    계좌정보 (선택)
                </Typography>
                <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                    <InputLabel>은행</InputLabel>
                    <Select
                        name="bankInfo.bankName"
                        value={formData.bankInfo?.bankName || ''}
                        onChange={(e) => onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)}
                        label="은행"
                    >
                        {bankOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                    fullWidth
                    label="계좌번호"
                    name="bankInfo.accountNumber"
                    value={formData.bankInfo?.accountNumber || ''}
                    onChange={(e) => onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)}
                    placeholder="숫자만 입력하세요"
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                    fullWidth
                    label="예금주"
                    name="bankInfo.accountHolder"
                    value={formData.bankInfo?.accountHolder || formData.name || ''}
                    onChange={(e) => onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)}
                    placeholder="예금주명"
                />
            </Grid>
        </>
    );
};

export default BankInfo;
