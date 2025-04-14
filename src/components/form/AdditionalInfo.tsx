// src/components/form/AdditionalInfo.tsx
import React from 'react';
import { Grid, TextField, Typography, Divider } from '@mui/material';
import { Note as NoteIcon } from '@mui/icons-material';
import { Farmer } from '@/types';

interface AdditionalInfoProps {
    formData: Partial<Farmer>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ formData, onChange }) => {
    return (
        <>
            <Grid size={{ xs: 12 }}>
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}
                >
                    <NoteIcon sx={{ mr: 1 }} />
                    추가 정보 (선택)
                </Typography>
                <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label="메모"
                    name="memo"
                    value={formData.memo || ''}
                    onChange={(e) => onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)}
                    multiline
                    rows={4}
                    placeholder="특이사항이나 참고할 내용을 입력하세요"
                />
            </Grid>
        </>
    );
};

export default AdditionalInfo;
