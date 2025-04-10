// src/types/index.ts

// 농가 관련 타입
export interface Farmer {
    id: string;
    name: string;
    phoneNumber: string;
    subdistrict: string;  // 면단위
    paymentGroup: string; // 결제소속
    personalId?: string;  // 주민등록번호 (optional)
    address?: {
        full: string;
        zipcode?: string;
        detail?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    bankInfo?: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    fields?: string[];    // 농지 ID 참조 배열
    contracts?: string[]; // 계약 ID 배열
    activeContracts?: number; // 활성 계약 수
    totalContractAmount?: number; // 총 계약 금액
    remainingPayments?: number;  // 남은 결제 금액
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;    // 등록한 사용자 ID
    memo?: string;
}

// 농지 관련 타입
export interface Field {
    id: string;
    farmerId: string;     // 소속 농가 ID 참조
    farmerName?: string;  // UI 표시용 농가 이름
    phoneNumber?: string; // 전화번호
    paymentGroup?: string; // 결제소속
    subdistrict?: string; // 면단위
    address: {
        full: string;
        detail?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    area: {
        value: number;
        unit: string;      // 평, 제곱미터, 헥타르 등
    };
    cropType: string;     // 작물 종류
    estimatedHarvestDate?: Date;
    currentStage: {
        stage: string;      // 계약예정, 계약완료, 뽑기준비 등
        updatedAt: Date;
    };
    contractIds?: string[]; // 연결된 계약 ID 배열
    contractStatus?: string; // 현재 계약 상태
    currentContract?: {    // 현재 활성 계약 정보
        id: string;
        contractNumber: string;
        finalPaymentDueDate?: Date;
    };
    schedules?: string[]; // 작업 일정 ID 배열
    createdAt: Date;
    updatedAt: Date;
    memo?: string;
}

// 작업자 타입
export interface BaseWorker {
    id: string;
    type: 'foreman' | 'driver'; // 작업반장 또는 운송기사
    name: string;
    phoneNumber: string;
    personalId?: string;  // 주민등록번호 (선택)
    address?: {
        full: string;
        detail?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    bankInfo?: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    schedules?: string[];  // 작업 일정 ID 배열
    payments?: string[];   // 결제 내역 ID 배열
    createdAt: Date;
    updatedAt: Date;
    memo?: string;
}

// 작업반장 타입
export interface Foreman extends BaseWorker {
    type: 'foreman';
    foremanInfo: {
        category: string;   // 망담기, 상차팀, 하차팀, 뽑기, 자르기 등
        rates: {
            hourly?: number;  // 시간당 단가
            daily?: number;   // 일당
            custom?: {        // 작업 유형별 커스텀 단가
                [key: string]: number;
            };
        };
    };
}

// 운송기사 타입
export interface Driver extends BaseWorker {
    type: 'driver';
    driverInfo: {
        vehicleNumber: string;     // 차량번호 전체
        vehicleNumberLast4: string; // 마지막 4자리 (검색용)
        vehicleType: string;       // 트럭, 5톤, 11톤 등
        category: string;          // 직영차량, 콜차량, 팀
        rates: {
            baseRate: number;        // 기본 운송료
            distanceRate?: number;   // km당 추가 요금
            custom?: {               // 지역별 커스텀 요금
                [key: string]: number;
            };
        };
    };
}

// Worker 타입 (Foreman 또는 Driver)
export type Worker = Foreman | Driver;

// 작업 일정 타입
export interface Schedule {
    id: string;
    type: 'pulling' | 'cutting' | 'packing' | 'transport'; // 작업 유형
    fieldId: string;      // 농지 ID 참조
    farmerId: string;     // 농가 ID 참조
    workerId: string;     // 작업자 ID 참조
    farmerName?: string;  // UI 표시용 농가 이름
    fieldName?: string;   // UI 표시용 농지 이름
    fieldAddress?: string; // UI 표시용 농지 주소
    workerName?: string;  // UI 표시용 작업자 이름
    stage: {
        current: string;    // 진행 상태 (준비, 진행중, 완료 등)
        history: {          // 상태 변경 이력
            stage: string;
            timestamp: Date;
            by: string;       // 변경한 사용자 ID
        }[];
    };
    scheduledDate: {
        start: Date;
        end?: Date;
    };
    actualDate?: {        // 실제 작업 일시
        start: Date;
        end?: Date;
    };
    rateInfo: {
        baseRate: number;   // 기본 단가
        negotiatedRate?: number; // 협의 단가
        quantity?: number;  // 작업량
        unit: string;       // 단위 (시간, 개수 등)
    };
    transportInfo?: {     // 운송 전용 필드
        origin: {
            address: string;
            coordinates?: {
                latitude: number;
                longitude: number;
            };
        };
        destination: {
            address: string;
            coordinates?: {
                latitude: number;
                longitude: number;
            };
            contactName?: string;
            contactPhone?: string;
        };
        cargo: {
            type: string;
            quantity: number;
            unit: string;
        };
        distance?: number;  // km
        distanceRate?: number; // km당 추가 요금
        additionalFee?: number; // 추가 요금
    };
    additionalInfo?: {    // 작업 유형별 추가 정보
        cropType?: string;           // 대상 작물
        expectedQuantity?: number;    // 예상 작업량
        cuttingMethod?: string;       // 절단 방식
        specialRequirements?: string; // 기타 요청사항
        packagingType?: string;       // 포장 유형
        expectedPackages?: number;    // 예상 포장 수량
    };
    paymentStatus: 'pending' | 'requested' | 'onhold' | 'completed'; // 작업완료, 입금요청, 입금보류, 입금완료
    paymentId?: string;   // 결제 ID 참조 (결제 완료 시)
    createdAt: Date;
    updatedAt: Date;
    memo?: string;
}

// 계약 타입
export interface Contract {
    id: string;
    farmerId: string;              // 농가 ID 참조
    farmerName?: string;           // UI 표시용 농가 이름
    fieldIds: string[];            // 계약 포함 농지 ID 배열
    fieldNames?: string[];         // UI 표시용 농지 이름 배열
    contractNumber: string;        // 계약 번호
    contractDate: Date;            // 계약 체결일
    contractType: string;          // 계약 유형 (일반, 특수, 장기 등)
    contractStatus: 'pending' | 'active' | 'completed' | 'cancelled'; // 계약 상태

    // 계약 금액 정보
    totalAmount: number;           // 총 계약금액

    // 계약금 정보
    downPayment: {
        amount: number;              // 계약금 금액
        dueDate: Date;               // 계약금 납부 예정일
        paidDate?: Date;             // 실제 납부일
        paidAmount?: number;         // 실제 납부액
        receiptImageUrl?: string;    // 영수증 이미지
        status: 'unpaid' | 'scheduled' | 'paid'; // 미납, 납부예정, 납부완료
    };

    // 중도금 정보 (여러 회차 가능)
    intermediatePayments: {
        installmentNumber: number;  // 회차
        amount: number;             // 중도금 금액
        dueDate: Date;              // 예정일
        paidDate?: Date;            // 실제 납부일
        paidAmount?: number;        // 실제 납부액
        receiptImageUrl?: string;   // 영수증 이미지
        status: 'unpaid' | 'scheduled' | 'paid'; // 미납, 납부예정, 납부완료
    }[];

    // 잔금 정보
    finalPayment: {
        amount: number;              // 잔금 금액
        dueDate: Date;               // 잔금 예정일
        paidDate?: Date;             // 실제 납부일
        paidAmount?: number;         // 실제 납부액
        receiptImageUrl?: string;    // 영수증 이미지
        status: 'unpaid' | 'scheduled' | 'paid'; // 미납, 납부예정, 납부완료
    };

    // 계약 세부 내용
    contractDetails: {
        harvestPeriod?: {            // 수확 기간
            start: Date;
            end: Date;
        };
        pricePerUnit?: number;       // 단가 정보
        unitType?: string;           // 단위 (kg, 상자 등)
        estimatedQuantity?: number;  // 예상 수확량
        specialTerms?: string;       // 특별 계약 조건
        qualityStandards?: string;   // 품질 기준
    };

    attachments?: {                // 첨부 파일
        name: string;
        url: string;
        type: string;
        uploadedAt: Date;
    }[];

    createdAt: Date;
    updatedAt: Date;
    createdBy: string;             // 등록한 사용자 ID
    memo?: string;
}

// 결제 타입
export interface Payment {
    id: string;
    receiverId: string;         // 수취인 ID (작업자 ID)
    receiverName?: string;      // UI 표시용 수취인 이름
    receiverType?: 'foreman' | 'driver'; // 수취인 유형
    payerId: string;            // 지급자 ID (사용자 ID)
    scheduleIds: string[];      // 결제 대상 작업 ID 배열
    scheduleDetails?: {         // UI 표시용 작업 상세 정보
        type: string;
        date: Date;
        description: string;
    }[];
    amount: number;             // 총 금액
    method: 'bank' | 'cash' | 'other'; // 계좌이체, 현금, 기타
    status: 'pending' | 'processing' | 'completed'; // 요청, 처리중, 완료
    receiptImageUrl?: string;   // 이체 증빙 이미지 URL
    bankInfo?: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    paymentDate: Date;          // 결제 일시
    memo?: string;
    createdAt: Date;
    updatedAt: Date;
}

// 드롭다운 옵션 타입
export interface DropdownOption {
    value: string;
    label: string;
}