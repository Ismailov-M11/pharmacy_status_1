import { useLanguage } from "@/contexts/LanguageContext";
import { StatusHistoryRecord } from "@/lib/api";
import { format } from "date-fns";
import { ru, uz } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
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

interface ChangeHistoryProps {
  records: StatusHistoryRecord[];
  onDelete?: (ids: number[]) => void;
  isAdmin?: boolean;
}

export function ChangeHistory({ records, onDelete, isAdmin = false }: ChangeHistoryProps) {
  const { t, language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Select locale based on current language
  const dateLocale = language === 'uz' ? uz : ru;

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t.noChanges || "No changes yet"}</p>
      </div>
    );
  }

  const handleCheckboxChange = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleDeleteClick = () => {
    if (selectedIds.length > 0) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmDelete = () => {
    if (onDelete && selectedIds.length > 0) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  return (
    <div className="relative">
      {/* Action buttons - shown when items are selected */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="flex gap-2 mb-4 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            className="gap-2"
          >
            {t.clear || "Очистить"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t.deleteSelected || "Удалить выбранные"} ({selectedIds.length})
          </Button>
        </div>
      )}

      {/* Vertical timeline line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-blue-200" />

      <div className="space-y-0">
        {records
          .sort(
            (a, b) =>
              new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
          )
          .map((record, index) => (
            <div
              key={record.id}
              className="relative pl-10 pb-6 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-[11px] top-[6px] w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white" />

              {/* Content */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {/* Checkbox for admin */}
                  {isAdmin && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => handleCheckboxChange(record.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Date and time */}
                    <div className="text-sm text-gray-500 mb-1">
                      {format(new Date(record.changed_at), "yyyy", { locale: dateLocale })} {t.year || "год"} {format(new Date(record.changed_at), "dd MMMM HH:mm", { locale: dateLocale })}
                    </div>

                    {/* Status change description */}
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">
                        {record.field === "training"
                          ? t.training || "Training"
                          : t.brandedPacket || "Branded Packet"}
                      </span>
                      {" "}
                      <span className="text-gray-500">{t.changedTo || "changed to"}</span>
                      {" "}
                      <span className={`font-semibold ${record.new_value ? "text-green-700" : "text-orange-700"}`}>
                        {record.field === "training"
                          ? (record.new_value ? (t.yesTraining || "YES") : (t.noTraining || "NO"))
                          : (record.new_value ? (t.yes || "YES") : (t.no || "NO"))}
                      </span>
                      {" "}
                      <span className="text-gray-500">{t.by || "by"}</span>
                      {" "}
                      <span className="font-medium text-gray-900">{record.changed_by}</span>
                    </div>

                    {/* Comment */}
                    {record.comment && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 border border-gray-200">
                        {record.comment}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete || "Вы действительно хотите удалить?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIds.length === 1
                ? (t.deleteWarning || "Эта запись будет удалена безвозвратно.")
                : `${t.deleteWarningMultiple || "Выбранные записи будут удалены безвозвратно."} (${selectedIds.length})`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              {t.confirmNo || "НЕТ"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              {t.confirmYes || "ДА"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
