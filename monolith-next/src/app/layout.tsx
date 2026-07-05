import type { Metadata } from "next";
import AppProviders from "@/frontend/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finanzas del Hogar",
  description: "Monolito Next con paridad funcional de frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
