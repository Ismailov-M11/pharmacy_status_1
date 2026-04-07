import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchNotifications,
  fetchCampaigns,
  createCampaign,
  extractNotifications,
  extractNotificationTotal,
  extractCampaigns,
  extractCampaignTotal,
  Notification,
  Campaign,
} from "@/lib/notificationApi";

const PAGE_SIZE = 20;

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-gray-400">—</span>;

  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: {
      label: "Активен",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    INACTIVE: {
      label: "Неактивен",
      className:
        "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    },
    SENT: {
      label: "Отправлен",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    PENDING: {
      label: "В ожидании",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    },
    FAILED: {
      label: "Ошибка",
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
    DRAFT: {
      label: "Черновик",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    },
  };

  const config = map[status.toUpperCase()] ?? {
    label: status,
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ─── Format date ──────────────────────────────────────────────────────────────

function formatDate(str?: string): string {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return str;
  }
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

function PaginationBar({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Страница {page + 1} из {totalPages} · всего {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
      <AlertCircle className="h-10 w-10 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Create Campaign Modal ─────────────────────────────────────────────────────

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  token: string;
}

function CreateCampaignModal({
  open,
  onClose,
  onCreated,
  token,
}: CreateCampaignModalProps) {
  const [form, setForm] = useState({
    title: "",
    titleRu: "",
    body: "",
    bodyRu: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.titleRu.trim()) {
      toast.error("Заполните заголовок на обоих языках");
      return;
    }
    if (!form.body.trim() || !form.bodyRu.trim()) {
      toast.error("Заполните текст уведомления на обоих языках");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCampaign(token, {
        type: "IN_APP",
        title: form.title,
        titleRu: form.titleRu,
        body: form.body,
        bodyRu: form.bodyRu,
        source: "HAMBI",
      });
      toast.success("Кампания успешно создана");
      setForm({ title: "", titleRu: "", body: "", bodyRu: "" });
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(`Ошибка при создании: ${err?.message ?? "Неизвестная ошибка"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setForm({ title: "", titleRu: "", body: "", bodyRu: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Создать кампанию
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Badges row */}
          <div className="flex gap-2">
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0 text-xs">
              IN_APP
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0 text-xs">
              HAMBI
            </Badge>
          </div>

          {/* Title UZ */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Заголовок (UZ)
            </label>
            <Input
              placeholder="Sarlavha..."
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Title RU */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Заголовок (RU)
            </label>
            <Input
              placeholder="Заголовок..."
              value={form.titleRu}
              onChange={(e) => handleChange("titleRu", e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Body UZ */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Текст уведомления (UZ)
            </label>
            <textarea
              placeholder="Xabar matni..."
              value={form.body}
              onChange={(e) => handleChange("body", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Body RU */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Текст уведомления (RU)
            </label>
            <textarea
              placeholder="Текст сообщения..."
              value={form.bodyRu}
              onChange={(e) => handleChange("bodyRu", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="dark:border-gray-600 dark:text-gray-300"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab({ token }: { token: string }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, s: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchNotifications(token, {
          page: p,
          size: PAGE_SIZE,
          searchKey: s || undefined,
        });
        setItems(extractNotifications(data));
        setTotal(extractNotificationTotal(data));
      } catch (err: any) {
        setError(err?.message ?? "Ошибка загрузки");
        toast.error("Не удалось загрузить уведомления");
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(page, search);
  }, [page, search, load]);

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div>
      {/* Search bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск уведомлений..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSearch}
          className="dark:border-gray-700 dark:text-gray-300"
        >
          Найти
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => load(page, search)}
          className="text-gray-500 dark:text-gray-400 hover:text-purple-600"
          title="Обновить"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 w-14">
                  №
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                  Заголовок
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Текст
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                  Статус
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Источник
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <SkeletonRows cols={6} />
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-3 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message="Нет уведомлений за выбранный период" />
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.id ?? idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                      <div className="max-w-[200px] truncate">
                        {item.titleRu || item.title || "—"}
                      </div>
                      {item.titleRu && item.title && item.title !== item.titleRu && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                          {item.title}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      <div className="max-w-[280px] truncate">
                        {item.bodyRu || item.body || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      {item.source || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell text-xs">
                      {formatDate(item.createdAt || item.sentAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignsTab({
  token,
  onCreateClick,
  refreshKey,
}: {
  token: string;
  onCreateClick: () => void;
  refreshKey: number;
}) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, s: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCampaigns(token, {
          page: p,
          size: PAGE_SIZE,
          searchKey: s || undefined,
        });
        setItems(extractCampaigns(data));
        setTotal(extractCampaignTotal(data));
      } catch (err: any) {
        setError(err?.message ?? "Ошибка загрузки");
        toast.error("Не удалось загрузить кампании");
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(page, search);
  }, [page, search, load, refreshKey]);

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск кампаний..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSearch}
          className="dark:border-gray-700 dark:text-gray-300"
        >
          Найти
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => load(page, search)}
          className="text-gray-500 dark:text-gray-400 hover:text-purple-600"
          title="Обновить"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <div className="flex-1" />
        <Button
          onClick={onCreateClick}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Создать кампанию</span>
          <span className="sm:hidden">Создать</span>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 w-12">
                  №
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                  Заголовок / Текст
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                  Статус
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Тип
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Всего
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Успешно
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Ошибок
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                  TG
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                  Mobile
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                  Создал
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <SkeletonRows cols={11} />
              ) : error ? (
                <tr>
                  <td colSpan={11} className="px-4 py-3 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState message="Нет кампаний" />
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.id ?? idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100 max-w-[220px] truncate">
                        {item.titleRu || item.title || "—"}
                      </div>
                      {item.titleRu && item.title && item.title !== item.titleRu && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 max-w-[220px] truncate">
                          {item.title}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px] truncate mt-0.5">
                        {item.bodyRu || item.body || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {item.type || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.totalCount ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {item.successCount ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className={`font-semibold ${(item.failCount ?? 0) > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
                        {item.failCount ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden xl:table-cell text-gray-600 dark:text-gray-400">
                      {item.tgCount ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center hidden xl:table-cell text-gray-600 dark:text-gray-400">
                      {item.mobileCount ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-gray-500 dark:text-gray-400 text-xs">
                      {item.createdBy || "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(item.creationDate || item.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationCenter() {
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [campaignRefreshKey, setCampaignRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <span className="text-gray-500">{t.loading}</span>
      </div>
    );
  }

  if (!token) return null;

  const handleCampaignCreated = () => {
    setCampaignRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900">
              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Центр уведомлений
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Управление уведомлениями и рекламными кампаниями
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <TabsTrigger
              value="notifications"
              className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300"
            >
              <Bell className="h-4 w-4" />
              Уведомления
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300"
            >
              <Megaphone className="h-4 w-4" />
              Кампании
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 md:p-6">
              <NotificationsTab token={token} />
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 md:p-6">
              <CampaignsTab
                token={token}
                onCreateClick={() => setIsCreateModalOpen(true)}
                refreshKey={campaignRefreshKey}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <CreateCampaignModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCampaignCreated}
        token={token}
      />
    </div>
  );
}
