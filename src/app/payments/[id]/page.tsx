// src/app/payments/[id]/page.tsx
import { Metadata } from 'next';
import PaymentDetailPage from '@/components/payments/PaymentDetail';
import MainLayout from '@/components/layout/MainLayout';
export const metadata: Metadata = {
  title: '결제 상세 | 팜매니지먼트',
  description: '결제 상세 정보를 확인합니다.',
};

interface PaymentDetailPageProps {
  params: {
    id: string;
  };
}

export default function PaymentDetailPageWrapper({ params }: PaymentDetailPageProps) {
  return (
    <MainLayout>
      <PaymentDetailPage paymentId={params.id} />
    </MainLayout>
  );
}
