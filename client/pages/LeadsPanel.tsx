import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLeadsList, getPharmacyList, getPharmacyStatus, Pharmacy, getUserColumnSettings, saveUserColumnSettings, ColumnSettings } from "@/lib/api";
import { PharmacyTable } from "@/components/PharmacyTable";
import { Header } from "@/components/Header";
import { PharmacyDetailModal } from "@/components/PharmacyDetailModal";
import { ColumnSettingsModal } from "@/components/ColumnSettingsModal";
import { SettingsMenuModal } from "@/components/SettingsMenuModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function LeadsPanel() {
    const { t } = useLanguage();
    const { token, authLoading } = useAuth();
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

    // Data Fetching
    useEffect(() => {
        // Auth Check
        if (authLoading) return;
        if (!token) {
            navigate("/login");
            return;
        }

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
                    />
                </div>
            </main>

            {/* Detail Modal */}
            <PharmacyDetailModal
                pharmacy={selectedPharmacy}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
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
                onSave={(newSettings) => {
                    setColumnSettings(newSettings);
                    setIsColumnSettingsOpen(false);
                    // TODO: Save to backend when user ID is available
                    toast.success(t.changesSaved || "Changes saved");
                }}
            />
        </div>
    );
}
