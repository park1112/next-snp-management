// src/types/index.ts
// Re-export all type modules
export * from './farmer';
export * from './field';
export * from './common';
export * from './worker';
export * from './schedule';
export * from './contract';
export * from './payment';
export * from './ui';
export * from './inventory'; // 새로 추가된 재고 관련 타입

interface CropType { id: string; name: string; }
interface WorkProcess { id: string; title: string; steps: string[]; }
interface CropTypeProcess { cropTypeId: string; processId: string; }
