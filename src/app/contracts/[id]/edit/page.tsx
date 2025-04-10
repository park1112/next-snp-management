// src/app/contracts/[id]/edit/page.tsx

import { Metadata } from 'next';
import EditContractPageClient from '@/app/contracts/[id]/edit/client-page';
import MainLayout from '@/components/layout/MainLayout';
export const metadata: Metadata = {
  title: '계약 수정 | 팜매니지먼트',
  description: '계약 정보를 수정합니다.',
};

interface EditContractPageProps {
  params: {
    id: string;
  };
}

export default function EditContractPage({ params }: EditContractPageProps) {
  return (
    <MainLayout>
      <EditContractPageClient contractId={params.id} />
    </MainLayout>
  );
}