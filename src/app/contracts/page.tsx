// src/app/contracts/page.tsx
import { Metadata } from 'next';
import ContractsPage from '@/components/contracts/ContractList';
import MainLayout from '@/components/layout/MainLayout';
export const metadata: Metadata = {
  title: '계약 관리 | 팜매니지먼트',
  description: '계약 목록을 관리하고 계약을 등록, 수정, 삭제할 수 있습니다.',
};

export default function ContractsListPage() {
  return (
    <MainLayout>
      <ContractsPage />
    </MainLayout>
  );
}












