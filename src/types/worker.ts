// src/types/worker.ts
// 기본 작업자 타입
export interface BaseWorker {
  id: string;
  type: 'foreman' | 'driver'; // 작업반장 또는 운송기사
  name: string;
  phoneNumber: string;
  personalId?: string; // 주민등록번호 (선택)
  address?: {
    full: string;
    subdistrict?: string;
    detail?: string;
    zipcode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  schedules?: string[]; // 작업 일정 ID 배열
  payments?: string[];  // 결제 내역 ID 배열
  createdAt: Date;
  updatedAt: Date;
  memo?: string;
}

// 작업반장 타입
export interface Foreman extends BaseWorker {
  type: 'foreman';
  foremanInfo: {
    category: { name: string[]; id: string[] }; // 망담기, 상차팀, 하차팀, 뽑기, 자르기 등
    categorysId: string[];
    rates: {
      detailedRates?: {
        id: string;
        name: string;
        description: string;
        defaultPrice: number;
        unit: string;
        createdAt: string;
        categoryId: string;
        categoryName: string;
      }[];
    };
    createdAt?: string;
  };
}

// 운송기사 타입
export interface Driver extends BaseWorker {
  type: 'driver';
  driverInfo: {
    vehicleNumber: string; // 차량번호 전체
    vehicleNumberLast4: string; // 마지막 4자리 (검색용)
    vehicleType: string; // 트럭, 5톤, 11톤 등
    category: string; // 직영차량, 콜차량, 팀
    rates: {
      baseRate: number; // 기본 운송료
      distanceRate?: number; // km당 추가 요금
      custom?: { [key: string]: number }; // 지역별 커스텀 요금
    };
  };
}

// 작업자 타입
export type Worker = Foreman | Driver;