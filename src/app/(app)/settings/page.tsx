"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  User,
  Target,
  Bell,
  Save,
  Loader2,
  CheckCircle2,
  Monitor,
  Volume2,
  Clock,
  Download,
  Shield,
  Trash2,
  Palette,
  Layout,
  ChevronDown,
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  FileJson,
  FileBarChart,
  X,
  Check,
  History,
  Globe,
  Smartphone,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingsData {
  user: {
    name: string | null;
    email: string | null;
  };
  profile: {
    goal: string;
    hoursPerWeek: number;
    improvementTrack: string;
    ratingBlitz: number | null;
    ratingRapid: number | null;
    ratingClassical: number | null;
    ratingFide: number | null;
    ratingUscf: number | null;
  } | null;
}

type PieceSet = "classic" | "neo" | "alpha" | "merida";
type BoardColor = "wood" | "green" | "blue" | "brown" | "purple";
type AnimationSpeed = "fast" | "normal" | "slow";
type TimeControl = "1+0" | "3+0" | "5+0" | "10+0" | "15+10" | "30+0";

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div>
        <span className="text-sm text-text-primary font-medium">{label}</span>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 relative ${
          checked ? "bg-accent-gold" : "bg-bg-tertiary border border-border-subtle"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// SegmentedControl component
// ---------------------------------------------------------------------------

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${
            value === opt
              ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
              : "bg-bg-tertiary border-border-subtle text-text-secondary hover:border-border hover:text-text-primary"
          }`}
        >
          {labels ? labels[opt] : opt}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionHeader component
// ---------------------------------------------------------------------------

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-lg bg-accent-gold/10 flex-shrink-0">
        <Icon className="w-5 h-5 text-accent-gold" />
      </div>
      <div>
        <h2 className="font-semibold text-lg text-text-primary">{title}</h2>
        {description && (
          <p className="text-sm text-text-muted mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast component
// ---------------------------------------------------------------------------

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border ${
          type === "success"
            ? "bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald"
            : "bg-accent-rose/10 border-accent-rose/30 text-accent-rose"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmModal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string, confirmation: string) => void;
  deleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 max-w-md w-full space-y-5 border-accent-rose/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-rose/10">
            <AlertTriangle className="w-6 h-6 text-accent-rose" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-text-primary">Delete Account</h3>
            <p className="text-sm text-text-muted">This action cannot be undone</p>
          </div>
        </div>

        <div className="text-sm text-text-secondary space-y-2">
          <p>This will permanently delete:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-text-muted">
            <li>Your profile and account data</li>
            <li>All game history and PGN records</li>
            <li>Training progress, puzzle attempts, and streaks</li>
            <li>Board and UI preferences</li>
          </ul>
          <p className="text-xs text-text-muted mt-2">
            Audit logs referencing your actions may be retained for security compliance.
          </p>
        </div>

        <div>
          <label className="label block mb-1.5 text-xs">Confirm your password</label>
          <div className="relative">
            <input
              type={showDeletePw ? "text" : "password"}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className="input-field pr-10 border-accent-rose/30"
            />
            <button
              type="button"
              onClick={() => setShowDeletePw(!showDeletePw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showDeletePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="label block mb-1.5 text-xs">
            Type <span className="font-mono text-accent-rose font-semibold">DELETE MY ACCOUNT</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "DELETE MY ACCOUNT"'
            className="input-field border-accent-rose/30 focus:border-accent-rose/50 focus:ring-accent-rose/30"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(deletePassword, confirmText)}
            disabled={confirmText !== "DELETE MY ACCOUNT" || !deletePassword || deleting}
            className="flex items-center gap-2 bg-accent-rose text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-accent-rose/80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {deleting ? "Deleting..." : "Permanently Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function getLocalSetting<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocalSetting<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or unavailable — fail silently
  }
}

// ---------------------------------------------------------------------------
// LoginHistorySection component
// ---------------------------------------------------------------------------

interface LoginEntry {
  id: string;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

function parseUA(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: "Unknown", os: "Unknown" };
  let browser = "Unknown";
  let os = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  return { browser, os };
}

function LoginHistorySection() {
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/settings/login-history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted py-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading activity...
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="text-sm text-text-muted">No login activity recorded yet.</p>;
  }

  const displayed = expanded ? history : history.slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {displayed.map((entry) => {
          const { browser, os } = parseUA(entry.userAgent);
          const date = new Date(entry.createdAt);
          const timeAgo = getTimeAgo(date);
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${
                entry.success
                  ? "bg-bg-secondary"
                  : "bg-accent-rose/5 border border-accent-rose/10"
              }`}
            >
              {entry.success ? (
                <Globe className="w-3.5 h-3.5 text-accent-emerald flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-accent-rose flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${entry.success ? "text-text-primary" : "text-accent-rose"}`}>
                    {entry.success ? "Successful login" : "Failed attempt"}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-muted">{timeAgo}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted mt-0.5">
                  <Smartphone className="w-3 h-3" />
                  <span>{browser} on {os}</span>
                  {entry.ip && entry.ip !== "unknown" && (
                    <>
                      <span>·</span>
                      <span>{entry.ip}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {history.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent-gold hover:text-accent-gold-light"
        >
          {expanded ? "Show less" : `Show all ${history.length} entries`}
        </button>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  // ------ loading / saving state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );

  // ------ Section 1: Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // ------ Section 2: Board Appearance (localStorage)
  const [pieceSet, setPieceSet] = useState<PieceSet>("classic");
  const [boardColor, setBoardColor] = useState<BoardColor>("wood");
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>("normal");

  // ------ Section 3: Time Control Defaults (localStorage)
  const [defaultTimeControl, setDefaultTimeControl] = useState<TimeControl>("10+0");
  const [autoPremove, setAutoPremove] = useState(false);

  // ------ Section 4: Training Preferences (API)
  const [goal, setGoal] = useState("reach_1800");
  const [hoursPerWeek, setHoursPerWeek] = useState("7");
  const [track, setTrack] = useState("serious");

  // ------ Section 5: Sound & Notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [moveSound, setMoveSound] = useState(true);
  const [captureSound, setCaptureSound] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [weeklyReport, setWeeklyReport] = useState(true);

  // ------ Section 7: Account Management
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ------ Section 6: Export state
  const [exportingPGN, setExportingPGN] = useState(false);
  const [exportingJSON, setExportingJSON] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // ---------- Load settings on mount ----------
  useEffect(() => {
    // Load localStorage preferences
    setPieceSet(getLocalSetting<PieceSet>("pieceSet", "classic"));
    setBoardColor(getLocalSetting<BoardColor>("boardTheme", "wood"));
    setShowCoordinates(getLocalSetting<boolean>("showCoordinates", true));
    setAnimationSpeed(getLocalSetting<AnimationSpeed>("animationSpeed", "normal"));
    setDefaultTimeControl(getLocalSetting<TimeControl>("defaultTimeControl", "10+0"));
    setAutoPremove(getLocalSetting<boolean>("autoPremove", false));
    setSoundEnabled(getLocalSetting<boolean>("soundEnabled", true));
    setMoveSound(getLocalSetting<boolean>("moveSound", true));
    setCaptureSound(getLocalSetting<boolean>("captureSound", true));

    // Load API settings
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data: SettingsData = await res.json();
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          if (data.profile) {
            setGoal(data.profile.goal);
            setHoursPerWeek(String(data.profile.hoursPerWeek));
            setTrack(data.profile.improvementTrack);
          }
        }
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // ---------- Persist localStorage whenever board/sound prefs change ----------
  useEffect(() => {
    if (loading) return;
    setLocalSetting("pieceSet", pieceSet);
    setLocalSetting("boardTheme", boardColor);
    setLocalSetting("showCoordinates", showCoordinates);
    setLocalSetting("animationSpeed", animationSpeed);
    setLocalSetting("defaultTimeControl", defaultTimeControl);
    setLocalSetting("autoPremove", autoPremove);
    setLocalSetting("soundEnabled", soundEnabled);
    setLocalSetting("moveSound", moveSound);
    setLocalSetting("captureSound", captureSound);
  }, [
    loading,
    pieceSet,
    boardColor,
    showCoordinates,
    animationSpeed,
    defaultTimeControl,
    autoPremove,
    soundEnabled,
    moveSound,
    captureSound,
  ]);

  // ---------- Save API settings ----------
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          goal,
          hoursPerWeek: parseInt(hoursPerWeek) || 7,
          improvementTrack: track,
          dailyReminder,
          reminderTime,
          weeklyReport,
        }),
      });
      if (res.ok) {
        setToast({ message: "Settings saved successfully", type: "success" });
      } else {
        setToast({ message: "Failed to save settings", type: "error" });
      }
    } catch {
      setToast({ message: "Network error — please try again", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [name, email, goal, hoursPerWeek, track, dailyReminder, reminderTime, weeklyReport]);

  // ---------- Change password ----------
  const newPasswordValid = useMemo(() => {
    return (
      newPassword.length >= 12 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[^a-zA-Z0-9]/.test(newPassword)
    );
  }, [newPassword]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }
    if (!newPasswordValid) {
      setToast({ message: "Password must be 12+ chars with uppercase, lowercase, number, and special character", type: "error" });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      if (res.ok) {
        setToast({ message: "Password changed successfully", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json().catch(() => null);
        setToast({
          message: data?.error || "Failed to change password",
          type: "error",
        });
      }
    } catch {
      setToast({ message: "Network error — please try again", type: "error" });
    } finally {
      setChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword, newPasswordValid]);

  // ---------- Delete account ----------
  const handleDeleteAccount = useCallback(async (password: string, confirmation: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmation }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => null);
        setToast({ message: data?.error || "Failed to delete account", type: "error" });
      }
    } catch {
      setToast({ message: "Network error — please try again", type: "error" });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }, []);

  // ---------- Export handlers ----------
  const handleExport = useCallback(
    async (format: "pgn" | "json" | "pdf") => {
      const setters = { pgn: setExportingPGN, json: setExportingJSON, pdf: setExportingPDF };
      const setter = setters[format];
      setter(true);
      try {
        const res = await fetch(`/api/export/${format}`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const extensions = { pgn: "pgn", json: "json", pdf: "pdf" };
          a.download = `chess-trainer-export.${extensions[format]}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setToast({ message: `${format.toUpperCase()} export downloaded`, type: "success" });
        } else {
          setToast({ message: `Export failed — ${format.toUpperCase()} not available yet`, type: "error" });
        }
      } catch {
        setToast({ message: "Export is not available yet", type: "error" });
      } finally {
        setter(false);
      }
    },
    []
  );

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </div>
    );
  }

  // ---------- Board color preview squares ----------
  const boardColorSwatches: Record<BoardColor, [string, string]> = {
    wood: ["#e8dcc8", "#a67c52"],
    green: ["#eeeed2", "#769656"],
    blue: ["#dee3e6", "#8ca2ad"],
    brown: ["#f0d9b5", "#b58863"],
    purple: ["#e8d0ff", "#7b61a6"],
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl pb-12">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-text-muted mt-1">
          Manage your profile, board preferences, and account
        </p>
      </div>

      {/* ================================================================= */}
      {/* Section 1 — Profile                                               */}
      {/* ================================================================= */}
      <div className="card space-y-5">
        <SectionHeader
          icon={User}
          title="Profile"
          description="Your personal information"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Section 2 — Board Appearance                                      */}
      {/* ================================================================= */}
      <div className="card space-y-6">
        <SectionHeader
          icon={Palette}
          title="Board Appearance"
          description="Customize how the board looks and feels"
        />

        {/* Piece Set */}
        <div>
          <label className="label block mb-2">Piece Set</label>
          <SegmentedControl<PieceSet>
            options={["classic", "neo", "alpha", "merida"]}
            value={pieceSet}
            onChange={setPieceSet}
            labels={{
              classic: "Classic",
              neo: "Neo",
              alpha: "Alpha",
              merida: "Merida",
            }}
          />
        </div>

        {/* Board Color Theme */}
        <div>
          <label className="label block mb-2">Board Color Theme</label>
          <div className="flex gap-3 flex-wrap">
            {(Object.keys(boardColorSwatches) as BoardColor[]).map((color) => (
              <button
                key={color}
                onClick={() => setBoardColor(color)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                  boardColor === color
                    ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                    : "bg-bg-tertiary border-border-subtle text-text-secondary hover:border-border hover:text-text-primary"
                }`}
              >
                <div className="flex rounded overflow-hidden border border-border-subtle">
                  <div
                    className="w-4 h-4"
                    style={{ backgroundColor: boardColorSwatches[color][0] }}
                  />
                  <div
                    className="w-4 h-4"
                    style={{ backgroundColor: boardColorSwatches[color][1] }}
                  />
                </div>
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Coordinate Notation & Animation Speed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <Toggle
              checked={showCoordinates}
              onChange={setShowCoordinates}
              label="Coordinate Notation"
              description="Show rank and file labels on the board"
            />
          </div>
          <div>
            <label className="label block mb-2">Animation Speed</label>
            <SegmentedControl<AnimationSpeed>
              options={["fast", "normal", "slow"]}
              value={animationSpeed}
              onChange={setAnimationSpeed}
              labels={{ fast: "Fast", normal: "Normal", slow: "Slow" }}
            />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Section 3 — Time Control Defaults                                 */}
      {/* ================================================================= */}
      <div className="card space-y-6">
        <SectionHeader
          icon={Clock}
          title="Time Control Defaults"
          description="Default settings for bot games"
        />

        <div>
          <label className="label block mb-2">Default Time Control</label>
          <div className="flex gap-2 flex-wrap">
            {(["1+0", "3+0", "5+0", "10+0", "15+10", "30+0"] as TimeControl[]).map(
              (tc) => (
                <button
                  key={tc}
                  onClick={() => setDefaultTimeControl(tc)}
                  className={`px-4 py-2 rounded-lg border text-sm font-mono font-medium transition-all ${
                    defaultTimeControl === tc
                      ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                      : "bg-bg-tertiary border-border-subtle text-text-secondary hover:border-border hover:text-text-primary"
                  }`}
                >
                  {tc}
                </button>
              )
            )}
          </div>
        </div>

        <Toggle
          checked={autoPremove}
          onChange={setAutoPremove}
          label="Auto-Premove"
          description="Enable pre-moves when it's your opponent's turn"
        />
      </div>

      {/* ================================================================= */}
      {/* Section 4 — Training Preferences                                  */}
      {/* ================================================================= */}
      <div className="card space-y-5">
        <SectionHeader
          icon={Target}
          title="Training Preferences"
          description="Set your training goals and intensity"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="input-field"
            >
              <option value="beat_friends">Beat my friends</option>
              <option value="reach_1200">Reach 1200</option>
              <option value="reach_1800">Reach 1800</option>
              <option value="reach_2200">Reach 2200</option>
              <option value="nm">National Master</option>
              <option value="fm">FIDE Master</option>
              <option value="im">International Master</option>
              <option value="gm">Grandmaster pursuit</option>
            </select>
          </div>
          <div>
            <label className="label block mb-1.5">Hours per week</label>
            <input
              type="number"
              min={1}
              max={40}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="label block mb-3">Training intensity</label>
            <div className="flex gap-3">
              {(["casual", "serious", "elite"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTrack(t)}
                  className={`flex-1 p-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                    track === t
                      ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                      : "bg-bg-tertiary border-border-subtle text-text-secondary hover:border-border hover:text-text-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Section 5 — Sound & Notifications                                 */}
      {/* ================================================================= */}
      <div className="card space-y-6">
        <SectionHeader
          icon={Volume2}
          title="Sound & Notifications"
          description="Control audio feedback and reminders"
        />

        {/* Sound toggles */}
        <div className="space-y-4">
          <Toggle
            checked={soundEnabled}
            onChange={(v) => {
              setSoundEnabled(v);
              if (!v) {
                setMoveSound(false);
                setCaptureSound(false);
              }
            }}
            label="Master Sound"
            description="Enable or disable all sounds"
          />

          <div
            className={`space-y-4 pl-4 border-l-2 border-border-subtle transition-opacity ${
              !soundEnabled ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <Toggle
              checked={moveSound}
              onChange={setMoveSound}
              label="Move Sounds"
              description="Play a sound when pieces move"
            />
            <Toggle
              checked={captureSound}
              onChange={setCaptureSound}
              label="Capture Sounds"
              description="Play a sound when a piece is captured"
            />
          </div>
        </div>

        <div className="border-t border-border-subtle pt-5 space-y-4">
          <Toggle
            checked={dailyReminder}
            onChange={setDailyReminder}
            label="Daily Training Reminder"
            description="Get a reminder to complete your daily training"
          />

          {dailyReminder && (
            <div className="pl-4 border-l-2 border-border-subtle">
              <label className="label block mb-1.5">Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="input-field w-40"
              />
            </div>
          )}

          <Toggle
            checked={weeklyReport}
            onChange={setWeeklyReport}
            label="Weekly Progress Report"
            description="Receive a summary of your weekly training progress"
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* Section 6 — Data Export                                           */}
      {/* ================================================================= */}
      <div className="card space-y-5">
        <SectionHeader
          icon={Download}
          title="Data Export"
          description="Download your chess data"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleExport("pgn")}
            disabled={exportingPGN}
            className="btn-secondary flex items-center justify-center gap-2 text-sm"
          >
            {exportingPGN ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-accent-gold" />
            )}
            {exportingPGN ? "Exporting..." : "Game History (PGN)"}
          </button>

          <button
            onClick={() => handleExport("json")}
            disabled={exportingJSON}
            className="btn-secondary flex items-center justify-center gap-2 text-sm"
          >
            {exportingJSON ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4 text-accent-blue" />
            )}
            {exportingJSON ? "Exporting..." : "Training Data (JSON)"}
          </button>

          <button
            onClick={() => handleExport("pdf")}
            disabled={exportingPDF}
            className="btn-secondary flex items-center justify-center gap-2 text-sm"
          >
            {exportingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileBarChart className="w-4 h-4 text-accent-emerald" />
            )}
            {exportingPDF ? "Exporting..." : "Progress Report (PDF)"}
          </button>
        </div>

        <p className="text-xs text-text-muted">
          Exports include all your games, training sessions, and progress data.
        </p>
      </div>

      {/* ================================================================= */}
      {/* Save button                                                       */}
      {/* ================================================================= */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <p className="text-xs text-text-muted">
          Board appearance, time controls, and sound preferences are saved automatically.
        </p>
      </div>

      {/* ================================================================= */}
      {/* Section 7 — Security & Account                                     */}
      {/* ================================================================= */}
      <div className="card space-y-6">
        <SectionHeader
          icon={Shield}
          title="Security & Account"
          description="Password, login activity, and account management"
        />

        {/* Change Password */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Change Password</h3>
          <div className="grid grid-cols-1 gap-3 max-w-sm">
            <div className="relative">
              <label className="label block mb-1.5">Current Password</label>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <label className="label block mb-1.5">New Password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="12+ characters, mixed case, number, symbol"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {newPassword && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const score = [
                        newPassword.length >= 12,
                        /[A-Z]/.test(newPassword),
                        /[a-z]/.test(newPassword),
                        /\d/.test(newPassword),
                        /[^a-zA-Z0-9]/.test(newPassword),
                      ].filter(Boolean).length;
                      return (
                        <div key={i} className={`flex-1 h-1 rounded-full ${
                          i <= score
                            ? score <= 2 ? "bg-accent-rose" : score <= 3 ? "bg-yellow-400" : score <= 4 ? "bg-accent-gold" : "bg-accent-emerald"
                            : "bg-bg-tertiary"
                        }`} />
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-0.5">
                    {[
                      { met: newPassword.length >= 12, label: "12+ characters" },
                      { met: /[A-Z]/.test(newPassword), label: "Uppercase (A-Z)" },
                      { met: /[a-z]/.test(newPassword), label: "Lowercase (a-z)" },
                      { met: /\d/.test(newPassword), label: "Number (0-9)" },
                      { met: /[^a-zA-Z0-9]/.test(newPassword), label: "Special char" },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-1">
                        {req.met ? <Check className="w-3 h-3 text-accent-emerald" /> : <X className="w-3 h-3 text-text-muted" />}
                        <span className={`text-[10px] ${req.met ? "text-accent-emerald" : "text-text-muted"}`}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="label block mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-accent-rose mt-1">Passwords do not match</p>
              )}
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={
              changingPassword ||
              !currentPassword ||
              !newPasswordValid ||
              newPassword !== confirmPassword
            }
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {changingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* Login Activity */}
        <div className="border-t border-border-subtle pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <History className="w-4 h-4 text-accent-gold" />
            Recent Login Activity
          </h3>
          <LoginHistorySection />
        </div>

        {/* Danger Zone */}
        <div className="border-t border-border-subtle pt-6">
          <div className="rounded-xl border border-accent-rose/20 bg-accent-rose/5 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-accent-rose flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-sm text-text-secondary">
              Permanently delete your account and all associated data. This action is
              irreversible and requires password confirmation.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-accent-rose bg-accent-rose/10 border border-accent-rose/30 px-4 py-2 rounded-lg hover:bg-accent-rose/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Modals & Toasts                                                   */}
      {/* ================================================================= */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
