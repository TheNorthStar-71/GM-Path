"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Activity,
  Crown,
  ShieldAlert,
  TrendingUp,
  Clock,
  Database,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  newSignups: { today: number; week: number; month: number };
  activeUsers: { day: number; week: number; month: number };
  signupTrend: { date: string; count: number }[];
  recentAudit: {
    id: string;
    action: string;
    actorEmail: string;
    targetId: string | null;
    createdAt: string;
  }[];
  systemHealth: { dbLatencyMs: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-accent-rose py-12">
        {error || "Failed to load dashboard data"}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-accent-blue",
      bg: "bg-accent-blue/10",
    },
    {
      label: "New Today",
      value: stats.newSignups.today,
      icon: UserPlus,
      color: "text-accent-emerald",
      bg: "bg-accent-emerald/10",
    },
    {
      label: "Active (24h)",
      value: stats.activeUsers.day,
      icon: Activity,
      color: "text-accent-gold",
      bg: "bg-accent-gold/10",
    },
    {
      label: "Premium",
      value: stats.usersByRole.premium || 0,
      icon: Crown,
      color: "text-accent-purple",
      bg: "bg-accent-purple/10",
    },
    {
      label: "Suspended",
      value: stats.usersByStatus.suspended || 0,
      icon: ShieldAlert,
      color: "text-accent-rose",
      bg: "bg-accent-rose/10",
    },
    {
      label: "DB Latency",
      value: `${stats.systemHealth.dbLatencyMs}ms`,
      icon: Database,
      color: "text-text-secondary",
      bg: "bg-bg-hover",
    },
  ];

  const roleChartData = Object.entries(stats.usersByRole).map(([role, count]) => ({
    role: role.replace("_", " "),
    count,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Admin Dashboard
          </h1>
          <p className="text-sm text-text-muted mt-1">
            System overview and user management
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/users")}
          className="px-4 py-2 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm rounded-lg
            hover:bg-accent-rose/20 transition-colors"
        >
          Manage Users
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-bg-card border border-border-subtle rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-text-primary">{card.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signup Trend */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-accent-emerald" />
            <h2 className="text-sm font-semibold text-text-primary">
              Signups (Last 30 Days)
            </h2>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.signupTrend}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#16162a",
                    border: "1px solid #1f2937",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#e8e6e3" }}
                  itemStyle={{ color: "#34d399" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#34d399"
                  fill="url(#signupGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Users by Role */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-semibold text-text-primary">
              Users by Role
            </h2>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChartData}>
                <XAxis
                  dataKey="role"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#16162a",
                    border: "1px solid #1f2937",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#e8e6e3" }}
                  itemStyle={{ color: "#60a5fa" }}
                />
                <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Active Users
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Last 24h</span>
              <span className="text-sm font-bold text-text-primary">{stats.activeUsers.day}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Last 7 days</span>
              <span className="text-sm font-bold text-text-primary">{stats.activeUsers.week}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Last 30 days</span>
              <span className="text-sm font-bold text-text-primary">{stats.activeUsers.month}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
            <UserPlus className="w-3 h-3" />
            New Signups
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Today</span>
              <span className="text-sm font-bold text-text-primary">{stats.newSignups.today}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">This week</span>
              <span className="text-sm font-bold text-text-primary">{stats.newSignups.week}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">This month</span>
              <span className="text-sm font-bold text-text-primary">{stats.newSignups.month}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            By Status
          </p>
          <div className="space-y-2">
            {Object.entries(stats.usersByStatus).map(([st, count]) => (
              <div key={st} className="flex justify-between items-center">
                <span className="text-sm text-text-secondary capitalize">
                  {st.replace("_", " ")}
                </span>
                <span className="text-sm font-bold text-text-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Log */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
          <button
            onClick={() => router.push("/admin/audit")}
            className="text-xs text-accent-rose hover:underline"
          >
            View full log
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-2 px-2 text-text-muted font-medium text-xs">
                  Action
                </th>
                <th className="text-left py-2 px-2 text-text-muted font-medium text-xs">
                  Actor
                </th>
                <th className="text-left py-2 px-2 text-text-muted font-medium text-xs">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAudit.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border-subtle/50 hover:bg-bg-hover/50"
                >
                  <td className="py-2 px-2 text-text-primary">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-bg-hover text-text-secondary">
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-text-secondary text-xs">
                    {entry.actorEmail}
                  </td>
                  <td className="py-2 px-2 text-text-muted text-xs">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {stats.recentAudit.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-text-muted">
                    No audit events yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
