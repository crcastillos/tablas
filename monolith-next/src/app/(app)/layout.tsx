"use client";

import AuthGuard from "@/frontend/components/AuthGuard";
import MainLayout from "@/frontend/layouts/MainLayout";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
