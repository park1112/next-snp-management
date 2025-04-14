'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSubdistricts } from '@/services/firebase/farmerService';
import { getCropTypes } from '@/services/firebase/fieldService';
import {
    getPaymentGroups as getPaymentGroupsFromCollection,
    PaymentGroup,
} from '@/services/firebase/paymentGroupService';
import { DropdownOption } from '@/types';

interface AppContextType {
    subdistricts: string[];
    paymentGroups: PaymentGroup[];
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
    const [paymentGroups, setPaymentGroups] = useState<PaymentGroup[]>([]);

    const [cropTypes, setCropTypes] = useState<string[]>([]);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

    const fetchMetadata = async (): Promise<void> => {
        try {
            console.log('메타데이터 로딩 시작');
            setIsLoadingMetadata(true);

            // 각 메타데이터를 개별적으로 로드하여 디버깅을 용이하게 함
            console.log('면단위 정보 로딩 시작');
            let subdistrictsData: string[] = [];
            try {
                subdistrictsData = await getSubdistricts();
                console.log('면단위 정보 로딩 성공:', subdistrictsData.length);
            } catch (e) {
                console.error('면단위 정보 로딩 실패:', e);
                subdistrictsData = [];
            }

            console.log('결제소속 정보 로딩 시작');
            let paymentGroupsData: PaymentGroup[] = [];
            try {
                paymentGroupsData = await getPaymentGroupsFromCollection();
                console.log('결제소속 정보 로딩 성공:', paymentGroupsData.length);
            } catch (e) {
                console.error('결제소속 정보 로딩 실패:', e);
                paymentGroupsData = [];
            }

            console.log('작물 유형 정보 로딩 시작');
            let cropTypesData: string[] = [];
            try {
                cropTypesData = await getCropTypes();
                console.log('작물 유형 정보 로딩 성공:', cropTypesData.length);
            } catch (e) {
                console.error('작물 유형 정보 로딩 실패:', e);
                cropTypesData = [];
            }

            // 상태 업데이트
            setSubdistricts(subdistrictsData);
            setPaymentGroups(paymentGroupsData);


            setCropTypes(cropTypesData);

            console.log('모든 메타데이터 로딩 완료');
        } catch (error) {
            console.error('메타데이터 로딩 오류:', error);
        } finally {
            setIsLoadingMetadata(false);
            console.log('로딩 상태 업데이트: false');
        }
    };




    // 초기 로딩
    useEffect(() => {
        console.log('AppProvider 마운트, 초기 데이터 로딩');
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