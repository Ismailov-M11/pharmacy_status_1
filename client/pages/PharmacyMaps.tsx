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

interface GeoObject {
  geometry: {
    getCoordinates: () => [number, number];
  };
}

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
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeHistory, setChangeHistory] = useState<StatusHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Yandex Maps API loading
  useEffect(() => {
    const loadYandexMaps = () => {
      if (!window.ymaps) {
        const script = document.createElement("script");
        script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=";
        script.type = "text/javascript";
        script.async = true;
        script.onload = () => {
          if (window.ymaps) {
            window.ymaps.ready(initMap);
          }
        };
        document.head.appendChild(script);
      } else if (window.ymaps.ready) {
        window.ymaps.ready(initMap);
      }
    };

    if (authLoading) return;

    if (!token) {
      navigate("/login");
      return;
    }

    loadYandexMaps();
  }, [token, authLoading, navigate]);

  const initMap = () => {
    if (!mapRef.current) return;

    const map = new window.ymaps.Map(mapRef.current, {
      center: [41.2995, 69.2401],
      zoom: 11,
      controls: ["zoomControl", "fullscreenControl"]
    });

    mapInstanceRef.current = map;
    fetchPharmacies();
  };

  const fetchPharmacies = async () => {
    try {
      setIsLoading(true);
      const response = await getPharmacyList(token!, "", 0, null);
      const pharmacyList = response.payload?.list || [];

      // Fetch statuses from local backend for all pharmacies
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
            console.warn(`Failed to fetch status for pharmacy ${pharmacy.id}:`, error);
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

      // Geocode and place markers
      setTimeout(() => {
        pharmaciesWithStatuses.forEach((pharmacy) => {
          geocodeAndPlaceMarker(pharmacy);
        });
      }, 100);
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeAndPlaceMarker = async (pharmacy: Pharmacy) => {
    if (!window.ymaps || !mapInstanceRef.current) return;

    try {
      const geocoder = window.ymaps.geocode(pharmacy.address);
      const result = await geocoder;

      if (result.geoObjects.length > 0) {
        const firstGeoObject = result.geoObjects.get(0) as GeoObject;
        const coords = firstGeoObject.geometry.getCoordinates() as [number, number];
        
        placeMarker(pharmacy, coords);
      }
    } catch (error) {
      console.error(`Failed to geocode address for ${pharmacy.name}:`, error);
      // Place marker at default location if geocoding fails
      placeMarker(pharmacy, [41.2995, 69.2401]);
    }
  };

  const placeMarker = (pharmacy: Pharmacy, coords: [number, number]) => {
    if (!window.ymaps || !mapInstanceRef.current) return;

    const markerColor = pharmacy.active ? "#7E22CE" : "#7E22CE";
    const iconColor = pharmacy.active ? "7E22CE" : "7E22CE";

    const placemark = new window.ymaps.Placemark(coords, {
      balloonContent: `
        <div style="padding: 10px; font-family: Arial, sans-serif;">
          <div style="font-weight: bold; margin-bottom: 5px;">${pharmacy.name}</div>
          <div style="font-size: 12px; margin-bottom: 3px;"><strong>Код:</strong> ${pharmacy.code}</div>
          <div style="font-size: 12px; margin-bottom: 3px;"><strong>Адрес:</strong> ${pharmacy.address}</div>
          <div style="font-size: 12px; margin-bottom: 3px;"><strong>Статус:</strong> ${pharmacy.active ? "Активна" : "Неактивна"}</div>
          ${pharmacy.phone ? `<div style="font-size: 12px; margin-bottom: 3px;"><strong>Телефон:</strong> ${pharmacy.phone}</div>` : ""}
        </div>
      `
    }, {
      preset: "islands#violetDotIcon",
      iconColor: iconColor
    });

    placemark.events.add("click", () => {
      handlePharmacyClick(pharmacy);
    });

    mapInstanceRef.current?.geoObjects.add(placemark);
    markersRef.current.push(placemark);
  };

  const handlePharmacyClick = async (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsModalOpen(true);

    try {
      setIsLoadingHistory(true);
      const history = await getStatusHistory(pharmacy.id);
      setChangeHistory(history);
    } catch (error) {
      console.error("Failed to fetch history:", error);
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
      await updatePharmacyStatusLocal(pharmacyId, field, value, comment, user?.username || "User");

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
    refreshMarkers();
  };

  const refreshMarkers = () => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.geoObjects.remove(marker);
    });
    markersRef.current = [];

    const markersToShow = activeFilter === "all" 
      ? pharmacies 
      : activeFilter === "active" 
        ? pharmacies.filter(p => p.active)
        : pharmacies.filter(p => !p.active);

    markersToShow.forEach(pharmacy => {
      geocodeAndPlaceMarker(pharmacy);
    });
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      mapRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
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
          <div className="relative bg-white rounded-lg shadow-sm overflow-hidden">
            <div
              ref={mapRef}
              className="w-full"
              style={{ height: isFullscreen ? "100vh" : "600px" }}
            />
            
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg p-2 hover:bg-gray-50 z-10"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize2 className="w-5 h-5 text-gray-700" />
            </button>

            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                <span className="text-gray-500">{t.loadingPharmacies}</span>
              </div>
            )}
          </div>

          {/* Pharmacy List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
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
                    <tr key={pharmacy.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handlePharmacyClick(pharmacy)}>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePharmacyClick(pharmacy);
                          }}
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
