import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthWrapper } from "./AuthWrapper";
import GlobalHeader from "@/components/GlobalHeader";

export const metadata: Metadata = {
  title: "Neuact Project Management",
  description: "Voice-driven project management pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased bg-neutral-50 text-neutral-950 m-0">
        <AuthWrapper>
          <div className="h-screen flex flex-col overflow-hidden">
            <GlobalHeader />
            <div className="flex-1 min-h-0 overflow-hidden">
              {children}
            </div>
          </div>
        </AuthWrapper>
      </body>
    </html>
  );
}
