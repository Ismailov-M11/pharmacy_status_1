import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Globe, Map, Headset, UserCog, LayoutDashboard, LogOut } from "lucide-react";
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
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt={t.siteTitle || "Aptekalar holati"}
            className="w-12 h-12"
          />
          <div>
            <div className="font-bold text-xl text-purple-700">
              {t.siteTitle || "Aptekalar holati"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            {/* Panel Link based on Role */}
            {role === "ROLE_ADMIN" && (
              <Button
                onClick={() => navigate("/admin")}
                variant={location.pathname === "/admin" ? "default" : "outline"}
                className={`text-sm ${location.pathname === "/admin"
                  ? "bg-purple-700 hover:bg-purple-800 text-white"
                  : "text-purple-700 border-purple-700 hover:bg-purple-50"
                  }`}
              >
                {t.adminPanel || "Админ"}
              </Button>
            )}

            {(role === "ROLE_AGENT" || role === "ROLE_OPERATOR") && (
              <Button
                onClick={() => navigate("/agent")}
                variant={location.pathname === "/agent" ? "default" : "outline"}
                className={`text-sm ${location.pathname === "/agent"
                  ? "bg-purple-700 hover:bg-purple-800 text-white"
                  : "text-purple-700 border-purple-700 hover:bg-purple-50"
                  }`}
              >
                {/* Mobile Icon */}
                <span className="block md:hidden">
                  {role === "ROLE_OPERATOR" ? <Headset className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                </span>
                {/* Desktop Text */}
                <span className="hidden md:block">
                  {role === "ROLE_OPERATOR"
                    ? t.operatorPanel || "Панель оператора"
                    : t.agentPanel || "Панель агента"}
                </span>
              </Button>
            )}

            {/* Maps Link - Available for all authorized roles */}
            {(role === "ROLE_ADMIN" || role === "ROLE_AGENT" || role === "ROLE_OPERATOR") && (
              <Button
                onClick={() => navigate("/maps")}
                variant={location.pathname === "/maps" ? "default" : "outline"}
                className={`text-sm gap-2 ${location.pathname === "/maps"
                  ? "bg-purple-700 hover:bg-purple-800 text-white"
                  : "text-purple-700 border-purple-700 hover:bg-purple-50"
                  }`}
              >
                <Map className="h-4 w-4" />
                {t.maps || "Карты"}
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-purple-700"
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
            className="text-purple-700 border-purple-700 hover:bg-purple-50 hover:text-purple-700 text-sm"
          >
            {t.logout}
          </Button>
        </div>
      </div>
    </header>
  );
}
