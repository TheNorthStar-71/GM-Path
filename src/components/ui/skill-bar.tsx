"use client";

interface SkillBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  showValue?: boolean;
}

export function SkillBar({
  label,
  value,
  maxValue = 100,
  color = "#F0B429",
  showValue = true,
}: SkillBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        {showValue && (
          <span className="text-xs font-mono font-medium w-8 text-right" style={{ color }}>
            {Math.round(value)}
          </span>
        )}
      </div>
    </div>
  );
}
