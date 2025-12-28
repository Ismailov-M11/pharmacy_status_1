import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt={t.siteTitle || "Aptekalar holati"} className="w-12 h-12" />
          <div>
            <div className="font-bold text-xl text-purple-700">
              {t.siteTitle || "Aptekalar holati"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-purple-700">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('ru')} className={language === 'ru' ? 'bg-purple-50 text-purple-700' : ''}>
                🇷🇺 Русский
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('uz')} className={language === 'uz' ? 'bg-purple-50 text-purple-700' : ''}>
                🇺🇿 O'zbekcha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-purple-700 border-purple-700 hover:bg-purple-50 hover:text-purple-700"
          >
            {t.logout}
          </Button>
        </div>
      </div>
    </header>
  );
}
