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
  StatusHistoryRecord
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import { toast } from "sonner";

// Tashkent city coordinates
const TASHKENT_CENTER = [41.2995, 69.2401];

declare global {
  interface Window {
    ymaps: any;
  }
}

export default function PharmacyMaps() {
  const { t } = useLanguage();
  const { token, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeHistory, setChangeHistory] = useState<StatusHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());

  // Load Yandex Maps API
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate("/login");
      return;
    }

    // Check if ymaps is already loaded
    if (window.ymaps) {
      window.ymaps.ready(() => {
        initializeMap();
      });
    } else {
      // Load the script
      const script = document.createElement("script");
      script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
      script.type = "text/javascript";
      script.async = true;
      
      script.onload = () => {
        console.log("Yandex Maps API loaded");
        if (window.ymaps) {
          window.ymaps.ready(() => {
            initializeMap();
          });
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load Yandex Maps API");
        toast.error("Не удалось загрузить карты Яндекса");
      };
      
      document.head.appendChild(script);
    }
  }, [token, authLoading, navigate]);

  const initializeMap = () => {
    if (!mapRef.current) {
      console.error("Map container not found");
      return;
    }

    try {
      console.log("Initializing Yandex Map...");
      const map = new window.ymaps.Map(mapRef.current, {
        center: TASHKENT_CENTER,
        zoom: 11,
        controls: ["zoomControl", "fullscreenControl"],
        behaviors: ["default", "scrollZoom"]
      });

      mapInstanceRef.current = map;
      setMapReady(true);
      console.log("Map initialized successfully");
      
      // Fetch pharmacies after map is ready
      fetchPharmacies();
    } catch (error) {
      console.error("Failed to initialize map:", error);
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

      // Fetch statuses from local backend
      const pharmaciesWithStatuses = await Promise.all(
        pharmacyList.map(async (pharmacy) => {
          try {
            const status = await getPharmacyStatus(pharmacy.id);
            return {
              ...pharmacy,
              training: status.training,
              brandedPacket: status.brandedPacket
            };
          } catch (error) {
            console.warn(`Failed to fetch status for pharmacy ${pharmacy.id}`);
            return {
              ...pharmacy,
              training: false,
              brandedPacket: false
            };
          }
        })
      );

      setPharmacies(pharmaciesWithStatuses);
      applyFilter(pharmaciesWithStatuses, activeFilter);
      
      // Place markers on map
      if (mapInstanceRef.current) {
        placeAllMarkers(pharmaciesWithStatuses);
      }
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const placeAllMarkers = (pharmaciesToPlace: Pharmacy[]) => {
    console.log(`Placing ${pharmaciesToPlace.length} markers on map`);
    
    // Clear existing markers
    markersRef.current.forEach((marker) => {
      try {
        mapInstanceRef.current?.geoObjects.remove(marker);
      } catch (e) {
        console.warn("Error removing marker:", e);
      }
    });
    markersRef.current.clear();

    // Place all markers at default location first
    pharmaciesToPlace.forEach((pharmacy) => {
      placeMarker(pharmacy, TASHKENT_CENTER);
    });

    // Then try to geocode and update locations
    pharmaciesToPlace.forEach((pharmacy, index) => {
      setTimeout(() => {
        geocodeAndUpdateMarker(pharmacy);
      }, index * 200);
    });
  };

  const placeMarker = (pharmacy: Pharmacy, coords: [number, number]) => {
    if (!mapInstanceRef.current || !window.ymaps) {
      console.warn("Map not ready, cannot place marker");
      return;
    }

    try {
      const placemark = new window.ymaps.Placemark(
        coords,
        {
          balloonContent: `
            <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 300px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1f2937;">${pharmacy.name}</div>
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Код:</strong> ${pharmacy.code}</div>
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Адрес:</strong> ${pharmacy.address}</div>
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Статус:</strong> <span style="color: ${pharmacy.active ? '#059669' : '#d97706'}">${pharmacy.active ? "Активна" : "Неактивна"}</span></div>
              ${pharmacy.phone ? `<div style="font-size: 12px;"><strong>Телефон:</strong> ${pharmacy.phone}</div>` : ""}
            </div>
          `
        },
        {
          preset: "islands#violetDotIcon",
          iconColor: "7E22CE"
        }
      );

      // Click event to open modal
      placemark.events.add("click", () => {
        handlePharmacyClick(pharmacy);
      });

      mapInstanceRef.current.geoObjects.add(placemark);
      markersRef.current.set(pharmacy.id, placemark);
      console.log(`Placed marker for: ${pharmacy.name}`);
    } catch (error) {
      console.error(`Failed to create marker for ${pharmacy.name}:`, error);
    }
  };

  const geocodeAndUpdateMarker = (pharmacy: Pharmacy) => {
    // Use OpenStreetMap Nominatim API (free, no authentication required)
    const query = encodeURIComponent(`${pharmacy.address}, Tashkent, Uzbekistan`);

    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PharmacyMap/1.0'
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);

          if (!isNaN(lat) && !isNaN(lon)) {
            const coords: [number, number] = [lat, lon];

            // Remove old marker and place new one with correct coordinates
            const oldMarker = markersRef.current.get(pharmacy.id);
            if (oldMarker) {
              try {
                mapInstanceRef.current?.geoObjects.remove(oldMarker);
              } catch (e) {
                console.warn("Error removing old marker:", e);
              }
            }

            placeMarker(pharmacy, coords);
            console.log(`✓ Geocoded: ${pharmacy.name} → [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
          }
        } else {
          console.log(`⚠ No location found for: ${pharmacy.name}`);
        }
      })
      .catch((error: any) => {
        console.warn(`Geocoding unavailable for "${pharmacy.name}":`, error?.message || error);
        // Marker remains at default location - this is acceptable
      });
  };

  const handlePharmacyClick = async (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsModalOpen(true);

    try {
      setIsLoadingHistory(true);
      const [status, history] = await Promise.all([
        getPharmacyStatus(pharmacy.id),
        getStatusHistory(pharmacy.id)
      ]);

      setSelectedPharmacy(prev => prev ? {
        ...prev,
        training: status.training,
        brandedPacket: status.brandedPacket
      } : null);

      setChangeHistory(history);
    } catch (error) {
      console.error("Failed to fetch pharmacy details:", error);
      setChangeHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUpdateStatus = async (
    pharmacyId: number,
    field: "brandedPacket" | "training",
    value: boolean,
    comment: string
  ) => {
    try {
      await updatePharmacyStatusLocal(
        pharmacyId,
        field,
        value,
        comment,
        user?.username || "User"
      );

      const history = await getStatusHistory(pharmacyId);
      setChangeHistory(history);

      const updatePharmacy = (p: Pharmacy) => {
        if (p.id === pharmacyId) {
          return {
            ...p,
            training: field === "training" ? value : (p as any).training,
            brandedPacket: field === "brandedPacket" ? value : (p as any).brandedPacket
          };
        }
        return p;
      };

      setPharmacies((prev) => prev.map(updatePharmacy));
      setFilteredPharmacies((prev) => prev.map(updatePharmacy));
      setSelectedPharmacy((prev) => prev ? updatePharmacy(prev) : null);

      toast.success(t.saved);
    } catch (error) {
      console.error("Failed to update pharmacy:", error);
      if (error instanceof Error && error.message === "BACKEND_SLEEPING") {
        toast.error("Сервер запускается. Пожалуйста, попробуйте еще раз через 1-2 минуты.");
      } else {
        toast.error(t.error);
      }
    }
  };

  const handleDeleteHistory = async (ids: number[]) => {
    try {
      await Promise.all(ids.map(id => deleteHistoryRecord(id)));
      setChangeHistory(prev => prev.filter(record => !ids.includes(record.id)));
      toast.success(t.deleted || "Deleted");
    } catch (error) {
      console.error("Failed to delete history:", error);
      toast.error(t.error);
    }
  };

  const applyFilter = (pharmaciesToFilter: Pharmacy[], filter: "all" | "active" | "inactive") => {
    let filtered = pharmaciesToFilter;

    if (filter === "active") {
      filtered = pharmaciesToFilter.filter(p => p.active);
    } else if (filter === "inactive") {
      filtered = pharmaciesToFilter.filter(p => !p.active);
    }

    setFilteredPharmacies(filtered);
  };

  const handleFilterChange = (filter: "all" | "active" | "inactive") => {
    setActiveFilter(filter);
    applyFilter(pharmacies, filter);
  };

  const toggleFullscreen = async () => {
    if (!mapRef.current) return;

    try {
      if (!isFullscreen) {
        if (mapRef.current.requestFullscreen) {
          await mapRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else if ((mapRef.current as any).webkitRequestFullscreen) {
          await (mapRef.current as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="w-full">
        <div className="mb-4 sm:mb-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t.maps || "Карты"}</h1>
          <p className="text-gray-600 mt-2">{t.pharmacyMap || "Отображение аптек на карте"}</p>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => handleFilterChange("all")}
              className={`${
                activeFilter === "all"
                  ? "bg-purple-700 hover:bg-purple-800 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.all || "Все"} ({pharmacies.length})
            </Button>
            <Button
              onClick={() => handleFilterChange("active")}
              className={`${
                activeFilter === "active"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.active || "Активные"} ({pharmacies.filter(p => p.active).length})
            </Button>
            <Button
              onClick={() => handleFilterChange("inactive")}
              className={`${
                activeFilter === "inactive"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.inactive || "Неактивные"} ({pharmacies.filter(p => !p.active).length})
            </Button>
          </div>

          {/* Map Container */}
          <div className="relative bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div
              ref={mapRef}
              className="w-full bg-gray-100"
              style={{ 
                height: isFullscreen ? "100vh" : "600px",
                minHeight: "400px"
              }}
            />
            
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg p-2 hover:bg-gray-50 z-10 shadow-md"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize2 className="w-5 h-5 text-gray-700" />
            </button>

            {/* Loading Overlay */}
            {(isLoading || !mapReady) && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex flex-col items-center justify-center z-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
                <span className="text-gray-700 font-medium">
                  {!mapReady ? "Загрузка карты..." : "Загрузка аптек..."}
                </span>
              </div>
            )}
          </div>

          {/* Pharmacy List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                {t.pharmacies || "Аптеки"} ({filteredPharmacies.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      №
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t.pharmacyName || "Название аптеки"}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t.address || "Адрес"}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t.status || "Статус"}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t.action || "Действие"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPharmacies.map((pharmacy, index) => (
                    <tr key={pharmacy.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">
                        {pharmacy.name}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-600">
                        {pharmacy.address}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            pharmacy.active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {pharmacy.active ? t.active : t.inactive}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                        <Button
                          onClick={() => handlePharmacyClick(pharmacy)}
                          className="bg-purple-700 hover:bg-purple-800 text-white h-8 text-xs"
                        >
                          {t.details || "Подробнее"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
