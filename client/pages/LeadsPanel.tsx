import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLeadsList, Pharmacy } from "@/lib/api"; // You might need to export this or add it to api.ts
import { PharmacyTable } from "@/components/PharmacyTable";

export default function LeadsPanel() {
    const { t } = useLanguage();
    const { token, role } = useAuth(); // Needed for API calls
    const [leads, setLeads] = useState<Pharmacy[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    // Reuse existing filters or keep simple for now
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

    // We reuse PharmacyTable, but need to map leads to Pharmacy structure
    // or ensure getLeadsList returns compatible structure.

    const fetchLeads = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await getLeadsList(token, searchQuery, 0, 1000); // Fetch all or paginate
            const rawLeads = response.payload.list || [];

            // Map raw leads to Pharmacy interface to satisfy PharmacyTable
            // We assume rawLeads have similar fields or we map them.
            // Based on previous knowledge, lead object has: id, name, address, phone...
            // And for specific columns like 'leadStatus', PharmacyTable expects `pharmacy.lead.status`.
            // So we wrap the lead itself in the `lead` property of the item.

            const mappedLeads: Pharmacy[] = rawLeads.map((item: any) => ({
                ...item,
                id: item.id,
                code: item.code || "LEAD",
                name: item.name || "Unknown Lead",
                address: item.address || "",
                phone: item.phone || "",
                active: false, // Leads are potential/inactive usually
                lead: item, // Crucial for isAdmin columns in PharmacyTable
                marketChats: [],
                brandedPacket: false,
                training: false,
                // Add other required fields if missing
                creationDate: item.creationDate || new Date().toISOString(),
                modifiedDate: item.modifiedDate || new Date().toISOString()
            }));

            setLeads(mappedLeads);
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [token, searchQuery]); // Refetch on search

    return (
        <div className="container mx-auto p-4 max-w-[1600px]">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    {/* Hardcoded or from translations */}
                    {t.language === "ru" ? "Лиды" : "Leadlar"}
                </h1>
            </div>

            <PharmacyTable
                pharmacies={leads}
                isLoading={isLoading}
                isAdmin={true} // Enable extra columns to show Lead Status etc.
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter} // Stub for now, logic needs implementation if we want client-side filter
                telegramBotFilter={null}
                onTelegramBotFilterChange={() => { }}
                brandedPacketFilter={null}
                onBrandedPacketFilterChange={() => { }}
                trainingFilter={null}
                onTrainingFilterChange={() => { }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onRefresh={fetchLeads}
            />
        </div>
    );
}
