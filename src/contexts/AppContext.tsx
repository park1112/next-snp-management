'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSubdistricts, getPaymentGroups } from '@/services/firebase/farmerService';
import { getCropTypes } from '@/services/firebase/fieldService';

interface AppContextType {
    subdistricts: string[];
    paymentGroups: string[];
    cropTypes: string[];
    isLoadingMetadata: boolean;
    refreshMetadata: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
    subdistricts: [],
    paymentGroups: [],
    cropTypes: [],
    isLoadingMetadata: true,
    refreshMetadata: async () => { },
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [subdistricts, setSubdistricts] = useState<string[]>([]);
    const [paymentGroups, setPaymentGroups] = useState<string[]>([]);
    const [cropTypes, setCropTypes] = useState<string[]>([]);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

    const fetchMetadata = async (): Promise<void> => {
        try {
            setIsLoadingMetadata(true);

            // 각 메타데이터 병렬로 가져오기
            const [subdistrictsData, paymentGroupsData, cropTypesData] = await Promise.all([
                getSubdistricts(),
                getPaymentGroups(),
                getCropTypes(),
            ]);

            setSubdistricts(subdistrictsData);
            setPaymentGroups(paymentGroupsData);
            setCropTypes(cropTypesData);
        } catch (error) {
            console.error('Error fetching app metadata:', error);
        } finally {
            setIsLoadingMetadata(false);
        }
    };

    // 초기 로딩
    useEffect(() => {
        fetchMetadata();
    }, []);

    return (
        <AppContext.Provider
            value={{
                subdistricts,
                paymentGroups,
                cropTypes,
                isLoadingMetadata,
                refreshMetadata: fetchMetadata,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);