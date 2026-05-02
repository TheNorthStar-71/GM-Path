"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  actorId: string;
  actorEmail: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  targetUser: { name: string | null; email: string | null } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_TYPES = [
  "",
  "user.created",
  "user.role_changed",
  "user.status_changed",
  "user.suspended",
  "user.unsuspended",
  "user.banned",
  "user.deleted",
  "user.password_reset",
  "user.password_changed",
  "user.sessions_cleared",
  "admin.login",
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 50, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (actionFilter) params.set("action", actionFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    try {
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchLogs(1), 300);
    return () => clearTimeout(debounce);
  }, [fetchLogs]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function formatValue(val: string | null): string {
    if (!val) return "—";
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-accent-rose" />
            Audit Log
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {pagination.total} total events
          </p>
        </div>
        <button
          onClick={exportJson}
          className="flex items-center gap-2 px-3 py-2 bg-bg-card border border-border-subtle text-text-secondary text-sm rounded-lg
            hover:text-text-primary"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
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
        <div className="flex items-end gap-4 p-4 bg-bg-card border border-border-subtle rounded-lg">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary px-3 py-2
                focus:outline-none focus:border-accent-rose/50"
            >
              <option value="">All actions</option>
              {ACTION_TYPES.filter(Boolean).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary px-3 py-2
                focus:outline-none focus:border-accent-rose/50"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary px-3 py-2
                focus:outline-none focus:border-accent-rose/50"
            />
          </div>
          <button
            onClick={() => { setActionFilter(""); setDateFrom(""); setDateTo(""); }}
            className="text-xs text-text-muted hover:text-text-primary pb-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-secondary/50">
                <th className="w-8" />
                <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Actor
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">
                  Target
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium text-xs uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="w-5 h-5 border-2 border-accent-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    No audit events found
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <>
                    <tr
                      key={entry.id}
                      className="border-b border-border-subtle/50 hover:bg-bg-hover/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                    >
                      <td className="px-2 py-3 text-center text-text-muted">
                        {expandedRow === entry.id ? (
                          <ChevronUp className="w-3.5 h-3.5 inline" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 inline" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-xs whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded text-xs bg-bg-hover text-text-secondary">
                          {entry.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-xs">
                        {entry.actorEmail}
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-xs">
                        {entry.targetUser?.email || entry.targetUser?.name || entry.targetId || "—"}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-xs">
                        {entry.ipAddress || "—"}
                      </td>
                    </tr>
                    {expandedRow === entry.id && (
                      <tr key={`${entry.id}-detail`} className="border-b border-border-subtle/50">
                        <td colSpan={6} className="px-6 py-4 bg-bg-secondary/30">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {entry.reason && (
                              <div>
                                <p className="text-text-muted mb-1">Reason</p>
                                <p className="text-text-secondary">{entry.reason}</p>
                              </div>
                            )}
                            {entry.oldValue && (
                              <div>
                                <p className="text-text-muted mb-1">Previous Value</p>
                                <pre className="text-text-secondary bg-bg-primary rounded p-2 overflow-x-auto">
                                  {formatValue(entry.oldValue)}
                                </pre>
                              </div>
                            )}
                            {entry.newValue && (
                              <div>
                                <p className="text-text-muted mb-1">New Value</p>
                                <pre className="text-text-secondary bg-bg-primary rounded p-2 overflow-x-auto">
                                  {formatValue(entry.newValue)}
                                </pre>
                              </div>
                            )}
                            {entry.userAgent && (
                              <div className="col-span-2">
                                <p className="text-text-muted mb-1">User Agent</p>
                                <p className="text-text-secondary truncate">{entry.userAgent}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
                onClick={() => fetchLogs(pagination.page - 1)}
                className="p-1.5 rounded border border-border-subtle text-text-muted hover:text-text-primary
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
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
