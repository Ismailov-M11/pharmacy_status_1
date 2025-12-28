import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { PharmacyDetailModal } from "@/components/PharmacyDetailModal";
import {
  getPharmacyList,
  Pharmacy,
  getPharmacyStatus,
  updatePharmacyStatusLocal,
  getStatusHistory,
  deleteHistoryRecord,
  StatusHistoryRecord,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

// Tashkent city coordinates
const TASHKENT_CENTER = [41.2995, 69.2401];

declare global {
  interface Window {
    ymaps: any;
  }
}

interface PharmacyWithCoords extends Pharmacy {
  latitude?: number;
  longitude?: number;
}

// Caching Helpers
const CACHE_KEY = "pharmacy_coords_cache";

const loadCachedCoords = (): Record<number, { lat: number; lon: number }> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    console.warn("Failed to load coords cache", e);
    return {};
  }
};

const saveCachedCoords = (id: number, lat: number, lon: number) => {
  try {
    const current = loadCachedCoords();
    current[id] = { lat, lon };
    localStorage.setItem(CACHE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn("Failed to save coords cache", e);
  }
};

export default function PharmacyMaps() {
  const { t } = useLanguage();
  const { token, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [pharmacies, setPharmacies] = useState<PharmacyWithCoords[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<
    PharmacyWithCoords[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Advanced Filter States
  const [filterTelegram, setFilterTelegram] = useState<"all" | "yes" | "no">("all");
  const [filterPacket, setFilterPacket] = useState<"all" | "yes" | "no">("all");
  const [filterTraining, setFilterTraining] = useState<"all" | "yes" | "no">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("active"); // Default: active

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] =
    useState<PharmacyWithCoords | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeHistory, setChangeHistory] = useState<StatusHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const geocodedRef = useRef<Set<number>>(new Set());
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Yandex Maps API and initialize
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate("/login");
      return;
    }

    // Load Yandex Maps API script
    const script = document.createElement("script");
    script.src =
      `https://api-maps.yandex.ru/2.1/?apikey=${import.meta.env.VITE_YANDEX_MAP_KEY}&lang=ru_RU`;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      console.log("✅ Yandex Maps API script loaded successfully");
      if (window.ymaps) {
        console.log("📍 ymaps object available, waiting for ready...");
        window.ymaps.ready(() => {
          console.log("📍 ymaps ready, initializing map");
          initializeMap();
        });
      } else {
        console.error("❌ ymaps object not available after script load");
      }
    };

    script.onerror = () => {
      console.error("❌ Failed to load Yandex Maps API script");
      toast.error("Не удалось загрузить Yandex Maps");
    };

    console.log("📌 Adding Yandex Maps script to document");
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount if needed
    };
  }, [token, authLoading, navigate]);

  const initializeMap = () => {
    if (!containerRef.current) {
      console.error("❌ Map container not found");
      return;
    }

    try {
      console.log("📍 Initializing Yandex Map...");

      mapRef.current = new window.ymaps.Map(containerRef.current, {
        center: TASHKENT_CENTER,
        zoom: 11,
        controls: ["zoomControl", "fullscreenControl"],
        behaviors: ["default", "scrollZoom"],
      });

      console.log("✅ Map initialized successfully");
      console.log(
        `🌍 API Backend URL: ${import.meta.env.VITE_BACKEND_URL || "default"}`,
      );

      // Fetch pharmacies after map is initialized
      fetchPharmacies();
    } catch (error) {
      console.error("❌ Failed to initialize map:", error);
      toast.error("Не удалось инициализировать карту");
    }
  };

  const fetchPharmacies = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching pharmacies...");

      const response = await getPharmacyList(token!, "", 0, null);
      const pharmacyList = response.payload?.list || [];
      console.log(`Fetched ${pharmacyList.length} pharmacies, loading statuses...`);

      // Fetch status for ALL pharmacies to validation filters
      // We chunk requests to avoid overwhelming the browser/server if list is huge
      const cachedCoords = loadCachedCoords();

      const pharmaciesWithStatus = await Promise.all(
        pharmacyList.map(async (pharmacy) => {
          let lat = pharmacy.latitude;
          let lon = pharmacy.longitude;

          // Try cache if no explicit coords
          if ((!lat || !lon) && cachedCoords[pharmacy.id]) {
            lat = cachedCoords[pharmacy.id].lat;
            lon = cachedCoords[pharmacy.id].lon;
          }

          try {
            const status = await getPharmacyStatus(pharmacy.id);
            return {
              ...pharmacy,
              latitude: lat,
              longitude: lon,
              training: status.training,
              brandedPacket: status.brandedPacket,
            };
          } catch {
            return {
              ...pharmacy,
              latitude: lat,
              longitude: lon,
              training: false,
              brandedPacket: false,
            };
          }
        })
      );

      setPharmacies(pharmaciesWithStatus);
      // Initial apply - pass empty/default for everything, but applyFilter uses state
      // We need to call applyFilter with the new list
      setFilteredPharmacies(pharmaciesWithStatus);

      console.log(
        `Successfully loaded ${pharmaciesWithStatus.length} pharmacies with status`,
      );
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  /* Refactored Layout and Map Logic */

  // Stabilize layout: Fixed height relative to viewport
  // Fix filters: Ensure map clears and redraws
  // Fix color: Use explicit specific color

  const addPlacemarks = (pharmaciesToPlace: PharmacyWithCoords[]) => {
    if (!mapRef.current || !window.ymaps) {
      return;
    }

    try {
      const geoObjects = mapRef.current.geoObjects;
      geoObjects.removeAll();

      // Create a collection for better performance
      const collection = new window.ymaps.GeoObjectCollection(null, {
        preset: 'islands#violetDotIcon'
      });

      pharmaciesToPlace.forEach((pharmacy) => {
        const coords =
          pharmacy.latitude && pharmacy.longitude
            ? [pharmacy.latitude, pharmacy.longitude]
            : TASHKENT_CENTER;

        const placemark = new window.ymaps.Placemark(
          coords,
          {
            balloonContent: `
              <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 300px;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1f2937;">${pharmacy.name}</div>
                <div style="font-size: 12px; margin-bottom: 4px;"><strong>${t.code || "Код"}:</strong> ${pharmacy.code}</div>
                <div style="font-size: 12px; margin-bottom: 4px;"><strong>${t.address || "Адрес"}:</strong> ${pharmacy.address}</div>
                <div style="font-size: 12px; margin-bottom: 4px;"><strong>${t.status || "Статус"}:</strong> <span style="color: ${pharmacy.active ? "#059669" : "#d97706"}">${pharmacy.active ? (t.active || "Активна") : (t.inactive || "Неактивна")}</span></div>
                ${pharmacy.phone ? `<div style="font-size: 12px; margin-bottom: 8px;"><strong>${t.pharmacyPhone || "Телефон"}:</strong> <a href="tel:${pharmacy.phone}" style="color: #2563eb;">${pharmacy.phone}</a></div>` : ""}
                
                 <div style="margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="font-size: 12px; display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">${t.telegramBot || "Telegram Bot"}:</span>
                        <span style="font-weight: bold; color: ${pharmacy.marketChats?.length ? '#059669' : '#dc2626'};">${pharmacy.marketChats?.length ? (t.yes || "ЕСТЬ") : (t.no || "НЕТ")}</span>
                    </div>
                    <div style="font-size: 12px; display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">${t.brandedPacket || "Пакет"}:</span>
                        <span style="font-weight: bold; color: ${pharmacy.brandedPacket ? '#059669' : '#dc2626'};">${pharmacy.brandedPacket ? (t.yes || "ЕСТЬ") : (t.no || "НЕТ")}</span>
                    </div>
                    <div style="font-size: 12px; display: flex; justify-content: space-between;">
                         <span style="color: #6b7280;">${t.training || "Обучение"}:</span>
                         <span style="font-weight: bold; color: ${pharmacy.training ? '#059669' : '#dc2626'};">${pharmacy.training ? (t.yes || "ЕСТЬ") : (t.no || "НЕТ")}</span>
                    </div>
                 </div>
              </div>
            `,
          },
          {
            preset: pharmacy.active ? 'islands#greenDotIcon' : 'islands#redDotIcon'
          }
        );

        // Click listener removed - balloon will open automatically

        collection.add(placemark);
      });

      geoObjects.add(collection);

      // If filtering, re-center map if needed? (Optional)

    } catch (error) {
      console.error("Error adding placemarks:", error);
    }

    // Trigger geocoding for those missing coords (background process)
    pharmaciesToPlace.forEach((pharmacy) => {
      // Check cache again just in case (though fetchPharmacies should have handled it) 
      // AND check ref to prevent session duplicates
      if ((!pharmacy.latitude || !pharmacy.longitude) && !geocodedRef.current.has(pharmacy.id)) {
        geocodedRef.current.add(pharmacy.id); // Mark as attempted
        geocodeAndUpdatePlacemark(pharmacy);
      }
    });
  };

  const geocodeAndUpdatePlacemark = (pharmacy: PharmacyWithCoords) => {
    if (!window.ymaps) {
      console.warn("ymaps not available for geocoding");
      return;
    }

    try {
      window.ymaps
        .geocode(pharmacy.address, {
          results: 1,
          boundedBy: [
            [39.5, 68.5],
            [42.5, 70.5],
          ], // Tashkent region bounds
          format: "json",
        })
        .then((result: any) => {
          try {
            if (
              result &&
              result.geoObjects &&
              result.geoObjects.getLength &&
              result.geoObjects.getLength() > 0
            ) {
              const geoObject = result.geoObjects.get(0);
              const coords = geoObject.geometry.getCoordinates();

              if (coords && Array.isArray(coords) && coords.length === 2) {
                const updatedPharmacy: PharmacyWithCoords = {
                  ...pharmacy,
                  latitude: coords[0],
                  longitude: coords[1],
                };

                // Save to Cache
                saveCachedCoords(pharmacy.id, coords[0], coords[1]);

                // Just update the pharmacy with coordinates, don't rebuild map
                setPharmacies((prev) =>
                  prev.map((p) => (p.id === pharmacy.id ? updatedPharmacy : p)),
                );
                setFilteredPharmacies((prev) =>
                  prev.map((p) => (p.id === pharmacy.id ? updatedPharmacy : p)),
                );

                console.log(
                  `✓ Geocoded: ${pharmacy.name} → [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`,
                );
              }
            } else {
              console.log(`⚠ No geocoding result for: ${pharmacy.name}`);
            }
          } catch (parseError) {
            console.warn(
              `Error parsing geocode result for ${pharmacy.name}:`,
              parseError,
            );
          }
        })
        .catch((error: any) => {
          console.warn(
            `Geocoding skipped for "${pharmacy.name}" - using default location`,
          );
        });
    } catch (error) {
      console.warn(`Geocoding unavailable for "${pharmacy.name}":`, error);
    }
  };

  const handlePharmacyClick = async (pharmacy: PharmacyWithCoords) => {
    setSelectedPharmacy(pharmacy);
    setIsModalOpen(true);

    setIsLoadingHistory(true);
    try {
      // Fetch status with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const status = await getPharmacyStatus(pharmacy.id);
        clearTimeout(timeoutId);

        setSelectedPharmacy((prev) =>
          prev
            ? {
              ...prev,
              training: status.training,
              brandedPacket: status.brandedPacket,
            }
            : null,
        );
      } catch (statusError) {
        console.warn(
          `Could not load status for pharmacy ${pharmacy.id}:`,
          statusError,
        );
        // Keep pharmacy data but with default status - don't crash
      }

      // Fetch history
      try {
        const history = await getStatusHistory(pharmacy.id);
        setChangeHistory(history);
      } catch (historyError) {
        console.warn(
          `Could not load history for pharmacy ${pharmacy.id}:`,
          historyError,
        );
        setChangeHistory([]);
      }
    } catch (error) {
      console.error("Error loading pharmacy details:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUpdateStatus = async (
    pharmacyId: number,
    field: "brandedPacket" | "training",
    value: boolean,
    comment: string,
  ) => {
    try {
      await updatePharmacyStatusLocal(
        pharmacyId,
        field,
        value,
        comment,
        user?.username || "User",
      );

      const history = await getStatusHistory(pharmacyId);
      setChangeHistory(history);

      const updatePharmacy = (p: PharmacyWithCoords) => {
        if (p.id === pharmacyId) {
          return {
            ...p,
            training: field === "training" ? value : (p as any).training,
            brandedPacket:
              field === "brandedPacket" ? value : (p as any).brandedPacket,
          };
        }
        return p;
      };

      setPharmacies((prev) => prev.map(updatePharmacy));
      setFilteredPharmacies((prev) => prev.map(updatePharmacy));
      setSelectedPharmacy((prev) => (prev ? updatePharmacy(prev) : null));

      toast.success(t.saved);
    } catch (error) {
      console.error("Failed to update pharmacy:", error);
      if (error instanceof Error && error.message === "BACKEND_SLEEPING") {
        toast.error(
          "Сервер запускается. Пожалуйста, попробуйте еще раз через 1-2 минуты.",
        );
      } else {
        toast.error(t.error);
      }
    }
  };

  const handleDeleteHistory = async (ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => deleteHistoryRecord(id)));
      setChangeHistory((prev) =>
        prev.filter((record) => !ids.includes(record.id)),
      );
      toast.success(t.deleted || "Deleted");
    } catch (error) {
      console.error("Failed to delete history:", error);
      toast.error(t.error);
    }
  };

  const applyFilter = (
    pharmaciesToFilter: PharmacyWithCoords[],
  ) => {
    let filtered = pharmaciesToFilter;

    // Filter: Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          (p.phone && p.phone.includes(query)),
      );
    }

    // Filter: Status
    if (filterStatus === "active") {
      filtered = filtered.filter((p) => p.active);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((p) => !p.active);
    }

    // Filter: Telegram Bot
    if (filterTelegram === "yes") {
      filtered = filtered.filter((p) => p.marketChats && p.marketChats.length > 0);
    } else if (filterTelegram === "no") {
      filtered = filtered.filter((p) => !p.marketChats || p.marketChats.length === 0);
    }

    // Filter: Packet
    if (filterPacket === "yes") {
      filtered = filtered.filter((p) => p.brandedPacket);
    } else if (filterPacket === "no") {
      filtered = filtered.filter((p) => !p.brandedPacket);
    }

    // Filter: Training
    if (filterTraining === "yes") {
      filtered = filtered.filter((p) => p.training);
    } else if (filterTraining === "no") {
      filtered = filtered.filter((p) => !p.training);
    }

    setFilteredPharmacies(filtered);
  };

  // Effect to re-apply filters when any filter state changes
  useEffect(() => {
    applyFilter(pharmacies);
  }, [pharmacies, filterStatus, filterTelegram, filterPacket, filterTraining, searchQuery]);


  // Helper component for Filter Cell
  const FilterCell = ({
    title,
    value,
    onChange
  }: {
    title: string;
    value: "all" | "yes" | "no" | "active" | "inactive";
    onChange: (v: any) => void
  }) => {
    // Logic for Status (3 options) vs others
    const isStatus = title === "Статус";

    return (
      <div className="flex flex-col gap-1 min-w-[100px]">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider pl-1">{title}</span>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onChange("all")}
            className={`text-xs px-2 py-1 rounded text-left transition-colors ${value === "all" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {t.all || "Все"}
          </button>
          <button
            onClick={() => onChange(isStatus ? "active" : "yes")}
            className={`text-xs px-2 py-1 rounded text-left transition-colors ${value === (isStatus ? "active" : "yes") ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {isStatus ? (t.active || "Активные") : (t.yes || "Есть")}
          </button>
          <button
            onClick={() => onChange(isStatus ? "inactive" : "no")}
            className={`text-xs px-2 py-1 rounded text-left transition-colors ${value === (isStatus ? "inactive" : "no") ? "bg-amber-50 text-amber-700 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {isStatus ? (t.inactive || "Неактивные") : (t.no || "Нет")}
          </button>
        </div>
      </div>
    );
  };

  // Update map when filter or search changes
  useEffect(() => {
    if (mapRef.current && !isLoading) {
      addPlacemarks(filteredPharmacies);
    }
  }, [filteredPharmacies, isLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">{t.loading}</span>
      </div>
    );
  }

  // Layout Render
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Panel - Pharmacy List */}
        <div className="w-full lg:w-[400px] bg-white border-r border-gray-200 flex flex-col z-10 shadow-lg shrink-0 h-[45vh] lg:h-full">
          <div className="px-4 py-4 border-b border-gray-200 bg-white shrink-0">
            <h1 className="text-xl font-bold text-gray-900">
              {t.maps || "Карты"}
            </h1>
            <p className="text-gray-500 text-sm">
              {t.pharmacyMap || "Аптеки на карте"}
            </p>
          </div>

          {/* Search & Filter Grid */}
          <div className="p-4 border-b border-gray-200 bg-white shrink-0 gap-4 flex flex-col shadow-sm z-20">
            <div className="flex gap-2">
              <Input
                placeholder={`${t.pharmacyName || "Поиск аптеки"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // State update triggers effect
                className="w-full bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
              <Button
                variant={isFiltersOpen ? "default" : "outline"}
                size="icon"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`shrink-0 ${isFiltersOpen ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                title={t.filter || "Фильтры"}
              >
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {isFiltersOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                <FilterCell
                  title={t.telegramBot || "Telegram Bot"}
                  value={filterTelegram}
                  onChange={setFilterTelegram}
                />
                <FilterCell
                  title={t.brandedPacket || "Пакет"}
                  value={filterPacket}
                  onChange={setFilterPacket}
                />
                <FilterCell
                  title={t.training || "Обучение"}
                  value={filterTraining}
                  onChange={setFilterTraining}
                />
                <FilterCell
                  title={t.status || "Статус"}
                  value={filterStatus}
                  onChange={setFilterStatus}
                />
              </div>
            )}
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white">
            {filteredPharmacies.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                {t.noData || "Аптеки не найдены"}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPharmacies.map((pharmacy, index) => (
                  <div
                    key={pharmacy.id}
                    onClick={() => handlePharmacyClick(pharmacy)}
                    className={`px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors ${selectedPharmacy?.id === pharmacy.id ? 'bg-purple-50 border-l-4 border-purple-600' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 text-sm line-clamp-1">{pharmacy.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pharmacy.active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {pharmacy.active ? 'ACT' : 'INA'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{pharmacy.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-center text-gray-400">
            Показано {filteredPharmacies.length} из {pharmacies.length}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative bg-gray-100 min-h-[400px] lg:h-full lg:min-h-0 order-last lg:order-none">
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                <span className="text-sm font-medium text-gray-600">Загрузка карты...</span>
                <span className="text-xs text-gray-400 mt-1">Получение статусов...</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <PharmacyDetailModal
        pharmacy={selectedPharmacy}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        isAdmin={user?.role === "ROLE_ADMIN"}
        currentUsername={user?.username || "User"}
        changeHistory={changeHistory}
        onDeleteHistory={handleDeleteHistory}
      />
    </div>
  );
}
