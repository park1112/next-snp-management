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
    InputAdornment
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

    const farmerId = searchParams?.get('farmerId');

    // Tab state
    const [tabValue, setTabValue] = useState(0);