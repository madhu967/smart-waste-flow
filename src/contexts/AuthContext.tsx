import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { onAuthStateChanged } from "@/services/authService";
import { User as FirestoreUser } from "@/types/database";
import { getUser } from "@/services/firestoreService";

export type UserRole = "user" | "weekly_collector" | "spot_collector" | "admin";

interface AuthContextType {
  user: FirestoreUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    city: string;
    street: string;
    address: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setLoading(true);
      setError(null);

      if (authUser) {
        try {
          let firestoreUser = await getUser(authUser.uid);

          // If not a regular user, check if it's a collector
          if (!firestoreUser) {
            const { getCollectorByUid, getCollectorByEmail } =
              await import("@/services/firestoreService");
            firestoreUser = await getCollectorByUid(authUser.uid);

            // Fallback: if no collector found by uid, try by email
            if (!firestoreUser && authUser.email) {
              firestoreUser = await getCollectorByEmail(authUser.email);
            }
          }

          setUser(firestoreUser);
        } catch (err: any) {
          setError(err.message);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { signInUser } = await import("@/services/authService");
      const firestoreUser = await signInUser(email, password);
      setUser(firestoreUser);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    name: string;
    city: string;
    street: string;
    address: string;
    phone?: string;
  }) => {
    try {
      setError(null);
      const { signUpUser } = await import("@/services/authService");
      const firestoreUser = await signUpUser(
        data.email,
        data.password,
        data.name,
        data.city,
        data.street,
        data.address,
        data.phone,
      );
      setUser(firestoreUser);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { signOutUser } = await import("@/services/authService");
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
