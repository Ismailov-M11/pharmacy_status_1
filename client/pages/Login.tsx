import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { login as apiLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const { language, setLanguage, t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiLogin({
        login: username,
        password: password,
      });

      // Relaxed validation: Check if user has authorities, regardless of token structure
      if (
        response.payload &&
        response.payload.user &&
        response.payload.user.authorities &&
        response.payload.user.authorities.length > 0
      ) {
        // Use provided token or a placeholder if missing (e.g. activationRequired case)
        const token = response.payload.token?.token || "auth_token_placeholder";

        const role = response.payload.user.authorities[0].authority as
          | "ROLE_AGENT"
          | "ROLE_ADMIN"
          | "ROLE_OPERATOR";

        const userData = {
          id: response.payload.user.id,
          username: response.payload.user.username,
          phone: response.payload.user.phone,
        };

        login(token, role, userData);

        if (role === "ROLE_ADMIN") {
          navigate("/admin");
        } else if (role === "ROLE_AGENT" || role === "ROLE_OPERATOR") {
          navigate("/agent");
        }
      } else {
        // Only show error if no authorities found
        if (response.payload?.token?.activationRequired) {
          setError(t.activationRequired || "Account activation required");
        } else {
          setError(t.invalidCredentials);
        }
      }
    } catch (err) {
      setError(t.loginError);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <img
              src="/logo.png"
              alt={t.siteTitle || "Aptekalar holati"}
              className="w-20 h-20 mb-4"
            />
            <h1 className="text-3xl font-bold text-center text-purple-700">
              {t.siteTitle || "Aptekalar holati"}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Pharmacy Management System
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setLanguage("ru")}
              className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${language === "ru"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              RU 🇷🇺
            </button>
            <button
              onClick={() => setLanguage("uz")}
              className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${language === "uz"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              UZ 🇺🇿
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.login}
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.enterLogin}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.password}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.enterPassword}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {isLoading ? t.loading : t.loginButton}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
