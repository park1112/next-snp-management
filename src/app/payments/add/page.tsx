// src/app/payments/add/page.tsx
import { Metadata } from 'next';
import AddPaymentPage from '@/components/payments/PaymentForm';
import MainLayout from '@/components/layout/MainLayout';
export const metadata: Metadata = {
  title: '결제 등록 | 팜매니지먼트',
  description: '새로운 결제 정보를 등록합니다.',
};

export default function AddNewPaymentPage() {
  return (
    <MainLayout>
      <AddPaymentPage />
    </MainLayout>
  );
}