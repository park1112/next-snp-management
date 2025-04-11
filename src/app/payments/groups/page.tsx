// src/app/payments/page.tsx
import { Metadata } from 'next';
import PaymentGroupManagement from '@/components/paymentGroups/PaymentGroupManagement';
import MainLayout from '@/components/layout/MainLayout';
export const metadata: Metadata = {
    title: '결제 관리 | 팜매니지먼트',
    description: '결제 목록을 관리하고 결제를 등록, 수정, 삭제할 수 있습니다.',
};

export default function PaymentsPage() {
    return (
        <MainLayout>
            <PaymentGroupManagement />
        </MainLayout>
    );
}












