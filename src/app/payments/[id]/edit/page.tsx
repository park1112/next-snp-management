// src/app/payments/[id]/edit/page.tsx

import { Metadata } from 'next';
import EditPaymentPageClient from '@/app/payments/[id]/edit/client-page';
import MainLayout from '@/components/layout/MainLayout';
export const metadata: Metadata = {
  title: '결제 수정 | 팜매니지먼트',
  description: '결제 정보를 수정합니다.',
};

interface EditPaymentPageProps {
  params: {
    id: string;
  };
}

export default function EditPaymentPage({ params }: EditPaymentPageProps) {
  return (
    <MainLayout>
      <EditPaymentPageClient paymentId={params.id} />
    </MainLayout>
  );
}