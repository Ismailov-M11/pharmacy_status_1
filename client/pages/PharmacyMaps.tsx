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

interface PharmacyWithCoords extends Pharmacy {
  latitude?: number;
  longitude?: number;
}

export default function PharmacyMaps() {
  const { t } = useLanguage();
  const { token, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [pharmacies, setPharmacies] = useState<PharmacyWithCoords[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<PharmacyWithCoords[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithCoords | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeHistory, setChangeHistory] = useState<StatusHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
    script.src = "https://api-maps.yandex.ru/2.1/?apikey=e0d28efd-ef86-451e-a276-c38260877cbb&lang=ru_RU";
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      console.log("Yandex Maps API script loaded");
      if (window.ymaps) {
        window.ymaps.ready(() => {
          initializeMap();
        });
      }
    };

    script.onerror = () => {
      console.error("Failed to load Yandex Maps API script");
      toast.error("Не удалось загрузить Yandex Maps");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount if needed
    };
  }, [token, authLoading, navigate]);

  const initializeMap = () => {
    if (!containerRef.current) {
      console.error("Map container not found");
      return;
    }

    try {
      console.log("Initializing Yandex Map...");
      
      mapRef.current = new window.ymaps.Map(containerRef.current, {
        center: TASHKENT_CENTER,
        zoom: 11,
        controls: ["zoomControl", "fullscreenControl"],
        behaviors: ["default", "scrollZoom"]
      });

      console.log("Map initialized successfully");
      
      // Fetch pharmacies after map is initialized
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
      
      // Add placemarks to map
      if (mapRef.current) {
        addPlacemarks(pharmaciesWithStatuses);
      }
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
      const coords = pharmacy.latitude && pharmacy.longitude
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
              <div style="font-size: 12px; margin-bottom: 4px;"><strong>Статус:</strong> <span style="color: ${pharmacy.active ? '#059669' : '#d97706'}">${pharmacy.active ? "Активна" : "Неактивна"}</span></div>
              ${pharmacy.phone ? `<div style="font-size: 12px;"><strong>Телефон:</strong> <a href="tel:${pharmacy.phone}" style="color: #2563eb;">${pharmacy.phone}</a></div>` : ""}
            </div>
          `
        },
        {
          preset: "islands#violetDotIcon",
          iconColor: "7E22CE" // Purple color rgb(126, 34, 206)
        }
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

    window.ymaps
      .geocode(pharmacy.address, {
        results: 1,
        boundedBy: [[39.5, 68.5], [42.5, 70.5]], // Tashkent region bounds
        format: "json"
      })
      .then((result: any) => {
        try {
          if (result && result.geoObjects && result.geoObjects.getLength && result.geoObjects.getLength() > 0) {
            const geoObject = result.geoObjects.get(0);
            const coords = geoObject.geometry.getCoordinates();
            
            if (coords && Array.isArray(coords) && coords.length === 2) {
              const updatedPharmacy: PharmacyWithCoords = {
                ...pharmacy,
                latitude: coords[0],
                longitude: coords[1]
              };

              // Update pharmacy with coordinates
              setPharmacies((prev) =>
                prev.map((p) => (p.id === pharmacy.id ? updatedPharmacy : p))
              );
              setFilteredPharmacies((prev) =>
                prev.map((p) => (p.id === pharmacy.id ? updatedPharmacy : p))
              );

              // Remove old placemark and add new one
              mapRef.current.geoObjects.removeAll();
              addPlacemarks(
                pharmacies.map((p) => (p.id === pharmacy.id ? updatedPharmacy : p))
              );

              console.log(`✓ Geocoded: ${pharmacy.name} → [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`);
            }
          } else {
            console.log(`No geocoding result for: ${pharmacy.name}`);
          }
        } catch (parseError) {
          console.error(`Error parsing geocode result for ${pharmacy.name}:`, parseError);
        }
      })
      .catch((error: any) => {
        console.warn(`Geocoding failed for "${pharmacy.name}":`, error?.message || error);
      });
  };

  const handlePharmacyClick = async (pharmacy: PharmacyWithCoords) => {
    setSelectedPharmacy(pharmacy);
    setIsModalOpen(true);

    try {
      setIsLoadingHistory(true);
      const [status, history] = await Promise.all([
        getPharmacyStatus(pharmacy.id),
        getStatusHistory(pharmacy.id)
      ]);

      setSelectedPharmacy((prev) =>
        prev
          ? {
              ...prev,
              training: status.training,
              brandedPacket: status.brandedPacket
            }
          : null
      );

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

      const updatePharmacy = (p: PharmacyWithCoords) => {
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
      setSelectedPharmacy((prev) => (prev ? updatePharmacy(prev) : null));

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
      await Promise.all(ids.map((id) => deleteHistoryRecord(id)));
      setChangeHistory((prev) => prev.filter((record) => !ids.includes(record.id)));
      toast.success(t.deleted || "Deleted");
    } catch (error) {
      console.error("Failed to delete history:", error);
      toast.error(t.error);
    }
  };

  const applyFilter = (
    pharmaciesToFilter: PharmacyWithCoords[],
    filter: "all" | "active" | "inactive"
  ) => {
    let filtered = pharmaciesToFilter;

    if (filter === "active") {
      filtered = pharmaciesToFilter.filter((p) => p.active);
    } else if (filter === "inactive") {
      filtered = pharmaciesToFilter.filter((p) => !p.active);
    }

    setFilteredPharmacies(filtered);
  };

  const handleFilterChange = (filter: "all" | "active" | "inactive") => {
    setActiveFilter(filter);
    applyFilter(pharmacies, filter);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
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
              {t.active || "Активные"} ({pharmacies.filter((p) => p.active).length})
            </Button>
            <Button
              onClick={() => handleFilterChange("inactive")}
              className={`${
                activeFilter === "inactive"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.inactive || "Неактивные"} ({pharmacies.filter((p) => !p.active).length})
            </Button>
          </div>

          {/* Map Container */}
          <div className="relative bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div
              ref={containerRef}
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
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex flex-col items-center justify-center z-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
                <span className="text-gray-700 font-medium">
                  {isLoading ? "Загрузка аптек..." : "Инициализация карты..."}
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
