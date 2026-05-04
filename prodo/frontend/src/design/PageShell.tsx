"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import {
  PAGE_SHELL, PAGE_HEADER, HEADER_BACK_BTN, HEADER_BACK_ICON,
  HEADER_LOGO, HEADER_TITLE,
} from "./tokens";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  /** Extra elements rendered in the header between title and avatar */
  headerRight?: React.ReactNode;
  /** Padding mode for content area */
  contentMode?: "padded" | "scroll" | "flush";
}

/**
 * Shared page layout shell used by all sub-pages.
 * Provides consistent header (back arrow, logo, serif title, user avatar)
 * and a content area below.
 */
export default function PageShell({ title, children, headerRight, contentMode = "padded" }: PageShellProps) {
  const contentClass =
    contentMode === "scroll"  ? "flex-1 overflow-y-auto p-5 space-y-5" :
    contentMode === "padded"  ? "flex-1 overflow-hidden min-h-0 p-3" :
    /* flush */                 "flex-1 overflow-hidden min-h-0";

  return (
    <div className={PAGE_SHELL}>
      <div className={PAGE_HEADER}>
        <Link href="/" className={HEADER_BACK_BTN}>
          <ArrowLeft className={HEADER_BACK_ICON} />
        </Link>
        <img src="/logo.png" alt="Logo" className={HEADER_LOGO} />
        <span className={HEADER_TITLE}>{title}</span>
        <div className="flex-1" />
        {headerRight}
        <UserAvatar />
      </div>
      <div className={contentClass}>
        {children}
      </div>
    </div>
  );
}
