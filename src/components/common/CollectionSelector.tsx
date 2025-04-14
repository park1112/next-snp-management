// src/components/common/CollectionSelector.tsx
'use client';

import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Typography,
    Divider
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DropdownOption } from '@/types';

interface CollectionSelectorProps {
    label: string;
    options: DropdownOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onAddNew: (newValue: string) => Promise<void> | void;
    additionalButtonText?: string;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({
    label,
    options,
    selectedValue,
    onSelect,
    onAddNew,
    additionalButtonText,
}) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [error, setError] = useState('');

    const handleOpen = () => {
        setNewValue('');
        setError('');
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
    };

    const handleAdd = async () => {
        if (!newValue.trim()) {
            setError(`${label}을(를) 입력해주세요.`);
            return;
        }
        try {
            await onAddNew(newValue.trim());
            onSelect(newValue.trim());
            setOpenDialog(false);
        } catch (err) {
            setError('추가 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
                {label}
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    width: '100%',
                    position: 'relative',
                    pb: 1
                }}
            >
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    flex: '1 1 auto',
                    maxWidth: 'calc(100% - 150px)'  // 새 결제소속 버튼 공간 확보
                }}>
                    {options.map(option => (
                        <Button
                            key={option.value}
                            variant={selectedValue === option.value ? "contained" : "outlined"}
                            onClick={() => onSelect(option.value)}
                            sx={{
                                mb: 1,
                                textOverflow: 'ellipsis',
                                overflow: 'hidden'
                            }}
                            size="small"
                        >
                            {option.label}
                        </Button>
                    ))}
                </Box>

                <Button
                    variant="outlined"
                    color="success"
                    onClick={handleOpen}
                    startIcon={<AddIcon />}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0
                    }}
                >
                    {additionalButtonText || `새 ${label} 추가`}
                </Button>
            </Box>
            <Divider sx={{ mt: 1 }} />

            <Dialog open={openDialog} onClose={handleClose}>
                <DialogTitle>새 {label} 추가</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        autoFocus
                        label={label}
                        fullWidth
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        취소
                    </Button>
                    <Button onClick={handleAdd} color="primary" variant="contained">
                        추가
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CollectionSelector;