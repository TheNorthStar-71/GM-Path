"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

const GOALS = [
  { value: "beat_friends", label: "Beat my friends", description: "Have fun and win casual games" },
  { value: "reach_1200", label: "Reach 1200", description: "Build a solid foundation" },
  { value: "reach_1800", label: "Reach 1800", description: "Become a strong club player" },
  { value: "reach_2200", label: "Reach 2200", description: "Achieve expert/candidate master level" },
  { value: "nm", label: "National Master", description: "Achieve NM title" },
  { value: "fm", label: "FIDE Master", description: "Earn the FM title" },
  { value: "im", label: "International Master", description: "Earn the IM title" },
  { value: "gm", label: "Long-term GM pursuit", description: "Work toward the highest title" },
];

const TRACKS = [
  { value: "casual", label: "Casual", description: "2-4 hours/week. Steady improvement at your own pace." },
  { value: "serious", label: "Serious", description: "5-10 hours/week. Structured daily training." },
  { value: "elite", label: "Elite", description: "10+ hours/week. Intensive, tournament-focused preparation." },
];

const EXPERIENCE = [
  { value: "none", label: "None" },
  { value: "beginner", label: "A few casual tournaments" },
  { value: "club", label: "Regular club player" },
  { value: "regional", label: "Regional tournaments" },
  { value: "national", label: "National level" },
  { value: "international", label: "International" },
];

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Ratings
  const [ratingBlitz, setRatingBlitz] = useState("");
  const [ratingRapid, setRatingRapid] = useState("");
  const [ratingClassical, setRatingClassical] = useState("");
  const [ratingFide, setRatingFide] = useState("");

  // Step 2: Goals
  const [goal, setGoal] = useState("reach_1800");
  const [track, setTrack] = useState("serious");
  const [hoursPerWeek, setHoursPerWeek] = useState("7");
  const [experience, setExperience] = useState("club");

  // Step 3: Skills self-assessment
  const [skills, setSkills] = useState({
    opening: 5,
    middlegame: 5,
    tactics: 5,
    strategy: 5,
    endgame: 5,
    calculation: 5,
    timeManagement: 5,
  });

  // Step 4: Openings
  const [openingsWhite, setOpeningsWhite] = useState<string[]>([]);
  const [openingsBlack, setOpeningsBlack] = useState<string[]>([]);

  const whiteOpenings = ["1.e4", "1.d4", "1.c4", "1.Nf3", "Other"];
  const blackVsE4 = ["Sicilian", "French", "Caro-Kann", "e5", "Scandinavian", "Pirc/Modern", "Other"];
  const blackVsD4 = ["Queen's Gambit Declined", "King's Indian", "Nimzo-Indian", "Slav", "Grünfeld", "Dutch", "Other"];

  async function handleComplete() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratingBlitz: ratingBlitz ? parseInt(ratingBlitz) : null,
          ratingRapid: ratingRapid ? parseInt(ratingRapid) : null,
          ratingClassical: ratingClassical ? parseInt(ratingClassical) : null,
          ratingFide: ratingFide ? parseInt(ratingFide) : null,
          goal,
          improvementTrack: track,
          hoursPerWeek: parseInt(hoursPerWeek),
          tournamentExperience: experience,
          skillOpening: skills.opening,
          skillMiddlegame: skills.middlegame,
          skillTactics: skills.tactics,
          skillStrategy: skills.strategy,
          skillEndgame: skills.endgame,
          skillCalculation: skills.calculation,
          skillTimeManagement: skills.timeManagement,
          preferredOpeningsWhite: openingsWhite,
          preferredOpeningsBlack: openingsBlack,
          onboardingComplete: true,
        }),
      });
      router.push("/dashboard");
    } catch {
      setSaving(false);
    }
  }

  function SkillSlider({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) {
    const labels = ["Beginner", "", "", "Intermediate", "", "", "Advanced", "", "", "Expert"];
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <span className="text-xs text-text-muted">
            {labels[value - 1] || ""} ({value}/10)
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-bg-tertiary rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent-gold
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    );
  }

  function ToggleChip({
    label,
    selected,
    onClick,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border
          ${
            selected
              ? "bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
              : "bg-bg-tertiary border-border-subtle text-text-secondary hover:border-border"
          }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-gold rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-bg-primary" />
            </div>
            <span className="font-display text-2xl font-bold">GM Path</span>
          </div>
          <h1 className="text-xl font-semibold mb-1">Let&apos;s build your training profile</h1>
          <p className="text-text-muted text-sm">
            This helps us create your personalized training plan
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 max-w-xs mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s <= step ? "bg-accent-gold" : "bg-bg-tertiary"
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="card">
          {/* Step 1: Ratings */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Your current ratings</h2>
                <p className="text-sm text-text-muted">Enter any ratings you have. Leave blank if unknown.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label block mb-1.5">Blitz Rating</label>
                  <input
                    type="number"
                    value={ratingBlitz}
                    onChange={(e) => setRatingBlitz(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 1200"
                  />
                </div>
                <div>
                  <label className="label block mb-1.5">Rapid Rating</label>
                  <input
                    type="number"
                    value={ratingRapid}
                    onChange={(e) => setRatingRapid(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 1350"
                  />
                </div>
                <div>
                  <label className="label block mb-1.5">Classical Rating</label>
                  <input
                    type="number"
                    value={ratingClassical}
                    onChange={(e) => setRatingClassical(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 1400"
                  />
                </div>
                <div>
                  <label className="label block mb-1.5">FIDE/USCF Rating</label>
                  <input
                    type="number"
                    value={ratingFide}
                    onChange={(e) => setRatingFide(e.target.value)}
                    className="input-field"
                    placeholder="If rated officially"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Your goals</h2>
                <p className="text-sm text-text-muted">What are you working toward?</p>
              </div>

              <div>
                <label className="label block mb-3">Primary goal</label>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={`text-left p-3 rounded-lg border transition-all
                        ${
                          goal === g.value
                            ? "bg-accent-gold/10 border-accent-gold/30"
                            : "bg-bg-tertiary border-border-subtle hover:border-border"
                        }`}
                    >
                      <div className="text-sm font-medium">{g.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">{g.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label block mb-3">Training intensity</label>
                <div className="space-y-2">
                  {TRACKS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTrack(t.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-all
                        ${
                          track === t.value
                            ? "bg-accent-gold/10 border-accent-gold/30"
                            : "bg-bg-tertiary border-border-subtle hover:border-border"
                        }`}
                    >
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="label block mb-1.5">Tournament experience</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="input-field"
                  >
                    {EXPERIENCE.map((exp) => (
                      <option key={exp.value} value={exp.value}>
                        {exp.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Self-assessment</h2>
                <p className="text-sm text-text-muted">
                  Rate your confidence in each area. Be honest — this shapes your training plan.
                </p>
              </div>

              <div className="space-y-5">
                <SkillSlider
                  label="Opening Knowledge"
                  value={skills.opening}
                  onChange={(v) => setSkills({ ...skills, opening: v })}
                />
                <SkillSlider
                  label="Middlegame Strategy"
                  value={skills.middlegame}
                  onChange={(v) => setSkills({ ...skills, middlegame: v })}
                />
                <SkillSlider
                  label="Tactical Ability"
                  value={skills.tactics}
                  onChange={(v) => setSkills({ ...skills, tactics: v })}
                />
                <SkillSlider
                  label="Positional Understanding"
                  value={skills.strategy}
                  onChange={(v) => setSkills({ ...skills, strategy: v })}
                />
                <SkillSlider
                  label="Endgame Technique"
                  value={skills.endgame}
                  onChange={(v) => setSkills({ ...skills, endgame: v })}
                />
                <SkillSlider
                  label="Calculation Ability"
                  value={skills.calculation}
                  onChange={(v) => setSkills({ ...skills, calculation: v })}
                />
                <SkillSlider
                  label="Time Management"
                  value={skills.timeManagement}
                  onChange={(v) => setSkills({ ...skills, timeManagement: v })}
                />
              </div>
            </div>
          )}

          {/* Step 4: Openings */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Opening repertoire</h2>
                <p className="text-sm text-text-muted">
                  Select what you play (or want to play). We&apos;ll build your study plan around these.
                </p>
              </div>

              <div>
                <label className="label block mb-3">As White, I play:</label>
                <div className="flex flex-wrap gap-2">
                  {whiteOpenings.map((op) => (
                    <ToggleChip
                      key={op}
                      label={op}
                      selected={openingsWhite.includes(op)}
                      onClick={() =>
                        setOpeningsWhite((prev) =>
                          prev.includes(op) ? prev.filter((x) => x !== op) : [...prev, op]
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="label block mb-3">Against 1.e4, I play:</label>
                <div className="flex flex-wrap gap-2">
                  {blackVsE4.map((op) => (
                    <ToggleChip
                      key={op}
                      label={op}
                      selected={openingsBlack.includes(op)}
                      onClick={() =>
                        setOpeningsBlack((prev) =>
                          prev.includes(op) ? prev.filter((x) => x !== op) : [...prev, op]
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="label block mb-3">Against 1.d4, I play:</label>
                <div className="flex flex-wrap gap-2">
                  {blackVsD4.map((op) => (
                    <ToggleChip
                      key={op}
                      label={op}
                      selected={openingsBlack.includes(op)}
                      onClick={() =>
                        setOpeningsBlack((prev) =>
                          prev.includes(op) ? prev.filter((x) => x !== op) : [...prev, op]
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-subtle">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              disabled={step === 1}
              className="btn-ghost flex items-center gap-2 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1) as Step)}
                className="btn-primary flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? "Setting up..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
