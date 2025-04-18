// src/types/farmer.ts
// 농가 관련 타입
export interface Farmer {
  id: string;
  name: string;
  phoneNumber: string;
  paymentGroup: string; // 결제소속
  personalId?: string; // 주민등록번호 (optional)
  address: {
    full: string;
    zipcode?: string;
    detail?: string;
    subdistrict?: string;
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
  fields?: string[]; // 농지 ID 참조 배열
  contracts?: string[]; // 계약 ID 배열
  activeContracts?: number; // 활성 계약 수
  totalContractAmount?: number; // 총 계약 금액
  remainingPayments?: number; // 남은 결제 금액
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // 등록한 사용자 ID
  memo?: string;
}