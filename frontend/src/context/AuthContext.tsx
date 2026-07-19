import { createContext, useContext, useEffect, useState } from "react";
import type {ReactNode} from "react";
import axios from "axios";
import { apiClient, setAccessToken, getAccessToken } from "../api/client";

interface Merchant {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  merchant: Merchant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshMerchant: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshMerchant() {
    try {
      const res = await apiClient.get("/merchants/me");
      setMerchant(res.data);
    } catch {
      setMerchant(null);
    }
  }

  async function logout() {
    await apiClient.post("/auth/logout");
    setAccessToken(null);
    setMerchant(null);
  }

 
  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        setAccessToken(res.data.accessToken);
        await refreshMerchant();
      } catch {
        setAccessToken(null);
        setMerchant(null);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        merchant,
        isLoading,
        isAuthenticated: !!merchant && !!getAccessToken(),
        refreshMerchant,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}