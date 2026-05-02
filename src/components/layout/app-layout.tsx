"use client";

import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="min-h-screen pl-[220px]">
        <div className="mx-auto w-full px-6 py-7 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
