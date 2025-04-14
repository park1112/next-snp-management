// src/app/contracts/[id]/edit/client-page.tsx
'use client';

import { CircularProgress, Box } from '@mui/material';
import { useContract } from '@/hooks/useContracts';
import EditContractForm from '@/components/contracts/ContractForm';

interface EditContractPageClientProps {
    contractId: string;
}

export default function EditContractPageClient({ contractId }: EditContractPageClientProps) {
    const { contract, isLoading, error } = useContract(contractId);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !contract) {
        return <div>Error loading contract</div>;
    }

    return <EditContractForm initialData={contract} isEdit={true} />;
}