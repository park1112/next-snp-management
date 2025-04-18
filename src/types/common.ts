// src/types/common.ts
// 카테고리 및 세부 작업 단가 관련 타입
export interface Rate {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  unit: string;
  createdAt: string | Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  nextCategoryId?: string | null;
  rates?: Rate[];
  order?: number; // 카테고리 순서
  createdAt: string | Date;
  updatedAt: string | Date;
}

// 세부 작업 단가 타입 정의
export interface WorkRate {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  unit: string;
  createdAt: Date;
}