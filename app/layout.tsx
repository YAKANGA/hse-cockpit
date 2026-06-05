import type { Metadata } from "next";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { tenants } from "@/lib/tenant-data";
import "./globals.css";

export const metadata: Metadata = {
  title: "HSE Cockpit",
  description: "Application HSE avec tableaux de bord dynamiques, imports Excel et rapports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <TenantThemeProvider tenants={tenants} />
        {children}
      </body>
    </html>
  );
}
