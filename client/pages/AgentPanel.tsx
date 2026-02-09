import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { PharmacyTable } from "@/components/PharmacyTable";
import { PharmacyDetailModal } from "@/components/PharmacyDetailModal";
import {
  getPharmacyList,
  Pharmacy,
  getPharmacyStatus,
  updatePharmacyStatusLocal,
  getStatusHistory,
  StatusHistoryRecord,
  getMarketSessionList,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AgentPanel() {
  const { t } = useLanguage();
  const { token, user, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | null>(true);
  const [telegramBotFilter, setTelegramBotFilter] = useState<boolean | null>(
    null,
  );
  const [brandedPacketFilter, setBrandedPacketFilter] = useState<
    boolean | null
  >(null);
  const [trainingFilter, setTrainingFilter] = useState<boolean | null>(null);
  const [merchantStatusFilter, setMerchantStatusFilter] = useState<boolean | null>(null);
  const [filesFilter, setFilesFilter] = useState<boolean | null>(null);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState<"details" | "files">("details");
  const [changeHistory, setChangeHistory] = useState<StatusHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate("/login");
      return;
    }

    fetchPharmacies();
    fetchPharmacies();
  }, [token, authLoading, navigate, activeFilter]);

  useEffect(() => {
    const filtered = pharmacies.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone && p.phone.includes(searchQuery)) ||
        (p.lead?.phone && p.lead.phone.includes(searchQuery)) ||
        ((p as any).landmark &&
          (p as any).landmark
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTelegramBot =
        telegramBotFilter === null
          ? true
          : telegramBotFilter
            ? (p as any).marketChats && (p as any).marketChats.length > 0
            : !(p as any).marketChats || (p as any).marketChats.length === 0;

      const matchesBrandedPacket =
        brandedPacketFilter === null
          ? true
          : (p as any).brandedPacket === brandedPacketFilter;

      const matchesTraining =
        trainingFilter === null ? true : (p as any).training === trainingFilter;

      const matchesFiles =
        filesFilter === null
          ? true
          : filesFilter
            ? p.licence !== null && p.licence !== undefined
            : p.licence === null || p.licence === undefined;

      const matchesActive =
        activeFilter === null ? true : p.active === activeFilter;

      const matchesMerchantStatus =
        merchantStatusFilter === null ? true : p.merchantOnline === merchantStatusFilter;

      return (
        matchesSearch &&
        matchesTelegramBot &&
        matchesBrandedPacket &&
        matchesTraining &&
        matchesFiles &&
        matchesActive &&
        matchesMerchantStatus
      );
    });
    setFilteredPharmacies(filtered);
  }, [
    searchQuery,
    pharmacies,
    telegramBotFilter,
    brandedPacketFilter,
    trainingFilter,
    filesFilter,
    activeFilter,
    merchantStatusFilter,
  ]);

  const fetchPharmacies = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await getPharmacyList(token, "", 0, activeFilter);
      const pharmacyList = response.payload?.list || [];

      // Fetch statuses from local backend and session data for all pharmacies
      const pharmaciesWithStatuses = await Promise.all(
        pharmacyList.map(async (pharmacy) => {
          try {
            // Fetch both status and session data in parallel
            const [status, sessionData] = await Promise.all([
              getPharmacyStatus(pharmacy.id),
              getMarketSessionList(token, pharmacy.id),
            ]);

            // Determine if pharmacy is online (any active session)
            const isOnline = sessionData.payload.list.some(
              (session) => session.active === true
            );

            return {
              ...pharmacy,
              training: status.training,
              brandedPacket: status.brandedPacket,
              merchantOnline: isOnline,
            };
          } catch (error) {
            // If status not found, use defaults
            console.warn(`Failed to fetch status for pharmacy ${pharmacy.id}:`, error);
            return {
              ...pharmacy,
              training: false,
              brandedPacket: false,
              merchantOnline: false,
            };
          }
        })
      );

      setPharmacies(pharmaciesWithStatuses);
      setFilteredPharmacies(pharmaciesWithStatuses);
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePharmacyClick = async (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsModalOpen(true);

    // Fetch status and history from local backend
    setIsLoadingHistory(true);
    try {
      const [status, history] = await Promise.all([
        getPharmacyStatus(pharmacy.id),
        getStatusHistory(pharmacy.id)
      ]);

      // Update pharmacy with backend status
      setSelectedPharmacy(prev => prev ? {
        ...prev,
        training: status.training,
        brandedPacket: status.brandedPacket
      } : null);

      setChangeHistory(history);
    } catch (error) {
      console.error("Failed to fetch pharmacy status/history:", error);
      setChangeHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPharmacy(null);
    setChangeHistory([]);
    setInitialModalTab("details");
  };

  const handleUpdateStatus = async (
    pharmacyId: number,
    field: "brandedPacket" | "training",
    value: boolean,
    comment: string,
  ) => {
    if (!token || !user) return;

    try {
      // Update via local backend using actual username
      const updatedStatus = await updatePharmacyStatusLocal(
        pharmacyId,
        field,
        value,
        comment,
        user.username
      );

      // Refresh history
      const history = await getStatusHistory(pharmacyId);
      setChangeHistory(history);

      // Update local state with new values from backend
      const updatePharmacy = (p: Pharmacy) => {
        if (p.id === pharmacyId) {
          return {
            ...p,
            training: updatedStatus.training,
            brandedPacket: updatedStatus.brandedPacket
          };
        }
        return p;
      };

      setPharmacies((prev) => prev.map(updatePharmacy));
      setFilteredPharmacies((prev) => prev.map(updatePharmacy));

      setSelectedPharmacy((prev) =>
        prev ? {
          ...prev,
          training: updatedStatus.training,
          brandedPacket: updatedStatus.brandedPacket
        } : null,
      );

      toast.success(t.saved);
    } catch (error) {
      console.error("Failed to update pharmacy:", error);

      // Check if backend is sleeping (cold start)
      if (error instanceof Error && error.message === 'BACKEND_SLEEPING') {
        toast.error("Сервер запускается. Пожалуйста, попробуйте еще раз через 1-2 минуты.");
      } else {
        toast.error(t.error);
      }
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
          <h1 className="text-3xl font-bold text-gray-900">
            {role === "ROLE_OPERATOR" ? t.operatorPanel : t.agentPanel}
          </h1>
          <p className="text-gray-600 mt-2">{t.pharmacyName}</p>
        </div>

        <div className="bg-white shadow">
          <PharmacyTable
            pharmacies={filteredPharmacies}
            isLoading={isLoading}
            isAdmin={false}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            telegramBotFilter={telegramBotFilter}
            onTelegramBotFilterChange={setTelegramBotFilter}
            brandedPacketFilter={brandedPacketFilter}
            onBrandedPacketFilterChange={setBrandedPacketFilter}
            trainingFilter={trainingFilter}
            onTrainingFilterChange={setTrainingFilter}
            merchantStatusFilter={merchantStatusFilter}
            onMerchantStatusFilterChange={setMerchantStatusFilter}
            filesFilter={filesFilter}
            onFilesFilterChange={setFilesFilter}
            onFilesClick={(pharmacy) => {
              setSelectedPharmacy(pharmacy);
              setInitialModalTab("files");
              setIsModalOpen(true);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onPharmacyClick={handlePharmacyClick}
            onRefresh={fetchPharmacies}
            leadStatusFilter={null}
            onLeadStatusFilterChange={() => { }}
            leadStatusOptions={[]}
            stirSortOrder={null}
          />
        </div>
        <PharmacyDetailModal
          pharmacy={selectedPharmacy}
          isOpen={isModalOpen}
          initialTab={initialModalTab}
          onClose={handleCloseModal}
          onUpdateStatus={handleUpdateStatus}
          isAdmin={false}
          changeHistory={changeHistory}
          onDeleteHistory={undefined}
        />
      </main>
    </div>
  );
}
