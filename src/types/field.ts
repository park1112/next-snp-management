// src/types/field.ts
// 위치 정보 타입 정의
export interface LocationItem {
  id: string;
  address: {
    full: string;
    detail: string;
    zipcode: string;
    subdistrict: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  flagNumber: number;
  area: {
    value: number;
    unit: string;
  };
  cropType: string;
  note?: string; // 위치별 특이사항/메모
}

// 농지 관련 타입
export interface Field {
  id: string;
  farmerId: string;
  farmerName?: string;
  phoneNumber?: string;
  paymentGroup?: string;
  subdistrict?: string;
  address: {
    full: string;
    detail?: string;
    subdistrict?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  area: {
    value: number;
    unit: string;
  };
  cropType: string;
  estimatedHarvestDate?: Date;
  currentStage: {
    stage: string;
    updatedAt: Date;
    history?: {
      stage: string;
      timestamp: Date;
      by: string;
    }[];
  };
  contractIds?: string[];
  contractStatus?: string;
  currentContract?: {
    id: string;
    contractNumber: string;
    finalPaymentDueDate?: Date;
  };
  schedules?: string[];
  createdAt: Date;
  updatedAt: Date;
  memo?: string;
  totalArea?: {
    value: number;
    unit: string;
  };
  locations?: LocationItem[];
}