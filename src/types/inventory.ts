// src/types/inventory.ts
import { BaseEntity, Quantity } from './common';

// 창고 정보 타입
export interface Warehouse extends BaseEntity {
  name: string;
  code: string;
  address: string;
  capacity: Quantity;
  manager?: string;
  contactNumber?: string;
  isActive: boolean;
  description?: string;
}

// 상품/제품 타입
export interface Product extends BaseEntity {
  name: string;
  code: string;
  category: string;
  description?: string;
  unit: string;
  minimumStock?: number;
  image?: string;
  isActive: boolean;
}

// 재고 정보 타입
export interface Inventory extends BaseEntity {
  productId: string;
  warehouseId: string;
  quantity: number;
  unit: string;
  batchNumber?: string;
  expiryDate?: Date;
  locationInWarehouse?: string;
}

// 자재 타입 (양파망, 바렛트 등)
export interface Material extends BaseEntity {
  name: string;
  code: string;
  type: 'packaging' | 'equipment' | 'consumable';
  quantity: number;
  unit: string;
  minimumStock?: number;
  warehouseId: string;
  supplier?: string;
  lastPurchaseDate?: Date;
  lastPurchasePrice?: number;
}

// 재고 트랜잭션 타입 (입고, 출고, 이동 등)
export interface InventoryTransaction extends BaseEntity {
  type: 'inbound' | 'outbound' | 'transfer' | 'adjustment';
  productId: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  quantity: number;
  unit: string;
  relatedDocumentId?: string; // 주문, 출하, 폐기 등의 관련 문서 ID
  relatedDocumentType?: string;
  batchNumber?: string;
  performedBy: string;
  notes?: string;
}

// 주문 상태 타입
export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// 출하 주문 타입
export interface ShipmentOrder extends BaseEntity {
  orderNumber: string;
  customerId: string;
  customerName?: string;
  status: OrderStatus;
  orderDate: Date;
  requestedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryAddress: string;
  items: {
    productId: string;
    productName?: string;
    quantity: number;
    unit: string;
    price: number;
  }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  transportInfo?: {
    driverId: string;
    vehicleInfo?: string;
    estimatedArrival?: Date;
    trackingNumber?: string;
  };
}

// CRUD 작업을 위한 타입
export type WarehouseCreate = Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type WarehouseUpdate = Partial<Omit<Warehouse, 'id' | 'createdAt' | 'createdBy'>>;

export type ProductCreate = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type ProductUpdate = Partial<Omit<Product, 'id' | 'createdAt' | 'createdBy'>>;

export type InventoryCreate = Omit<Inventory, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type InventoryUpdate = Partial<Omit<Inventory, 'id' | 'createdAt' | 'createdBy'>>;

export type MaterialCreate = Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type MaterialUpdate = Partial<Omit<Material, 'id' | 'createdAt' | 'createdBy'>>;

export type TransactionCreate = Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type ShipmentOrderCreate = Omit<ShipmentOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type ShipmentOrderUpdate = Partial<Omit<ShipmentOrder, 'id' | 'createdAt' | 'createdBy'>>;