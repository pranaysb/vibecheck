"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: "CREATOR" | "REVIEWER" | "EXPERT" | "ADMIN";
  reputationPoints: number;
  bio: string | null;
  githubUrl: string | null;
}

export interface DemoUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  role: "CREATOR" | "REVIEWER" | "EXPERT" | "ADMIN";
  reputationPoints: number;
}

interface UserContextType {
  currentUser: CurrentUser | null;
  demoUsers: DemoUser[];
  isLoading: boolean;
  switchUser: (userId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/switch-user");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.currentUser);
        setDemoUsers(data.demoUsers || []);
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const switchUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to switch persona:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        demoUsers,
        isLoading,
        switchUser,
        refreshUser: fetchSession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
