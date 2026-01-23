// PharmacyTable component
import { Pharmacy } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, RefreshCw, Settings, Square, CheckSquare } from "lucide-react";

interface PharmacyTableProps {
  pharmacies: Pharmacy[];
  isLoading: boolean;
  isAdmin?: boolean;
  activeFilter: boolean | null;
  onFilterChange: (active: boolean | null) => void;
  telegramBotFilter: boolean | null;
  onTelegramBotFilterChange: (value: boolean | null) => void;
  brandedPacketFilter: boolean | null;
  onBrandedPacketFilterChange: (value: boolean | null) => void;
  trainingFilter: boolean | null;
  onTrainingFilterChange: (value: boolean | null) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onPharmacyClick?: (pharmacy: Pharmacy) => void;
  onRefresh?: () => void;
  leadStatusFilter?: string | null;
  onLeadStatusFilterChange?: (value: string | null) => void;
  leadStatusOptions?: string[];
  showComments?: boolean;
  commentUserFilter?: string | null;
  onCommentUserFilterChange?: (value: string | null) => void;
  commentUserOptions?: string[];
  commentDateFilter?: { from: string | null; to: string | null };
  onCommentDateFilterChange?: (value: { from: string | null; to: string | null }) => void;
  // Leads page specific props
  isLeadsPage?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  onSettingsClick?: () => void;
}

export function PharmacyTable({
  pharmacies,
  isLoading,
  isAdmin = false,
  activeFilter,
  onFilterChange,
  telegramBotFilter,
  onTelegramBotFilterChange,
  brandedPacketFilter,
  onBrandedPacketFilterChange,
  trainingFilter,
  onTrainingFilterChange,
  searchQuery = "",
  onSearchChange,
  onPharmacyClick,
  onRefresh,
  leadStatusFilter,
  onLeadStatusFilterChange,
  leadStatusOptions = [],
  showComments = false,
  commentUserFilter,
  onCommentUserFilterChange,
  commentUserOptions = [],
  commentDateFilter,
  onCommentDateFilterChange,
  isLeadsPage = false,
  selectedRows = new Set(),
  onSelectionChange,
  onSettingsClick,
}: PharmacyTableProps) {
  const { t } = useLanguage();

  const handleDateFilterChange = (type: "from" | "to", value: string) => {
    if (onCommentDateFilterChange && commentDateFilter) {
      onCommentDateFilterChange({
        ...commentDateFilter,
        [type]: value || null
      })
    }
  }

  // ... handlers ...

  const getLastComment = (comments: any[]) => {
    if (!comments || !Array.isArray(comments) || comments.length === 0) return null;

    // Sort by createdAt descending
    const sorted = [...comments].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending
    });

    return sorted[0];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", { // Or dynamic locale
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFilterChange = (
    value: string,
    setter: (val: boolean | null) => void,
  ) => {
    if (value === "true") {
      setter(true);
    } else if (value === "false") {
      setter(false);
    } else {
      setter(null);
    }
  };

  const handleStringFilterChange = (
    value: string,
    setter?: (val: string | null) => void,
  ) => {
    if (!setter) return;
    if (value === "null") {
      setter(null);
    } else {
      setter(value);
    }
  };

  const getStatusText = (value: boolean) => {
    return value ? t.yes : t.no;
  };

  const getTrainingStatusText = (value: boolean) => {
    return value ? t.yesTraining : t.noTraining;
  };

  const getTelegramBotStatus = (marketChats: any[]) => {
    const hasChat =
      marketChats && Array.isArray(marketChats) && marketChats.length > 0;
    return hasChat ? t.yes : t.no;
  };

  const getTelegramBotDetails = (marketChats: any[]) => {
    if (
      !marketChats ||
      !Array.isArray(marketChats) ||
      marketChats.length === 0
    ) {
      return null;
    }
    return marketChats[0];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Input
            type="text"
            placeholder={`${t.pharmacyName} / ${t.address}...`}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full sm:max-w-md"
            disabled
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled>
                {t.filter}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-center py-8">
          <span className="text-gray-500">{t.loadingPharmacies}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 space-y-4 sticky top-[82px] z-30 bg-gray-50">
      {isLeadsPage ? (
        // Leads page layout
        <div className="space-y-4">
          {/* First row: Selection buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedRows && selectedRows.size === 0) {
                  // Select all
                  const allIds = new Set(pharmacies.map(p => p.id));
                  onSelectionChange?.(allIds);
                } else {
                  // Clear selection
                  onSelectionChange?.(new Set());
                }
              }}
              className="whitespace-nowrap"
            >
              {selectedRows && selectedRows.size > 0 ? t.clearSelection : t.select}
            </Button>
            {selectedRows && selectedRows.size > 0 && (
              <span className="text-sm text-gray-600 flex items-center">
                {t.selected}: {selectedRows.size}
              </span>
            )}
          </div>

          {/* Second row: Centered search with action buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Centered Search field */}
            <Input
              type="text"
              placeholder={`${t.pharmacyName} / ${t.address}...`}
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="max-w-md"
            />

            {/* Action buttons: Refresh, Filter, Settings */}
            <div className="flex gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {t.filter}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={
                      activeFilter === true
                        ? "true"
                        : activeFilter === false
                          ? "false"
                          : "null"
                    }
                    onValueChange={(val) => handleFilterChange(val, onFilterChange)}
                  >
                    <DropdownMenuRadioItem value="null">
                      {t.allPharmacies}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="true"
                      className="bg-emerald-100 text-emerald-800 focus:bg-emerald-200 focus:text-emerald-900 m-1 cursor-pointer"
                    >
                      {t.active}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="false"
                      className="bg-red-100 text-red-800 focus:bg-red-200 focus:text-red-900 m-1 cursor-pointer"
                    >
                      {t.inactive}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onSettingsClick}>
                    {t.columnSettings}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ) : (
        // Original layout for other pages
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
          <Input
            type="text"
            placeholder={`${t.pharmacyName} / ${t.address}...`}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full sm:max-w-md"
          />
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {t.filter}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={
                    activeFilter === true
                      ? "true"
                      : activeFilter === false
                        ? "false"
                        : "null"
                  }
                  onValueChange={(val) => handleFilterChange(val, onFilterChange)}
                >
                  <DropdownMenuRadioItem value="null">
                    {t.allPharmacies}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="true"
                    className="bg-emerald-100 text-emerald-800 focus:bg-emerald-200 focus:text-emerald-900 m-1 cursor-pointer"
                  >
                    {t.active}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="false"
                    className="bg-red-100 text-red-800 focus:bg-red-200 focus:text-red-900 m-1 cursor-pointer"
                  >
                    {t.inactive}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <div
        className="border rounded-md bg-white shadow-sm overflow-auto"
        style={{ maxHeight: "calc(100vh - 100px)" }}
      >
        <table className="w-full text-xs md:text-sm relative">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-40 bg-white shadow-sm">
            <tr>
              <th
                className="px-2 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                style={{ width: "50px" }}
              >
                {t.number}
              </th>
              {isLeadsPage && (
                <th
                  className="px-2 py-2 md:py-3 text-center font-semibold text-gray-700"
                  style={{ width: "40px" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows?.size === pharmacies.length && pharmacies.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectionChange?.(new Set(pharmacies.map(p => p.id)));
                      } else {
                        onSelectionChange?.(new Set());
                      }
                    }}
                    className="cursor-pointer"
                  />
                </th>
              )}
              <th
                className="px-2 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                style={{ width: "100px" }}
              >
                {t.code}
              </th>
              <th
                className="px-2 py-2 md:py-3 text-left font-semibold text-gray-700"
                style={{ width: "150px", minWidth: "150px" }}
              >
                <div className="break-words">{t.pharmacyName}</div>
              </th>
              <th
                className="px-2 py-2 md:py-3 text-left font-semibold text-gray-700"
                style={{ width: "170px", minWidth: "170px" }}
              >
                <div className="break-words">{t.address}</div>
              </th>
              <th
                className="px-2 py-2 md:py-3 text-left font-semibold text-gray-700"
                style={{ width: "130px", minWidth: "130px" }}
              >
                <div className="break-words">{t.landmark}</div>
              </th>
              <th
                className="px-2 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                style={{ width: "110px" }}
              >
                {t.pharmacyPhone}
              </th>
              <th
                className="px-2 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                style={{ width: "110px" }}
              >
                {t.leadPhone}
              </th>

              <th className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold text-gray-700 whitespace-nowrap min-w-max">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-purple-600 data-[state=open]:text-white"
                    >
                      <span>{t.telegramBot}</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={
                        telegramBotFilter === true
                          ? "true"
                          : telegramBotFilter === false
                            ? "false"
                            : "null"
                      }
                      onValueChange={(val) =>
                        handleFilterChange(val, onTelegramBotFilterChange)
                      }
                    >
                      <DropdownMenuRadioItem value="null">
                        {t.allPharmacies}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="true"
                        className="bg-emerald-100 text-emerald-800 focus:bg-emerald-200 focus:text-emerald-900 m-1 cursor-pointer"
                      >
                        {t.yes}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="false"
                        className="bg-red-100 text-red-800 focus:bg-red-200 focus:text-red-900 m-1 cursor-pointer"
                      >
                        {t.no}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold text-gray-700 whitespace-nowrap min-w-max">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-purple-600 data-[state=open]:text-white"
                    >
                      <span>{t.training}</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={
                        trainingFilter === true
                          ? "true"
                          : trainingFilter === false
                            ? "false"
                            : "null"
                      }
                      onValueChange={(val) =>
                        handleFilterChange(val, onTrainingFilterChange)
                      }
                    >
                      <DropdownMenuRadioItem value="null">
                        {t.allPharmacies}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="true"
                        className="bg-emerald-100 text-emerald-800 focus:bg-emerald-200 focus:text-emerald-900 m-1 cursor-pointer"
                      >
                        {t.yes}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="false"
                        className="bg-red-100 text-red-800 focus:bg-red-200 focus:text-red-900 m-1 cursor-pointer"
                      >
                        {t.no}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-center font-semibold text-gray-700 whitespace-nowrap min-w-max">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-purple-600 data-[state=open]:text-white"
                    >
                      <span>{t.brandedPacket}</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={
                        brandedPacketFilter === true
                          ? "true"
                          : brandedPacketFilter === false
                            ? "false"
                            : "null"
                      }
                      onValueChange={(val) =>
                        handleFilterChange(val, onBrandedPacketFilterChange)
                      }
                    >
                      <DropdownMenuRadioItem value="null">
                        {t.allPharmacies}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="true"
                        className="bg-emerald-100 text-emerald-800 focus:bg-emerald-200 focus:text-emerald-900 m-1 cursor-pointer"
                      >
                        {t.yes}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="false"
                        className="bg-red-100 text-red-800 focus:bg-red-200 focus:text-red-900 m-1 cursor-pointer"
                      >
                        {t.no}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-max">
                {t.status}
              </th>
              {isAdmin && (
                <>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-max">
                    {onLeadStatusFilterChange && leadStatusOptions && leadStatusOptions.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8 data-[state=open]:bg-purple-600 data-[state=open]:text-white"
                          >
                            <span>{t.leadStatus}</span>
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuRadioGroup
                            value={leadStatusFilter || "null"}
                            onValueChange={(val) =>
                              handleStringFilterChange(val, onLeadStatusFilterChange)
                            }
                          >
                            <DropdownMenuRadioItem value="null">
                              {t.all || "Все"}
                            </DropdownMenuRadioItem>
                            {leadStatusOptions.map((status) => (
                              <DropdownMenuRadioItem
                                key={status}
                                value={status}
                                className="cursor-pointer"
                              >
                                {status}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      t.leadStatus
                    )}
                  </th>

                  {/* New Comment Headers */}
                  {showComments && (
                    <>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-max">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="-ml-3 h-8 data-[state=open]:bg-purple-600 data-[state=open]:text-white"
                            >
                              <div className="flex flex-col items-start">
                                <span>{t.lastCommentDate || "Дата"}</span>
                                <span className="text-[10px] font-normal text-gray-500">Lead</span>
                              </div>
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64 p-4" align="start">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t.dateFrom}</label>
                                <Input
                                  type="date"
                                  value={commentDateFilter?.from || ""}
                                  onChange={(e) => handleDateFilterChange("from", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t.dateTo}</label>
                                <Input
                                  type="date"
                                  value={commentDateFilter?.to || ""}
                                  onChange={(e) => handleDateFilterChange("to", e.target.value)}
                                />
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-max">
                        {onCommentUserFilterChange && commentUserOptions && commentUserOptions.length > 0 ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="-ml-3 h-8 data-[state=open]:bg-purple-600 data-[state=open]:text-white"
                              >
                                <div className="flex flex-col items-start">
                                  <span>{t.lastCommentUser || "Автор"}</span>
                                  <span className="text-[10px] font-normal text-gray-500">Lead</span>
                                </div>
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuRadioGroup
                                value={commentUserFilter || "null"}
                                onValueChange={(val) =>
                                  handleStringFilterChange(val, onCommentUserFilterChange)
                                }
                              >
                                <DropdownMenuRadioItem value="null">
                                  {t.all || "Все"}
                                </DropdownMenuRadioItem>
                                {commentUserOptions.map((user) => (
                                  <DropdownMenuRadioItem
                                    key={user}
                                    value={user}
                                    className="cursor-pointer"
                                  >
                                    {user}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <div className="flex flex-col items-start">
                            <span>{t.lastCommentUser || "Автор"}</span>
                            <span className="text-[10px] font-normal text-gray-500">Lead</span>
                          </div>
                        )}
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">
                        <div className="flex flex-col items-start">
                          <span>{t.lastComment || "Коммент"}</span>
                          <span className="text-[10px] font-normal text-gray-500">Lead</span>
                        </div>
                      </th>
                    </>
                  )}
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-max">
                    {t.stir}
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-max">
                    <div className="flex flex-col items-start">
                      <span>{t.additionalPhone}</span>
                      <span className="text-[10px] font-normal text-gray-500">Lead</span>
                    </div>
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-[180px]">
                    {t.juridicalName}
                  </th>
                  <th
                    className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700"
                    style={{ width: "200px", minWidth: "200px" }}
                  >
                    <div className="break-words">{t.juridicalAddress}</div>
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">
                    {t.bankName}
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">
                    {t.bankAccount}
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-max">
                    {t.mfo}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pharmacies.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 20 : 11}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {t.noData}
                </td>
              </tr>
            ) : (
              pharmacies.map((pharmacy, index) => {
                const marketChats = pharmacy.marketChats;
                const telegramBotDetails = getTelegramBotDetails(marketChats);
                const hasTelegramBot =
                  marketChats && Array.isArray(marketChats) && marketChats.length > 0;
                const telegramBotCount = hasTelegramBot ? marketChats.length : 0;

                return (
                  <tr
                    key={pharmacy.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 py-2 md:py-3 text-gray-900 font-medium whitespace-nowrap align-top">
                      {index + 1}
                    </td>
                    {isLeadsPage && (
                      <td className="px-2 py-2 md:py-3 text-center align-top">
                        <input
                          type="checkbox"
                          checked={selectedRows?.has(pharmacy.id) || false}
                          onChange={(e) => {
                            const newSelection = new Set(selectedRows);
                            if (e.target.checked) {
                              newSelection.add(pharmacy.id);
                            } else {
                              newSelection.delete(pharmacy.id);
                            }
                            onSelectionChange?.(newSelection);
                          }}
                          className="cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-2 py-2 md:py-3 text-gray-900 whitespace-nowrap align-top">
                      <button
                        onClick={() => onPharmacyClick?.(pharmacy)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                      >
                        {pharmacy.code}
                      </button>
                    </td>
                    <td className="px-2 py-2 md:py-3 text-gray-900 font-medium align-top">
                      <div
                        className="break-words overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          lineHeight: "1.4em",
                          minHeight: "4.2em",
                        }}
                      >
                        {pharmacy.name}
                      </div>
                    </td>
                    <td className="px-2 py-2 md:py-3 text-gray-600 align-top">
                      <div
                        className="break-words overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          lineHeight: "1.4em",
                          minHeight: "4.2em",
                        }}
                      >
                        {pharmacy.address}
                      </div>
                    </td>
                    <td className="px-2 py-2 md:py-3 text-gray-600 align-top">
                      <div
                        className="break-words"
                        style={{ lineHeight: "1.4em", minHeight: "4.2em" }}
                      >
                        {(pharmacy as any).landmark || "-"}
                      </div>
                    </td>
                    <td className="px-2 py-2 md:py-3 text-gray-900 whitespace-nowrap align-top">
                      {pharmacy.phone || "-"}
                    </td>
                    <td className="px-2 py-2 md:py-3 text-gray-900 whitespace-nowrap align-top">
                      {pharmacy.lead?.phone || "-"}
                    </td>

                    <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                      <div
                        className={`font-bold text-xs px-2 py-1 rounded inline-block whitespace-nowrap ${hasTelegramBot
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {getTelegramBotStatus(marketChats)}
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold inline-block whitespace-nowrap ${(pharmacy as any).training
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {getTrainingStatusText((pharmacy as any).training)}
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold inline-block whitespace-nowrap ${(pharmacy as any).brandedPacket
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {getStatusText((pharmacy as any).brandedPacket)}
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap inline-block ${pharmacy.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {pharmacy.active ? t.active : t.inactive}
                      </span>
                    </td>
                    {isAdmin && (
                      <>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-gray-900 text-xs">
                          {pharmacy.lead?.status || "-"}
                        </td>

                        {/* New Comment Columns */}
                        {showComments && (
                          <>
                            {/* Date Column: Just Date */}
                            <td className="px-2 md:px-4 py-2 md:py-3 text-gray-900 text-xs whitespace-nowrap align-middle">
                              {(() => {
                                const last = getLastComment(pharmacy.comments || []);
                                if (!last) return "-";
                                return (
                                  <span className="font-semibold">{formatDate(last.createdAt)}</span>
                                );
                              })()}
                            </td>
                            {/* Author Column: Just Phone/Name */}
                            <td className="px-2 md:px-4 py-2 md:py-3 text-gray-900 text-xs whitespace-nowrap align-middle">
                              {(() => {
                                const last = getLastComment(pharmacy.comments || []);
                                if (!last) return "-";
                                return (
                                  <span className="text-gray-500 text-xs">{last.creator?.phone || "-"}</span>
                                );
                              })()}
                            </td>
                            {/* Comment Text Column */}
                            <td className="px-2 md:px-4 py-2 md:py-3 text-gray-900 text-xs align-middle">
                              <div className="max-w-[200px] break-words">
                                {getLastComment(pharmacy.comments || [])?.coment || getLastComment(pharmacy.comments || [])?.comment || "-"}
                              </div>
                            </td>
                          </>
                        )}

                        <td className="px-2 md:px-4 py-2 md:py-3 text-gray-900 text-xs whitespace-nowrap">
                          {(pharmacy.lead as any)?.stir || "-"}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-gray-900 text-xs whitespace-nowrap">
                          {(pharmacy.lead as any)?.additionalPhone || "-"}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600 text-xs max-w-xs truncate">
                          {(pharmacy.lead as any)?.juridicalName || "-"}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600 text-xs align-top">
                          <div
                            className="break-words"
                            style={{ lineHeight: "1.4em", minHeight: "4.2em" }}
                          >
                            {(pharmacy.lead as any)?.juridicalAddress || "-"}
                          </div>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600 text-xs max-w-xs truncate">
                          {(pharmacy.lead as any)?.bankName || "-"}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-gray-900 text-xs font-mono whitespace-nowrap">
                          {(pharmacy.lead as any)?.bankAccount || "-"}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-gray-900 text-xs whitespace-nowrap">
                          {(pharmacy.lead as any)?.mfo || "-"}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div >
    </div >
  );
}
