import { useState, useEffect } from "react";
import { Pharmacy, StatusHistoryRecord } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChangeHistory } from "./ChangeHistory";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface PharmacyDetailModalProps {
  pharmacy: Pharmacy | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    pharmacyId: number,
    field: "brandedPacket" | "training",
    value: boolean,
    comment: string,
  ) => Promise<void>;
  isAdmin?: boolean;
  currentUsername?: string;
  changeHistory?: StatusHistoryRecord[];
  onDeleteHistory?: (ids: number[]) => void;
  onUpdate?: () => void; // Added matching the usage in LeadsPanel
}

export function PharmacyDetailModal({
  pharmacy,
  isOpen,
  onClose,
  onUpdateStatus,
  isAdmin = false,
  currentUsername = "User",
  changeHistory = [],
  onDeleteHistory,
}: PharmacyDetailModalProps) {
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "training" | "package" | "history" | "leadHistory"
  >("details");
  const [trainingComment, setTrainingComment] = useState("");
  const [packageComment, setPackageComment] = useState("");
  const [trainingError, setTrainingError] = useState("");

  const [packageError, setPackageError] = useState("");
  const [pendingTraining, setPendingTraining] = useState<boolean | null>(null);
  const [pendingPacket, setPendingPacket] = useState<boolean | null>(null);

  // Reset to details tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
    }
  }, [isOpen]);

  // Reset pending state when pharmacy changes or tab changes
  if (pharmacy && pendingTraining === null && activeTab === 'training') {
    setPendingTraining((pharmacy as any).training);
  }
  if (pharmacy && pendingPacket === null && activeTab === 'package') {
    setPendingPacket((pharmacy as any).brandedPacket);
  }

  if (!pharmacy) return null;

  const handleStatusChange = async (
    field: "brandedPacket" | "training",
    newValue: boolean,
    comment: string,
    setError: (err: string) => void,
  ) => {
    if (!comment.trim()) {
      setError(t.commentRequired || "Comment is required");
      return;
    }

    setError("");
    setIsUpdating(true);

    try {
      await onUpdateStatus(pharmacy.id, field, newValue, comment);

      if (field === "training") {
        setTrainingComment("");
      } else {
        setPackageComment("");
      }

      toast.success(t.saved);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(t.error);
    } finally {
      setIsUpdating(false);
    }
  };

  const pharmacyChangeHistory = changeHistory;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        {/* Sticky header with tabs */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-20 border-b dark:border-gray-700">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <DialogTitle className="break-words text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  {t.pharmacyDetails || "Pharmacy Details"}
                </DialogTitle>
                <DialogDescription className="break-words text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t.code || "Code"}: {pharmacy.code}
                </DialogDescription>
              </div>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground text-gray-500 dark:text-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 border-t dark:border-gray-700 overflow-x-auto px-4 sm:px-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "details"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              {t.details || "Details"}
            </button>
            <button
              onClick={() => setActiveTab("training")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "training"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              {t.training || "Training"}
            </button>
            <button
              onClick={() => setActiveTab("package")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "package"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              {t.brandedPacket || "Branded Packet"}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "history"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              {t.history || "History"}
            </button>
            {/* New Lead History Tab */}
            <button
              onClick={() => setActiveTab("leadHistory")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "leadHistory"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              {t.leadHistory || "Lead History"}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-800">

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.code || "Code"}
                  </label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm break-words text-gray-900 dark:text-gray-100">
                    {pharmacy.code}
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.status || "Status"}
                  </label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium inline-block ${pharmacy.active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                    >
                      {pharmacy.active ? t.active : t.inactive}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.pharmacyName || "Pharmacy Name"}
                </label>
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm break-words text-gray-900 dark:text-gray-100">
                  {pharmacy.name}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.address || "Address"}
                </label>
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm break-words text-gray-900 dark:text-gray-100">
                  {pharmacy.address}
                </div>
              </div>

              {(pharmacy as any).landmark && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.landmark || "Landmark"}
                  </label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm break-words text-gray-900 dark:text-gray-100">
                    {(pharmacy as any).landmark}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.pharmacyPhone || "Pharmacy Phone"}
                  </label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                    {pharmacy.phone || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.leadPhone || "Lead Phone"}
                  </label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm break-words text-gray-900 dark:text-gray-100">
                    {pharmacy.lead?.phone || "-"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col h-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex-grow">
                    {t.telegramBot || "Telegram Bot"}
                  </label>
                  <div className={`p-2 rounded border border-gray-200 dark:border-gray-700 text-center text-xs sm:text-sm mt-auto ${(pharmacy as any).marketChats?.length > 0
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200"
                    }`}>
                    {(pharmacy as any).marketChats?.length > 0 ? t.yes : t.no}
                  </div>
                </div>
                <div className="flex flex-col h-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex-grow">
                    {t.training || "Training"}
                  </label>
                  <div className={`p-2 rounded border border-gray-200 dark:border-gray-700 text-center text-xs sm:text-sm mt-auto ${(pharmacy as any).training
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200"
                    }`}>
                    {(pharmacy as any).training ? t.yesTraining : t.noTraining}
                  </div>
                </div>
                <div className="flex flex-col h-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex-grow">
                    {t.brandedPacket || "Branded Packet"}
                  </label>
                  <div className={`p-2 rounded border border-gray-200 dark:border-gray-700 text-center text-xs sm:text-sm mt-auto ${(pharmacy as any).brandedPacket
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200"
                    }`}>
                    {(pharmacy as any).brandedPacket ? t.yes : t.no}
                  </div>
                </div>
              </div>

              {/* Telegram Bot Users Section - shown for all users */}
              {(pharmacy as any).marketChats && (pharmacy as any).marketChats.length > 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.telegramUsers || "Telegram Bot Users"}
                  </label>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            №
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            {t.name || "Name"}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            {t.username || "Username"}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            {t.chatId || "Chat ID"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {(pharmacy as any).marketChats.map((chat: any, index: number) => (
                          <tr key={chat.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                              {chat.name || "-"}
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                              @{chat.username || "-"}
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-mono">
                              {chat.id}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Lead Status - shown for admins only */}
              {isAdmin && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.leadStatus || "Lead Status"}
                  </label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                    {pharmacy.lead?.status || "-"}
                  </div>
                </div>
              )}

              {isAdmin && (
                <>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t.stir || "STIR"}
                      </label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {(pharmacy.lead as any)?.stir || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t.additionalPhone || "Additional Phone"}
                      </label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {(pharmacy.lead as any)?.additionalPhone || "-"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t.juridicalName || "Juridical Name"}
                    </label>
                    <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
                      {(pharmacy.lead as any)?.juridicalName || "-"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t.juridicalAddress || "Juridical Address"}
                    </label>
                    <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
                      {(pharmacy.lead as any)?.juridicalAddress || "-"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.bankName || "Bank Name"}
                      </label>
                      <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
                        {(pharmacy.lead as any)?.bankName || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.mfo || "MFO"}
                      </label>
                      <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
                        {(pharmacy.lead as any)?.mfo || "-"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t.bankAccount || "Bank Account"}
                    </label>
                    <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
                      {(pharmacy.lead as any)?.bankAccount || "-"}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Training Tab */}
          {activeTab === "training" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base font-medium">
                    {t.changeStatus || "Change Status"}
                  </Label>
                </div>
                <Select
                  value={
                    (pendingTraining ?? (pharmacy as any).training) ? "true" : "false"
                  }
                  onValueChange={(value) => setPendingTraining(value === "true")}
                >
                  <SelectTrigger
                    className={`w-36 border font-bold h-9 ${(pendingTraining ?? (pharmacy as any).training)
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                      }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t.yesTraining || "YES"}</SelectItem>
                    <SelectItem value="false">{t.noTraining || "NO"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t.comment || "Comment"} *
                </label>
                <Textarea
                  value={trainingComment}
                  onChange={(e) => {
                    setTrainingComment(e.target.value);
                    setTrainingError("");
                  }}
                  placeholder={t.enterComment || "Enter your comment..."}
                  className="min-h-24 text-sm"
                />
                {trainingError && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{trainingError}</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() =>
                    handleStatusChange(
                      "training",
                      pendingTraining ?? (pharmacy as any).training,
                      trainingComment,
                      setTrainingError,
                    )
                  }
                  disabled={isUpdating || pendingTraining === (pharmacy as any).training}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-11"
                >
                  {isUpdating ? "..." : t.update || "Update"}
                </Button>
              </div>
            </div>
          )}

          {/* Package Tab */}
          {activeTab === "package" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base font-medium">
                    {t.changeStatus || "Change Status"}
                  </Label>
                </div>
                <Select
                  value={
                    (pendingPacket ?? (pharmacy as any).brandedPacket) ? "true" : "false"
                  }
                  onValueChange={(value) => setPendingPacket(value === "true")}
                >
                  <SelectTrigger
                    className={`w-36 border font-bold h-9 ${(pendingPacket ?? (pharmacy as any).brandedPacket)
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                      }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t.yes || "YES"}</SelectItem>
                    <SelectItem value="false">{t.no || "NO"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t.comment || "Comment"} *
                </label>
                <Textarea
                  value={packageComment}
                  onChange={(e) => {
                    setPackageComment(e.target.value);
                    setPackageError("");
                  }}
                  placeholder={t.enterComment || "Enter your comment..."}
                  className="min-h-24 text-sm"
                />
                {packageError && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{packageError}</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() =>
                    handleStatusChange(
                      "brandedPacket",
                      pendingPacket ?? (pharmacy as any).brandedPacket,
                      packageComment,
                      setPackageError,
                    )
                  }
                  disabled={isUpdating || pendingPacket === (pharmacy as any).brandedPacket}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-11"
                >
                  {isUpdating ? "..." : t.update || "Update"}
                </Button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <ChangeHistory
              records={pharmacyChangeHistory}
              onDelete={onDeleteHistory}
              isAdmin={isAdmin}
            />
          )}

          {/* Lead History Tab Content */}
          {activeTab === "leadHistory" && (
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.lastCommentDate || "Date"}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.lastCommentUser || "User"}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.lastComment || "Comment"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pharmacy.comments && pharmacy.comments.length > 0 ? (
                    [...pharmacy.comments]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((comment, index) => (
                        <tr key={comment.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap align-top">
                            {formatDate(comment.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap align-top">
                            {comment.creator?.phone || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 align-top">
                            <div className="break-words max-w-sm whitespace-pre-wrap">
                              {comment.coment || comment.comment || "-"}
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        {t.noData || "No data"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog >
  );
}
