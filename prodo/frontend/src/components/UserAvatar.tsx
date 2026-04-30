"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

export default function UserAvatar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:ring-2 hover:ring-neutral-400 transition-all shrink-0"
      >
        {user?.initials ?? "U"}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <div className="text-sm font-semibold text-neutral-900">{user?.firstName} {user?.lastName}</div>
            <div className="text-xs text-neutral-500">{user?.email}</div>
            <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${user?.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
              {user?.role === "admin" ? "Admin" : "Engineer"}
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
