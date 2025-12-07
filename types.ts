export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export enum ProductType {
  BRANCO = 'Branco',
  VERMELHO = 'Vermelho',
  CAIPIRA = 'Caipira',
  ORGANICO = 'Orgânico',
  CODORNA = 'Codorna'
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  quantityPerPackage: number;
  price: number;
  imageUrl: string;
  active: boolean;
  isPromo: boolean;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  zipCode: string; // CEP
  reference: string;
  lat?: number;
  lng?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // WhatsApp
  address?: Address;
  lastOrderDate?: string;
  totalOrders: number;
}

export enum OrderStatus {
  PENDING = 'Pendente',
  PREPARING = 'Separando',
  DELIVERING = 'Saiu para entrega',
  COMPLETED = 'Entregue',
  CANCELLED = 'Cancelado'
}

export enum PaymentMethod {
  PIX = 'PIX',
  CASH = 'Dinheiro',
  CARD = 'Cartão na Entrega'
}

export enum RecurrenceType {
  NONE = 'Apenas uma vez',
  WEEKLY = 'Semanal',
  BIWEEKLY = 'Quinzenal',
  MONTHLY = 'Mensal'
}

export enum DeliveryPeriod {
  MORNING = 'Manhã (08:00 - 12:00)',
  AFTERNOON = 'Tarde (13:00 - 18:00)',
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  address: Address;
  status: OrderStatus;
  createdAt: string; // ISO String
  paymentMethod: PaymentMethod;
  changeFor?: string; // Troco para quanto
  recurrence: RecurrenceType;
  deliveryPeriod: DeliveryPeriod;
}

export interface UserSession {
  role: UserRole;
  data: Customer | { name: string; id: string };
}
