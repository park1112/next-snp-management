// src/types/common.ts
// 기본 엔티티 인터페이스 - 모든 도메인 객체의 기본이 됨
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  memo?: string;
}

// 주소 관련 인터페이스
export interface AddressInfo {
  full: string;
  detail?: string;
  zipcode?: string;
  subdistrict?: string;
  coordinates?: Coordinates;
}

// 좌표 인터페이스
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// 은행 정보 인터페이스
export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

// 카테고리 관련 인터페이스
export interface Category extends BaseEntity {
  name: string;
  description?: string;
  nextCategoryId?: string | null;
  order?: number; // 카테고리 순서
}

// 작업 단가 인터페이스
export interface Rate extends BaseEntity {
  name: string;
  description?: string;
  defaultPrice: number;
  unit: string;
  categoryId?: string; // 소속 카테고리 ID
}

// 상태 기록 인터페이스
export interface StatusHistory {
  stage: string;
  timestamp: Date;
  by: string;
}

// 상태 관리 인터페이스
export interface StatusInfo {
  current: string;
  history: StatusHistory[];
}

// 수량 및 단위 인터페이스
export interface Quantity {
  value: number;
  unit: string;
}

// 일정 관련 인터페이스
export interface ScheduleTime {
  start: Date;
  end?: Date;
}

// 결제 관련 공통 인터페이스
export interface PaymentInfo {
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  paidAmount?: number;
  receiptImageUrl?: string;
  status: 'unpaid' | 'scheduled' | 'paid';
}

// 작업 유형 및 상태 타입
export type WorkType = 'pulling' | 'cutting' | 'packing' | 'transport' | 'netting';
export type WorkStage = '예정' | '준비중' | '진행중' | '완료' | '취소';
export type ContractStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'requested' | 'onhold' | 'completed';



