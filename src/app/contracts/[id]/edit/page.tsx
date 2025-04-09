// src/app/contracts/[id]/edit/page.tsx
'use client';

import { Metadata } from 'next';
import EditContractPage from '@/components/contracts/ContractForm';
import { useContract } from '@/hooks/useContracts';
import { CircularProgress, Box } from '@mui/material';

export const metadata: Metadata = {
  title: '계약 수정 | 팜매니지먼트',
  description: '계약 정보를 수정합니다.',
};

interface EditContractPageProps {
  params: {
    id: string;
  };
}

export default function EditContractPageWrapper({ params }: EditContractPageProps) {
  const { contract, isLoading, error } = useContract(params.id);

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

  return <EditContractPage initialData={contract} />;
}


