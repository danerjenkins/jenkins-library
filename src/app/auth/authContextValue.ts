import { createContext } from "react";
import type { AppSession } from "../../services/auth";

export type AuthContextValue = {
  canEdit: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  session: AppSession | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
