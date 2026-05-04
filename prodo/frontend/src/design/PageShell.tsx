"use client";

import React from "react";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  contentMode?: "padded" | "scroll" | "flush";
}

/**
 * Page content shell — header is now in GlobalHeader (layout.tsx).
 * This just provides the content area with the right padding/overflow mode.
 */
export default function PageShell({ children, contentMode = "padded" }: PageShellProps) {
  const contentClass =
    contentMode === "scroll"  ? "h-full overflow-y-auto p-5 space-y-5" :
    contentMode === "padded"  ? "h-full overflow-hidden p-3" :
    /* flush */                 "h-full overflow-hidden";

  return (
    <div className={contentClass}>
      {children}
    </div>
  );
}
