const DEV_API_BASE_URL = "https://dev-api.davodelivery.uz/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NotificationListRequest {
  partnerId?: number;
  marketId?: number;
  campaignId?: number;
  searchKey?: string;
  statuses?: string[];
  status?: string;
  source?: string;
  orderBy?: string;
  desc?: boolean;
  active?: boolean | null;
  page: number;
  size: number;
  dateField?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CampaignListRequest {
  partnerId?: number;
  marketId?: number;
  campaignId?: number;
  searchKey?: string;
  statuses?: string[];
  status?: string;
  source?: string;
  orderBy?: string;
  desc?: boolean;
  active?: boolean | null;
  page: number;
  size: number;
  dateField?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateCampaignRequest {
  type: "IN_APP";
  title: string;
  titleRu: string;
  body: string;
  bodyRu: string;
  source: "HAMBI";
}

export interface Notification {
  id: number;
  title?: string;
  titleRu?: string;
  body?: string;
  bodyRu?: string;
  status?: string;
  source?: string;
  campaignId?: number;
  createdAt?: string;
  sentAt?: string;
  [key: string]: any;
}

export interface Campaign {
  id: number;
  type?: string;
  title?: string;
  titleRu?: string;
  body?: string;
  bodyRu?: string;
  status?: string;
  source?: string;
  active?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface NotificationListResponse {
  payload?: {
    list?: Notification[];
    total?: number;
    totalElements?: number;
    content?: Notification[];
    [key: string]: any;
  };
  list?: Notification[];
  total?: number;
  totalElements?: number;
  content?: Notification[];
  status?: string;
  code?: number;
  [key: string]: any;
}

export interface CampaignListResponse {
  payload?: {
    list?: Campaign[];
    total?: number;
    totalElements?: number;
    content?: Campaign[];
    [key: string]: any;
  };
  list?: Campaign[];
  total?: number;
  totalElements?: number;
  content?: Campaign[];
  status?: string;
  code?: number;
  [key: string]: any;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchNotifications(
  token: string,
  params: NotificationListRequest
): Promise<NotificationListResponse> {
  const response = await fetch(
    `${DEV_API_BASE_URL}/campaign/notification/list`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        accept: "*/*",
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}

export async function fetchCampaigns(
  token: string,
  params: CampaignListRequest
): Promise<CampaignListResponse> {
  const response = await fetch(`${DEV_API_BASE_URL}/campaign/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accept: "*/*",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}

export async function createCampaign(
  token: string,
  data: CreateCampaignRequest
): Promise<any> {
  const response = await fetch(`${DEV_API_BASE_URL}/campaign/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accept: "*/*",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractNotifications(data: NotificationListResponse): Notification[] {
  return (
    data?.payload?.list ??
    data?.payload?.content ??
    data?.list ??
    data?.content ??
    []
  );
}

export function extractNotificationTotal(data: NotificationListResponse): number {
  return (
    data?.payload?.total ??
    data?.payload?.totalElements ??
    data?.total ??
    data?.totalElements ??
    0
  );
}

export function extractCampaigns(data: CampaignListResponse): Campaign[] {
  return (
    data?.payload?.list ??
    data?.payload?.content ??
    data?.list ??
    data?.content ??
    []
  );
}

export function extractCampaignTotal(data: CampaignListResponse): number {
  return (
    data?.payload?.total ??
    data?.payload?.totalElements ??
    data?.total ??
    data?.totalElements ??
    0
  );
}
