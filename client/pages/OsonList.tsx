import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  List,
  Map,
  Search,
  ChevronDown,
  Phone,
  Clock,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
  Info,
  Percent,
  BadgeCheck,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOsonPharmacies,
  triggerOsonSync,
  getOsonSyncStatus,
  OsonPharmacy,
  OsonStats,
  OsonSyncStatus,
  OsonFilterOptions,
  OsonStatus,
  OsonProgress,
} from "@/lib/osonApi";

// ─── Map coordinates ─────────────────────────────────────────────────────────
const UZBEKISTAN_CENTER = [41.2995, 69.2401];

declare global {
  interface Window {
    ymaps: any;
  }
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

function getStatusLabel(status: OsonStatus, lang: string): string {
  const labels: Record<OsonStatus, Record<string, string>> = {
    connected: { ru: "Подключён", uz: "Ulangan" },
    not_connected: { ru: "Не подключён", uz: "Ulanmagan" },
    deleted: { ru: "Удалён", uz: "O'chirilgan" },
  };
  return labels[status]?.[lang] || labels[status]?.["ru"] || status;
}

function getStatusColor(status: OsonStatus): string {
  switch (status) {
    case "connected":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "not_connected":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "deleted":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusIcon(status: OsonStatus) {
  switch (status) {
    case "connected":
      return <CheckCircle className="h-3 w-3" />;
    case "not_connected":
      return <AlertCircle className="h-3 w-3" />;
    case "deleted":
      return <XCircle className="h-3 w-3" />;
  }
}

function getMarkerColor(status: OsonStatus): string {
  switch (status) {
    case "connected":
      return "islands#greenDotIcon";
    case "not_connected":
      return "islands#orangeDotIcon";
    default:
      return "islands#grayDotIcon";
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ViewTab = "list" | "map";

export default function OsonList() {
  const { language } = useLanguage();
  const { token, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // View state
  const [activeTab, setActiveTab] = useState<ViewTab>("list");

  // Data state
  const [pharmacies, setPharmacies] = useState<OsonPharmacy[]>([]);
  const [filterOptions, setFilterOptions] = useState<OsonFilterOptions>({
    parentRegions: [],
    regions: [],
  });
  const [stats, setStats] = useState<OsonStats>({
    total: 0,
    connected: 0,
    not_connected: 0,
    deleted: 0,
    lastSyncedAt: null,
  });
  const [syncStatus, setSyncStatus] = useState<OsonSyncStatus>({
    isSyncing: false,
    lastSyncAt: null,
    lastSyncError: null,
    hasToken: false,
    progress: { current: 0, total: 0, percent: 0, phase: "" },
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<OsonProgress>({
    current: 0,
    total: 0,
    percent: 0,
    phase: "",
  });

  // Filter states
  const [filterStatus, setFilterStatus] = useState<OsonStatus | "all">("all");
  const [filterParentRegion, setFilterParentRegion] = useState<string>("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Confirm dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Map refs
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInitialized = useRef(false);

  // Polling ref for sync status
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Auth guard ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !token) {
      navigate("/login");
    }
  }, [token, authLoading, navigate]);

  // ─── Load data ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await getOsonPharmacies(token, {
        status: filterStatus,
        parentRegion: filterParentRegion || undefined,
        region: filterRegion || undefined,
        search: searchQuery || undefined,
      });
      setPharmacies(response.data);
      setFilterOptions(response.filters);
      setStats(response.stats);
      setSyncStatus(response.syncStatus);
    } catch (err) {
      console.error("Failed to load OSON data:", err);
      toast.error("Не удалось загрузить данные OSON");
    } finally {
      setIsLoading(false);
    }
  }, [token, filterStatus, filterParentRegion, filterRegion, searchQuery]);

  // Initial load
  useEffect(() => {
    if (!authLoading && token) {
      loadData();
    }
  }, [authLoading, token, loadData]);

  // ─── Sync status polling (while sync is running) ─────────────────────────

  useEffect(() => {
    if (isSyncing) {
      pollingRef.current = setInterval(async () => {
        if (!token) return;
        try {
          const status = await getOsonSyncStatus(token);
          setSyncStatus({
            isSyncing: status.isSyncing,
            lastSyncAt: status.lastSyncAt,
            lastSyncError: status.lastSyncError,
            hasToken: status.hasToken,
            progress: status.progress || { current: 0, total: 0, percent: 0, phase: "" },
          });
          setStats(status.stats);
          if (status.progress) setSyncProgress(status.progress);

          if (!status.isSyncing) {
            // Sync finished
            setIsSyncing(false);
            clearInterval(pollingRef.current!);
            toast.success("Данные OSON успешно обновлены!");
            loadData(); // Reload full data
          }
        } catch {
          // Ignore polling errors
        }
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isSyncing, token, loadData]);

  // ─── Trigger sync ─────────────────────────────────────────────────────────

  const handleSync = async () => {
    if (!token) return;
    setIsConfirmOpen(false);
    setSyncProgress({ current: 0, total: 0, percent: 0, phase: "collecting" });

    try {
      await triggerOsonSync(token);
      setIsSyncing(true);
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
      toast.info("Синхронизация запущена. Это может занять несколько минут...");
    } catch (err: any) {
      toast.error(err.message || "Не удалось запустить синхронизацию");
    }
  };

  // ─── Map init ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== "map" || mapInitialized.current) return;

    const existing = document.getElementById("yandex-maps-script");
    if (existing) {
      if (window.ymaps) {
        window.ymaps.ready(() => initMap());
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "yandex-maps-script";
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${import.meta.env.VITE_YANDEX_MAP_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      if (window.ymaps) window.ymaps.ready(() => initMap());
    };
    document.head.appendChild(script);
  }, [activeTab]);

  const initMap = () => {
    if (!containerRef.current || mapInitialized.current) return;

    try {
      mapRef.current = new window.ymaps.Map(containerRef.current, {
        center: UZBEKISTAN_CENTER,
        zoom: 6,
        controls: ["zoomControl", "fullscreenControl"],
        behaviors: ["default", "scrollZoom"],
      });
      mapInitialized.current = true;
      renderMapMarkers();
    } catch (err) {
      console.error("Map init error:", err);
    }
  };

  // ─── Map markers ─────────────────────────────────────────────────────────

  const renderMapMarkers = useCallback(() => {
    if (!mapRef.current || !window.ymaps) return;

    const geoObjects = mapRef.current.geoObjects;
    geoObjects.removeAll();

    const visiblePharmacies = pharmacies.filter(
      (p) => p.oson_status === "connected" || p.oson_status === "not_connected"
    );

    const collection = new window.ymaps.GeoObjectCollection();

    visiblePharmacies.forEach((pharmacy) => {
      if (!pharmacy.latitude || !pharmacy.longitude) return;

      const statusLabel = getStatusLabel(pharmacy.oson_status, language);
      const statusColor =
        pharmacy.oson_status === "connected" ? "#10b981" : "#f59e0b";

      const placemark = new window.ymaps.Placemark(
        [pharmacy.latitude, pharmacy.longitude],
        {
          balloonContent: `
            <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 300px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
                ${language === "uz" ? pharmacy.name_uz || pharmacy.name_ru : pharmacy.name_ru || pharmacy.name_uz}
              </div>
              <div style="display:inline-block; padding: 2px 8px; border-radius: 12px; background:${statusColor}22; color:${statusColor}; font-size:11px; font-weight:bold; margin-bottom:8px;">
                ${statusLabel}
              </div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                📍 ${language === "uz" ? pharmacy.address_uz || pharmacy.address_ru : pharmacy.address_ru || pharmacy.address_uz || "—"}
              </div>
              ${pharmacy.phone ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">📞 <a href="tel:${pharmacy.phone}" style="color:#3b82f6;">${pharmacy.phone}</a></div>` : ""}
              ${pharmacy.open_time && pharmacy.close_time ? `<div style="font-size: 12px; color: #666;">🕐 ${pharmacy.open_time} – ${pharmacy.close_time}</div>` : ""}
              <div style="font-size: 11px; color:#aaa; margin-top:6px;">slug: ${pharmacy.slug}</div>
            </div>
          `,
        },
        {
          preset: getMarkerColor(pharmacy.oson_status),
        }
      );

      collection.add(placemark);
    });

    geoObjects.add(collection);
  }, [pharmacies, language]);

  // Re-render markers when data or tab changes
  useEffect(() => {
    if (activeTab === "map" && mapInitialized.current && !isLoading) {
      renderMapMarkers();
    }
  }, [pharmacies, activeTab, isLoading, renderMapMarkers]);

  // Dark theme for map
  useEffect(() => {
    if (containerRef.current) {
      if (theme === "dark") {
        containerRef.current.classList.add("yandex-map-dark");
      } else {
        containerRef.current.classList.remove("yandex-map-dark");
      }
    }
  }, [theme]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <span className="text-gray-500 dark:text-gray-400">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Header />

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ─── Top bar ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex flex-col gap-3 shrink-0">
          {/* Title + tabs + sync button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  OSON Slug List
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {syncStatus.isSyncing || isSyncing ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Синхронизация...
                    </span>
                  ) : syncStatus.lastSyncAt ? (
                    `Обновлено: ${formatDateTime(syncStatus.lastSyncAt)}`
                  ) : stats.lastSyncedAt ? (
                    `Обновлено: ${formatDateTime(stats.lastSyncedAt)}`
                  ) : (
                    "Данные ещё не синхронизированы"
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Tabs */}
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setActiveTab("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                    activeTab === "list"
                      ? "bg-purple-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Список</span>
                </button>
                <button
                  onClick={() => setActiveTab("map")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l border-gray-200 dark:border-gray-700 ${
                    activeTab === "map"
                      ? "bg-purple-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Карта</span>
                </button>
              </div>

              {/* Sync button */}
              <Button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isSyncing || syncStatus.isSyncing}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSyncing || syncStatus.isSyncing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Обновить данные</span>
              </Button>
            </div>
          </div>

          {/* ─── Progress Bar (shown during sync) ───────────────────── */}
          {(isSyncing || syncStatus.isSyncing) && (
            <SyncProgressBar progress={syncProgress} />
          )}
          {/* ─── Stats cards ──────────────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap">
            <StatsCard
              label="Всего"
              value={stats.total}
              color="gray"
              onClick={() => setFilterStatus("all")}
              active={filterStatus === "all"}
            />
            <StatsCard
              label="Подключён"
              value={stats.connected}
              color="green"
              onClick={() =>
                setFilterStatus(filterStatus === "connected" ? "all" : "connected")
              }
              active={filterStatus === "connected"}
            />
            <StatsCard
              label="Не подключён"
              value={stats.not_connected}
              color="amber"
              onClick={() =>
                setFilterStatus(
                  filterStatus === "not_connected" ? "all" : "not_connected"
                )
              }
              active={filterStatus === "not_connected"}
            />
            <StatsCard
              label="Удалён"
              value={stats.deleted}
              color="red"
              onClick={() =>
                setFilterStatus(filterStatus === "deleted" ? "all" : "deleted")
              }
              active={filterStatus === "deleted"}
            />
          </div>

          {/* ─── Search + Filter row (list only) ─────────────────────── */}
          {activeTab === "list" && (
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по названию, slug, адресу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-100"
              />
            </div>

            <select
              value={filterParentRegion}
              onChange={(e) => {
                setFilterParentRegion(e.target.value);
                setFilterRegion("");
              }}
              className="px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 min-w-[140px]"
            >
              <option value="">Все города</option>
              {filterOptions.parentRegions.map((r) => (
                <option key={r.parent_region_ru} value={r.parent_region_ru}>
                  {language === "uz" ? r.parent_region_uz || r.parent_region_ru : r.parent_region_ru}
                </option>
              ))}
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 min-w-[140px]"
            >
              <option value="">Все районы</option>
              {filterOptions.regions.map((r) => (
                <option key={r.region_ru} value={r.region_ru}>
                  {language === "uz" ? r.region_uz || r.region_ru : r.region_ru}
                </option>
              ))}
            </select>
          </div>
          )}
        </div>

        {/* ─── Content area ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === "list" ? (
            <ListTab
              pharmacies={pharmacies}
              isLoading={isLoading}
              language={language}
            />
          ) : (
            <MapTab
              containerRef={containerRef}
              isLoading={isLoading}
              pharmacies={pharmacies}
              language={language}
              filterParentRegion={filterParentRegion}
              filterRegion={filterRegion}
              filterStatus={filterStatus}
              searchQuery={searchQuery}
              filterOptions={filterOptions}
              onFilterParentRegion={(v) => { setFilterParentRegion(v); setFilterRegion(""); }}
              onFilterRegion={(v) => setFilterRegion(v)}
              onFilterStatus={(v) => setFilterStatus(v)}
              onSearch={(v) => setSearchQuery(v)}
              stats={stats}
            />
          )}
        </div>
      </main>

      {/* ─── Confirm Dialog ──────────────────────────────────────────────── */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Обновить данные OSON?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет запущена синхронизация со всеми регионами OSON. Процесс
              может занять несколько минут. Данные в таблице будут обновлены
              автоматически.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSync}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Да, обновить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Stats Card Component ─────────────────────────────────────────────────────

function StatsCard({
  label,
  value,
  color,
  onClick,
  active,
}: {
  label: string;
  value: number;
  color: "gray" | "green" | "amber" | "red";
  onClick: () => void;
  active: boolean;
}) {
  const colorMap = {
    gray: active
      ? "bg-gray-200 dark:bg-gray-600 border-gray-400"
      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    green: active
      ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400"
      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    amber: active
      ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400"
      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    red: active
      ? "bg-red-100 dark:bg-red-900/40 border-red-400"
      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
  };

  const valueColorMap = {
    gray: "text-gray-700 dark:text-gray-200",
    green: "text-emerald-700 dark:text-emerald-400",
    amber: "text-amber-700 dark:text-amber-400",
    red: "text-red-700 dark:text-red-400",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all hover:shadow-sm ${colorMap[color]}`}
    >
      <span className={`font-bold text-base ${valueColorMap[color]}`}>
        {value.toLocaleString()}
      </span>
      <span className="text-gray-500 dark:text-gray-400 text-xs">{label}</span>
    </button>
  );
}

// ─── Sync Progress Bar Component ─────────────────────────────────────────────

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case "collecting": return "Сбор списка аптек из OSON...";
    case "syncing":    return "Синхронизация данных...";
    case "cleanup":   return "Очистка устаревших записей...";
    case "done":      return "Завершено";
    case "error":     return "Ошибка синхронизации";
    default:          return "Подготовка...";
  }
}

function SyncProgressBar({ progress }: { progress: OsonProgress }) {
  const { current, total, percent, phase } = progress;

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
          <RefreshCw className="h-3 w-3 animate-spin" />
          {getPhaseLabel(phase)}
        </span>
        <span className="font-bold text-amber-800 dark:text-amber-300">
          {total > 0 ? (
            <>{current.toLocaleString()} / {total.toLocaleString()} &nbsp;({percent}%)</>
          ) : (
            "Загрузка..."
          )}
        </span>
      </div>
      <div className="w-full bg-amber-200 dark:bg-amber-800/50 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-amber-500 dark:bg-amber-400 transition-all duration-500"
          style={{ width: `${Math.max(percent, total > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}
function ListTab({
  pharmacies,
  isLoading,
  language,
}: {
  pharmacies: OsonPharmacy[];
  isLoading: boolean;
  language: string;
}) {
  const [selectedPharmacy, setSelectedPharmacy] = useState<OsonPharmacy | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Загрузка данных...
          </span>
        </div>
      </div>
    );
  }

  if (pharmacies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400 dark:text-gray-500">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Аптеки не найдены</p>
          <p className="text-xs mt-1">Попробуйте изменить фильтры или запустить синхронизацию</p>
        </div>
      </div>
    );
  }

  const TH = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap";

  return (
    <div className="h-full overflow-auto">
      <table className="text-sm border-collapse" style={{ minWidth: "1900px", width: "100%" }}>
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className={`${TH} w-10 text-center`}>#</th>
            <th className={TH} style={{ minWidth: "180px" }}>Название</th>
            <th className={TH}>Статус</th>
            <th className={TH}>Город</th>
            <th className={TH}>Район</th>
            <th className={TH} style={{ minWidth: "180px" }}>Адрес</th>
            <th className={TH}>Телефон</th>
            <th className={TH}>Время работы</th>
            <th className={TH} style={{ width: "180px", maxWidth: "180px" }}>Slug</th>
            <th className={TH}>Доставка</th>
            <th className={TH}>Скидка</th>
            <th className={TH}>Кэшбэк</th>
            <th className={TH}>Верифицирован</th>
            <th className={TH} style={{ minWidth: "150px" }}>Ориентир</th>
            <th className={TH} style={{ minWidth: "130px" }}>Обновлено</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {pharmacies.map((pharmacy, index) => {
            const name =
              language === "uz"
                ? pharmacy.name_uz || pharmacy.name_ru
                : pharmacy.name_ru || pharmacy.name_uz;

            const city =
              language === "uz"
                ? pharmacy.parent_region_uz || pharmacy.parent_region_ru
                : pharmacy.parent_region_ru || pharmacy.parent_region_uz;

            const district =
              language === "uz"
                ? pharmacy.region_uz || pharmacy.region_ru
                : pharmacy.region_ru || pharmacy.region_uz;

            const address =
              language === "uz"
                ? pharmacy.address_uz || pharmacy.address_ru
                : pharmacy.address_ru || pharmacy.address_uz;

            const landmark =
              language === "uz"
                ? pharmacy.landmark_uz || pharmacy.landmark_ru
                : pharmacy.landmark_ru || pharmacy.landmark_uz;

            return (
              <tr
                key={pharmacy.id}
                onClick={() => setSelectedPharmacy(pharmacy)}
                className="hover:bg-purple-50/50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
              >
                {/* # Row number */}
                <td className="px-3 py-2.5 text-center text-xs text-gray-400 dark:text-gray-500 font-mono">
                  {index + 1}
                </td>

                {/* Name */}
                <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100 font-medium align-top" style={{ minWidth: "180px" }}>
                  <div className="break-words leading-snug" style={{ maxWidth: "220px" }}>
                    {name || "—"}
                  </div>
                </td>

                {/* Status */}
                <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pharmacy.oson_status)}`}
                  >
                    {getStatusIcon(pharmacy.oson_status)}
                    {getStatusLabel(pharmacy.oson_status, language)}
                  </span>
                </td>

                {/* City */}
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 text-xs align-middle whitespace-nowrap">
                  {city || "—"}
                </td>

                {/* District */}
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 text-xs align-middle whitespace-nowrap">
                  {district || "—"}
                </td>

                {/* Address */}
                <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs align-top" style={{ minWidth: "180px" }}>
                  <div className="break-words leading-snug" style={{ maxWidth: "220px" }}>
                    {address || "—"}
                  </div>
                </td>

                {/* Phone */}
                <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                  {pharmacy.phone ? (
                    <a
                      href={`tel:${pharmacy.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 text-xs"
                    >
                      <Phone className="h-3 w-3 shrink-0" />
                      {pharmacy.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>

                {/* Work hours */}
                <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs align-middle whitespace-nowrap">
                  {pharmacy.open_time && pharmacy.close_time ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {pharmacy.open_time.slice(0, 5)} – {pharmacy.close_time.slice(0, 5)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>

                {/* Slug — truncated with tooltip */}
                <td className="px-3 py-2.5 align-middle" style={{ maxWidth: "180px" }}>
                  <code
                    className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded block truncate"
                    title={pharmacy.slug}
                  >
                    {pharmacy.slug}
                  </code>
                </td>

                {/* Delivery */}
                <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                  {pharmacy.has_delivery ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
                      <Truck className="h-3 w-3" />
                      Есть
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Нет</span>
                  )}
                </td>

                {/* Скидка (Discount) */}
                <td className="px-3 py-2.5 text-xs align-middle text-center whitespace-nowrap">
                  {pharmacy.discount_percent > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                      {pharmacy.discount_percent}%
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* Кэшбэк (Cashback) */}
                <td className="px-3 py-2.5 text-xs align-middle text-center whitespace-nowrap">
                  {pharmacy.cashback_percent > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-medium">
                      {pharmacy.cashback_percent}%
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* Верифицирован (Verified) */}
                <td className="px-3 py-2.5 text-xs align-middle text-center whitespace-nowrap">
                  {pharmacy.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Да
                    </span>
                  ) : (
                    <span className="text-gray-400">Нет</span>
                  )}
                </td>

                {/* Ориентир (Landmark) */}
                <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs align-top" style={{ minWidth: "150px" }}>
                  <div className="break-words leading-snug" style={{ maxWidth: "200px" }}>
                    {landmark || "—"}
                  </div>
                </td>

                {/* Last synced */}
                <td className="px-3 py-2.5 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {formatDateTime(pharmacy.last_synced_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-400 flex justify-between items-center">
        <span>Показано {pharmacies.length.toLocaleString()} аптек</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Подключён
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Не подключён
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Удалён
          </span>
        </div>
      </div>

      {/* Detail Modal */}
      <PharmacyDetailModal
        pharmacy={selectedPharmacy}
        language={language}
        onClose={() => setSelectedPharmacy(null)}
      />
    </div>
  );
}

// ─── Map Tab ──────────────────────────────────────────────────────────────────

function MapTab({
  containerRef,
  isLoading,
  pharmacies,
  language,
  filterParentRegion,
  filterRegion,
  filterStatus,
  searchQuery,
  filterOptions,
  onFilterParentRegion,
  onFilterRegion,
  onFilterStatus,
  onSearch,
  stats,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  pharmacies: OsonPharmacy[];
  language: string;
  filterParentRegion: string;
  filterRegion: string;
  filterStatus: OsonStatus | "all";
  searchQuery: string;
  filterOptions: OsonFilterOptions;
  onFilterParentRegion: (v: string) => void;
  onFilterRegion: (v: string) => void;
  onFilterStatus: (v: OsonStatus | "all") => void;
  onSearch: (v: string) => void;
  stats: OsonStats;
}) {
  const mapCount = pharmacies.filter(
    (p) => p.oson_status === "connected" || p.oson_status === "not_connected"
  ).length;

  return (
    <div className="relative h-full">
      {/* Yandex Map container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-20 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Загрузка карты...</span>
          </div>
        </div>
      )}

      {/* ─── Left filter panel (overlay on map) ─────────────────────────── */}
      {!isLoading && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-64">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur text-gray-800 dark:text-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* City filter */}
          <select
            value={filterParentRegion}
            onChange={(e) => onFilterParentRegion(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur text-gray-800 dark:text-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Все города</option>
            {filterOptions.parentRegions.map((r) => (
              <option key={r.parent_region_ru} value={r.parent_region_ru}>
                {language === "uz" ? r.parent_region_uz || r.parent_region_ru : r.parent_region_ru}
              </option>
            ))}
          </select>

          {/* District filter */}
          <select
            value={filterRegion}
            onChange={(e) => onFilterRegion(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur text-gray-800 dark:text-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Все районы</option>
            {filterOptions.regions.map((r) => (
              <option key={r.region_ru} value={r.region_ru}>
                {language === "uz" ? r.region_uz || r.region_ru : r.region_ru}
              </option>
            ))}
          </select>

          {/* Status filter chips */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-600 shadow-md p-2 flex flex-col gap-1">
            {(
              [
                { value: "all", label: `Все (${stats.total})`, dot: "bg-gray-400" },
                { value: "connected", label: `Подключён (${stats.connected})`, dot: "bg-emerald-500" },
                { value: "not_connected", label: `Не подключён (${stats.not_connected})`, dot: "bg-amber-500" },
              ] as { value: OsonStatus | "all"; label: string; dot: string }[]
            ).map(({ value, label, dot }) => (
              <button
                key={value}
                onClick={() => onFilterStatus(value)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                  filterStatus === value
                    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${dot}`} />
                {label}
              </button>
            ))}
          </div>

          {/* Map count */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 shadow border border-gray-200 dark:border-gray-600 text-center">
            На карте: <span className="font-semibold text-gray-700 dark:text-gray-200">{mapCount.toLocaleString()}</span> аптек
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pharmacy Detail Modal ────────────────────────────────────────────────────

function PharmacyDetailModal({
  pharmacy,
  language,
  onClose,
}: {
  pharmacy: OsonPharmacy | null;
  language: string;
  onClose: () => void;
}) {
  if (!pharmacy) return null;

  const name =
    language === "uz"
      ? pharmacy.name_uz || pharmacy.name_ru
      : pharmacy.name_ru || pharmacy.name_uz;

  const city =
    language === "uz"
      ? pharmacy.parent_region_uz || pharmacy.parent_region_ru
      : pharmacy.parent_region_ru || pharmacy.parent_region_uz;

  const district =
    language === "uz"
      ? pharmacy.region_uz || pharmacy.region_ru
      : pharmacy.region_ru || pharmacy.region_uz;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "ID", value: pharmacy.id },
    {
      label: "Статус",
      value: (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pharmacy.oson_status)}`}>
          {getStatusIcon(pharmacy.oson_status)}
          {getStatusLabel(pharmacy.oson_status, language)}
        </span>
      ),
    },
    { label: "Название (RU)", value: pharmacy.name_ru || "—" },
    { label: "Название (UZ)", value: pharmacy.name_uz || "—" },
    {
      label: "Slug",
      value: (
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded" style={{ wordBreak: "break-all" }}>
          {pharmacy.slug}
        </code>
      ),
    },
    { label: "Город", value: city || "—" },
    { label: "Район", value: district || "—" },
    { label: "Адрес (RU)", value: pharmacy.address_ru || "—" },
    { label: "Адрес (UZ)", value: pharmacy.address_uz || "—" },
    { label: "Ориентир (RU)", value: pharmacy.landmark_ru || "—" },
    { label: "Ориентир (UZ)", value: pharmacy.landmark_uz || "—" },
    {
      label: "Телефон",
      value: pharmacy.phone ? (
        <a href={`tel:${pharmacy.phone}`} className="text-purple-600 dark:text-purple-400 hover:underline">
          {pharmacy.phone}
        </a>
      ) : "—",
    },
    {
      label: "Время работы",
      value: pharmacy.open_time && pharmacy.close_time
        ? `${pharmacy.open_time.slice(0, 5)} – ${pharmacy.close_time.slice(0, 5)}`
        : "—",
    },
    {
      label: "Доставка",
      value: pharmacy.has_delivery ? (
        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Есть</span>
      ) : (
        <span className="text-gray-400">Нет</span>
      ),
    },
    {
      label: "Скидка",
      value: pharmacy.discount_percent > 0
        ? <span className="text-blue-600 dark:text-blue-400 font-medium">{pharmacy.discount_percent}%</span>
        : "—",
    },
    {
      label: "Кэшбэк",
      value: pharmacy.cashback_percent > 0
        ? <span className="text-teal-600 dark:text-teal-400 font-medium">{pharmacy.cashback_percent}%</span>
        : "—",
    },
    {
      label: "Верифицирован",
      value: pharmacy.is_verified ? (
        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Да</span>
      ) : (
        <span className="text-gray-400">Нет</span>
      ),
    },
    {
      label: "Координаты",
      value: pharmacy.latitude && pharmacy.longitude
        ? `${pharmacy.latitude}, ${pharmacy.longitude}`
        : "—",
    },
    { label: "Последняя синхронизация", value: formatDateTime(pharmacy.last_synced_at) },
    { label: "Дата создания", value: formatDateTime(pharmacy.created_at) },
  ];

  return (
    <Dialog open={!!pharmacy} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-purple-600" />
            {name || "Аптека"}
          </DialogTitle>
        </DialogHeader>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 -mx-2">
          {rows.map(({ label, value }, i) => (
            <div key={i} className="flex gap-3 px-2 py-2.5 text-sm">
              <span className="w-44 shrink-0 text-gray-500 dark:text-gray-400 text-xs font-medium">
                {label}
              </span>
              <span className="text-gray-900 dark:text-gray-100 text-xs break-words min-w-0">
                {value}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
