"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  User,
  Mail,
  Calendar,
  Globe,
  Clock,
  AlertTriangle,
  Ban,
  Unlock,
  KeyRound,
  LogOut,
  Gamepad2,
  Puzzle,
  Target,
  TrendingUp,
} from "lucide-react";

interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  suspendedAt: string | null;
  suspendedUntil: string | null;
  suspendReason: string | null;
  bannedAt: string | null;
  banReason: string | null;
  profile: {
    ratingPuzzle: number;
    ratingBlitz: number | null;
    ratingRapid: number | null;
    ratingClassical: number | null;
    ratingFide: number | null;
    goal: string;
    hoursPerWeek: number;
    improvementTrack: string;
    primaryWeakness: string | null;
    secondaryWeakness: string | null;
    strengthArea: string | null;
    onboardingComplete: boolean;
  } | null;
  stats: {
    gameCount: number;
    puzzleAttemptCount: number;
    botGameCount: number;
  };
  progress: {
    streakDays: number | null;
    ratingPuzzle: number | null;
    tacticalAccuracy: number | null;
    calculationDepth: number | null;
    endgameAccuracy: number | null;
    openingRetention: number | null;
  } | null;
  loginHistory: {
    id: string;
    ip: string | null;
    userAgent: string | null;
    success: boolean;
    failureReason: string | null;
    createdAt: string;
  }[];
  auditEvents: {
    id: string;
    action: string;
    actorEmail: string;
    oldValue: string | null;
    newValue: string | null;
    reason: string | null;
    createdAt: string;
  }[];
}

interface ActionModalState {
  type: "suspend" | "ban" | "reset-password" | null;
  reason: string;
  duration: string;
}

const ROLES = ["super_admin", "admin", "coach", "premium", "user", "banned"];

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
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[role] || colors.user}`}>
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
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionModal, setActionModal] = useState<ActionModalState>({
    type: null, reason: "", duration: "7d",
  });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error("Failed to load user");
      const data = await res.json();
      setUser(data);
      setSelectedRole(data.role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoleChange = async () => {
    if (!user || selectedRole === user.role) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      showToast("Role updated");
      fetchUser();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal.type) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { action: actionModal.type };
      if (actionModal.reason) body.reason = actionModal.reason;
      if (actionModal.type === "suspend") body.duration = actionModal.duration;

      const res = await fetch(`/api/admin/users/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      if (actionModal.type === "reset-password" && data.tempPassword) {
        setTempPassword(data.tempPassword);
      }
      showToast(data.message || "Action completed");
      setActionModal({ type: null, reason: "", duration: "7d" });
      fetchUser();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(data.message || "Done");
      fetchUser();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-accent-rose mb-4">{error || "User not found"}</p>
        <button onClick={() => router.push("/admin/users")} className="text-sm text-accent-rose underline">
          Back to users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm shadow-lg border
          ${toast.type === "success"
            ? "bg-accent-emerald/20 border-accent-emerald/30 text-accent-emerald"
            : "bg-accent-rose/20 border-accent-rose/30 text-accent-rose"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Temp password popup */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-text-primary mb-2">Temporary Password</h3>
            <p className="text-sm text-text-secondary mb-4">
              Share this with the user securely. It will not be shown again.
            </p>
            <code className="block bg-bg-primary border border-border-subtle rounded-lg p-3 text-accent-gold text-sm font-mono break-all mb-4">
              {tempPassword}
            </code>
            <button
              onClick={() => setTempPassword(null)}
              className="w-full py-2 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm rounded-lg hover:bg-accent-rose/20"
            >
              I&apos;ve copied it
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.type && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-text-primary mb-4 capitalize">
              {actionModal.type.replace("-", " ")} User
            </h3>
            {(actionModal.type === "suspend" || actionModal.type === "ban") && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Reason *</label>
                  <textarea
                    value={actionModal.reason}
                    onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                    className="w-full bg-bg-secondary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary
                      focus:outline-none focus:border-accent-rose/50 resize-none"
                    rows={3}
                    placeholder="Reason for this action..."
                  />
                </div>
                {actionModal.type === "suspend" && (
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Duration</label>
                    <select
                      value={actionModal.duration}
                      onChange={(e) => setActionModal({ ...actionModal, duration: e.target.value })}
                      className="w-full bg-bg-secondary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary
                        focus:outline-none focus:border-accent-rose/50"
                    >
                      <option value="24h">24 hours</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                      <option value="90d">90 days</option>
                    </select>
                  </div>
                )}
              </div>
            )}
            {actionModal.type === "reset-password" && (
              <p className="text-sm text-text-secondary">
                This will generate a new temporary password and invalidate the current one.
              </p>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setActionModal({ type: null, reason: "", duration: "7d" })}
                className="flex-1 py-2 bg-bg-hover border border-border-subtle text-text-secondary text-sm rounded-lg hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={saving || ((actionModal.type === "suspend" || actionModal.type === "ban") && !actionModal.reason)}
                className="flex-1 py-2 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm rounded-lg
                  hover:bg-accent-rose/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/users")}
          className="p-2 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-text-primary">
            {user.name || "Unnamed User"}
          </h1>
          <p className="text-sm text-text-muted">{user.email}</p>
        </div>
        <RoleBadge role={user.role} />
        <StatusBadge status={user.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Identity + Actions */}
        <div className="space-y-6">
          {/* Identity */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <User className="w-4 h-4 text-accent-blue" />
              Identity
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-3.5 h-3.5 text-text-muted" />
                {user.email || "No email"}
                {user.emailVerified && (
                  <span className="text-xs text-accent-emerald">verified</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="w-3.5 h-3.5 text-text-muted" />
                Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
              </div>
              {user.lastLoginIp && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Globe className="w-3.5 h-3.5 text-text-muted" />
                  IP: {user.lastLoginIp}
                </div>
              )}
              {user.suspendReason && (
                <div className="mt-2 p-2 bg-yellow-900/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                  Suspended: {user.suspendReason}
                  {user.suspendedUntil && (
                    <span className="block mt-1">
                      Until: {new Date(user.suspendedUntil).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              {user.banReason && (
                <div className="mt-2 p-2 bg-red-900/10 border border-red-500/20 rounded text-xs text-red-400">
                  Banned: {user.banReason}
                </div>
              )}
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent-rose" />
              Account Actions
            </h2>

            {/* Role change */}
            <div>
              <label className="text-xs text-text-muted mb-1 block">Change Role</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="flex-1 bg-bg-secondary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary
                    focus:outline-none focus:border-accent-rose/50"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRoleChange}
                  disabled={saving || selectedRole === user.role}
                  className="px-3 py-2 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm rounded-lg
                    hover:bg-accent-rose/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {user.status !== "suspended" ? (
                <button
                  onClick={() => setActionModal({ type: "suspend", reason: "", duration: "7d" })}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border
                    border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/20"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => handleQuickAction("unsuspend")}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border
                    border-accent-emerald/30 text-accent-emerald hover:bg-accent-emerald/10"
                >
                  <Unlock className="w-3 h-3" />
                  Unsuspend
                </button>
              )}
              <button
                onClick={() => setActionModal({ type: "ban", reason: "", duration: "7d" })}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border
                  border-red-500/30 text-red-400 hover:bg-red-900/20"
              >
                <Ban className="w-3 h-3" />
                Ban
              </button>
              <button
                onClick={() => setActionModal({ type: "reset-password", reason: "", duration: "7d" })}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border
                  border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10"
              >
                <KeyRound className="w-3 h-3" />
                Reset PW
              </button>
              <button
                onClick={() => handleQuickAction("force-logout")}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border
                  border-border-subtle text-text-secondary hover:bg-bg-hover"
              >
                <LogOut className="w-3 h-3" />
                Force Logout
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Training Profile */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-gold" />
              Training Profile
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-text-muted text-xs">Puzzle Rating</p>
                <p className="text-text-primary font-bold text-lg">{user.profile?.ratingPuzzle ?? "—"}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Blitz</p>
                <p className="text-text-primary font-bold text-lg">{user.profile?.ratingBlitz ?? "—"}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Rapid</p>
                <p className="text-text-primary font-bold text-lg">{user.profile?.ratingRapid ?? "—"}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Classical</p>
                <p className="text-text-primary font-bold text-lg">{user.profile?.ratingClassical ?? "—"}</p>
              </div>
            </div>
            {user.profile && (
              <div className="pt-2 border-t border-border-subtle space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Goal</span>
                  <span className="text-text-secondary capitalize">{user.profile.goal.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Track</span>
                  <span className="text-text-secondary capitalize">{user.profile.improvementTrack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Hours/Week</span>
                  <span className="text-text-secondary">{user.profile.hoursPerWeek}h</span>
                </div>
                {user.profile.primaryWeakness && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Primary Weakness</span>
                    <span className="text-accent-rose text-xs">{user.profile.primaryWeakness}</span>
                  </div>
                )}
                {user.profile.strengthArea && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Strength</span>
                    <span className="text-accent-emerald text-xs">{user.profile.strengthArea}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-emerald" />
              Activity Stats
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Gamepad2 className="w-3.5 h-3.5" /> Games Reviewed
                </span>
                <span className="text-text-primary font-medium">{user.stats.gameCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Puzzle className="w-3.5 h-3.5" /> Puzzle Attempts
                </span>
                <span className="text-text-primary font-medium">{user.stats.puzzleAttemptCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Gamepad2 className="w-3.5 h-3.5" /> Bot Games
                </span>
                <span className="text-text-primary font-medium">{user.stats.botGameCount}</span>
              </div>
              {user.progress && (
                <>
                  <div className="pt-2 border-t border-border-subtle" />
                  {user.progress.streakDays != null && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Streak</span>
                      <span className="text-accent-gold font-medium">{user.progress.streakDays} days</span>
                    </div>
                  )}
                  {user.progress.tacticalAccuracy != null && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Tactical Accuracy</span>
                      <span className="text-text-primary">{user.progress.tacticalAccuracy.toFixed(1)}%</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Login History + Audit Trail */}
        <div className="space-y-6">
          {/* Login History */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Login History</h2>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {user.loginHistory.length === 0 ? (
                <p className="text-xs text-text-muted">No login history</p>
              ) : (
                user.loginHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between text-xs px-2 py-1.5 rounded
                      ${entry.success ? "bg-accent-emerald/5" : "bg-accent-rose/5"}`}
                  >
                    <span className={entry.success ? "text-accent-emerald" : "text-accent-rose"}>
                      {entry.success ? "OK" : entry.failureReason || "Failed"}
                    </span>
                    <span className="text-text-muted">{entry.ip || "—"}</span>
                    <span className="text-text-muted">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Audit Trail</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {user.auditEvents.length === 0 ? (
                <p className="text-xs text-text-muted">No audit events</p>
              ) : (
                user.auditEvents.map((evt) => (
                  <div key={evt.id} className="border-l-2 border-border-subtle pl-3 py-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary">
                      {evt.action}
                    </span>
                    <p className="text-xs text-text-muted mt-0.5">
                      by {evt.actorEmail} &middot;{" "}
                      {new Date(evt.createdAt).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    {evt.reason && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        Reason: {evt.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
