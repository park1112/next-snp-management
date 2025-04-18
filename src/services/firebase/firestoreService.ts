// src/services/firebase/firestoreService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
  getFirestore,
  setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { BaseEntity } from '@/types';

// Firestore 인스턴스
const db = getFirestore();

/**
 * Firebase 컬렉션 이름 상수 정의
 */
export const Collections = {
  FARMERS: 'farmers',
  FIELDS: 'fields',
  WORKERS: 'workers',
  SCHEDULES: 'schedules',
  CONTRACTS: 'contracts',
  PAYMENTS: 'payments',
  CATEGORIES: 'categories',
  RATES: 'rates',
  PAYMENT_GROUPS: 'paymentGroups',
  CROP_TYPES: 'cropTypes',
  CONFIGS: 'configs',
  
  // 확장 예정 컬렉션
  INVENTORY: 'inventory',
  WAREHOUSES: 'warehouses',
  MATERIALS: 'materials',
  SHIPMENTS: 'shipments',
};

/**
 * Timestamp를 Date로 변환하는 유틸리티 함수
 * 객체나 배열의 중첩 구조를 재귀적으로 처리
 */
export const convertTimestampToDate = (data: DocumentData): Record<string, any> => {
  if (!data) return data;
  
  const result = { ...data };
  
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      // Timestamp 객체는 Date로 변환
      result[key] = result[key].toDate();
    } else if (Array.isArray(result[key])) {
      // 배열 내부 요소 처리
      result[key] = result[key].map((item: any) => 
        typeof item === 'object' && item !== null ? convertTimestampToDate(item) : item
      );
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      // 중첩 객체 처리
      result[key] = convertTimestampToDate(result[key]);
    }
  }
  
  return result;
};

/**
 * Date를 Firestore Timestamp로 변환하는 유틸리티 함수
 */
export const convertDateToTimestamp = (data: Record<string, any>): Record<string, any> => {
  if (!data) return data;
  
  const result = { ...data };
  
  for (const key in result) {
    if (result[key] instanceof Date) {
      // Date 객체는 Timestamp로 변환
      result[key] = Timestamp.fromDate(result[key]);
    } else if (Array.isArray(result[key])) {
      // 배열 내부 요소 처리
      result[key] = result[key].map((item: any) => 
        typeof item === 'object' && item !== null ? convertDateToTimestamp(item) : item
      );
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      // 중첩 객체 처리
      result[key] = convertDateToTimestamp(result[key]);
    }
  }
  
  return result;
};

/**
 * 문서 ID로 데이터 조회 (공통 함수)
 */
export async function getDocumentById<T extends BaseEntity>(
  collectionName: string, 
  id: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...convertTimestampToDate(data),
      } as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * 컬렉션에서 여러 문서 조회 (공통 함수)
 */
export async function getDocuments<T extends BaseEntity>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestampToDate(data),
      } as T;
    });
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * 문서 생성 (공통 함수)
 */
export async function createDocument<T extends BaseEntity>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<string> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const newDoc = {
      ...convertDateToTimestamp(data as Record<string, any>),
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, collectionName), newDoc);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * 문서 업데이트 (공통 함수)
 */
export async function updateDocument<T extends BaseEntity>(
  collectionName: string,
  id: string,
  data: Partial<Omit<T, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    
    const updateData = {
      ...convertDateToTimestamp(data as Record<string, any>),
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * 문서 삭제 (공통 함수)
 */
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Firebase에서 마지막으로 사용된 깃발 번호를 가져옵니다.
 */
export const getLastFlagNumber = async (): Promise<number> => {
  try {
    const configRef = doc(db, Collections.CONFIGS, 'fieldConfig');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists() && configSnap.data().lastFlagNumber !== undefined) {
      return configSnap.data().lastFlagNumber;
    }

    // 설정이 없으면 새로 생성
    await setDoc(configRef, { lastFlagNumber: 0 });
    return 0;
  } catch (error) {
    console.error("Error getting last flag number:", error);
    return 0; // 오류 시 0 반환
  }
};

/**
 * Firebase에 마지막으로 사용된 깃발 번호를 업데이트합니다.
 */
export const updateLastFlagNumber = async (flagNumber: number): Promise<void> => {
  try {
    const configRef = doc(db, Collections.CONFIGS, 'fieldConfig');
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
      await updateDoc(configRef, { lastFlagNumber: flagNumber });
    } else {
      await setDoc(configRef, { lastFlagNumber: flagNumber });
    }
  } catch (error) {
    console.error("Error updating last flag number:", error);
    throw error;
  }
};