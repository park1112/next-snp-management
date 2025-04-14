declare namespace kakao.maps {
    class Map {
        constructor(container: HTMLElement, options: MapOptions);
        setCenter(latLng: LatLng): void;
        setZoom(zoom: number): void;
        getZoom(): number;
        getCenter(): LatLng;
        addOverlayMapTypeId(mapTypeId: MapTypeId): void;
        removeOverlayMapTypeId(mapTypeId: MapTypeId): void;
        addControl(control: Control, position: ControlPosition): void;
        panTo(latLng: LatLng): void;
        setLevel(level: number): void;
        getLevel(): number;
        setBounds(bounds: LatLngBounds): void;
    }

    class LatLng {
        constructor(lat: number, lng: number);
        getLat(): number;
        getLng(): number;
    }

    class LatLngBounds {
        constructor();
        extend(latLng: LatLng): void;
    }

    class Marker {
        constructor(options: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(position: LatLng): void;
    }

    class InfoWindow {
        constructor(options: InfoWindowOptions);
        open(map: Map, marker?: Marker): void;
        close(): void;
        setContent(content: string | HTMLElement): void;
    }

    class CustomOverlay {
        constructor(options: CustomOverlayOptions);
        setMap(map: Map | null): void;
        setPosition(position: LatLng): void;
    }

    class MapTypeControl {
        constructor();
    }

    class ZoomControl {
        constructor();
    }

    interface MapOptions {
        center: LatLng;
        level?: number;
        mapTypeId?: MapTypeId;
    }

    interface MarkerOptions {
        position: LatLng;
        map?: Map;
    }

    interface InfoWindowOptions {
        content: string | HTMLElement;
        removable?: boolean;
        position?: LatLng;
        zIndex?: number;
    }

    interface CustomOverlayOptions {
        position: LatLng;
        content: string | HTMLElement;
        yAnchor?: number;
    }

    enum MapTypeId {
        ROADMAP = 'ROADMAP',
        HYBRID = 'HYBRID',
        SATELLITE = 'SATELLITE',
        TERRAIN = 'TERRAIN'
    }

    enum ControlPosition {
        TOP = 'TOP',
        TOPRIGHT = 'TOPRIGHT',
        RIGHT = 'RIGHT',
        BOTTOMRIGHT = 'BOTTOMRIGHT',
        BOTTOM = 'BOTTOM',
        BOTTOMLEFT = 'BOTTOMLEFT',
        LEFT = 'LEFT',
        TOPLEFT = 'TOPLEFT'
    }

    class Control {
        constructor();
    }

    namespace event {
        function addListener(target: any, type: string, handler: Function): void;
    }

    function load(callback: () => void): void;

    namespace services {
        class Geocoder {
            constructor();
            addressSearch(address: string, callback: (result: GeocoderResult[], status: Status) => void): void;
        }

        interface GeocoderResult {
            address: {
                address_name: string;
                region_1depth_name: string;
                region_2depth_name: string;
                region_3depth_name: string;
                region_4depth_name: string;
                road_address: {
                    address_name: string;
                    road_name: string;
                    main_building_no: string;
                    sub_building_no: string;
                    zone_no: string;
                };
            };
            road_address: {
                address_name: string;
                road_name: string;
                main_building_no: string;
                sub_building_no: string;
                zone_no: string;
            };
            x: string;
            y: string;
        }

        enum Status {
            OK = 'OK',
            ZERO_RESULT = 'ZERO_RESULT',
            ERROR = 'ERROR'
        }
    }
}

interface Window {
    kakao: typeof kakao;
} 