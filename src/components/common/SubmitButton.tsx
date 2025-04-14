// src/components/common/SubmitButton.tsx
import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface SubmitButtonProps {
    label: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'inherit';
    variant?: 'text' | 'outlined' | 'contained';
    disabled?: boolean;
    loading?: boolean;
    startIcon?: React.ReactNode;
    fullWidth?: boolean;
    sx?: SxProps<Theme>;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
    label,
    onClick,
    type = 'submit',
    color = 'primary',
    variant = 'contained',
    disabled = false,
    loading = false,
    startIcon,
    fullWidth = false,
    sx,
}) => {
    return (
        <Button
            type={type}
            variant={variant}
            color={color}
            onClick={onClick}
            disabled={disabled || loading}
            fullWidth={fullWidth}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
            sx={sx}
        >
            {label}
        </Button>
    );
};

export default SubmitButton;