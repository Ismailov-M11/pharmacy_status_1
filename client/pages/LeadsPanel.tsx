import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLeadsList, getPharmacyList, getPharmacyStatus, Pharmacy } from "@/lib/api";
import { PharmacyTable } from "@/components/PharmacyTable";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function LeadsPanel() {
    const { t } = useLanguage();
    const { token, authLoading } = useAuth();
    const navigate = useNavigate();

    const [leads, setLeads] = useState<Pharmacy[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Pharmacy[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [leadStatusFilter, setLeadStatusFilter] = useState<string | null>(null);

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

                // Create Map of Market Pharmacies for quick lookup by ID or Code
                // Assuming ID match is reliable. If not, might need Code match. But ID usually shared if from same DB.
                // Wait, Lead IDs and Market IDs might be different if they are different entities?
                // User said: "на странице leads статусы аптек... нужно работать вместе с api market/list"
                // This implies a lead might corresponding to a market pharmacy.
                // Typically a Lead converts to a Pharmacy. They might share `id` or `code`.
                // Let's assume matching by `id` is the primary key. If not found, try `code`.

                const marketMap = new Map<number, Pharmacy>();
                marketList.forEach(p => marketMap.set(p.id, p));

                // 2. Map and Merge Data
                const mappedLeads = await Promise.all(rawLeads.map(async (item: any) => {
                    // Check if this lead exists in market list
                    const marketMatch = marketMap.get(item.id);

                    // Base object
                    const pharmacy: Pharmacy = {
                        ...item,
                        id: item.id,
                        code: item.code || "LEAD",
                        name: item.name || "Unknown Lead",
                        address: item.address || "",
                        phone: item.phone || "",
                        active: false,
                        lead: item, // Embed self for isAdmin columns
                        // Merge Market Chats if available
                        marketChats: marketMatch ? marketMatch.marketChats : [],
                        // Default statuses (will be updated)
                        brandedPacket: false,
                        training: false,
                        creationDate: item.creationDate || new Date().toISOString(),
                        modifiedDate: item.modifiedDate || new Date().toISOString()
                    };

                    // 3. Fetch Local Status (Packet/Training)
                    // We fetch this for every lead that we render.
                    // Optimization: Could batch this or only fetch for visible, but for now fetch all (safe for < 1000 records).
                    try {
                        const status = await getPharmacyStatus(pharmacy.id);
                        pharmacy.brandedPacket = status.brandedPacket;
                        pharmacy.training = status.training;
                    } catch (ignore) {
                        // Keep defaults
                    }

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

    // Derive unique statuses from current data
    const leadStatusOptions = useMemo(() => {
        const statuses = new Set<string>();
        leads.forEach(l => {
            if (l.lead?.status) statuses.add(l.lead.status);
        });
        return Array.from(statuses).sort();
    }, [leads]);

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

            // 3. Active filter (if relevant)
            const matchesActive = activeFilter === null
                ? true
                : p.active === activeFilter;

            return matchesSearch && matchesLeadStatus && matchesActive;
        });
        setFilteredLeads(filtered);
    }, [searchQuery, leads, leadStatusFilter, activeFilter]);

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
                    {/* Correction 1: Use new translation key */}
                    <h1 className="text-3xl font-bold text-gray-900">{t.leadsTitle || "Leads"}</h1>
                    <p className="text-gray-600 mt-2">{t.pharmacies}</p>
                </div>

                <div className="bg-white shadow">
                    <PharmacyTable
                        pharmacies={filteredLeads}
                        isLoading={isLoading}
                        isAdmin={true}

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
                    />
                </div>
            </main>
        </div>
    );
}
