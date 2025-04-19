// src/types/schedule.ts

import { WorkStage, WorkType } from "./common";




// 작업 일정 타입
export interface Schedule {
  id: string;
  type: WorkType;
  fieldId: string;
  farmerId: string;
  workerId: string;
  farmerName?: string;
  fieldName?: string;
  fieldAddress?: string;
  fieldFullAddress?: string;
  workerName?: string;
  stage: {
    current: string;
    history: {
      stage: string;
      timestamp: Date;
      by: string;
    }[];
  };
  scheduledDate: {
    start: Date;
    end?: Date;
  };
  actualDate?: {
    start: Date;
    end?: Date;
  };
  rateInfo: {
    baseRate: number;
    negotiatedRate?: number;
    quantity?: number;
    unit: string;
    /** 추가 정산 금액 */
    additionalAmount?: number;
    /** 총 정산 금액 (기본 금액 + 추가 금액) */
    totalAmount?: number;
  };
  categorySchedules?: {
    amount?: number;
    categoryId: string;
    categoryName: string;
    stage: WorkStage;
    workerId: string;
    workerName?: string;
    scheduledDate: {
      start: Date;
    };
  }[];
  transportInfo?: {
    origin: {
      address: string;
      detail?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    destination: {
      address: string;
      detail?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      contactName?: string;
      contactPhone?: string;
    };
    cargo: {
      type: string;
      quantity: number;
      unit: string;
    };
    distance?: number;
    distanceRate?: number;
    additionalFee?: number;
  };
  additionalInfo?: {
    cropType?: string;
    expectedQuantity?: number;
    cuttingMethod?: string;
    specialRequirements?: string;
    packagingType?: string;
    expectedPackages?: number;
    flagNumber?: string;
    locationId?: string;
  };
  /** 추가 정산 내역 */
  additionalSettlements?: {
    /** 추가 정산 금액 */
    amount: number;
    /** 정산 사유 */
    reason: string;
    /** 정산 일시 */
    date: Date;
    /** 정산 대상 작업 */
    categoryId: string;
  }[];
  paymentStatus: 'pending' | 'requested' | 'onhold' | 'completed';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  memo?: string;
}

// 작업 폼 상태 타입
export interface ScheduleFormState {
  workType: WorkType;
  stage: WorkStage;
  farmerId: string;
  fieldId: string;
  fieldFullAddress: string;
  workerId: string;
  scheduledDate: {
    start: Date;
    end: Date;
  };
  rateInfo: {
    baseRate: number;
    unit: string;
    quantity?: number;
    negotiatedRate?: number;
  };
  memo: string;
}