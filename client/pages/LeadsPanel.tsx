import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLeadsList, getPharmacyList, getPharmacyStatus, Pharmacy } from "@/lib/api";
import { PharmacyTable } from "@/components/PharmacyTable";
import { Header } from "@/components/Header";
import { PharmacyDetailModal } from "@/components/PharmacyDetailModal"; // Added Modal
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
                // Note: Leads list usually returns 'comments' in the payload if backend provides it.
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
                        // Comments should be present in 'item' from getLeadsList response.
                        // Assuming backend naming is 'comments' or 'messages'. 
                        // Checks on data structure: user said "response приходит значение с payload/coments/coment" (typo "coments").
                        // If the key is 'coments', map it to 'comments'.
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
                    />
                </div>
            </main>

            {/* Detail Modal */}
            <PharmacyDetailModal
                pharmacy={selectedPharmacy}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={() => {
                    // Optional: Refresh data if modal triggers updates
                    // window.location.reload(); 
                }}
            />
        </div>
    );
}
