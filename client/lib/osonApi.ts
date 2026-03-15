// ─── Types ──────────────────────────────────────────────────────────────────

export type OsonStatus = "connected" | "not_connected" | "deleted";

export interface OsonPharmacy {
  id: number;
  slug: string;
  name_ru: string | null;
  name_uz: string | null;
  parent_region_ru: string | null;
  parent_region_uz: string | null;
  region_ru: string | null;
  region_uz: string | null;
  address_ru: string | null;
  address_uz: string | null;
  landmark_ru: string | null;
  landmark_uz: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  open_time: string | null;
  close_time: string | null;
  has_delivery: boolean;
  is_verified: boolean;
  discount_percent: number;
  cashback_percent: number;
  oson_status: OsonStatus;
  last_synced_at: string;
  created_at: string;
}

export interface OsonStats {
  total: number;
  connected: number;
  not_connected: number;
  deleted: number;
  lastSyncedAt: string | null;
}

export interface OsonSyncStatus {
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  hasToken: boolean;
}

export interface OsonFilterOptions {
  parentRegions: { parent_region_ru: string; parent_region_uz: string }[];
  regions: { region_ru: string; region_uz: string }[];
}

export interface OsonDataResponse {
  data: OsonPharmacy[];
  total: number;
  filters: OsonFilterOptions;
  stats: OsonStats;
  syncStatus: OsonSyncStatus;
}

export interface OsonFilters {
  status?: OsonStatus | "all";
  parentRegion?: string;
  region?: string;
  search?: string;
}

// ─── Backend Base URL ────────────────────────────────────────────────────────

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Get all OSON pharmacies with optional filters
 */
export async function getOsonPharmacies(
  token: string,
  filters: OsonFilters = {}
): Promise<OsonDataResponse> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.parentRegion) params.set("parentRegion", filters.parentRegion);
  if (filters.region) params.set("region", filters.region);
  if (filters.search) params.set("search", filters.search);

  const url = `${BACKEND_URL}/api/oson/data${params.toString() ? `?${params}` : ""}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OSON pharmacies: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Trigger a manual OSON sync (fires-and-forgets on backend)
 */
export async function triggerOsonSync(token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BACKEND_URL}/api/oson/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Sync failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current sync status + stats
 */
export async function getOsonSyncStatus(
  token: string
): Promise<{ isSyncing: boolean; lastSyncAt: string | null; lastSyncError: string | null; hasToken: boolean; stats: OsonStats }> {
  const response = await fetch(`${BACKEND_URL}/api/oson/sync-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sync status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get filter options (parent regions + districts)
 */
export async function getOsonFilterOptions(
  token: string,
  parentRegion?: string
): Promise<OsonFilterOptions> {
  const params = parentRegion ? `?parentRegion=${encodeURIComponent(parentRegion)}` : "";
  const response = await fetch(`${BACKEND_URL}/api/oson/filter-options${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch filter options: ${response.statusText}`);
  }

  return response.json();
}
