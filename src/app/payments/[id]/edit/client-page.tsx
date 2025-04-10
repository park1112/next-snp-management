// src/app/payments/[id]/edit/client-page.tsx
'use client';

import { CircularProgress, Box } from '@mui/material';
import { usePayment } from '@/hooks/usePayments';
import EditPaymentForm from '@/components/payments/PaymentForm';

interface EditPaymentPageClientProps {
    paymentId: string;
}

export default function EditPaymentPageClient({ paymentId }: EditPaymentPageClientProps) {
    const { payment, isLoading, error } = usePayment(paymentId);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !payment) {
        return <div>Error loading payment</div>;
    }

    return <EditPaymentForm initialData={payment} isEdit={true} />;
}