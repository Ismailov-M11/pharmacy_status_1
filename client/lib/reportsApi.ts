// Mock data for development
const mockActivityData: ActivityResponse = {
  summary: { activated: 5, deactivated: 4 },
  events: [
    {
      id: 1,
      time: "2026-01-05T09:12:00+05:00",
      pharmacyName: "Apteka #42",
      district: "Sergeli",
      type: "DEACTIVATED",
      source: "manual",
    },
    {
      id: 2,
      time: "2026-01-06T11:03:00+05:00",
      pharmacyName: "Apteka #42",
      district: "Sergeli",
      type: "ACTIVATED",
      source: "agent",
    },
    {
      id: 3,
      time: "2026-01-07T08:30:00+05:00",
      pharmacyName: "Apteka #15",
      district: "Yunusabad",
      type: "ACTIVATED",
      source: "system",
    },
    {
      id: 4,
      time: "2026-01-08T14:22:00+05:00",
      pharmacyName: "Apteka #88",
      district: "Mirabad",
      type: "DEACTIVATED",
      source: "manual",
    },
    {
      id: 5,
      time: "2026-01-09T10:15:00+05:00",
      pharmacyName: "Apteka #5",
      district: "Shayhantaur",
      type: "ACTIVATED",
      source: "agent",
    },
    {
      id: 6,
      time: "2026-01-10T13:45:00+05:00",
      pharmacyName: "Apteka #25",
      district: "Chilianzar",
      type: "ACTIVATED",
      source: "system",
    },
    {
      id: 7,
      time: "2026-01-11T09:20:00+05:00",
      pharmacyName: "Apteka #60",
      district: "Sergeli",
      type: "DEACTIVATED",
      source: "manual",
    },
    {
      id: 8,
      time: "2026-01-12T11:50:00+05:00",
      pharmacyName: "Apteka #33",
      district: "Yunusabad",
      type: "DEACTIVATED",
      source: "agent",
    },
    {
      id: 9,
      time: "2026-01-13T15:30:00+05:00",
      pharmacyName: "Apteka #77",
      district: "Mirabad",
      type: "ACTIVATED",
      source: "manual",
    },
  ],
};

const mockNewPharmaciesData: NewPharmaciesResponse = {
  periodA: { label: "Январь 2026", count: 12 },
  periodB: { label: "Декабрь 2025", count: 9 },
  diff: { value: 3, percent: 33.3 },
  items: [
    {
      id: 101,
      onboardedAt: "2026-01-06T11:03:00+05:00",
      pharmacyName: "Apteka #42",
      district: "Sergeli",
      currentStatus: "active",
    },
    {
      id: 102,
      onboardedAt: "2026-01-07T09:15:00+05:00",
      pharmacyName: "Apteka #15",
      district: "Yunusabad",
      currentStatus: "active",
    },
    {
      id: 103,
      onboardedAt: "2026-01-08T14:30:00+05:00",
      pharmacyName: "Apteka #88",
      district: "Mirabad",
      currentStatus: "inactive",
    },
    {
      id: 104,
      onboardedAt: "2026-01-09T10:45:00+05:00",
      pharmacyName: "Apteka #5",
      district: "Shayhantaur",
      currentStatus: "active",
    },
    {
      id: 105,
      onboardedAt: "2026-01-10T13:20:00+05:00",
      pharmacyName: "Apteka #25",
      district: "Chilianzar",
      currentStatus: "active",
    },
    {
      id: 106,
      onboardedAt: "2026-01-11T11:00:00+05:00",
      pharmacyName: "Apteka #60",
      district: "Sergeli",
      currentStatus: "active",
    },
    {
      id: 107,
      onboardedAt: "2026-01-12T08:30:00+05:00",
      pharmacyName: "Apteka #33",
      district: "Yunusabad",
      currentStatus: "inactive",
    },
    {
      id: 108,
      onboardedAt: "2026-01-13T15:15:00+05:00",
      pharmacyName: "Apteka #77",
      district: "Mirabad",
      currentStatus: "active",
    },
    {
      id: 109,
      onboardedAt: "2026-01-14T10:30:00+05:00",
      pharmacyName: "Apteka #92",
      district: "Yashnabad",
      currentStatus: "active",
    },
    {
      id: 110,
      onboardedAt: "2026-01-15T12:45:00+05:00",
      pharmacyName: "Apteka #101",
      district: "Sergeli",
      currentStatus: "active",
    },
    {
      id: 111,
      onboardedAt: "2026-01-16T09:00:00+05:00",
      pharmacyName: "Apteka #47",
      district: "Shayhantaur",
      currentStatus: "active",
    },
    {
      id: 112,
      onboardedAt: "2026-01-17T14:20:00+05:00",
      pharmacyName: "Apteka #64",
      district: "Chilianzar",
      currentStatus: "active",
    },
  ],
};

export interface ActivityEvent {
  id: number;
  time: string;
  pharmacyName: string;
  district: string;
  type: "ACTIVATED" | "DEACTIVATED";
  source: string;
}

export interface ActivitySummary {
  activated: number;
  deactivated: number;
}

export interface ActivityResponse {
  summary: ActivitySummary;
  events: ActivityEvent[];
}

export interface NewPharmacy {
  id: number;
  onboardedAt: string;
  pharmacyName: string;
  district: string;
  currentStatus: "active" | "inactive";
}

export interface PeriodData {
  label: string;
  count: number;
}

export interface Difference {
  value: number;
  percent: number;
}

export interface NewPharmaciesResponse {
  periodA: PeriodData;
  periodB: PeriodData;
  diff: Difference;
  items: NewPharmacy[];
}

// Filter mock data by date range
function filterActivityByDateRange(
  events: ActivityEvent[],
  fromDate: Date,
  toDate: Date,
): ActivityEvent[] {
  return events.filter((event) => {
    const eventDate = new Date(event.time);
    return eventDate >= fromDate && eventDate <= toDate;
  });
}

function filterNewPharmaciesByDateRange(
  items: NewPharmacy[],
  fromDate: Date,
  toDate: Date,
): NewPharmacy[] {
  return items.filter((item) => {
    const itemDate = new Date(item.onboardedAt);
    return itemDate >= fromDate && itemDate <= toDate;
  });
}

// Fetch activity data
export async function fetchActivityData(
  fromDate: Date,
  toDate: Date,
): Promise<ActivityResponse> {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (apiUrl) {
    try {
      const from = fromDate.toISOString().split("T")[0];
      const to = toDate.toISOString().split("T")[0];
      const response = await fetch(
        `${apiUrl}/reports/activity?from=${from}&to=${to}`,
      );
      if (!response.ok) throw new Error("API failed");
      return response.json();
    } catch (error) {
      console.error("API error, falling back to mock data:", error);
    }
  }

  // Use mock data
  const filteredEvents = filterActivityByDateRange(
    mockActivityData.events,
    fromDate,
    toDate,
  );

  const summary = {
    activated: filteredEvents.filter((e) => e.type === "ACTIVATED").length,
    deactivated: filteredEvents.filter((e) => e.type === "DEACTIVATED").length,
  };

  return {
    summary,
    events: filteredEvents,
  };
}

// Fetch new pharmacies data
export async function fetchNewPharmaciesData(
  fromDate: Date,
  toDate: Date,
  compareFromDate?: Date,
  compareToDate?: Date,
): Promise<NewPharmaciesResponse> {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (apiUrl) {
    try {
      const from = fromDate.toISOString().split("T")[0];
      const to = toDate.toISOString().split("T")[0];
      const query =
        compareFromDate && compareToDate
          ? `from=${from}&to=${to}&compareFrom=${compareFromDate.toISOString().split("T")[0]}&compareTo=${compareToDate.toISOString().split("T")[0]}`
          : `from=${from}&to=${to}`;
      const response = await fetch(`${apiUrl}/reports/new-pharmacies?${query}`);
      if (!response.ok) throw new Error("API failed");
      return response.json();
    } catch (error) {
      console.error("API error, falling back to mock data:", error);
    }
  }

  // Use mock data
  const filteredItemsA = filterNewPharmaciesByDateRange(
    mockNewPharmaciesData.items,
    fromDate,
    toDate,
  );

  let filteredItemsB: NewPharmacy[] = [];
  if (compareFromDate && compareToDate) {
    filteredItemsB = filterNewPharmaciesByDateRange(
      mockNewPharmaciesData.items,
      compareFromDate,
      compareToDate,
    );
  }

  const countA = filteredItemsA.length;
  const countB = filteredItemsB.length;
  const diff = countA - countB;
  const percent = countB > 0 ? (diff / countB) * 100 : 0;

  return {
    periodA: {
      label: `Период А (${fromDate.toLocaleDateString("ru-RU")})`,
      count: countA,
    },
    periodB: {
      label:
        compareFromDate && compareToDate
          ? `Период B (${compareFromDate.toLocaleDateString("ru-RU")})`
          : "Период B",
      count: countB,
    },
    diff: {
      value: diff,
      percent: percent,
    },
    items: filteredItemsA,
  };
}
