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
    "details" | "training" | "package" | "history"
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full p-0">
        {/* Sticky header with tabs */}
        <div className="sticky top-0 bg-white z-20 border-b">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <DialogTitle className="break-words text-base sm:text-lg">
                  {t.pharmacyDetails || "Pharmacy Details"}
                </DialogTitle>
                <DialogDescription className="break-words text-xs sm:text-sm">
                  {t.code || "Code"}: {pharmacy.code}
                </DialogDescription>
              </div>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
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
          <div className="flex gap-1 border-t overflow-x-auto px-4 sm:px-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              {t.details || "Details"}
            </button>
            <button
              onClick={() => setActiveTab("training")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "training"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              {t.training || "Training"}
            </button>
            <button
              onClick={() => setActiveTab("package")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "package"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              {t.brandedPacket || "Branded Packet"}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-2 sm:px-4 py-2 font-medium border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              {t.history || "History"}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {t.code || "Code"}
                  </label>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm break-words">
                    {pharmacy.code}
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {t.status || "Status"}
                  </label>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium inline-block ${pharmacy.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                        }`}
                    >
                      {pharmacy.active ? t.active : t.inactive}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t.pharmacyName || "Pharmacy Name"}
                </label>
                <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm break-words">
                  {pharmacy.name}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t.address || "Address"}
                </label>
                <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm break-words">
                  {pharmacy.address}
                </div>
              </div>

              {(pharmacy as any).landmark && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {t.landmark || "Landmark"}
                  </label>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm break-words">
                    {(pharmacy as any).landmark}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {t.pharmacyPhone || "Pharmacy Phone"}
                  </label>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
                    {pharmacy.phone || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {t.leadPhone || "Lead Phone"}
                  </label>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm break-words">
                    {pharmacy.lead?.phone || "-"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col h-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex-grow">
                    {t.telegramBot || "Telegram Bot"}
                  </label>
                  <div className={`p-2 rounded border border-gray-200 text-center text-xs sm:text-sm mt-auto ${(pharmacy as any).marketChats?.length > 0
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                    }`}>
                    {(pharmacy as any).marketChats?.length > 0 ? t.yes : t.no}
                  </div>
                </div>
                <div className="flex flex-col h-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex-grow">
                    {t.training || "Training"}
                  </label>
                  <div className={`p-2 rounded border border-gray-200 text-center text-xs sm:text-sm mt-auto ${(pharmacy as any).training
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                    }`}>
                    {(pharmacy as any).training ? t.yesTraining : t.noTraining}
                  </div>
                </div>
                <div className="flex flex-col h-full">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex-grow">
                    {t.brandedPacket || "Branded Packet"}
                  </label>
                  <div className={`p-2 rounded border border-gray-200 text-center text-xs sm:text-sm mt-auto ${(pharmacy as any).brandedPacket
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                    }`}>
                    {(pharmacy as any).brandedPacket ? t.yes : t.no}
                  </div>
                </div>
              </div>

              {/* Telegram Bot Users Section - shown for all users */}
              {(pharmacy as any).marketChats && (pharmacy as any).marketChats.length > 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    {t.telegramUsers || "Telegram Bot Users"}
                  </label>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            №
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            {t.name || "Name"}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            {t.username || "Username"}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            {t.chatId || "Chat ID"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(pharmacy as any).marketChats.map((chat: any, index: number) => (
                          <tr key={chat.id || index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">
                              {chat.name || "-"}
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">
                              @{chat.username || "-"}
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 font-mono">
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
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {t.leadStatus || "Lead Status"}
                  </label>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
                    {pharmacy.lead?.status || "-"}
                  </div>
                </div>
              )}

              {isAdmin && (
                <>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.stir || "STIR"}
                      </label>
                      <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
                        {(pharmacy.lead as any)?.stir || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.additionalPhone || "Additional Phone"}
                      </label>
                      <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs sm:text-sm">
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
        </div>
      </DialogContent>
    </Dialog >
  );
}
