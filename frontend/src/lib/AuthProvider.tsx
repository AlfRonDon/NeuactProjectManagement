"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getKeycloak } from "./keycloak";
import type Keycloak from "keycloak-js";

interface AuthUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  role: "admin" | "engineer" | "unknown";
}

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  user: AuthUser | null;
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  user: null,
  token: null,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Module-level flag — survives re-renders and strict mode double-mount
let _kcInitialized = false;
let _kcPromise: Promise<boolean> | null = null;

function initKeycloak(keycloak: Keycloak): Promise<boolean> {
  if (_kcInitialized && keycloak.authenticated !== undefined) {
    return Promise.resolve(keycloak.authenticated ?? false);
  }
  if (_kcPromise) return _kcPromise;

  _kcPromise = keycloak
    .init({
      onLoad: "login-required",
      checkLoginIframe: false,
      pkceMethod: "S256",
    })
    .then((auth) => {
      _kcInitialized = true;
      return auth;
    });

  return _kcPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const kcRef = useRef<Keycloak | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const keycloak = getKeycloak();
    kcRef.current = keycloak;

    initKeycloak(keycloak).then((auth) => {
      setAuthenticated(auth);
      if (auth && keycloak.tokenParsed) {
        const tp = keycloak.tokenParsed as any;
        const firstName = tp.given_name || "";
        const lastName = tp.family_name || "";
        const username = tp.preferred_username || "";
        const roles: string[] = tp.roles || tp.realm_access?.roles || [];
        const role = roles.includes("admin") ? "admin" as const : roles.includes("engineer") ? "engineer" as const : "unknown" as const;
        setUser({
          username,
          email: tp.email || "",
          firstName,
          lastName,
          initials: (firstName[0] || username[0] || "U").toUpperCase(),
          role,
        });
        setToken(keycloak.token || null);
      }
      setLoading(false);

      // Auto-refresh token (only set once)
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          keycloak.updateToken(30).then((refreshed) => {
            if (refreshed) setToken(keycloak.token || null);
          }).catch(() => {
            keycloak.login();
          });
        }, 30000);
      }

      keycloak.onTokenExpired = () => {
        keycloak.updateToken(30).then(() => {
          setToken(keycloak.token || null);
        });
      };
    }).catch(() => {
      setLoading(false);
      setAuthenticated(false);
    });
  }, []);

  const logout = useCallback(() => {
    if (kcRef.current) {
      _kcInitialized = false;
      _kcPromise = null;
      kcRef.current.logout({ redirectUri: window.location.origin });
    }
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-sm font-bold mx-auto">N</div>
          <div className="text-sm text-neutral-500">Signing in...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authenticated, loading, user, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
