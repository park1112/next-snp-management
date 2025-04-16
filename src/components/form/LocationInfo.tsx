// src/components/form/LocationInfo.tsx
import React from 'react';
import { Grid, Typography, Divider } from '@mui/material';
import { LocationOn as LocationOnIcon } from '@mui/icons-material';
import AddressInfo from './AddressInfo';
import { Schedule } from '@/types';

// Define the AddressUpdate interface
interface AddressUpdate {
    address?: string;
    roadAddress?: string;
    jibunAddress?: string;
    zonecode?: string;
    detail?: string;
}

interface LocationInfoProps {
    formData: Partial<Schedule>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
    onAddressUpdate: (addressData: any, fieldName: string) => void;
    type: 'origin' | 'destination';
    required?: boolean;
    label: string;
    error?: string;
}

const LocationInfo: React.FC<LocationInfoProps> = ({
    formData,
    onChange,
    onAddressUpdate,
    type,
    required = false,
    label,
    error
}) => {
    // 주소 정보 업데이트 핸들러
    const handleAddressUpdate = (addressData: AddressUpdate) => {
        onAddressUpdate(addressData, type);
    };

    // 현재 데이터 접근 경로 설정
    const addressPath = `transportInfo.${type}.address`;
    const detailPath = `transportInfo.${type}.detail`;

    // 데이터 값 접근
    const addressValue = type === 'origin'
        ? formData.transportInfo?.origin?.address || ''
        : formData.transportInfo?.destination?.address || '';

    const detailValue = type === 'origin'
        ? formData.transportInfo?.origin?.detail || ''
        : formData.transportInfo?.destination?.detail || '';

    return (
        <>
            <Grid size={{ xs: 12 }}>
                <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                >
                    <LocationOnIcon sx={{ mr: 1 }} />
                    {label} {required && '*'}
                </Typography>
                <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* AddressInfo 컴포넌트 활용 */}
            <AddressInfo
                formData={{
                    address: {
                        full: addressValue,
                        detail: detailValue
                    }
                }}
                onChange={onChange}
                onAddressUpdate={(addressData) => {
                    // Create a new object with the address data and detail
                    const updatedData = {
                        ...(addressData as unknown as AddressUpdate),
                        detail: detailValue
                    };
                    handleAddressUpdate(updatedData);
                }}
            />

            {error && (
                <Grid size={{ xs: 12 }}>
                    <Typography color="error" variant="caption">
                        {error}
                    </Typography>
                </Grid>
            )}
        </>
    );
};

export default LocationInfo;