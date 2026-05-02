"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  profile: {
    ratingPuzzle: number;
    ratingBlitz: number | null;
    ratingRapid: number | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLES = ["", "super_admin", "admin", "coach", "premium", "user", "banned"];
const STATUSES = ["", "active", "inactive", "suspended", "banned", "pending_verification"];

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: "bg-accent-rose/20 text-accent-rose border-accent-rose/30",
    admin: "bg-accent-purple/20 text-accent-purple border-accent-purple/30",
    coach: "bg-accent-blue/20 text-accent-blue border-accent-blue/30",
    premium: "bg-accent-gold/20 text-accent-gold border-accent-gold/30",
    user: "bg-bg-hover text-text-secondary border-border-subtle",
    banned: "bg-red-900/20 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
        colors[role] || colors.user
      }`}
    >
      {role.replace("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-accent-emerald/20 text-accent-emerald",
    inactive: "bg-bg-hover text-text-muted",
    suspended: "bg-yellow-900/20 text-yellow-400",
    banned: "bg-red-900/20 text-red-400",
    pending_verification: "bg-accent-blue/20 text-accent-blue",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 25, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "25");
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return <span className="ml-1 text-accent-gold">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          User Management
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {pagination.total} total users
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-subtle rounded-lg text-sm
              text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-rose/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-text-muted hover:text-text-primary" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors
            ${showFilters
              ? "bg-accent-rose/10 border-accent-rose/20 text-accent-rose"
              : "bg-bg-card border-border-subtle text-text-secondary hover:text-text-primary"
            }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-4 p-4 bg-bg-card border border-border-subtle rounded-lg">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary px-3 py-2
                focus:outline-none focus:border-accent-rose/50"
            >
              <option value="">All roles</option>
              {ROLES.filter(Boolean).map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary px-3 py-2
                focus:outline-none focus:border-accent-rose/50"
            >
              <option value="">All statuses</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setRoleFilter(""); setStatusFilter(""); }}
            className="text-xs text-text-muted hover:text-text-primary self-end pb-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-secondary/50">
                {[
                  { label: "Name", field: "name" },
                  { label: "Email", field: "email" },
                  { label: "Role", field: "role" },
                  { label: "Status", field: "status" },
                  { label: "Rating", field: "" },
                  { label: "Last Login", field: "lastLoginAt" },
                  { label: "Created", field: "createdAt" },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    className={`text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider
                      ${field ? "cursor-pointer hover:text-text-primary" : ""}`}
                    onClick={() => field && handleSort(field)}
                  >
                    {label}
                    {field && <SortIndicator field={field} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="w-5 h-5 border-2 border-accent-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border-subtle/50 hover:bg-bg-hover/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <td className="py-3 px-4 text-text-primary font-medium">
                      {user.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {user.email || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {user.profile?.ratingPuzzle ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-text-muted text-xs">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="py-3 px-4 text-text-muted text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
            <p className="text-xs text-text-muted">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="p-1.5 rounded border border-border-subtle text-text-muted hover:text-text-primary
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="p-1.5 rounded border border-border-subtle text-text-muted hover:text-text-primary
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
