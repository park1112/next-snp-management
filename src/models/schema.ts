// src/models/schema.ts
import { Field, Farmer, Foreman, Driver, Schedule, Contract, Payment } from '@/types';
import { z } from 'zod';

// 주소 스키마
export const AddressSchema = z.object({
    full: z.string().min(1, { message: '주소는 필수 항목입니다.' }),
    zipcode: z.string().optional(),
    detail: z.string().optional(),
    coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }).optional(),
});

// 계좌 정보 스키마
export const BankInfoSchema = z.object({
    bankName: z.string().min(1, { message: '은행명은 필수 항목입니다.' }),
    accountNumber: z.string().min(1, { message: '계좌번호는 필수 항목입니다.' }),
    accountHolder: z.string().min(1, { message: '예금주명은 필수 항목입니다.' }),
});

// 면적 스키마
export const AreaSchema = z.object({
    value: z.number().positive({ message: '면적은 0보다 커야 합니다.' }),
    unit: z.string().min(1, { message: '단위는 필수 항목입니다.' }),
});

// 농가 스키마
export const FarmerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, { message: '이름은 최소 2자 이상이어야 합니다.' }),
    phoneNumber: z.string().regex(/^\d{3}-\d{3,4}-\d{4}$/, {
        message: '유효한 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
    }),
    subdistrict: z.string().min(1, { message: '면단위는 필수 항목입니다.' }),
    paymentGroup: z.string().min(1, { message: '결제소속은 필수 항목입니다.' }),
    personalId: z.string().regex(/^\d{6}-\d{7}$/, {
        message: '유효한 주민등록번호 형식이 아닙니다. (예: 123456-1234567)'
    }).optional(),
    address: AddressSchema.optional(),
    bankInfo: BankInfoSchema.optional(),
    fields: z.array(z.string()).optional(),
    contracts: z.array(z.string()).optional(),
    activeContracts: z.number().optional(),
    totalContractAmount: z.number().optional(),
    remainingPayments: z.number().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    createdBy: z.string().optional(),
    memo: z.string().optional(),
});

// 농지 스키마
export const FieldSchema = z.object({
    id: z.string().optional(),
    farmerId: z.string().min(1, { message: '농가는 필수 항목입니다.' }),
    farmerName: z.string().optional(),
    address: AddressSchema,
    area: AreaSchema,
    cropType: z.string().min(1, { message: '작물 종류는 필수 항목입니다.' }),
    estimatedHarvestDate: z.date().optional(),
    currentStage: z.object({
        stage: z.string(),
        updatedAt: z.date(),
        history: z.array(
            z.object({
                stage: z.string(),
                timestamp: z.date(),
                by: z.string(),
            })
        ).optional(),
    }),
    contractIds: z.array(z.string()).optional(),
    contractStatus: z.string().optional(),
    currentContract: z.object({
        id: z.string(),
        contractNumber: z.string(),
        finalPaymentDueDate: z.date().optional(),
    }).optional(),
    schedules: z.array(z.string()).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    memo: z.string().optional(),
});

// 작업자 기본 스키마
export const BaseWorkerSchema = z.object({
    id: z.string().optional(),
    type: z.enum(['foreman', 'driver']),
    name: z.string().min(2, { message: '이름은 최소 2자 이상이어야 합니다.' }),
    phoneNumber: z.string().regex(/^\d{3}-\d{3,4}-\d{4}$/, {
        message: '유효한 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
    }),
    personalId: z.string().regex(/^\d{6}-\d{7}$/, {
        message: '유효한 주민등록번호 형식이 아닙니다. (예: 123456-1234567)'
    }).optional(),
    address: AddressSchema.optional(),
    bankInfo: BankInfoSchema.optional(),
    schedules: z.array(z.string()).optional(),
    payments: z.array(z.string()).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    memo: z.string().optional(),
});