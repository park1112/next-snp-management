// src/services/firebase/farmerService.ts
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  startAt,
  endAt
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { Farmer, FarmerCreate, FarmerUpdate, FarmerSearchType } from '@/types';
import {
  Collections,
  getDocumentById,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument
} from './firestoreService';

// Firestore 인스턴스
const db = getFirestore();
const farmersCollection = collection(db, Collections.FARMERS);

/**
 * 모든 농가 조회
 */
export const getFarmers = async (): Promise<Farmer[]> => {
  try {
    return await getDocuments<Farmer>(Collections.FARMERS, [orderBy('name')]);
  } catch (error) {
    console.error("Error getting farmers:", error);
    throw error;
  }
};

/**
 * 농가 검색 (이름, 전화번호, 지역별)
 */
export const searchFarmers = async (
  searchType: FarmerSearchType,
  searchValue: string
): Promise<Farmer[]> => {
  try {
    let constraints = [];

    if (searchType === 'name') {
      // 이름 검색 - 시작 문자열 매칭
      const end = searchValue + '\uf8ff';
      constraints = [orderBy('name'), startAt(searchValue), endAt(end)];
    } else {
      // 전화번호, 지역 또는 결제소속 검색
      constraints = [where(searchType, '==', searchValue), orderBy('name')];
    }

    return await getDocuments<Farmer>(Collections.FARMERS, constraints);
  } catch (error) {
    console.error(`Error searching farmers by ${searchType}:`, error);
    throw error;
  }
};

/**
 * 농가 상세 조회
 */
export const getFarmerById = async (id: string): Promise<Farmer | null> => {
  try {
    return await getDocumentById<Farmer>(Collections.FARMERS, id);
  } catch (error) {
    console.error("Error getting farmer:", error);
    throw error;
  }
};

/**
 * 농가 등록
 */
export const createFarmer = async (farmerData: FarmerCreate): Promise<string> => {
  try {
    return await createDocument<Farmer>(Collections.FARMERS, farmerData);
  } catch (error) {
    console.error("Error creating farmer:", error);
    throw error;
  }
};

/**
 * 농가 정보 수정
 */
export const updateFarmer = async (id: string, farmerData: FarmerUpdate): Promise<void> => {
  try {
    await updateDocument<Farmer>(Collections.FARMERS, id, farmerData);
  } catch (error) {
    console.error("Error updating farmer:", error);
    throw error;
  }
};

/**
 * 농가 삭제
 */
export const deleteFarmer = async (id: string): Promise<void> => {
  try {
    await deleteDocument(Collections.FARMERS, id);
  } catch (error) {
    console.error("Error deleting farmer:", error);
    throw error;
  }
};

/**
 * 면단위 목록 조회 (고유값)
 */
export const getSubdistricts = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(farmersCollection);

    const subdistrictsSet = new Set<string>();
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.address?.subdistrict) {
        subdistrictsSet.add(data.address.subdistrict);
      }
    });

    return Array.from(subdistrictsSet).sort();
  } catch (error) {
    console.error("Error getting subdistricts:", error);
    throw error;
  }
};

/**
 * 결제소속 목록 조회 (고유값)
 */
export const getPaymentGroups = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(farmersCollection);

    const paymentGroupsSet = new Set<string>();
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.paymentGroup) {
        paymentGroupsSet.add(data.paymentGroup);
      }
    });

    return Array.from(paymentGroupsSet).sort();
  } catch (error) {
    console.error("Error getting payment groups:", error);
    throw error;
  }
};