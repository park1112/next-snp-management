// src/types/kakao.d.ts
declare global {
    interface Window {
        daum: any;
        kakao: any;
        map: any;
        kakaoMapCallback?: () => void;
    }
}

export { };