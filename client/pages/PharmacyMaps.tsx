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

export default function PharmacyMaps() {
  const { t } = useLanguage();
  const { token, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [pharmacies, setPharmacies] = useState<PharmacyWithCoords[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<
    PharmacyWithCoords[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] =
    useState<PharmacyWithCoords | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeHistory, setChangeHistory] = useState<StatusHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
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
      "https://api-maps.yandex.ru/2.1/?apikey=e0d28efd-ef86-451e-a276-c38260877cbb&lang=ru_RU";
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
        controls: ["zoomControl"],
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
      console.log(`Fetched ${pharmacyList.length} pharmacies`);

      // Don't wait for statuses - just show pharmacies on map
      // Statuses will be loaded when user clicks on a pharmacy
      const pharmaciesWithDefaults = pharmacyList.map((pharmacy) => ({
        ...pharmacy,
        training: false,
        brandedPacket: false,
      }));

      setPharmacies(pharmaciesWithDefaults);
      applyFilter(pharmaciesWithDefaults, activeFilter);

      // Add placemarks to map
      if (mapRef.current) {
        addPlacemarks(pharmaciesWithDefaults);
      }

      console.log(
        `Successfully loaded ${pharmaciesWithDefaults.length} pharmacies on map`,
      );
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPlacemarks = (pharmaciesToPlace: PharmacyWithCoords[]) => {
    if (!mapRef.current || !window.ymaps) {
      console.warn("Map not ready, cannot add placemarks");
      return;
    }

    // Clear existing placemarks
    mapRef.current.geoObjects.removeAll();
    console.log("Cleared existing placemarks");

    // Add placemarks for each pharmacy
    pharmaciesToPlace.forEach((pharmacy) => {
      addPlacemark(pharmacy);
    });

    // Geocode addresses to get actual coordinates
    pharmaciesToPlace.forEach((pharmacy, index) => {
      setTimeout(() => {
        geocodeAndUpdatePlacemark(pharmacy);
      }, index * 300); // Stagger requests
    });
  };

  const addPlacemark = (pharmacy: PharmacyWithCoords) => {
    if (!mapRef.current || !window.ymaps) return;

    try {
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
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Код:</strong> ${pharmacy.code}</div>
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Адрес:</strong> ${pharmacy.address}</div>
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Статус:</strong> <span style="color: ${pharmacy.active ? "#059669" : "#d97706"}">${pharmacy.active ? "Активна" : "Неактивна"}</span></div>
              ${pharmacy.phone ? `<div style="font-size: 12px;"><strong>Телефон:</strong> <a href="tel:${pharmacy.phone}" style="color: #2563eb;">${pharmacy.phone}</a></div>` : ""}
            </div>
          `,
        },
        {
          preset: "islands#purpleDotIcon",
        },
      );

      // Click event to open modal
      placemark.events.add("click", () => {
        handlePharmacyClick(pharmacy);
      });

      mapRef.current.geoObjects.add(placemark);
      console.log(`Added placemark for: ${pharmacy.name}`);
    } catch (error) {
      console.error(`Failed to create placemark for ${pharmacy.name}:`, error);
    }
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

                // Update pharmacy with coordinates
                setPharmacies((prev) =>
                  prev.map((p) => (p.id === pharmacy.id ? updatedPharmacy : p)),
                );
                setFilteredPharmacies((prev) =>
                  prev.map((p) => (p.id === pharmacy.id ? updatedPharmacy : p)),
                );

                // Rebuild all placemarks with updated coordinates
                if (mapRef.current) {
                  mapRef.current.geoObjects.removeAll();
                  setPharmacies((prevPharmacies) => {
                    const updated = prevPharmacies.map((p) =>
                      p.id === pharmacy.id ? updatedPharmacy : p,
                    );
                    addPlacemarks(updated);
                    return updated;
                  });
                }

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
    filter: "all" | "active" | "inactive",
    search: string = searchQuery,
  ) => {
    let filtered = pharmaciesToFilter;

    // Apply status filter
    if (filter === "active") {
      filtered = pharmaciesToFilter.filter((p) => p.active);
    } else if (filter === "inactive") {
      filtered = pharmaciesToFilter.filter((p) => !p.active);
    }

    // Apply search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          (p.phone && p.phone.includes(query)),
      );
    }

    setFilteredPharmacies(filtered);
  };

  const handleFilterChange = (filter: "all" | "active" | "inactive") => {
    setActiveFilter(filter);
    applyFilter(pharmacies, filter, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilter(pharmacies, activeFilter, query);
  };


  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Pharmacy List */}
        <div className="w-full lg:w-1/3 bg-white border-r border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">
              {t.maps || "Карты"}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {t.pharmacyMap || "Отображение аптек на карте"}
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                placeholder={`${t.pharmacyName || "Название"} / ${t.address || "Адрес"}...`}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 flex-shrink-0">
                    {activeFilter === "all" && "Все"}
                    {activeFilter === "active" && "Активные"}
                    {activeFilter === "inactive" && "Неактивные"}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={activeFilter}
                    onValueChange={(val) =>
                      handleFilterChange(val as "all" | "active" | "inactive")
                    }
                  >
                    <DropdownMenuRadioItem value="all">
                      {t.all || "Все"} ({pharmacies.length})
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="active"
                      className="bg-emerald-50"
                    >
                      {t.active || "Активные"} (
                      {pharmacies.filter((p) => p.active).length})
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="inactive"
                      className="bg-amber-50"
                    >
                      {t.inactive || "Неактивные"} (
                      {pharmacies.filter((p) => !p.active).length})
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Pharmacy List Window with Scrollbar */}
          <div className="flex-1 overflow-hidden flex flex-col mx-4 sm:mx-6 my-4 rounded-lg border border-gray-200 shadow-sm bg-white">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-shrink-0">
              <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.pharmacies || "Аптеки"} ({filteredPharmacies.length})
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredPharmacies.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  {t.noData || "Нет данных"}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPharmacies.map((pharmacy, index) => (
                    <div
                      key={pharmacy.id}
                      className="px-4 py-3 hover:bg-purple-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handlePharmacyClick(pharmacy)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 flex-shrink-0 font-medium">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {pharmacy.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {pharmacy.address}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 whitespace-nowrap ${
                            pharmacy.active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {pharmacy.active ? t.active : t.inactive}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="w-full lg:w-2/3 bg-white flex flex-col min-h-96 lg:min-h-0 order-first lg:order-last">
          <div className="relative flex-1 bg-gray-100 overflow-hidden">
            <div
              ref={containerRef}
              className="w-full h-full bg-gray-100"
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex flex-col items-center justify-center z-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
                <span className="text-gray-700 font-medium">
                  {isLoading ? "Загрузка аптек..." : "Инициализация карты..."}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      <PharmacyDetailModal
        pharmacy={selectedPharmacy}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        isAdmin={true}
        currentUsername={user?.username || "User"}
        changeHistory={changeHistory}
        onDeleteHistory={handleDeleteHistory}
      />
    </div>
  );
}
