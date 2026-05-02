"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  LogOut,
  type LucideIcon,
} from "lucide-react";

/* ── Chess piece SVG icons ─────────────────────────────── */

function KingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="10" y1="4" x2="14" y2="4" />
      <path d="M7.5 9L5 20h14l-2.5-11z" />
      <path d="M7.5 9a4.5 4.5 0 019 0" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  );
}

function BishopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a1 1 0 100 2 1 1 0 000-2z" />
      <path d="M9 17h6l1-5c.5-2.5-1-5-4-7-3 2-4.5 4.5-4 7l1 5z" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="7" y1="20" x2="17" y2="20" />
      <line x1="9" y1="17" x2="9" y2="20" />
      <line x1="15" y1="17" x2="15" y2="20" />
    </svg>
  );
}

function RookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 4h2v3h2V4h4v3h2V4h2v5l-1 2v6H7v-6L6 9V4z" />
      <line x1="5" y1="20" x2="19" y2="20" />
      <line x1="7" y1="17" x2="7" y2="20" />
      <line x1="17" y1="17" x2="17" y2="20" />
    </svg>
  );
}

function PawnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="7" r="3" />
      <path d="M9 13h6l1 4H8l1-4z" />
      <line x1="6" y1="20" x2="18" y2="20" />
      <line x1="8" y1="17" x2="8" y2="20" />
      <line x1="16" y1="17" x2="16" y2="20" />
    </svg>
  );
}

function QueenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="4" r="1.5" />
      <path d="M5 10l2-4 3 3 2-5 2 5 3-3 2 4-2 7H7l-2-7z" />
      <line x1="5" y1="20" x2="19" y2="20" />
      <line x1="7" y1="17" x2="7" y2="20" />
      <line x1="17" y1="17" x2="17" y2="20" />
    </svg>
  );
}

function GamepadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <line x1="6" y1="10" x2="6" y2="14" />
      <line x1="4" y1="12" x2="8" y2="12" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 20h18" />
      <path d="M6 16V10" />
      <path d="M10 16V6" />
      <path d="M14 16V12" />
      <path d="M18 16V8" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

type ChessIcon = (props: { className?: string }) => JSX.Element;

interface NavItem {
  href: string;
  label: string;
  icon: ChessIcon | LucideIcon;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

const DIFFICULTY_CONFIG = {
  beginner: { dotColor: "bg-emerald-400", text: "Beginner" },
  intermediate: { dotColor: "bg-amber-400", text: "Intermediate" },
  advanced: { dotColor: "bg-red-400", text: "Advanced" },
} as const;

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: KingIcon },
      { href: "/play", label: "Start Playing", icon: GamepadIcon },
    ],
  },
  {
    label: "BEGIN HERE",
    collapsible: false,
    items: [
      { href: "/tactics", label: "Tactics", icon: BishopIcon, difficulty: "beginner" },
      { href: "/endgames", label: "Endgames", icon: PawnIcon, difficulty: "beginner" },
      { href: "/openings", label: "Opening Playbook", icon: QueenIcon, difficulty: "intermediate" },
      { href: "/motifs", label: "Motif Library", icon: BishopIcon, difficulty: "intermediate" },
      { href: "/calculation", label: "Think Ahead", icon: RookIcon, difficulty: "advanced" },
      { href: "/custom-mode", label: "Custom Mode", icon: KingIcon },
    ],
  },
  {
    label: "MY GAMES",
    collapsible: true,
    items: [
      { href: "/games", label: "My Games", icon: UploadIcon },
      { href: "/coach", label: "Analysis", icon: BookIcon },
    ],
  },
  {
    label: "TRACK",
    collapsible: false,
    items: [
      { href: "/progress", label: "My Development", icon: ChartIcon },
      { href: "/settings", label: "Settings", icon: GearIcon },
    ],
  },
];

const GLOSSARY_TERMS: { term: string; definition: string }[] = [
  { term: "Blindfold Mode", definition: "Practicing without seeing the board — an advanced visualization exercise." },
  { term: "Candidate Move", definition: "A move worth considering before calculating further. Strong players list all candidates before choosing." },
  { term: "Centipawn", definition: "A unit of evaluation equal to 1/100th of a pawn's value. Used to measure move accuracy." },
  { term: "ECO Code", definition: "A standardized classification system for chess openings (e.g. C54 for the Italian Game)." },
  { term: "Endgame", definition: "The final phase of the game when few pieces remain on the board." },
  { term: "Fork", definition: "A single piece simultaneously attacks two of the opponent's pieces." },
  { term: "Middlegame", definition: "The phase between the opening and endgame, where strategic and tactical battles occur." },
  { term: "Opening", definition: "The first phase of the game where both sides develop their pieces and control the center." },
  { term: "Pin", definition: "A piece cannot move without exposing a more valuable piece behind it." },
  { term: "Repertoire", definition: "A player's prepared set of opening variations for both white and black." },
  { term: "Skewer", definition: "An attack on a valuable piece that forces it to move, exposing a lesser piece behind it." },
  { term: "Smart Review", definition: "The app tracks what you need to practice and brings it back at exactly the right time." },
  { term: "Tabiya", definition: "A well-known position that arises from a standard opening sequence." },
  { term: "Zwischenzug", definition: "An unexpected intermediate move played before the anticipated recapture." },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "super_admin" || role === "admin";

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "MY GAMES": true,
  });

  const [showGlossary, setShowGlossary] = useState(false);

  function toggleSection(label: string) {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen bg-bg-secondary/85 backdrop-blur-xl
          flex flex-col transition-all duration-300 z-40
          ${collapsed ? "w-16" : "w-[220px]"}`}
        style={{ borderRight: "1px solid rgba(255,255,255,0.08)", boxShadow: "18px 0 60px rgba(0,0,0,0.22)" }}
      >
        {/* Logo */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-accent-gold to-accent-gold-dim rounded-md flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-gold/10">
              <KingIcon className="w-5 h-5 text-bg-primary" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-base font-bold text-text-primary leading-tight">GM Path</h1>
                <p className="text-[10px] font-medium uppercase text-text-muted">Training OS</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navGroups.map((group, gi) => {
              const isExpanded = group.collapsible ? (expandedSections[group.label] ?? true) : true;

              return (
                <li key={gi}>
                  {/* Section header — whisper level */}
                  {group.label && !collapsed && (
                    <button
                      onClick={() => group.collapsible && toggleSection(group.label)}
                      className={`w-full flex items-center justify-between
                        text-[10px] text-text-muted uppercase tracking-[0.18em] font-medium
                        px-3 pt-6 pb-2
                        ${group.collapsible ? "cursor-pointer hover:text-text-secondary" : "cursor-default"}`}
                    >
                      {group.label}
                      {group.collapsible && (
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`} />
                      )}
                    </button>
                  )}

                  {/* Items */}
                  {isExpanded && (
                    <ul className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        const Icon = item.icon;
                        const diffConfig = item.difficulty ? DIFFICULTY_CONFIG[item.difficulty] : null;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                                ${isActive
                                  ? "text-accent-gold bg-accent-gold/[0.08]"
                                  : "text-text-secondary hover:text-text-primary hover:bg-white/[0.05]"
                                }
                                ${collapsed ? "justify-center" : ""}`}
                              title={collapsed ? item.label : undefined}
                            >
                              {/* Left amber bar — active indicator */}
                              {isActive && !collapsed && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-gold rounded-r-full" />
                              )}
                              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-accent-gold" : ""}`} />
                              {!collapsed && (
                                <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                              )}
                              {!collapsed && diffConfig && (
                                <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-text-muted">
                                  <span className={`w-1.5 h-1.5 rounded-full ${diffConfig.dotColor}`} />
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}

            {/* Admin link */}
            {isAdmin && (
              <li>
                {!collapsed && (
                  <p className="text-[10px] text-text-muted uppercase tracking-[0.18em] font-medium px-3 pt-6 pb-2">
                    ADMIN
                  </p>
                )}
                <Link
                  href="/admin"
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                    ${pathname?.startsWith("/admin")
                      ? "text-accent-rose"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                    }
                    ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? "Admin" : undefined}
                >
                  {pathname?.startsWith("/admin") && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-rose rounded-r-full" />
                  )}
                  <ShieldAlert className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">Admin</span>}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Bottom: Glossary + Logout + Collapse */}
        <div className="bg-bg-primary/25" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => setShowGlossary(true)}
            className={`w-full flex items-center gap-3 px-5 py-3 text-text-muted hover:text-text-primary
              transition-all duration-150 text-sm ${collapsed ? "justify-center px-3" : ""}`}
            title={collapsed ? "Chess Glossary" : undefined}
          >
            <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Chess Glossary</span>}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={`w-full flex items-center gap-3 px-5 py-3 text-text-muted hover:text-accent-rose
              transition-all duration-150 text-sm ${collapsed ? "justify-center px-3" : ""}`}
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full p-3 text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center justify-center"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Glossary Modal */}
      {showGlossary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowGlossary(false)}
        >
          <div
            className="relative w-full max-w-2xl mx-4 bg-bg-secondary rounded-xl max-h-[80vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-text-primary">Chess Glossary</h2>
              <button
                onClick={() => setShowGlossary(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GLOSSARY_TERMS.map(({ term, definition }) => (
                <div key={term} className="space-y-1">
                  <p className="text-sm font-bold text-text-primary">{term}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{definition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
