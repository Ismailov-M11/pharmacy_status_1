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
}
export async function getPharmacyList(
  token: string,
  searchKey: string = "",
  page: number = 0,
  active: boolean | null = true,
  size: number = 1000,
): Promise<PharmacyListResponse> {
  // If we only want ACTIVE pharmacies, just fetch market/list (leads are inactive)
  if (active === true) {
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

    if (!response.ok) throw new Error("Failed to fetch pharmacy list");
    return response.json();
  }

  // If we want ALL or INACTIVE, we need to merge Market + Leads
  try {
    // 1. Fetch Market List (All or Inactive)
    // We use a large size to fetch all locally for merging if strictly needed,
    // but here we respect the passed size for the market request as a base,
    // OR we might need to fetch ALL to merge properly.
    // Given the prompt implies "list from API... also gather info from lead/list",
    // and we do client-side filtering, we should probably fetch ALL from both if we want accurate total counts and sorting.
    // However, for performance regular pagination might be desired.
    // BUT, the user requirement is "exclude converted", which requires checking against the full list or ID.
    // Let's stick effectively to "Fetch All and Client Side Merge" for this specific filtered view as per plan.

    const [marketRes, leadsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/market/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ searchKey, page: 0, size: 10000, active }), // Fetch all market items matching filter
      }),
      fetch(`${API_BASE_URL}/lead/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ searchKey, page: 0, size: 10000 }), // Fetch all leads
      }),
    ]);

    if (!marketRes.ok || !leadsRes.ok) throw new Error("Failed to fetch lists");

    const marketData = await marketRes.json();
    const leadsData = await leadsRes.json();

    const marketList: Pharmacy[] = marketData.payload.list || [];
    const leadsList: any[] = leadsData.payload.list || [];

    // 2. Filter Leads
    // Exclude leads that have status 'CONVERTED'
    const unconvertedLeads = leadsList.filter((l) => l.status !== "CONVERTED");

    // 3. Map Leads to Pharmacy Interface
    const mappedLeads: Pharmacy[] = unconvertedLeads.map((lead) => ({
      ...lead,
      id: lead.id, // Ensure this doesn't collide with market IDs ideally, but we use what we have
      name: lead.name || "Lead",
      code: lead.code || "LEAD",
      address: lead.address || "",
      phone: lead.phone,
      active: false, // Force inactive
      lead: lead, // Self-reference or specific structure
      marketChats: [],
      creationDate: lead.creationDate,
      modifiedDate: lead.modifiedDate,
      // Map other specific fields if the frontend relies on them (e.g. juridicalName)
      juridicalName: lead.juridicalName,
    }));

    // 4. Merge
    let mergedList = [...marketList, ...mappedLeads];

    // 5. Client-side Search (if searchKey was applied to both APIs, this is partially redundant but ensures safety)
    if (searchKey) {
      const key = searchKey.toLowerCase();
      mergedList = mergedList.filter(
        (p) =>
          p.name?.toLowerCase().includes(key) ||
          p.code?.toLowerCase().includes(key) ||
          p.address?.toLowerCase().includes(key)
      );
    }

    // 6. Pagination (Simulated)
    const total = mergedList.length;
    // If original request had size/page, slice it
    // If size is 1000 (default in calling code), we might just return all or slice.
    // Current pagination is 0-indexed.
    const start = page * size;
    const end = start + size;
    const slicedList = mergedList.slice(start, end);

    return {
      payload: {
        list: slicedList,
        total: total,
      },
      status: "Ok",
      code: 200,
    };
  } catch (error) {
    console.error("Merge error:", error);
    throw new Error("Failed to fetch/merge lists");
  }
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
