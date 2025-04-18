// src/types/ui.ts
// UI 관련 헬퍼 및 옵션
import { WorkStage } from './schedule';

export const stageOptions = [
  { value: '계약예정', label: '계약예정' },
  { value: '계약보류', label: '계약보류' },
  { value: '계약완료', label: '계약완료' },
  { value: '뽑기준비', label: '뽑기준비' },
  { value: '뽑기진행', label: '뽑기진행' },
  { value: '뽑기완료', label: '뽑기완료' },
  { value: '자르기준비', label: '자르기준비' },
  { value: '자르기진행', label: '자르기진행' },
  { value: '자르기완료', label: '자르기완료' },
  { value: '수확완료', label: '수확완료' }
] as const;

export const getStageColor = (stage: WorkStage | string): string => {
  if (stage.includes('계약예정')) {
    return '#4a90e2';
  } else if (stage.includes('계약보류')) {
    return '#9013fe';
  } else if (stage.includes('계약완료')) {
    return '#4a90e2';
  } else if (stage.includes('뽑기준비')) {
    return '#f5a623';
  } else if (stage.includes('뽑기진행')) {
    return '#ff6b6b';
  } else if (stage.includes('뽑기완료')) {
    return '#f5a623';
  } else if (stage.includes('자르기준비')) {
    return '#7ed321';
  } else if (stage.includes('자르기진행')) {
    return '#2ecc71';
  } else if (stage.includes('자르기완료')) {
    return '#7ed321';
  } else if (stage.includes('수확완료')) {
    return '#27ae60';
  } else if (stage.includes('준비')) {
    return '#9013fe';
  } else if (stage.includes('진행')) {
    return '#e91e63';
  } else if (stage.includes('완료')) {
    return '#27ae60';
  }
  return '#b8b8b8';
};