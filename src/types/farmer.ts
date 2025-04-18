// src/types/farmer.ts
import { BaseEntity, AddressInfo, BankInfo } from './common';

export interface Farmer extends BaseEntity {
  name: string;
  phoneNumber: string;
  paymentGroup: string; // 결제소속
  personalId?: string; // 주민등록번호 (optional)
  address: AddressInfo;
  bankInfo?: BankInfo;
  
  // 참조 관계
  fields?: string[]; // 농지 ID 참조 배열
  contracts?: string[]; // 계약 ID 배열
  
  // 통계 필드 (계산된 값)
  activeContracts?: number; // 활성 계약 수
  totalContractAmount?: number; // 총 계약 금액
  remainingPayments?: number; // 남은 결제 금액
}

// 농가 생성 시 필요한 타입 (ID, 생성일 등 제외)
export type FarmerCreate = Omit<Farmer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

// 농가 업데이트 시 필요한 타입 (모든 필드 옵셔널)
export type FarmerUpdate = Partial<Omit<Farmer, 'id' | 'createdAt' | 'createdBy'>>;

// 농가 검색 타입
export type FarmerSearchType = 'name' | 'phoneNumber' | 'subdistrict' | 'paymentGroup';