import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLeadsList, Pharmacy } from "@/lib/api";
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
    // Leads are typically inactive, but we might want to filter if the API returns mixed states later.
    // For now, we reuse the filter naming conventions.
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null); // Leads strictly inactive? or Mixed? Usually false.

    // New Lead Status Filter
    const [leadStatusFilter, setLeadStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        // Auth Check
        if (authLoading) return;
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchLeads = async () => {
            setIsLoading(true);
            try {
                const response = await getLeadsList(token, "", 0, 10000); // Fetch all to filter locally
                const rawLeads = response.payload.list || [];

                // Map to Pharmacy
                const mappedLeads: Pharmacy[] = rawLeads.map((item: any) => ({
                    ...item,
                    id: item.id,
                    code: item.code || "LEAD",
                    // Handle potentially missing name
                    name: item.name || "Unknown Lead",
                    address: item.address || "",
                    phone: item.phone || "",
                    active: false,
                    lead: item, // Embed self for isAdmin columns
                    marketChats: [],
                    brandedPacket: false,
                    training: false,
                    creationDate: item.creationDate || new Date().toISOString(),
                    modifiedDate: item.modifiedDate || new Date().toISOString()
                }));

                setLeads(mappedLeads);
                setFilteredLeads(mappedLeads);
            } catch (error) {
                console.error("Failed to fetch leads:", error);
                toast.error(t.error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeads();
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

            // 3. Active filter (if relevant, though leads are usually inactive)
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
                    <h1 className="text-3xl font-bold text-gray-900">{t.language === "ru" ? "Лиды" : "Leadlar"}</h1>
                    <p className="text-gray-600 mt-2">{t.pharmacies}</p>
                </div>

                <div className="bg-white shadow">
                    <PharmacyTable
                        pharmacies={filteredLeads}
                        isLoading={isLoading}
                        isAdmin={true} // Show extra columns

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
                        onRefresh={() => { /* Re-trigger fetch logic if needed, simplify for now since useEffect handles it */
                            // We can trigger a reload by forcing a state change or extracting fetch to function, 
                            // but useEffect dependency [token] is strict. 
                            // Let's just reload page or ignore for now, or extract fetch to separate function outside useEffect.
                            window.location.reload();
                        }}

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
