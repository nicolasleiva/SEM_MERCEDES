
export enum UserRole {
  OPERATOR = 'operator',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin'
}

export enum ParkingStatus {
  ESTACIONADO = 'estacionado',
  RETIRADO = 'retirado'
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface ParkingRecord {
  id: string;
  license_plate: string;
  date: string;
  start_time: string;
  end_time?: string;
  status: ParkingStatus;
  latitude: number;
  longitude: number;
  address?: string;
  total_minutes?: number;
  rate_cents: number;
  amount_cents: number;
  paid: boolean;
  payment_status: PaymentStatus;
  mercado_pago_payment_id?: string;
  mercado_pago_response?: string;
  created_by: string;
  ended_by?: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  parking_record_id: string;
  user_id: string;
  details: string;
  created_at: string;
}
