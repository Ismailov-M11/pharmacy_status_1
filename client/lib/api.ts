const API_BASE_URL = 'https://api.davodelivery.uz/api';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface Authority {
  authority: string;
}

export interface LoginUser {
  username: string;
  authorities: Authority[];
  id: number;
  phone: string;
  [key: string]: any;
}

export interface LoginToken {
  token: string;
  activationRequired: boolean;
  expiresAt: string | null;
  expiresIn: string | null;
}

export interface LoginPayload {
  user: LoginUser;
  token: LoginToken;
}

export interface LoginResponse {
  payload: LoginPayload;
  status: string;
  code: number;
}

export interface PharmacyListRequest {
  searchKey: string;
  page: number;
  size: number;
  active: boolean | null;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  [key: string]: any;
}

export interface MarketChat {
  id: number;
  name: string;
  username: string | null;
}

export interface Pharmacy {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string | null;
  active: boolean;
  lead: Lead;
  marketChats: MarketChat[];
  creationDate: string;
  modifiedDate: string;
  [key: string]: any;
}

export interface PharmacyListPayload {
  list: Pharmacy[];
  total: number;
}

export interface PharmacyListResponse {
  payload: PharmacyListPayload;
  status: string;
  code: number;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

export async function getPharmacyList(
  token: string,
  searchKey: string = '',
  page: number = 0,
  active: boolean | null = true
): Promise<PharmacyListResponse> {
  const response = await fetch(`${API_BASE_URL}/market/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      searchKey,
      page,
      size: 100,
      active,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pharmacy list');
  }

  return response.json();
}

export async function updatePharmacyStatus(
  token: string,
  pharmacyId: number,
  field: 'brandedPacket' | 'training',
  value: boolean
): Promise<Pharmacy> {
  const response = await fetch(`${API_BASE_URL}/market/${pharmacyId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ [field]: value }),
  });

  if (!response.ok) {
    throw new Error('Failed to update pharmacy');
  }

  return response.json();
}

// ============================================
// LOCAL BACKEND API
// ============================================

// Use environment variable for backend URL, fallback to localhost for development
const STATUS_API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/status';

export interface PharmacyStatus {
  pharmacy_id: string;
  training: boolean;
  brandedPacket: boolean;
  updated_at: string;
}

export interface StatusHistoryRecord {
  id: number;
  pharmacy_id: string;
  field: 'training' | 'brandedPacket';
  old_value: boolean;
  new_value: boolean;
  comment: string;
  changed_by: string;
  changed_at: string;
}

export async function getPharmacyStatus(
  pharmacyId: number
): Promise<PharmacyStatus> {
  const response = await fetch(`${STATUS_API_BASE_URL}/${pharmacyId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pharmacy status');
  }

  return response.json();
}

export async function updatePharmacyStatusLocal(
  pharmacyId: number,
  field: 'brandedPacket' | 'training',
  value: boolean,
  comment: string,
  changedBy: string
): Promise<PharmacyStatus> {
  try {
    // Set timeout for request (30 seconds to allow for cold start)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${STATUS_API_BASE_URL}/update/${pharmacyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        update_type: field,
        new_value: value,
        comment,
        changed_by: changedBy,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Check if it's a 503 (service unavailable) or 504 (gateway timeout)
      if (response.status === 503 || response.status === 504) {
        throw new Error('BACKEND_SLEEPING');
      }
      throw new Error('Failed to update pharmacy status');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      // Check if request was aborted (timeout)
      if (error.name === 'AbortError') {
        throw new Error('BACKEND_SLEEPING');
      }
      // Re-throw the error to be handled by the caller
      throw error;
    }
    throw new Error('Failed to update pharmacy status');
  }
}

export async function getStatusHistory(
  pharmacyId: number
): Promise<StatusHistoryRecord[]> {
  const response = await fetch(`${STATUS_API_BASE_URL}/history/${pharmacyId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch status history');
  }

  return response.json();
}

export async function deleteHistoryRecord(id: number): Promise<void> {
  const response = await fetch(`${STATUS_API_BASE_URL}/history/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete history record');
  }
}

