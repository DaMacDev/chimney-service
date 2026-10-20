import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "@vodkadav/ui/ui.css";
import { adminCopy } from "@/lib/admin/copy";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: adminCopy.title,
  robots: { index: false, follow: false },
};

/** Root layout for the owner's /admin tool (Spanish only, outside the locale routes). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-background text-foreground font-sans antialiased">{children}</body>
    </html>
  );
}
