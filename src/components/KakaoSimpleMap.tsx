// src/components/KakaoSimpleMap.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface KakaoAddressResult {
    x: string;
    y: string;
}

interface KakaoSimpleMapProps {
    address: string;
    latitude?: number;
    longitude?: number;
    zoom?: number;
}

const KakaoSimpleMap: React.FC<KakaoSimpleMapProps> = ({ address, latitude, longitude, zoom = 3 }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const currentZoom = zoom;
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAPS_API_KEY;

    // Kakao Maps API 스크립트 로드
    useEffect(() => {
        if (window.kakao && window.kakao.maps) {
            setMapLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'kakao-maps-sdk';
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.kakao.maps.load(() => {
                setMapLoaded(true);
            });
        };
        document.head.appendChild(script);
        return () => {
            const existingScript = document.getElementById('kakao-maps-sdk');
            if (existingScript) {
                document.head.removeChild(existingScript);
            }
        };
    }, [apiKey]);

    // 지도 초기화
    useEffect(() => {
        if (!mapLoaded || !mapRef.current || !window.kakao || !window.kakao.maps) {
            return;
        }

        const kakao = window.kakao;
        let centerPosition;

        // 위도/경도가 제공된 경우 해당 좌표를 사용
        if (latitude && longitude) {
            centerPosition = new kakao.maps.LatLng(latitude, longitude);
            initMap(centerPosition);
        } else {
            // 위도/경도가 없으면 주소를 기반으로 좌표 변환
            // 좌표 변환 부분 수정
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (results: KakaoAddressResult[], status: string) => {
                if (status === kakao.maps.services.Status.OK && results.length > 0) {
                    const coords = new kakao.maps.LatLng(parseFloat(results[0].y), parseFloat(results[0].x));
                    centerPosition = coords;
                    initMap(centerPosition);
                } else {
                    console.error('주소를 기반으로 좌표를 찾을 수 없습니다:', address);
                }
            });
        }

        function initMap(center: kakao.maps.LatLng) {
            const mapOptions = {
                center,
                level: currentZoom,
                mapTypeId: kakao.maps.MapTypeId.HYBRID,
            };
            const map = new kakao.maps.Map(mapRef.current as HTMLElement, mapOptions);
            // 마커 추가
            const marker = new kakao.maps.Marker({
                position: center,
                map: map,
            });
            // 간단한 정보창 추가
            const infowindow = new kakao.maps.InfoWindow({
                content: `<div style="padding: 5px; font-size: 12px;">${address}</div>`,
            });
            infowindow.open(map, marker);
        }
    }, [mapLoaded, address, latitude, longitude, currentZoom]);

    return (
        <Box sx={{ position: 'relative', height: 350, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
            {!mapLoaded && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.7)',
                        zIndex: 10,
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </Box>
    );
};

export default KakaoSimpleMap;
