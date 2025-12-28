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
  >("active");
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

      // Map will be updated by the useEffect that watches filteredPharmacies

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
        preset: 'islands#violetDotIcon',
        iconColor: '#7c3aed' // Explicit Tailwind purple-600
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
                <div style="font-size: 12px; margin-bottom: 4px;"><strong>Код:</strong> ${pharmacy.code}</div>
                <div style="font-size: 12px; margin-bottom: 4px;"><strong>Адрес:</strong> ${pharmacy.address}</div>
                <div style="font-size: 12px; margin-bottom: 4px;"><strong>Статус:</strong> <span style="color: ${pharmacy.active ? "#059669" : "#d97706"}">${pharmacy.active ? "Активна" : "Неактивна"}</span></div>
                ${pharmacy.phone ? `<div style="font-size: 12px;"><strong>Телефон:</strong> <a href="tel:${pharmacy.phone}" style="color: #2563eb;">${pharmacy.phone}</a></div>` : ""}
              </div>
            `,
          },
          {
            preset: "islands#violetDotIcon", // Changed to violet which is purple-ish
            iconColor: '#8b5cf6' // Tailwind violet-500
          }
        );

        placemark.events.add("click", () => {
          handlePharmacyClick(pharmacy);
        });

        collection.add(placemark);
      });

      geoObjects.add(collection);

      // If filtering, re-center map if needed? (Optional)

    } catch (error) {
      console.error("Error adding placemarks:", error);
    }

    // Trigger geocoding for those missing coords (background process)
    pharmaciesToPlace.forEach((pharmacy) => {
      if (!pharmacy.latitude || !pharmacy.longitude) {
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
        <div className="w-full lg:w-[400px] bg-white border-r border-gray-200 flex flex-col z-10 shadow-lg shrink-0 h-full">
          <div className="px-4 py-4 border-b border-gray-200 bg-white shrink-0">
            <h1 className="text-xl font-bold text-gray-900">
              {t.maps || "Карты"}
            </h1>
            <p className="text-gray-500 text-sm">
              {t.pharmacyMap || "Аптеки на карте"}
            </p>
          </div>

          {/* Search & Filter */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0 gap-2 flex flex-col">
            <div className="flex gap-2">
              <Input
                placeholder={`${t.pharmacyName || "Поиск"}...`}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 bg-white"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 bg-white">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={activeFilter} onValueChange={(v: any) => handleFilterChange(v)}>
                    <DropdownMenuRadioItem value="all">{t.all || "Все"}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active">{t.active || "Активные"}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inactive">{t.inactive || "Неактивные"}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1 rounded-full border transition-colors ${activeFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {t.all || "Все"}
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                className={`px-3 py-1 rounded-full border transition-colors ${activeFilter === 'active' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {t.active || "Активные"}
              </button>
              <button
                onClick={() => handleFilterChange('inactive')}
                className={`px-3 py-1 rounded-full border transition-colors ${activeFilter === 'inactive' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                {t.inactive || "Неактивные"}
              </button>
            </div>
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
        <div className="flex-1 relative bg-gray-200 h-full min-h-0">
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                <span className="text-sm font-medium text-gray-600">Загрузка карты...</span>
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
        isAdmin={true} // Allow all map viewers to edit for now, or use actual role check
        currentUsername={user?.username || "User"}
        changeHistory={changeHistory}
        onDeleteHistory={handleDeleteHistory}
      />
    </div>
  );
}
