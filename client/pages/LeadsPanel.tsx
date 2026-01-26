import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLeadsList, getPharmacyList, getPharmacyStatus, Pharmacy, getUserColumnSettings, saveUserColumnSettings, ColumnSettings, updatePharmacyStatusLocal } from "@/lib/api";
import { PharmacyTable } from "@/components/PharmacyTable";
import { Header } from "@/components/Header";
import { PharmacyDetailModal } from "@/components/PharmacyDetailModal";
import { ColumnSettingsModal } from "@/components/ColumnSettingsModal";
import { SettingsMenuModal } from "@/components/SettingsMenuModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function LeadsPanel() {
    const { t } = useLanguage();
    const { token, authLoading, user } = useAuth();
    const navigate = useNavigate();

    const [leads, setLeads] = useState<Pharmacy[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Pharmacy[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [leadStatusFilter, setLeadStatusFilter] = useState<string | null>(null);
    const [commentUserFilter, setCommentUserFilter] = useState<string | null>(null);
    const [commentDateFilter, setCommentDateFilter] = useState<{ from: string | null, to: string | null }>({ from: null, to: null });

    // Leads-specific features
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
    const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>([]);

    // Derive unique statuses from current data
    const leadStatusOptions = useMemo(() => {
        const statuses = new Set<string>();
        leads.forEach(l => {
            if (l.lead?.status) statuses.add(l.lead.status);
        });
        return Array.from(statuses).sort();
    }, [leads]);

    const commentUserOptions = useMemo(() => {
        const users = new Set<string>();
        leads.forEach(l => {
            if (l.comments && l.comments.length > 0) {
                // Sort comments to find last one
                const sortedFn = (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                const last = [...l.comments].sort(sortedFn)[0];
                if (last.creator?.phone) users.add(last.creator.phone);
            }
        });
        return Array.from(users).sort();
    }, [leads]);

    // Default Columns Definition
    const defaultColumns: ColumnSettings[] = useMemo(() => [
        { id: "number", label: t.number || "№", visible: true, order: 0 },
        { id: "code", label: t.code || "Code", visible: true, order: 1 },
        { id: "name", label: t.pharmacyName || "Name", visible: true, order: 2 },
        { id: "address", label: t.address || "Address", visible: true, order: 3 },
        { id: "landmark", label: t.landmark || "Landmark", visible: true, order: 4 },
        { id: "pharmacyPhone", label: t.pharmacyPhone || "Phone", visible: true, order: 5 },
        { id: "leadPhone", label: t.leadPhone || "Lead Phone", visible: true, order: 6 },
        { id: "telegramBot", label: t.telegramBot || "Bot", visible: true, order: 7 },
        { id: "training", label: t.training || "Training", visible: true, order: 8 },
        { id: "brandedPacket", label: t.brandedPacket || "Packet", visible: true, order: 9 },
        { id: "status", label: t.status || "Status", visible: true, order: 10 },
        { id: "leadStatus", label: t.leadStatus || "Lead Status", visible: true, order: 11 },
        { id: "comments", label: t.comments || "Comments", visible: true, order: 12 },
        { id: "commentUser", label: t.commentUser || "Comment User", visible: true, order: 13 },
        { id: "commentDate", label: t.commentDate || "Comment Date", visible: true, order: 14 },
        { id: "creationDate", label: t.date || "Date", visible: true, order: 15 },
        { id: "region", label: t.region || "Region", visible: false, order: 16 },
        { id: "district", label: t.district || "District", visible: false, order: 17 },
    ], [t]);

    // Data Fetching
    useEffect(() => {
        // Auth Check
        if (authLoading) return;
        if (!token) {
            navigate("/login");
            return;
        }

        // Initialize Column Settings
        const initColumnSettings = async () => {
            if (token && user?.username) {
                try {
                    const savedSettings = await getUserColumnSettings(token, user.username);
                    if (savedSettings && savedSettings.length > 0) {
                        // Merge saved settings with defaults to ensure all columns exist
                        // This handles cases where new columns are added to the app
                        const mergedSettings = defaultColumns.map(defCol => {
                            const saved = savedSettings.find((s: ColumnSettings) => s.id === defCol.id);
                            return saved ? { ...defCol, ...saved } : defCol;
                        });

                        // Sort by order
                        mergedSettings.sort((a, b) => a.order - b.order);
                        setColumnSettings(mergedSettings);
                    } else {
                        setColumnSettings(defaultColumns);
                    }
                } catch (error) {
                    console.error("Failed to fetch column settings:", error);
                    setColumnSettings(defaultColumns);
                }
            }
        };

        initColumnSettings();

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Parallel Fetch: Leads and Market List
                const [leadsResponse, marketResponse] = await Promise.all([
                    getLeadsList(token, "", 0, 10000),
                    getPharmacyList(token, "", 0, null, 10000)
                ]);

                const rawLeads = leadsResponse.payload.list || [];
                const marketList = marketResponse.payload.list || [];

                // Create Map of Market Pharmacies by Lead ID for integration
                const marketMap = new Map<number, Pharmacy>();
                marketList.forEach(p => {
                    if (p.lead && p.lead.id) {
                        marketMap.set(p.lead.id, p);
                    }
                });

                // 2. Map and Merge Data
                const mappedLeads = await Promise.all(rawLeads.map(async (item: any) => {
                    // Find corresponding pharmacy in market list using the Lead's ID
                    const marketMatch = marketMap.get(item.id);

                    // Fetch Local Status (Packet/Training)
                    let status = { brandedPacket: false, training: false };

                    if (marketMatch) {
                        try {
                            const fetchedStatus = await getPharmacyStatus(marketMatch.id);
                            status.brandedPacket = fetchedStatus.brandedPacket;
                            status.training = fetchedStatus.training;
                        } catch (ignore) {
                            // Keep defaults
                        }
                    }

                    // Construct merged object
                    const pharmacy: Pharmacy = {
                        ...item,
                        id: item.id,
                        code: item.code || "LEAD",
                        name: item.name || "Unknown Lead",
                        address: item.address || "",
                        phone: item.phone || "",
                        active: marketMatch ? marketMatch.active : false,
                        lead: item,
                        marketChats: marketMatch ? marketMatch.marketChats : [],
                        brandedPacket: status.brandedPacket,
                        training: status.training,
                        creationDate: item.creationDate || new Date().toISOString(),
                        modifiedDate: item.modifiedDate || new Date().toISOString(),
                        comments: item.coments || item.comments || []
                    };

                    return pharmacy;
                }));

                setLeads(mappedLeads);
                setFilteredLeads(mappedLeads);
            } catch (error) {
                console.error("Failed to fetch leads data:", error);
                toast.error(t.error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token, authLoading, navigate, t.error]);

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

            // Update local state
            setLeads(current => current.map(p => {
                if (p.id === pharmacyId) {
                    return { ...p, [field]: value };
                }
                return p;
            }));

            // Allow time for DB propagation before refetching or just rely on local state
            if (selectedPharmacy && selectedPharmacy.id === pharmacyId) {
                setSelectedPharmacy(prev => prev ? { ...prev, [field]: value } : null);
            }

        } catch (error) {
            console.error("Failed to update status", error);
            throw error;
        }
    };

    // Filter Logic
    useEffect(() => {
        const filtered = leads.filter((p) => {
            // 1. Search
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                p.name.toLowerCase().includes(q) ||
                p.address.toLowerCase().includes(q) ||
                (p.phone && p.phone.includes(q)) ||
                (p.lead?.phone && p.lead.phone.includes(q)) ||
                p.code.toLowerCase().includes(q) ||
                (p.lead?.status && p.lead.status.toLowerCase().includes(q));

            // 2. Lead Status Filter
            const matchesLeadStatus = leadStatusFilter === null
                ? true
                : p.lead?.status === leadStatusFilter;

            // 3. Active filter
            const matchesActive = activeFilter === null
                ? true
                : p.active === activeFilter;

            // 4. Comment User Filter
            let matchesCommentUser = true;
            const sortedComments = p.comments ? [...p.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
            const lastComment = sortedComments.length > 0 ? sortedComments[0] : null;

            if (commentUserFilter !== null) {
                if (!lastComment) {
                    matchesCommentUser = false;
                } else {
                    matchesCommentUser = lastComment.creator?.phone === commentUserFilter;
                }
            }

            // 5. Comment Date Filter
            let matchesCommentDate = true;
            if (commentDateFilter.from || commentDateFilter.to) {
                if (!lastComment) {
                    matchesCommentDate = false;
                } else {
                    const commentDate = new Date(lastComment.createdAt).getTime();
                    // normalize dates to start/end of day if needed, but simple comparison often works if user enters YYYY-MM-DD
                    if (commentDateFilter.from) {
                        const fromDate = new Date(commentDateFilter.from).getTime(); // starts at 00:00 local
                        if (commentDate < fromDate) matchesCommentDate = false;
                    }
                    if (matchesCommentDate && commentDateFilter.to) {
                        // To include end of day, add 1 day or set hours. input type=date gives 00:00.
                        const toDate = new Date(commentDateFilter.to);
                        toDate.setHours(23, 59, 59, 999);
                        if (commentDate > toDate.getTime()) matchesCommentDate = false;
                    }
                }
            }

            return matchesSearch && matchesLeadStatus && matchesActive && matchesCommentUser && matchesCommentDate;
        });
        setFilteredLeads(filtered);
    }, [searchQuery, leads, leadStatusFilter, activeFilter, commentUserFilter, commentDateFilter]);

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
                    <h1 className="text-3xl font-bold text-gray-900">{t.leadsTitle || "Leads"}</h1>
                    <p className="text-gray-600 mt-2">{t.pharmacies}</p>
                </div>

                <div className="bg-white shadow">
                    <PharmacyTable
                        pharmacies={filteredLeads}
                        isLoading={isLoading}
                        isAdmin={true}
                        showComments={true} // Enable comments columns

                        // Interaction
                        onPharmacyClick={(pharmacy) => {
                            setSelectedPharmacy(pharmacy);
                            setIsModalOpen(true);
                        }}

                        // Standard Filters
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                        telegramBotFilter={null}
                        onTelegramBotFilterChange={() => { }}
                        brandedPacketFilter={null}
                        onBrandedPacketFilterChange={() => { }}
                        trainingFilter={null}
                        onTrainingFilterChange={() => { }}

                        // Search
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}

                        // Refresh
                        onRefresh={() => window.location.reload()}

                        // New Lead Status Filter
                        leadStatusFilter={leadStatusFilter}
                        onLeadStatusFilterChange={setLeadStatusFilter}
                        leadStatusOptions={leadStatusOptions}

                        // Comment Filters
                        commentUserFilter={commentUserFilter}
                        onCommentUserFilterChange={setCommentUserFilter}
                        commentUserOptions={commentUserOptions}
                        commentDateFilter={commentDateFilter}
                        onCommentDateFilterChange={setCommentDateFilter}

                        // Leads-specific props
                        isLeadsPage={true}
                        selectedRows={selectedRows}
                        onSelectionChange={setSelectedRows}
                        onSettingsClick={() => setIsSettingsMenuOpen(true)}
                        columnSettings={columnSettings}
                    />
                </div>
            </main>

            {/* Detail Modal */}
            <PharmacyDetailModal
                pharmacy={selectedPharmacy}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdateStatus={handleUpdateStatus}
                currentUsername={user?.username || "User"}
            />

            {/* Settings Menu Modal */}
            <SettingsMenuModal
                isOpen={isSettingsMenuOpen}
                onClose={() => setIsSettingsMenuOpen(false)}
                onColumnSettingsClick={() => setIsColumnSettingsOpen(true)}
            />

            {/* Column Settings Modal */}
            <ColumnSettingsModal
                isOpen={isColumnSettingsOpen}
                onClose={() => setIsColumnSettingsOpen(false)}
                columns={columnSettings}
                onSave={async (newSettings) => {
                    setColumnSettings(newSettings);
                    setIsColumnSettingsOpen(false);

                    if (token && user?.username) {
                        try {
                            await saveUserColumnSettings(token, user.username, newSettings);
                            toast.success(t.changesSaved || "Changes saved");
                        } catch (error) {
                            console.error("Failed to save column settings:", error);
                            toast.error(t.error || "Error saving settings");
                        }
                    }
                }}
            />
        </div>
    );
}
