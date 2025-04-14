// src/app/contracts/[id]/page.tsx
import { Metadata } from 'next';
import ContractDetailPage from '@/components/contracts/ContractDetail';
import MainLayout from '@/components/layout/MainLayout';
export const metadata: Metadata = {
  title: '계약 상세 | 팜매니지먼트',
  description: '계약 상세 정보를 확인합니다.',
};

interface ContractDetailPageProps {
  params: {
    id: string;
  };
}

export default function ContractDetailPageWrapper({ params }: ContractDetailPageProps) {
  return (
    <MainLayout>
      <ContractDetailPage contractId={params.id} />
    </MainLayout>
  );
}
