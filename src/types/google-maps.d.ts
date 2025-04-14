// src/types/google-maps.d.ts
declare global {
    interface Window {
        google: typeof google;
    }
}

// 이 내용을 추가하여 Google Maps 관련 타입을 명시적으로 정의
declare namespace google.maps {
    class Map {
        constructor(mapDiv: Element, opts?: MapOptions);
        setCenter(latLng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
        getZoom(): number;
        panTo(latLng: LatLng | LatLngLiteral): void;
        fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
    }

    class Marker {
        constructor(opts?: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(latLng: LatLng | LatLngLiteral): void;
        addListener(eventName: string, handler: Function): MapsEventListener;
    }

    class InfoWindow {
        constructor(opts?: InfoWindowOptions);
        setContent(content: string | Node): void;
        open(map?: Map, anchor?: MVCObject): void;
    }

    interface LatLng {
        lat(): number;
        lng(): number;
    }

    interface LatLngLiteral {
        lat: number;
        lng: number;
    }

    interface LatLngBounds {
        extend(latLng: LatLng | LatLngLiteral): LatLngBounds;
    }

    interface LatLngBoundsLiteral {
        east: number;
        north: number;
        south: number;
        west: number;
    }

    interface MapsEventListener {
        remove(): void;
    }

    interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: string;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        zoomControl?: boolean;
    }

    interface MarkerOptions {
        position: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        animation?: any;
        icon?: any;
    }

    interface InfoWindowOptions {
        content?: string | Node;
        position?: LatLng | LatLngLiteral;
    }

    interface MVCObject { }
}