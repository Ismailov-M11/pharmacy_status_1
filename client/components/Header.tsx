import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Globe,
  Map,
  Headset,
  UserCog,
  LayoutDashboard,
  LogOut,
  User,
  Activity,
  Store,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { logout, role } = useAuth(); // Destructure role here
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex flex-wrap items-center justify-between gap-y-3">
        {/* Logo - Order 1 */}
        <div className="flex items-center gap-3 order-1">
          <img
            src="/logo.png"
            alt={t.siteTitle || "Aptekalar holati"}
            className="w-10 h-10 md:w-12 md:h-12"
          />
          <div>
            <div className="font-bold text-lg md:text-xl text-purple-700">
              {t.siteTitle || "Aptekalar holati"}
            </div>
          </div>
        </div>

        {/* Language & Logout - Order 2 Mobile, Order 3 Desktop (Right aligned) */}
        <div className="flex items-center gap-2 order-2 md:order-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-purple-700 h-9 w-9 md:h-10 md:w-10"
              >
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setLanguage("ru")}
                className={
                  language === "ru" ? "bg-purple-50 text-purple-700" : ""
                }
              >
                🇷🇺 Русский
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("uz")}
                className={
                  language === "uz" ? "bg-purple-50 text-purple-700" : ""
                }
              >
                🇺🇿 O'zbekcha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="h-9 w-9 md:w-auto md:px-3 p-0 md:py-2 text-purple-700 border-purple-700 hover:bg-purple-50 hover:text-purple-700 text-sm justify-center"
          >
            <LogOut className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
            <span className="hidden md:block">{t.logout}</span>
          </Button>
        </div>

        {/* Nav Buttons - Order 3 Mobile (Row 2), Order 2 Desktop */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start order-3 md:order-2">
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Panel Link based on Role */}
            {role === "ROLE_ADMIN" && (
              <Button
                onClick={() => navigate("/admin")}
                variant={location.pathname === "/admin" ? "default" : "outline"}
                className={`h-10 w-full md:w-auto md:h-9 md:px-3 text-sm justify-center flex-1 md:flex-none transition-colors ${
                  location.pathname === "/admin"
                    ? "bg-purple-700 hover:bg-purple-800 text-white"
                    : "text-purple-700 border-purple-700 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <User className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
                <span className="md:block hidden">
                  {t.adminPanel || "Админ"}
                </span>
                {/* On mobile, show text or just icon? User asked for "icon still doesn't appear... fix this" 
                   AND "move to second line". I'll show Icon + Text on mobile row 2 to fill space nicely, 
                   or revert to icon only if text is too long? "Админ" is short. 
                   With w-full and flex-1, there is plenty of space for text. 
                   Let's show text on mobile too for clarity since we have a full row now.
                */}
                <span className="block md:hidden ml-2">
                  {t.adminPanel || "Админ"}
                </span>
              </Button>
            )}

            {(role === "ROLE_AGENT" || role === "ROLE_OPERATOR") && (
              <Button
                onClick={() => navigate("/agent")}
                variant={location.pathname === "/agent" ? "default" : "outline"}
                className={`h-10 w-full md:w-auto md:h-9 md:px-3 text-sm justify-center flex-1 md:flex-none transition-colors ${
                  location.pathname === "/agent"
                    ? "bg-purple-700 hover:bg-purple-800 text-white"
                    : "text-purple-700 border-purple-700 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                {role === "ROLE_OPERATOR" ? (
                  <Headset className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
                ) : (
                  <UserCog className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
                )}
                <span className="hidden md:block">
                  {role === "ROLE_OPERATOR"
                    ? t.operatorPanel || "Панель оператора"
                    : t.agentPanel || "Панель агента"}
                </span>
                <span className="block md:hidden ml-2">
                  {role === "ROLE_OPERATOR"
                    ? t.operatorPanel || "Оператор"
                    : t.agentPanel || "Агент"}
                </span>
              </Button>
            )}

            {/* Maps Link */}
            {(role === "ROLE_ADMIN" ||
              role === "ROLE_AGENT" ||
              role === "ROLE_OPERATOR") && (
              <Button
                onClick={() => navigate("/maps")}
                variant={location.pathname === "/maps" ? "default" : "outline"}
                className={`h-10 w-full md:w-auto md:h-9 md:px-3 text-sm justify-center flex-1 md:flex-none transition-colors ${
                  location.pathname === "/maps"
                    ? "bg-purple-700 hover:bg-purple-800 text-white"
                    : "text-purple-700 border-purple-700 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <Map className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden md:block">{t.maps || "Карты"}</span>
                <span className="block md:hidden ml-2">
                  {t.maps || "Карты"}
                </span>
              </Button>
            )}

            {/* Pharmacies Activity Link */}
            {role === "ROLE_ADMIN" && (
              <Button
                onClick={() => navigate("/pharmacies-activity")}
                variant={
                  location.pathname === "/pharmacies-activity"
                    ? "default"
                    : "outline"
                }
                className={`h-10 w-full md:w-auto md:h-9 md:px-3 text-sm justify-center flex-1 md:flex-none transition-colors ${
                  location.pathname === "/pharmacies-activity"
                    ? "bg-purple-700 hover:bg-purple-800 text-white"
                    : "text-purple-700 border-purple-700 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <Activity className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden md:block">Активности</span>
                <span className="block md:hidden ml-2">Активности</span>
              </Button>
            )}

            {/* New Pharmacies Link */}
            {role === "ROLE_ADMIN" && (
              <Button
                onClick={() => navigate("/new-pharmacies")}
                variant={
                  location.pathname === "/new-pharmacies"
                    ? "default"
                    : "outline"
                }
                className={`h-10 w-full md:w-auto md:h-9 md:px-3 text-sm justify-center flex-1 md:flex-none transition-colors ${
                  location.pathname === "/new-pharmacies"
                    ? "bg-purple-700 hover:bg-purple-800 text-white"
                    : "text-purple-700 border-purple-700 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <Store className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden md:block">Новые аптеки</span>
                <span className="block md:hidden ml-2">Новые</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
