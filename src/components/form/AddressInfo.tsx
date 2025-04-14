// src/components/form/AddressInfo.tsx
import React from 'react';
import { Grid, TextField, Button, Typography, Divider, InputAdornment } from '@mui/material';
import { Home as HomeIcon, LocationOn as LocationOnIcon } from '@mui/icons-material';
import { Farmer } from '@/types';

interface AddressUpdate {
    full: string;
    zipcode: string;
    subdistrict: string; // 추출한 면 단위 (예: "동탄면")
    coordinates?: { latitude: number; longitude: number };
}

interface AddressInfoProps {
    formData: Partial<Farmer>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
    // 주소 검색 후 주소, 우편번호, 추출된 면단위 및 좌표를 부모로 전달하기 위한 콜백
    onAddressUpdate: (address: AddressUpdate) => void;
}

// 주소 문자열에서 "면" 단위를 추출하는 헬퍼 함수
const extractSubdistrict = (address: string): string => {
    const regex = /(\S+면)/;
    const match = address.match(regex);
    return match ? match[0] : '';
};

const AddressInfo: React.FC<AddressInfoProps> = ({ formData, onChange, onAddressUpdate }) => {
    // 주소 검색을 위한 함수
    const handleAddressSearch = () => {
        if (!(window as any).daum || !(window as any).daum.Postcode) {
            const script = document.createElement('script');
            script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
            script.async = true;
            script.onload = openAddressSearch;
            document.head.appendChild(script);
        } else {
            openAddressSearch();
        }
    };

    const openAddressSearch = () => {
        new (window as any).daum.Postcode({
            oncomplete: function (data: any) {
                let fullAddress = data.address;
                let extraAddress = '';

                // 법정동명이 있으면 추가
                if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                    extraAddress += data.bname;
                }
                // 건물명이 있고 공동주택인 경우 추가
                if (data.buildingName !== '' && data.apartment === 'Y') {
                    extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                if (extraAddress !== '') {
                    fullAddress += ' (' + extraAddress + ')';
                }
                // 전체 주소로부터 면 단위만 추출 (예: "동탄면")
                const subdistrict = extractSubdistrict(fullAddress);

                // 부모 컴포넌트로 주소, 우편번호 및 추출된 면단위를 업데이트 전달 (우편번호는 UI로는 표시하지 않음)
                onAddressUpdate({ full: fullAddress, zipcode: data.zonecode, subdistrict });

                // 좌표 변환 요청 (좌표 정보가 필요할 경우)
                getCoordinatesFromAddress(fullAddress);
            },
        }).open();
    };

    // 주소로 좌표 조회 (카카오 맵 API 사용)
    const getCoordinatesFromAddress = (address: string) => {
        if (!(window as any).kakao || !(window as any).kakao.maps) {
            const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAPS_API_KEY || 'YOUR_KAKAO_API_KEY';
            const script = document.createElement('script');
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=services&autoload=false`;
            script.async = true;
            script.onload = () => {
                (window as any).kakao.maps.load(() => {
                    searchCoordinates(address);
                });
            };
            document.head.appendChild(script);
        } else {
            searchCoordinates(address);
        }
    };

    const searchCoordinates = (address: string) => {
        if (!address || address.trim() === '') {
            console.error('Empty address provided');
            return;
        }

        const geocoder = new (window as any).kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result: any, status: any) => {
            if (
                status === (window as any).kakao.maps.services.Status.OK &&
                result.length > 0
            ) {
                const coordinates = {
                    latitude: parseFloat(result[0].y),
                    longitude: parseFloat(result[0].x),
                };
                // 주소, 우편번호, 추출된 면단위와 함께 좌표 정보를 부모로 추가 전달
                onAddressUpdate({
                    full: address,
                    zipcode: formData.address?.zipcode || '',
                    subdistrict: extractSubdistrict(address),
                    coordinates: coordinates,
                });
            } else {
                console.error(
                    'Failed to get coordinates for address:',
                    address,
                    'Status:',
                    status
                );
            }
        });
    };

    return (
        <>
            <Grid size={{ xs: 12 }}>
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}
                >
                    <HomeIcon sx={{ mr: 1 }} />
                    주소 정보 *
                </Typography>
                <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    fullWidth
                    label="주소"
                    name="address.full"
                    value={formData.address?.full || ''}
                    onChange={(e) =>
                        onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)
                    }
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <LocationOnIcon sx={{ color: 'action.active', mr: 1 }} />
                            </InputAdornment>
                        ),
                        readOnly: true,
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Button variant="outlined" fullWidth onClick={handleAddressSearch} sx={{ height: '56px' }}>
                    주소 검색
                </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                    fullWidth
                    label="상세주소"
                    name="address.detail"
                    value={formData.address?.detail || ''}
                    onChange={(e) =>
                        onChange(e as React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>)
                    }
                    placeholder="상세주소를 입력하세요"
                />
            </Grid>
        </>
    );
};

export default AddressInfo;
