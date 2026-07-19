import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useMutation } from "@apollo/client/react";
import { LOGIN_USER, REGISTER_USER } from "@/lib/graphql/mutations";

export type UserRole =
  | "student"
  | "trainer"
  | "admin"
  | "super_admin"
  | "mentor"
  | "client";

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  enrolledCourses?: string[];
  completedCourses?: string[];
  school?: string;
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
  isFirst?: boolean;
  studentProfile?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    skipState?: boolean
  ) => Promise<{
    token?: string;
    user?: User;
    requires2FA?: boolean;
    requires2FASetup?: boolean;
  }>;
  signup: (
    data: SignupData,
    skipState?: boolean
  ) => Promise<{
    token?: string;
    user?: User;
  }>;
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

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  /**
   * LOAD USER FROM LOCAL STORAGE
   */
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;

    const savedUser = localStorage.getItem("ihub_user");

    if (!savedUser) return null;

    try {
      const parsedUser = JSON.parse(savedUser);

      return {
        ...parsedUser,
        isFirst:
          parsedUser.isFirst !== undefined
            ? parsedUser.isFirst
            : true,
      };
    } catch (e) {
      console.error("Failed to parse saved user", e);

      localStorage.removeItem("ihub_user");
      localStorage.removeItem("ihub_token");

      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const [loginMutation] = useMutation(LOGIN_USER);
  const [registerMutation] = useMutation(REGISTER_USER);

  /**
   * VERIFY LOCAL STORAGE
   */
  useEffect(() => {
    const savedToken = localStorage.getItem("ihub_token");
    const savedUser = localStorage.getItem("ihub_user");

    if (!savedToken || !savedUser) {
      setUser(null);

      localStorage.removeItem("ihub_user");
      localStorage.removeItem("ihub_token");
    }
  }, []);

  /**
   * LOGIN
   */
  const login = async (
    email: string,
    password: string,
    skipState: boolean = false
  ) => {
    setIsLoading(true);

    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });

      const loginData = (data as any)?.login;
      if (!loginData) {
        throw new Error("Invalid credentials or account not found");
      }

      const {
        token,
        user: userData,
        requires2FA,
        requires2FASetup,
      } = loginData;

      if (!token) {
        throw new Error("Login failed — no authentication token returned");
      }

      if (requires2FA || requires2FASetup) {
        return {
          user: userData,
          requires2FA,
          requires2FASetup,
        };
      }

      const appUser: User = {
        id: userData.id,
        email: userData.email,
        fullName:
          userData.username || userData.fullName,
        role: userData.role || "student",
        createdAt:
          userData.createdAt ||
          new Date().toISOString(),

        themePreference: userData.themePreference,
        avatar: userData.avatar,
        title: userData.title,
        bio: userData.bio,
        phone: userData.phone,
        location: userData.location,

        xp: userData.xp || 0,
        level: userData.level || 1,
        streak: userData.streak || 0,

        badges: userData.badges || [],

        certificateName:
          userData.certificateName || "",

        completedCourses:
          userData.completedCourses?.map(
            (c: any) => c.id || c
          ) || [],

        enrolledCourses:
          userData.enrolledCourses?.map(
            (c: any) => c.id || c
          ) || [],

        school: userData.school,

        // IMPORTANT
        isFirst:
          userData.isFirst !== undefined
            ? userData.isFirst
            : true,
      };

      if (!skipState) {
        localStorage.setItem(
          "ihub_token",
          token
        );

        localStorage.setItem(
          "ihub_user",
          JSON.stringify(appUser)
        );

        setUser(appUser);
      }

      return { token, user: appUser };
    } catch (err: any) {
      throw new Error(
        err.message || "Login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * SIGNUP
   */
  const signup = async (
    data: SignupData,
    skipState: boolean = false
  ) => {
    setIsLoading(true);

    try {
      const { data: resData } =
        await registerMutation({
          variables: {
            username:
              data.email.split("@")[0],

            fullName: data.fullName,
            email: data.email,
            password: data.password,
          },
        });

      const {
        token,
        user: userData,
      } = (resData as any).register;

      const appUser: User = {
        id: userData.id,
        email: userData.email,

        fullName:
          userData.username ||
          userData.fullName,

        role: "student",

        createdAt:
          userData.createdAt ||
          new Date().toISOString(),

        themePreference:
          userData.themePreference,

        avatar: userData.avatar,
        phone: userData.phone,
        location: userData.location,

        xp: userData.xp || 0,
        level: userData.level || 1,
        streak: userData.streak || 0,

        badges: [],

        certificateName: "",

        // IMPORTANT
        isFirst:
          userData.isFirst !== undefined
            ? userData.isFirst
            : true,
      };

      if (!skipState) {
        localStorage.setItem(
          "ihub_token",
          token
        );

        localStorage.setItem(
          "ihub_user",
          JSON.stringify(appUser)
        );

        setUser(appUser);
      }

      return { token, user: appUser };
    } catch (err: any) {
      throw new Error(
        err.message || "Signup failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * LOGOUT
   */
  const logout = () => {
    setUser(null);

    localStorage.removeItem("ihub_user");
    localStorage.removeItem("ihub_token");

    window.location.reload();
  };

  /**
   * UPDATE USER
   */
  const updateUser = (
    data: Partial<User>
  ) => {
    setUser((prev) => {
      if (!prev) return prev;

      const updatedUser = {
        ...prev,
        ...data,
      };

      localStorage.setItem(
        "ihub_user",
        JSON.stringify(updatedUser)
      );

      return updatedUser;
    });
  };

  /**
   * LOGIN WITH TOKEN
   */
  const loginWithToken = (
    token: string,
    userData: any
  ) => {
    localStorage.setItem(
      "ihub_token",
      token
    );

    const appUser: User = {
      id: userData.id,
      email: userData.email,

      fullName:
        userData.username ||
        userData.fullName,

      role: userData.role || "student",

      createdAt:
        userData.createdAt ||
        new Date().toISOString(),

      themePreference:
        userData.themePreference,

      avatar: userData.avatar,
      title: userData.title,
      bio: userData.bio,
      phone: userData.phone,
      location: userData.location,

      xp: userData.xp || 0,
      level: userData.level || 1,
      streak: userData.streak || 0,

      badges: userData.badges || [],

      certificateName:
        userData.certificateName || "",

      completedCourses:
        userData.completedCourses?.map(
          (c: any) => c.id || c
        ) || [],

      enrolledCourses:
        userData.enrolledCourses?.map(
          (c: any) => c.id || c
        ) || [],

      school: userData.school,

      // IMPORTANT
      isFirst:
        userData.isFirst !== undefined
          ? userData.isFirst
          : true,
    };

    setUser(appUser);

    localStorage.setItem(
      "ihub_user",
      JSON.stringify(appUser)
    );
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

/**
 * USE AUTH HOOK
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}