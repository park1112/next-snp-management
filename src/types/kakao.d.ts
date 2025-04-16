// src/types/kakao.d.ts

// Daum 우편번호 관련 타입 선언
interface DaumPostcodeData {
    address: string;
    zonecode: string;
    buildingName?: string;
    bname?: string;
}

interface DaumPostcodeOptions {
    oncomplete: (data: DaumPostcodeData) => void;
}

interface DaumPostcode {
    new(options: DaumPostcodeOptions): { open: () => void };
}

interface Daum {
    Postcode: DaumPostcode;
}

// Kakao 지도 API 관련 타입 선언
interface KakaoMapsServices {
    Geocoder: new () => {
        addressSearch: (
            address: string,
            callback: (result: { x: string; y: string }[], status: string) => void
        ) => void;
    };
    Status: {
        OK: string;
    };
}

interface KakaoMaps {
    Map: new (container: HTMLElement, options: Record<string, unknown>) => unknown;
    Marker: new (options: Record<string, unknown>) => unknown;
    LatLng: new (lat: number, lng: number) => unknown;
    InfoWindow: new (options: Record<string, unknown>) => unknown;
    MapTypeId: {
        HYBRID: string;
    };
    load: (callback: () => void) => void;
    services: KakaoMapsServices;
}

interface Kakao {
    maps: KakaoMaps;
}

declare global {
    interface Window {
        daum: Daum;
        kakao: Kakao;
        // 만약 'map' 전역 변수가 사용된다면, 타입을 구체적으로 정의하거나 사용 목적에 맞게 수정하세요.
        map: unknown;
        kakaoMapCallback?: () => void;
    }
}

export { };
