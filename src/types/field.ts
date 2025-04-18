// src/types/field.ts
import { BaseEntity, AddressInfo, Quantity, StatusInfo } from './common';

// 위치 정보 타입 정의
export interface LocationItem extends BaseEntity {
  address: AddressInfo;
  flagNumber: number;
  area: Quantity;
  cropType: string;
  note?: string; // 위치별 특이사항/메모
}

// 농지 관련 타입
export interface Field extends BaseEntity {
  // 소유자 정보
  farmerId: string;
  farmerName?: string; // 표시용, DB 저장 불필요
  phoneNumber?: string; // 표시용, DB 저장 불필요
  paymentGroup?: string; // 표시용, DB 저장 불필요
  
  // 위치 정보
  address: AddressInfo;
  subdistrict?: string; // 검색용 필드
  
  // 면적 정보
  area: Quantity;
  
  // 작물 정보
  cropType: string;
  estimatedHarvestDate?: Date;
  
  // 상태 정보
  currentStage: StatusInfo;
  
  // 계약 정보
  contractIds?: string[];
  contractStatus?: string;
  currentContract?: {
    id: string;
    contractNumber: string;
    finalPaymentDueDate?: Date;
  };
  
  // 일정 정보
  schedules?: string[];
  
  // 세부 위치 정보
  locations?: LocationItem[];
  
  // 통계 정보
  totalArea?: Quantity;
}

// 농지 생성 시 필요한 타입
export type FieldCreate = Omit<Field, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

// 농지 업데이트 시 필요한 타입
export type FieldUpdate = Partial<Omit<Field, 'id' | 'createdAt' | 'createdBy'>>;

// 농지 검색 타입
export type FieldSearchType = 'farmerId' | 'subdistrict' | 'cropType' | 'flagNumber';