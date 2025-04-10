// src/app/contracts/add/page.tsx
import { Metadata } from 'next';
import AddContractPage from '@/components/contracts/ContractForm';
import MainLayout from '@/components/layout/MainLayout';
export const metadata: Metadata = {
  title: '계약 등록 | 팜매니지먼트',
  description: '새로운 계약 정보를 등록합니다.',
};

export default function AddNewContractPage() {
  return (
    <MainLayout>
      <AddContractPage />
    </MainLayout>
  );
}