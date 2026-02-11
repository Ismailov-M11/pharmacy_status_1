import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { PharmacyTable } from "@/components/PharmacyTable";
import { PharmacyDetailModal } from "@/components/PharmacyDetailModal";
import { StirFilterModal } from "@/components/StirFilterModal";
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

  // STIR filter state
  const [stirFilter, setStirFilter] = useState<string[]>([]);
  const [stirSortOrder, setStirSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [isStirModalOpen, setIsStirModalOpen] = useState(false);
  const stirButtonRef = useRef<HTMLTableCellElement>(null);

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

      // STIR filter logic
      const matchesStir =
        stirFilter.length === 0
          ? true
          : stirFilter.includes((p.lead as any)?.stir || "");

      return (
        matchesSearch &&
        matchesTelegramBot &&
        matchesBrandedPacket &&
        matchesTraining &&
        matchesFiles &&
        matchesActive &&
        matchesMerchantStatus &&
        matchesStir
      );
    });

    // Apply STIR sorting if set
    let sortedFiltered = [...filtered];
    if (stirSortOrder !== null) {
      sortedFiltered.sort((a, b) => {
        const stirA = (a.lead as any)?.stir || "";
        const stirB = (b.lead as any)?.stir || "";
        if (stirSortOrder === 'asc') {
          return stirA.localeCompare(stirB);
        } else {
          return stirB.localeCompare(stirA);
        }
      });
    }

    setFilteredPharmacies(sortedFiltered);
  }, [
    searchQuery,
    pharmacies,
    telegramBotFilter,
    brandedPacketFilter,
    trainingFilter,
    filesFilter,
    activeFilter,
    merchantStatusFilter,
    stirFilter,
    stirSortOrder,
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

  // Get all unique STIR values from pharmacies
  const allStirValues = Array.from(
    new Set(
      pharmacies
        .map((p) => (p.lead as any)?.stir)
        .filter((stir) => stir && stir.trim() !== "")
    )
  ).sort();

  const handleStirFilterClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    e.stopPropagation();
    setIsStirModalOpen(true);
  };

  const handleStirFilterApply = (selected: string[], sort: 'asc' | 'desc' | null) => {
    setStirFilter(selected);
    setStirSortOrder(sort);
  };

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
            stirFilter={stirFilter}
            stirSortOrder={stirSortOrder}
            onStirFilterClick={handleStirFilterClick}
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

        {/* STIR Filter Modal */}
        <StirFilterModal
          isOpen={isStirModalOpen}
          onClose={() => setIsStirModalOpen(false)}
          allStirValues={allStirValues}
          selectedStirs={stirFilter}
          sortOrder={stirSortOrder}
          onApply={handleStirFilterApply}
          triggerElement={stirButtonRef.current}
        />
      </main>
    </div>
  );
}
