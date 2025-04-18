// src/types/payment.ts
// 결제 관련 타입
export interface Payment {
  id: string;
  receiverId: string;
  receiverName?: string;
  receiverType?: 'foreman' | 'driver';
  payerId: string;
  scheduleIds: string[];
  scheduleDetails?: {
    type: string;
    date: Date;
    description: string;
  }[];
  amount: number;
  method: 'bank' | 'cash' | 'other';
  status: 'pending' | 'processing' | 'completed';
  receiptImageUrl?: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  paymentDate: Date;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 드롭다운 옵션 타입
export interface DropdownOption {
  value: string;
  label: string;
  id?: string; // Optional id property
}

// 결제 소속 그룹 타입
export interface PaymentGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
}