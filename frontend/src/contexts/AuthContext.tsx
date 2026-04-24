import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "@apollo/client/react";
import { LOGIN_USER, REGISTER_USER } from "@/lib/graphql/mutations";

export type UserRole = "student" | "trainer" | "admin" | "super_admin" | "mentor";

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  enrolledCourses?: string[];
  completedCourses?: string[];
  createdAt: string;
  title?: string;
  bio?: string;
  phone?: string;
  location?: string;
  themePreference?: {
    primaryColor?: string;
    mode?: string;
    lightBg?: string;
    darkBg?: string;
  };
  xp?: number;
  level?: number;
  streak?: number;
  badges?: Array<{
    badge: {
      id: string;
      title: string;
      icon: string;
      description: string;
    };
    awardedAt: string;
  }>;
  certificateName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    token?: string;
    user?: User;
    requires2FA?: boolean;
    requires2FASetup?: boolean;
  }>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  loginWithToken: (token: string, userData: any) => void;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for UI development
const mockUsers: Record<string, User & { password: string }> = {
  "student@codemande.com": {
    id: "1",
    email: "student@codemande.com",
    fullName: "Jean Baptiste",
    role: "student",
    password: "student123",
    enrolledCourses: ["software-dev", "data-science"],
    completedCourses: [],
    createdAt: new Date().toISOString(),
  },
  "trainer@codemande.com": {
    id: "2",
    email: "trainer@codemande.com",
    fullName: "Marie Claire",
    role: "trainer",
    password: "trainer123",
    createdAt: new Date().toISOString(),
  },
  "admin@codemande.com": {
    id: "3",
    email: "admin@codemande.com",
    fullName: "Emmanuel Kwizera",
    role: "admin",
    password: "admin123",
    createdAt: new Date().toISOString(),
  },
  "superadmin@codemande.com": {
    id: "4",
    email: "superadmin@codemande.com",
    fullName: "Sarah Uwimana",
    role: "super_admin",
    password: "super123",
    createdAt: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loginMutation] = useMutation(LOGIN_USER);
  const [registerMutation] = useMutation(REGISTER_USER);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem("codemande_user");
    const savedToken = localStorage.getItem("codemande_token");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("codemande_user");
        localStorage.removeItem("codemande_token");
      }
    } else {
      // Clear half-logged sessions
      localStorage.removeItem("codemande_user");
      localStorage.removeItem("codemande_token");
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await loginMutation({
        variables: { email, password }
      });

      const { token, user: userData, requires2FA, requires2FASetup } = (data as any).login;

      if (requires2FA || requires2FASetup) {
        return { user: userData, requires2FA, requires2FASetup };
      }

      // Store Token
      localStorage.setItem("codemande_token", token);

      // Adapt backend user to frontend User interface (mapping fields)
      const appUser: User = {
        id: userData.id,
        email: userData.email,
        fullName: userData.username || userData.fullName,
        role: userData.role || "student",
        createdAt: new Date().toISOString(),
        themePreference: userData.themePreference,
        avatar: userData.avatar,
        title: userData.title,
        bio: userData.bio,
        phone: userData.phone,
        location: userData.location,
        xp: userData.xp,
        level: userData.level,
        streak: userData.streak,
        badges: userData.badges,
        certificateName: userData.certificateName,
        completedCourses: userData.completedCourses?.map((c: any) => (c.id || c)) || [],
        enrolledCourses: userData.enrolledCourses?.map((c: any) => (c.id || c)) || []
      };

      setUser(appUser);
      localStorage.setItem("codemande_user", JSON.stringify(appUser));
      return { token, user: appUser };
    } catch (err: any) {
      throw new Error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    try {
      const { data: resData } = await registerMutation({
        variables: {
          username: data.email.split('@')[0], // derived username
          fullName: data.fullName,
          email: data.email,
          password: data.password
        }
      });

      const { token, user: userData } = (resData as any).register;

      localStorage.setItem("codemande_token", token);

      const appUser: User = {
        id: userData.id,
        email: userData.email,
        fullName: userData.username,
        role: "student",
        createdAt: new Date().toISOString(),
        themePreference: userData.themePreference,
        avatar: userData.avatar,
        xp: userData.xp || 0,
        level: userData.level || 1,
        streak: userData.streak || 0,
        badges: [],
        certificateName: ""
      };

      setUser(appUser);
      localStorage.setItem("codemande_user", JSON.stringify(appUser));
    } catch (err: any) {
      throw new Error(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("codemande_user");
    localStorage.removeItem("codemande_token");
    window.location.reload(); // clear apollo cache by force reload or use client.resetStore()
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("codemande_user", JSON.stringify(updatedUser));
    }
  };

  const loginWithToken = (token: string, userData: any) => {
    localStorage.setItem("codemande_token", token);
    const appUser: User = {
      id: userData.id,
      email: userData.email,
      fullName: userData.username || userData.fullName,
      role: userData.role || "student",
      createdAt: new Date().toISOString(),
      themePreference: userData.themePreference,
      avatar: userData.avatar,
      title: userData.title,
      bio: userData.bio,
      phone: userData.phone,
      location: userData.location,
      xp: userData.xp,
      level: userData.level,
      streak: userData.streak,
      badges: userData.badges,
      certificateName: userData.certificateName,
      completedCourses: userData.completedCourses?.map((c: any) => (c.id || c)) || [],
      enrolledCourses: userData.enrolledCourses?.map((c: any) => (c.id || c)) || []
    };
    setUser(appUser);
    localStorage.setItem("codemande_user", JSON.stringify(appUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        loginWithToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
