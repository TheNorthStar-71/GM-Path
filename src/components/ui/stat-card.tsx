"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: LucideIcon | ((props: { className?: string }) => JSX.Element);
  color?: "gold" | "emerald" | "rose" | "blue" | "purple" | "cyan";
  hint?: string;
}

const colorMap = {
  gold: { icon: "text-accent-gold", bg: "bg-accent-gold/10", border: "border-accent-gold/20" },
  emerald: { icon: "text-accent-emerald", bg: "bg-accent-emerald/10", border: "border-accent-emerald/20" },
  rose: { icon: "text-accent-rose", bg: "bg-accent-rose/10", border: "border-accent-rose/20" },
  blue: { icon: "text-accent-blue", bg: "bg-accent-blue/10", border: "border-accent-blue/20" },
  purple: { icon: "text-accent-purple", bg: "bg-accent-purple/10", border: "border-accent-purple/20" },
  cyan: { icon: "text-accent-cyan", bg: "bg-accent-cyan/10", border: "border-accent-cyan/20" },
};

export function StatCard({ label, value, change, icon: Icon, color = "gold", hint }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`relative bg-bg-card border ${c.border} rounded-xl p-4 group
      hover:bg-bg-hover transition-all duration-200 overflow-hidden`}>
      {/* Subtle top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.bg} opacity-60`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">{label}</p>
          <p className="text-2xl font-display font-bold text-text-primary tracking-tight">{value}</p>
          {change && (
            <p className={`text-xs font-medium ${
              change.startsWith("+") || change.startsWith("↑") ? "text-accent-emerald" : 
              change.startsWith("-") || change.startsWith("↓") ? "text-accent-rose" : "text-text-muted"
            }`}>
              {change}
            </p>
          )}
          {hint && (
            <p className="text-[11px] text-text-muted">{hint}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
