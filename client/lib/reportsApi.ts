// Mock data for development
const mockActivityData: ActivityResponse = {
  summary: { activated: 5, deactivated: 5 },
  events: [
    {
      id: 1,
      changeDatetime: "2026-01-05T09:12:00+05:00",
      code: "APT-042",
      pharmacyName: "Apteka #42",
      address: "Ул. Амира Темура, 45",
      landmark: "Рядом с метро Максим Горький",
      phone: "+998 71 210-45-45",
      responsiblePhone: "+998 91 210-45-45",
      district: "Sergeli",
      type: "DEACTIVATED",
      source: "manual",
      currentStatus: "inactive",
    },
    {
      id: 2,
      changeDatetime: "2026-01-06T11:03:00+05:00",
      code: "APT-042",
      pharmacyName: "Apteka #42",
      address: "Ул. Амира Темура, 45",
      landmark: "Рядом с метро Максим Горький",
      phone: "+998 71 210-45-45",
      responsiblePhone: "+998 91 210-45-45",
      district: "Sergeli",
      type: "ACTIVATED",
      source: "agent",
      currentStatus: "active",
    },
    {
      id: 3,
      changeDatetime: "2026-01-07T08:30:00+05:00",
      code: "APT-015",
      pharmacyName: "Apteka #15",
      address: "Ул. Букхоро, 78",
      landmark: "Возле ТРЦ Анвар",
      phone: "+998 71 215-30-30",
      responsiblePhone: "+998 91 215-30-30",
      district: "Yunusabad",
      type: "ACTIVATED",
      source: "system",
      currentStatus: "active",
    },
    {
      id: 4,
      changeDatetime: "2026-01-08T09:15:00+05:00",
      code: "APT-088",
      pharmacyName: "Apteka #88",
      address: "Проспект Мирабда, 12",
      landmark: "Напротив парка",
      phone: "+998 71 220-15-15",
      responsiblePhone: "+998 91 220-15-15",
      district: "Mirabad",
      type: "DEACTIVATED",
      source: "manual",
      currentStatus: "inactive",
    },
    {
      id: 5,
      changeDatetime: "2026-01-08T14:22:00+05:00",
      code: "APT-005",
      pharmacyName: "Apteka #5",
      address: "Ул. Чустаки, 55",
      landmark: "Рядом с детским садом",
      phone: "+998 71 225-60-60",
      responsiblePhone: "+998 91 225-60-60",
      district: "Shayhantaur",
      type: "ACTIVATED",
      source: "agent",
      currentStatus: "active",
    },
    {
      id: 6,
      changeDatetime: "2026-01-09T10:15:00+05:00",
      code: "APT-025",
      pharmacyName: "Apteka #25",
      address: "Ул. Туси, 20",
      landmark: "Рядом с магазином",
      phone: "+998 71 230-25-25",
      responsiblePhone: "+998 91 230-25-25",
      district: "Chilianzar",
      type: "ACTIVATED",
      source: "system",
      currentStatus: "active",
    },
    {
      id: 7,
      changeDatetime: "2026-01-10T13:45:00+05:00",
      code: "APT-060",
      pharmacyName: "Apteka #60",
      address: "Ул. Абая, 90",
      landmark: "Центр Сергели",
      phone: "+998 71 235-40-40",
      responsiblePhone: "+998 91 235-40-40",
      district: "Sergeli",
      type: "DEACTIVATED",
      source: "manual",
      currentStatus: "inactive",
    },
    {
      id: 8,
      changeDatetime: "2026-01-11T09:20:00+05:00",
      code: "APT-033",
      pharmacyName: "Apteka #33",
      address: "Ул. Хорезма, 33",
      landmark: "На центральной улице",
      phone: "+998 71 240-50-50",
      responsiblePhone: "+998 91 240-50-50",
      district: "Yunusabad",
      type: "DEACTIVATED",
      source: "agent",
      currentStatus: "inactive",
    },
    {
      id: 9,
      changeDatetime: "2026-01-12T15:30:00+05:00",
      code: "APT-077",
      pharmacyName: "Apteka #77",
      address: "Ул. Фирдавси, 15",
      landmark: "Возле библиотеки",
      phone: "+998 71 245-70-70",
      responsiblePhone: "+998 91 245-70-70",
      district: "Mirabad",
      type: "ACTIVATED",
      source: "manual",
      currentStatus: "active",
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
      code: "APT-042",
      pharmacyName: "Apteka #42",
      address: "Ул. Амира Темура, 45",
      landmark: "Рядом с метро Максим Горький",
      phone: "+998 71 210-45-45",
      responsiblePhone: "+998 91 210-45-45",
      onboardedAt: "2026-01-06T11:03:00+05:00",
      district: "Sergeli",
      currentStatus: "active",
    },
    {
      id: 102,
      code: "APT-015",
      pharmacyName: "Apteka #15",
      address: "Ул. Букхоро, 78",
      landmark: "Возле ТРЦ Анвар",
      phone: "+998 71 215-30-30",
      responsiblePhone: "+998 91 215-30-30",
      onboardedAt: "2026-01-07T09:15:00+05:00",
      district: "Yunusabad",
      currentStatus: "active",
    },
    {
      id: 103,
      code: "APT-088",
      pharmacyName: "Apteka #88",
      address: "Проспект Мирабда, 12",
      landmark: "Напротив парка",
      phone: "+998 71 220-15-15",
      responsiblePhone: "+998 91 220-15-15",
      onboardedAt: "2026-01-08T14:30:00+05:00",
      district: "Mirabad",
      currentStatus: "inactive",
    },
    {
      id: 104,
      code: "APT-005",
      pharmacyName: "Apteka #5",
      address: "Ул. Чустаки, 55",
      landmark: "Рядом с детским садом",
      phone: "+998 71 225-60-60",
      responsiblePhone: "+998 91 225-60-60",
      onboardedAt: "2026-01-09T10:45:00+05:00",
      district: "Shayhantaur",
      currentStatus: "active",
    },
    {
      id: 105,
      code: "APT-025",
      pharmacyName: "Apteka #25",
      address: "Ул. Туси, 20",
      landmark: "Рядом с магазином",
      phone: "+998 71 230-25-25",
      responsiblePhone: "+998 91 230-25-25",
      onboardedAt: "2026-01-10T13:20:00+05:00",
      district: "Chilianzar",
      currentStatus: "active",
    },
    {
      id: 106,
      code: "APT-060",
      pharmacyName: "Apteka #60",
      address: "Ул. Абая, 90",
      landmark: "Центр Сергели",
      phone: "+998 71 235-40-40",
      responsiblePhone: "+998 91 235-40-40",
      onboardedAt: "2026-01-11T11:00:00+05:00",
      district: "Sergeli",
      currentStatus: "active",
    },
    {
      id: 107,
      code: "APT-033",
      pharmacyName: "Apteka #33",
      address: "Ул. Хорезма, 33",
      landmark: "На центральной улице",
      phone: "+998 71 240-50-50",
      responsiblePhone: "+998 91 240-50-50",
      onboardedAt: "2026-01-12T08:30:00+05:00",
      district: "Yunusabad",
      currentStatus: "inactive",
    },
    {
      id: 108,
      code: "APT-077",
      pharmacyName: "Apteka #77",
      address: "Ул. Фирдавси, 15",
      landmark: "Возле библиотеки",
      phone: "+998 71 245-70-70",
      responsiblePhone: "+998 91 245-70-70",
      onboardedAt: "2026-01-13T15:15:00+05:00",
      district: "Mirabad",
      currentStatus: "active",
    },
    {
      id: 109,
      code: "APT-092",
      pharmacyName: "Apteka #92",
      address: "Ул. Навои, 88",
      landmark: "Возле рынка",
      phone: "+998 71 250-35-35",
      responsiblePhone: "+998 91 250-35-35",
      onboardedAt: "2026-01-14T10:30:00+05:00",
      district: "Yashnabad",
      currentStatus: "active",
    },
    {
      id: 110,
      code: "APT-101",
      pharmacyName: "Apteka #101",
      address: "Ул. Мирзо Улугбека, 50",
      landmark: "Рядом с университетом",
      phone: "+998 71 255-80-80",
      responsiblePhone: "+998 91 255-80-80",
      onboardedAt: "2026-01-15T12:45:00+05:00",
      district: "Sergeli",
      currentStatus: "active",
    },
    {
      id: 111,
      code: "APT-047",
      pharmacyName: "Apteka #47",
      address: "Ул. Носыра, 42",
      landmark: "На пересечении улиц",
      phone: "+998 71 260-10-10",
      responsiblePhone: "+998 91 260-10-10",
      onboardedAt: "2026-01-16T09:00:00+05:00",
      district: "Shayhantaur",
      currentStatus: "active",
    },
    {
      id: 112,
      code: "APT-064",
      pharmacyName: "Apteka #64",
      address: "Ул. Чиланзара, 28",
      landmark: "Возле почты",
      phone: "+998 71 265-90-90",
      responsiblePhone: "+998 91 265-90-90",
      onboardedAt: "2026-01-17T14:20:00+05:00",
      district: "Chilianzar",
      currentStatus: "active",
    },
  ],
};

export interface ActivityEvent {
  id: number;
  changeDatetime: string;
  code: string;
  pharmacyName: string;
  address?: string;
  landmark?: string;
  phone?: string;
  responsiblePhone?: string;
  district: string;
  type: "ACTIVATED" | "DEACTIVATED";
  source: string;
  currentStatus: "active" | "inactive";
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
  code: string;
  pharmacyName: string;
  address?: string;
  landmark?: string;
  phone?: string;
  responsiblePhone?: string;
  onboardedAt: string;
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
    const eventDate = new Date(event.changeDatetime);
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
