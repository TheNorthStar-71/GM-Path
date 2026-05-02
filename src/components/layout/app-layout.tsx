"use client";

import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="ml-[220px] min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
