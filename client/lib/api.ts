const API_BASE_URL = "https://api.davodelivery.uz/api";

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

export interface CommentCreator {
  id: number;
  phone: string;
  // other fields if needed
}

export interface Comment {
  id: number;
  coment: string;
  createdAt: string;
  creator: CommentCreator;
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
  comments?: Comment[]; // Added comments
  creationDate: string;
  modifiedDate: string;
  landmark?: string;
  training?: boolean;
  brandedPacket?: boolean;
  stir?: string;
  juridicalName?: string;
  juridicalAddress?: string;
  bankName?: string;
  bankAccount?: string;
  mfo?: string;
  additionalPhone?: string;
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
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
} export async function getPharmacyList(
  token: string,
  searchKey: string = "",
  page: number = 0,
  active: boolean | null = true,
  size: number = 1000,
): Promise<PharmacyListResponse> {
  const response = await fetch(`${API_BASE_URL}/market/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      searchKey,
      page,
      size,
      active,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch pharmacy list");
  }

  return response.json();
}

export async function getLeadsList(
  token: string,
  searchKey: string = "",
  page: number = 0,
  size: number = 1000,
): Promise<PharmacyListResponse> {
  const response = await fetch(`${API_BASE_URL}/lead/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      searchKey,
      page,
      size,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch leads list");
  }

  return response.json();
}

export async function updatePharmacyStatus(
  token: string,
  pharmacyId: number,
  field: "brandedPacket" | "training",
  value: boolean,
): Promise<Pharmacy> {
  const response = await fetch(`${API_BASE_URL}/market/${pharmacyId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ [field]: value }),
  });

  if (!response.ok) {
    throw new Error("Failed to update pharmacy");
  }

  return response.json();
}

// ============================================
// LOCAL BACKEND API
// ============================================

// Use environment variable for backend URL, fallback to localhost for development
// Use environment variable for backend URL, fallback to localhost for development
// Ensure it points to the /status base path
const envBackendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
export const STATUS_API_BASE_URL = envBackendUrl.endsWith("/status")
  ? envBackendUrl
  : `${envBackendUrl}/status`;

export interface PharmacyStatus {
  pharmacy_id: string;
  training: boolean;
  brandedPacket: boolean;
  updated_at: string;
}

export interface StatusHistoryRecord {
  id: number;
  pharmacy_id: string;
  field: "training" | "brandedPacket";
  old_value: boolean;
  new_value: boolean;
  comment: string;
  changed_by: string;
  changed_at: string;
}

export async function getPharmacyStatus(
  pharmacyId: number,
): Promise<PharmacyStatus> {
  try {
    const response = await fetch(`${STATUS_API_BASE_URL}/${pharmacyId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `Status API returned ${response.status} for pharmacy ${pharmacyId}`,
      );
      throw new Error("Failed to fetch pharmacy status");
    }

    return response.json();
  } catch (error) {
    // If backend is unavailable, return default values
    console.warn(
      `Backend status service unavailable for pharmacy ${pharmacyId}:`,
      error,
    );
    return {
      pharmacy_id: String(pharmacyId),
      training: false,
      brandedPacket: false,
      updated_at: new Date().toISOString(),
    };
  }
}

export async function updatePharmacyStatusLocal(
  pharmacyId: number,
  field: "brandedPacket" | "training",
  value: boolean,
  comment: string,
  changedBy: string,
): Promise<PharmacyStatus> {
  try {
    // Set timeout for request (30 seconds to allow for cold start)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `${STATUS_API_BASE_URL}/update/${pharmacyId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          update_type: field,
          new_value: value,
          comment,
          changed_by: changedBy,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Check if it's a 503 (service unavailable) or 504 (gateway timeout)
      if (response.status === 503 || response.status === 504) {
        throw new Error("BACKEND_SLEEPING");
      }
      throw new Error("Failed to update pharmacy status");
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      // Check if request was aborted (timeout)
      if (error.name === "AbortError") {
        throw new Error("BACKEND_SLEEPING");
      }
      // Re-throw the error to be handled by the caller
      throw error;
    }
    throw new Error("Failed to update pharmacy status");
  }
}

export async function getStatusHistory(
  pharmacyId: number,
): Promise<StatusHistoryRecord[]> {
  try {
    const response = await fetch(
      `${STATUS_API_BASE_URL}/history/${pharmacyId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.warn(
        `Status history API returned ${response.status} for pharmacy ${pharmacyId}`,
      );
      throw new Error("Failed to fetch status history");
    }

    return response.json();
  } catch (error) {
    // If backend is unavailable, return empty history
    console.warn(
      `Failed to fetch status history for pharmacy ${pharmacyId}:`,
      error,
    );
    return [];
  }
}

export async function deleteHistoryRecord(id: number): Promise<void> {
  try {
    const response = await fetch(`${STATUS_API_BASE_URL}/history/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `Failed to delete history record ${id}, status: ${response.status}`,
      );
      throw new Error("Failed to delete history record");
    }
  } catch (error) {
    // Log the error but don't crash
    console.warn(`Failed to delete history record ${id}:`, error);
    throw error; // Re-throw so UI can handle it
  }
}

// ============================================
// USER COLUMN SETTINGS API
// ============================================

export interface ColumnSettings {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export async function getUserColumnSettings(
  token: string,
  userId: string | number,
  page: string = "leads"
): Promise<ColumnSettings[] | null> {
  try {
    const response = await fetch(
      `${STATUS_API_BASE_URL}/user-settings/${userId}/column-settings?page=${page}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.warn("Failed to fetch column settings");
      return null;
    }

    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.warn("Error fetching column settings:", error);
    return null;
  }
}

export async function saveUserColumnSettings(
  token: string,
  userId: string | number,
  settings: ColumnSettings[],
  page: string = "leads"
): Promise<boolean> {
  try {
    const response = await fetch(
      `${STATUS_API_BASE_URL}/user-settings/${userId}/column-settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page, settings }),
      }
    );

    if (!response.ok) {
      console.warn("Failed to save column settings");
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Error saving column settings:", error);
    return false;
  }
}

