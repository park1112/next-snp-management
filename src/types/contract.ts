// src/types/contract.ts
// 계약 관련 타입
export interface Contract {
  id: string;
  farmerId: string;
  farmerName?: string;
  fieldIds: string[];
  fieldNames?: string[];
  contractNumber: string;
  contractDate: Date;
  contractType: string;
  contractStatus: 'pending' | 'active' | 'completed' | 'cancelled';
  totalAmount: number;
  downPayment: {
    amount: number;
    dueDate: Date;
    paidDate?: Date;
    paidAmount?: number;
    receiptImageUrl?: string;
    status: 'unpaid' | 'scheduled' | 'paid';
  };
  intermediatePayments: {
    installmentNumber: number;
    amount: number;
    dueDate: Date;
    paidDate?: Date;
    paidAmount?: number;
    receiptImageUrl?: string;
    status: 'unpaid' | 'scheduled' | 'paid';
  }[];
  finalPayment: {
    amount: number;
    dueDate: Date;
    paidDate?: Date;
    paidAmount?: number;
    receiptImageUrl?: string;
    status: 'unpaid' | 'scheduled' | 'paid';
  };
  contractDetails: {
    harvestPeriod?: {
      start: Date;
      end: Date;
    };
    pricePerUnit?: number;
    unitType?: string;
    estimatedQuantity?: number;
    specialTerms?: string;
    qualityStandards?: string;
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  memo?: string;
}