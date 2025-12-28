import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

export type UserRole = "ROLE_AGENT" | "ROLE_ADMIN" | "ROLE_OPERATOR";

export interface User {
  id: number;
  username: string;
  phone: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  role: UserRole | null;
  user: User | null;
  login: (token: string, role: UserRole, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("user_role") as UserRole | null;
    const savedUser = localStorage.getItem("user_data");

    if (savedToken && savedRole && savedUser) {
      setToken(savedToken);
      setRole(savedRole);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, newRole: UserRole, newUser: User) => {
    setToken(newToken);
    setRole(newRole);
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("user_role", newRole);
    localStorage.setItem("user_data", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_data");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, role, user, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
