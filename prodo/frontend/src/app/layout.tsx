import type { Metadata } from "next";
import "./globals.css";
import { AuthWrapper } from "./AuthWrapper";

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
    <html lang="en">
      <body className="font-sans antialiased bg-neutral-50 text-neutral-950 m-0">
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}
