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

  // Navigation items for the hamburger menu
  const navigationItems = [];

  // Add role-specific and common navigation items
  if (role === "ROLE_ADMIN") {
    navigationItems.push(
      { label: t.adminPanel || "Админ", path: "/admin", icon: User },
      { label: t.maps || "Карты", path: "/maps", icon: Map },
      { label: "Активности", path: "/pharmacies-activity", icon: Activity },
      { label: "Новые аптеки", path: "/new-pharmacies", icon: Store },
    );
  } else if (role === "ROLE_AGENT" || role === "ROLE_OPERATOR") {
    const agentLabel =
      role === "ROLE_OPERATOR"
        ? t.operatorPanel || "Панель оператора"
        : t.agentPanel || "Панель агента";
    const agentIcon = role === "ROLE_OPERATOR" ? Headset : UserCog;
    navigationItems.push(
      {
        label: agentLabel,
        path: role === "ROLE_OPERATOR" ? "/operator" : "/agent",
        icon: agentIcon,
      },
      { label: t.maps || "Карты", path: "/maps", icon: Map },
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex flex-wrap items-center justify-between gap-y-3">
        {/* Hamburger Menu - Top Left */}
        <div className="order-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-purple-700 h-9 w-9 md:h-10 md:w-10"
                aria-label="Navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`cursor-pointer ${
                      isActive ? "bg-purple-50 text-purple-700" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
      </div>
    </header>
  );
}
