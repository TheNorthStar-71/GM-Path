"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  ChevronLeft,
  Target,
  Shield,
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (role !== "super_admin" && role !== "admin") {
      router.replace("/dashboard");
    }
  }, [session, status, role, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role !== "super_admin" && role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 bg-bg-secondary border-r border-border-subtle flex flex-col z-40">
        <div className="p-4 border-b border-border-subtle">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-rose/20 border border-accent-rose/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-accent-rose" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-text-primary leading-tight">
                Admin
              </h1>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">
                GM Path Control
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-2">
          <ul className="space-y-1">
            {adminNav.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? "bg-accent-rose/10 text-accent-rose border border-accent-rose/20"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                      }`}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-border-subtle">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <Target className="w-4 h-4" />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
