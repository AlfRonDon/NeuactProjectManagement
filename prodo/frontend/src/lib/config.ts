// In production (HTTPS), use the Next.js API proxy to avoid mixed content.
// The proxy routes /api/proxy/* → Django backend.
export const API_BASE_URL =
  typeof window !== "undefined" && window.location.protocol === "https:"
    ? "" // Use relative URL → hits Next.js server → proxied to Django
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8420";

// When using the proxy, API paths become /api/proxy/projects/...
// When direct, they stay /api/projects/...
export const API_PREFIX =
  typeof window !== "undefined" && window.location.protocol === "https:"
    ? "/api/proxy"
    : "/api";
