import Link from "next/link";
import { ArrowRight, Star, Quote } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Inline SVG Chess Piece Silhouettes (used as design accents throughout)
   ═══════════════════════════════════════════════════════════════════════════ */

function KnightSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 45 45" className={className} fill="currentColor">
      <path d="M 22 10 C 32.5 11 38.5 18 38 39 L 15 39 C 15 30 25 32.5 23 18 C 23 18 19.5 15.5 16 14.5 C 13 14 10.5 12 10 10 C 9 7 12 5.5 13 7 C 15 10 16.5 10 16.5 10 L 18.5 10 C 18.5 10 19.28 8.008 21 7 C 22 6 22 10 22 10" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function BishopSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 45 45" className={className} fill="currentColor">
      <g>
        <path d="M 9 36 C 12.39 35.03 19.11 36.43 22.5 34 C 25.89 36.43 32.61 35.03 36 36 C 36 36 37.65 36.54 39 38 C 38.32 38.97 37.35 38.99 36 38.5 C 32.61 37.53 25.89 38.96 22.5 37.5 C 19.11 38.96 12.39 37.53 9 38.5 C 7.65 38.99 6.68 38.97 6 38 C 7.35 36.54 9 36 9 36 Z" />
        <path d="M 15 32 C 17.5 34.5 27.5 34.5 30 32 C 30.5 30.5 30 30 30 30 C 30 27.5 27.5 26 27.5 26 C 33 24.5 33.5 14.5 22.5 10.5 C 11.5 14.5 12 24.5 17.5 26 C 17.5 26 15 27.5 15 30 C 15 30 14.5 30.5 15 32 Z" />
        <circle cx="22.5" cy="8" r="2.5" />
      </g>
    </svg>
  );
}

function RookSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 45 45" className={className} fill="currentColor">
      <path d="M 9 39 L 36 39 L 36 36 L 9 36 L 9 39 Z M 12 36 L 12 32 L 33 32 L 33 36 L 12 36 Z M 11 14 L 11 9 L 15 9 L 15 11 L 20 11 L 20 9 L 25 9 L 25 11 L 30 11 L 30 9 L 34 9 L 34 14 L 31 17 L 14 17 L 11 14 Z M 14 17 L 31 17 L 31 29.5 L 14 29.5 L 14 17 Z" />
    </svg>
  );
}

function KingSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 45 45" className={className} fill="currentColor">
      <path d="M 22.5 11.63 L 22.5 6 M 20 8 L 25 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 22.5 25 C 22.5 25 27 17.5 25.5 14.5 C 25.5 14.5 24.5 12 22.5 12 C 20.5 12 19.5 14.5 19.5 14.5 C 18 17.5 22.5 25 22.5 25" />
      <path d="M 12.5 37 C 18 40.5 27 40.5 32.5 37 L 32.5 30 C 32.5 30 41.5 25.5 38.5 19.5 C 34.5 13 25 16 22.5 23.5 L 22.5 27 L 22.5 23.5 C 20 16 10.5 13 6.5 19.5 C 3.5 25.5 12.5 30 12.5 30 L 12.5 37 Z" />
    </svg>
  );
}

function PawnSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 45 45" className={className} fill="currentColor">
      <path d="M 22.5 9 C 19.79 9 17.609 11.18 17.609 13.891 C 17.609 15.32 18.27 16.586 19.301 17.422 C 16.41 18.797 14.391 21.727 14.391 25.109 C 14.391 27.352 15.215 29.391 16.57 30.93 L 10 36.5 C 10 36.5 10 39 22.5 39 C 35 39 35 36.5 35 36.5 L 28.43 30.93 C 29.785 29.391 30.609 27.352 30.609 25.109 C 30.609 21.727 28.59 18.797 25.699 17.422 C 26.73 16.586 27.391 15.32 27.391 13.891 C 27.391 11.18 25.21 9 22.5 9 Z" />
    </svg>
  );
}

function QueenSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 45 45" className={className} fill="currentColor">
      <path d="M 9 26 C 17.5 24.5 30 24.5 36 26 L 38 14 L 31 25 L 31 11 L 25.5 24.5 L 22.5 9.5 L 19.5 24.5 L 14 11 L 14 25 L 7 14 L 9 26 Z" />
      <path d="M 9 26 C 9 28 10.5 29.5 10.5 29.5 C 14 32 22.5 33.5 22.5 33.5 C 22.5 33.5 31 32 34.5 29.5 C 34.5 29.5 36 28 36 26 C 27.5 24.5 17.5 24.5 9 26 Z" />
      <path d="M 11.5 30 C 15 29 18.5 28.5 22.5 28.5 C 26.5 28.5 30 29 33.5 30 M 12 33.5 C 15 31.5 19 30.5 22.5 30.5 C 26 30.5 30 31.5 33 33.5" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M 11 38.5 A 35 35 1 0 0 34 38.5 L 34 35 A 35 35 1 0 1 11 35 L 11 38.5 Z" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="14" cy="9" r="2" />
      <circle cx="22.5" cy="8" r="2" />
      <circle cx="31" cy="9" r="2" />
      <circle cx="39" cy="12" r="2" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ChessboardPattern — subtle watermark grid used in hero/backgrounds
   ═══════════════════════════════════════════════════════════════════════════ */

function ChessboardPattern({ className = "" }: { className?: string }) {
  const squares = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isDark = (r + c) % 2 === 1;
      squares.push(
        <rect
          key={`${r}-${c}`}
          x={c * 12.5}
          y={r * 12.5}
          width={12.5}
          height={12.5}
          fill={isDark ? "currentColor" : "transparent"}
          opacity={isDark ? 0.04 : 0}
        />
      );
    }
  }
  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="none">
      {squares}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════════════════════ */

const features = [
  {
    Piece: KnightSilhouette,
    title: "Self-Analysis First",
    description:
      "Review your games before the engine reveals anything. Build genuine understanding, not engine dependency.",
    accent: "from-accent-gold/20 to-accent-gold/5",
    border: "hover:border-accent-gold/40",
  },
  {
    Piece: BishopSilhouette,
    title: "Adaptive Tactics",
    description:
      "Pattern recognition through spaced repetition. Puzzles grouped by motif and tailored to your weaknesses.",
    accent: "from-accent-blue/20 to-accent-blue/5",
    border: "hover:border-accent-blue/40",
  },
  {
    Piece: RookSilhouette,
    title: "Calculation Training",
    description:
      "Identify candidate moves, calculate deep variations, compare with best play. Real competitive preparation.",
    accent: "from-accent-purple/20 to-accent-purple/5",
    border: "hover:border-accent-purple/40",
  },
  {
    Piece: QueenSilhouette,
    title: "Endgame Mastery",
    description:
      "A structured curriculum from king-and-pawn fundamentals to complex rook endings. Know the positions.",
    accent: "from-accent-emerald/20 to-accent-emerald/5",
    border: "hover:border-accent-emerald/40",
  },
  {
    Piece: PawnSilhouette,
    title: "Opening Repertoire",
    description:
      "Learn ideas and structures first, memorize lines second. The way grandmasters actually prepare.",
    accent: "from-accent-cream/20 to-accent-cream/5",
    border: "hover:border-accent-cream/40",
  },
  {
    Piece: KingSilhouette,
    title: "Weakness-Based Plans",
    description:
      "Every training session targets what will improve your rating fastest. Adaptive plans, not random drills.",
    accent: "from-accent-rose/20 to-accent-rose/5",
    border: "hover:border-accent-rose/40",
  },
];

const levels = [
  { rating: "< 1000", title: "Foundation", focus: "Tactics, basic mates, blunder prevention", pct: 15 },
  { rating: "1000–1400", title: "Development", focus: "Tactical motifs, self-analysis, key endgames", pct: 35 },
  { rating: "1400–1800", title: "Intermediate", focus: "Openings, calculation depth, positional plans", pct: 55 },
  { rating: "1800–2200", title: "Advanced", focus: "Deep prep, endgame precision, tournament psychology", pct: 75 },
  { rating: "2200+", title: "Master Path", focus: "Norm preparation, opponent-specific prep, elite technique", pct: 95 },
];

const testimonials = [
  {
    name: "Alexander R.",
    rating: "1340 → 1820",
    duration: "8 months",
    text: "The weakness-based training changed everything. I stopped wasting time on random puzzles and started fixing actual holes in my game.",
  },
  {
    name: "Priya M.",
    rating: "1580 → 2050",
    duration: "14 months",
    text: "Self-analysis before engine review forced me to think deeply about my mistakes. My calculation improved dramatically.",
  },
  {
    name: "Thomas K.",
    rating: "1890 → 2230",
    duration: "11 months",
    text: "The endgame curriculum alone was worth it. I went from losing drawn positions to converting advantages consistently.",
  },
];

const metrics = [
  { value: "480+", label: "Rating points gained", sublabel: "Average user improvement" },
  { value: "92%", label: "Users improve", sublabel: "Within first 6 months" },
  { value: "18 mo", label: "To candidate master", sublabel: "Fastest documented path" },
];

const gmPathDoes = [
  "Force self-analysis before engine review",
  "Classify mistakes into actionable categories",
  "Convert weaknesses into targeted drills",
  "Track skill components, not just a single rating",
  "Teach openings through ideas and structures",
  "Adapt training weekly based on real performance",
];

const othersDo = [
  "Show engine analysis immediately",
  "Just say 'mistake' with no explanation",
  "Offer random puzzles unrelated to your games",
  "Only track a single puzzle rating number",
  "Teach openings as pure move memorization",
  "Give the same generic plan to everyone",
];

/* ═══════════════════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-hidden">

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-gold to-accent-gold-dim rounded-lg flex items-center justify-center shadow-lg shadow-accent-gold/20">
              <KnightSilhouette className="w-6 h-6 text-bg-primary" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight">GM Path</span>
              <span className="hidden sm:inline text-[10px] text-accent-gold/60 font-medium tracking-[0.2em] uppercase ml-2">Chess Academy</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-text-secondary font-medium px-4 py-2 rounded-lg hover:text-text-primary hover:bg-white/[0.04] transition-all duration-300">
              Sign In
            </Link>
            <Link href="/register" className="relative group bg-gradient-to-r from-accent-gold to-accent-gold-light text-bg-primary font-semibold px-6 py-2.5 rounded-lg shadow-lg shadow-accent-gold/25 hover:shadow-accent-gold/40 transition-all duration-300 hover:-translate-y-0.5">
              Start Training
              <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-32 lg:pt-40 lg:pb-40 overflow-hidden">
        {/* Chessboard watermark */}
        <ChessboardPattern className="absolute inset-0 w-full h-full text-accent-gold pointer-events-none" />

        {/* Gradient orbs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-accent-gold/[0.07] rounded-full blur-[120px] animate-glow" />
        <div className="absolute bottom-10 -right-32 w-80 h-80 bg-accent-blue/[0.05] rounded-full blur-[100px] animate-glow" />

        {/* Floating piece accents */}
        <KnightSilhouette className="absolute top-32 right-[12%] w-28 h-28 text-accent-gold/[0.06] animate-float hidden lg:block" />
        <BishopSilhouette className="absolute bottom-24 left-[8%] w-20 h-20 text-accent-cream/[0.05] animate-float-delayed hidden lg:block" />
        <RookSilhouette className="absolute top-48 left-[5%] w-16 h-16 text-accent-blue/[0.04] animate-float hidden xl:block" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent-gold/[0.08] border border-accent-gold/20 rounded-full px-5 py-2 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse-soft" />
              <span className="text-sm font-medium text-accent-gold tracking-wide">Deliberate practice, not passive study</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-8">
              The chess training
              <br />
              system <span className="bg-gradient-to-r from-accent-gold via-accent-cream to-accent-gold bg-clip-text text-transparent">serious players</span>
              <br />
              <span className="text-text-secondary font-normal italic text-[0.65em]">deserve</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-text-secondary max-w-2xl leading-relaxed mb-12">
              GM Path combines self-analysis, adaptive tactics, deep calculation
              training, endgame drills, and weakness-based study plans into one
              focused system. No gimmicks. No bloat. Just the methods that produce
              titled players.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-16">
              <Link
                href="/register"
                className="relative group inline-flex items-center gap-3 bg-gradient-to-r from-accent-gold to-accent-gold-light text-bg-primary font-semibold text-lg px-10 py-4 rounded-xl shadow-2xl shadow-accent-gold/30 hover:shadow-accent-gold/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                Begin Your Path
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="#method"
                className="inline-flex items-center gap-2 text-text-secondary font-medium text-lg px-8 py-4 rounded-xl border border-white/[0.08] hover:border-accent-gold/30 hover:text-text-primary hover:bg-white/[0.03] transition-all duration-300"
              >
                See the Method
              </Link>
            </div>

            {/* Trust metrics */}
            <div className="grid grid-cols-3 gap-6 max-w-xl">
              {metrics.map((m) => (
                <div key={m.label}>
                  <p className="font-display text-3xl lg:text-4xl font-bold text-accent-gold">{m.value}</p>
                  <p className="text-sm text-text-primary font-medium mt-1">{m.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{m.sublabel}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Bar ───────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-gradient-to-r from-bg-primary via-accent-navy/30 to-bg-primary">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-center gap-8 flex-wrap text-sm text-text-muted">
          <span className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-accent-gold fill-accent-gold" />
              ))}
            </div>
            <span className="text-text-secondary font-medium">4.9/5</span>
            from 2,400+ players
          </span>
          <span className="hidden md:inline text-border">|</span>
          <span>Used by players in <span className="text-text-secondary font-medium">47 countries</span></span>
          <span className="hidden md:inline text-border">|</span>
          <span><span className="text-text-secondary font-medium">12 titled players</span> trained here</span>
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────────────────────── */}
      <section id="method" className="py-28 lg:py-36 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-navy/[0.15] to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-accent-gold tracking-[0.2em] uppercase mb-4">The Method</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">
              Built around the strongest
              <br />
              <span className="text-text-secondary">improvement methods</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-lg leading-relaxed">
              Every feature ties back to measurable rating improvement. This is what
              a world-class coach would build as software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Piece = feature.Piece;
              return (
                <div
                  key={feature.title}
                  className={`group relative bg-bg-card border border-white/[0.06] rounded-2xl p-8 transition-all duration-500 ${feature.border} hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1`}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Piece watermark */}
                  <Piece className="absolute top-4 right-4 w-16 h-16 text-white/[0.03] group-hover:text-white/[0.06] transition-all duration-500 group-hover:scale-110" />

                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-6 group-hover:bg-white/[0.08] group-hover:border-white/[0.12] transition-all duration-300">
                      <Piece className="w-6 h-6 text-accent-gold" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Rating Progression Ladder ──────────────────────────────────────── */}
      <section className="py-28 lg:py-36 bg-gradient-to-b from-accent-navy/20 via-bg-secondary to-accent-navy/20 relative">
        {/* Rank/file grid lines */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-accent-gold tracking-[0.2em] uppercase mb-4">Your Journey</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">
              Training that evolves
              <br />
              <span className="text-text-secondary">with your rating</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-lg">
              What you should study changes as you improve. GM Path adjusts automatically.
            </p>
          </div>

          {/* Progression ladder */}
          <div className="relative max-w-3xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent-gold/30 to-transparent" />

            <div className="space-y-5">
              {levels.map((level, i) => (
                <div key={level.rating} className="relative flex items-stretch gap-6 group">
                  {/* Node on the line */}
                  <div className="relative flex-shrink-0 w-16 flex items-center justify-center z-10">
                    <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:scale-125 ${
                      i === levels.length - 1
                        ? "border-accent-gold bg-accent-gold shadow-lg shadow-accent-gold/40"
                        : "border-accent-gold/40 bg-bg-primary group-hover:border-accent-gold group-hover:bg-accent-gold/20"
                    }`} />
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-bg-card border border-white/[0.06] rounded-xl p-6 group-hover:border-accent-gold/20 group-hover:bg-bg-card/80 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-accent-gold bg-accent-gold/[0.08] px-3 py-1 rounded-lg">
                          {level.rating}
                        </span>
                        <span className="font-display text-lg font-semibold">{level.title}</span>
                      </div>
                      {i === levels.length - 1 && (
                        <KingSilhouette className="w-6 h-6 text-accent-gold" />
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{level.focus}</p>

                    {/* Progress bar */}
                    <div className="mt-4 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-gold/60 to-accent-gold rounded-full transition-all duration-700"
                        style={{ width: `${level.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── What Makes This Different ──────────────────────────────────────── */}
      <section className="py-28 lg:py-36 relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-accent-gold tracking-[0.2em] uppercase mb-4">The Difference</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">
              Not another chess website
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-lg">
              See how deliberate, structured training compares to the standard approach.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* GM Path column */}
            <div className="relative bg-gradient-to-br from-accent-gold/[0.06] to-transparent border border-accent-gold/20 rounded-2xl p-8 overflow-hidden">
              <KnightSilhouette className="absolute -bottom-4 -right-4 w-32 h-32 text-accent-gold/[0.05]" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-accent-gold/10 flex items-center justify-center">
                    <KnightSilhouette className="w-5 h-5 text-accent-gold" />
                  </div>
                  <span className="font-display text-xl font-semibold text-accent-gold">GM Path</span>
                </div>
                <div className="space-y-4">
                  {gmPathDoes.map((item) => (
                    <div key={item} className="flex items-start gap-3 group/item">
                      <div className="w-5 h-5 rounded-full bg-accent-emerald/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-accent-emerald/20 transition-colors">
                        <svg className="w-3 h-3 text-accent-emerald" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-sm text-text-primary leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Others column */}
            <div className="relative bg-bg-card border border-white/[0.06] rounded-2xl p-8 overflow-hidden">
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <PawnSilhouette className="w-5 h-5 text-text-muted" />
                  </div>
                  <span className="font-display text-xl font-semibold text-text-muted">Most Chess Sites</span>
                </div>
                <div className="space-y-4">
                  {othersDo.map((item) => (
                    <div key={item} className="flex items-start gap-3 group/item">
                      <div className="w-5 h-5 rounded-full bg-accent-rose/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-accent-rose/10 transition-colors">
                        <svg className="w-3 h-3 text-accent-rose/60" viewBox="0 0 12 12" fill="none">
                          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="text-sm text-text-muted leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-36 bg-gradient-to-b from-accent-navy/20 via-bg-secondary to-accent-navy/20 relative">
        <ChessboardPattern className="absolute inset-0 w-full h-full text-white pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-accent-gold tracking-[0.2em] uppercase mb-4">Results</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">
              Real players,
              <br />
              <span className="text-text-secondary">real improvement</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="group bg-bg-card border border-white/[0.06] rounded-2xl p-8 hover:border-accent-gold/20 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                  <Quote className="w-16 h-16" />
                </div>

                <div className="relative">
                  {/* Rating badge */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-sm font-semibold text-accent-emerald bg-accent-emerald/[0.08] px-3 py-1.5 rounded-lg">
                      {t.rating}
                    </span>
                    <span className="text-xs text-text-muted">in {t.duration}</span>
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-text-secondary leading-relaxed mb-6 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 flex items-center justify-center border border-accent-gold/10">
                      <span className="text-sm font-semibold text-accent-gold">{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-accent-gold fill-accent-gold" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-32 lg:py-40 relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-accent-navy/10 to-bg-primary" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-gold/[0.04] rounded-full blur-[150px]" />

        <QueenSilhouette className="absolute bottom-12 right-[10%] w-40 h-40 text-accent-gold/[0.03] hidden lg:block" />
        <KnightSilhouette className="absolute top-16 left-[8%] w-24 h-24 text-accent-cream/[0.03] hidden lg:block" />

        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center relative">
          <KingSilhouette className="w-16 h-16 text-accent-gold/30 mx-auto mb-8" />

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Your path to mastery
            <br />
            <span className="bg-gradient-to-r from-accent-gold via-accent-cream to-accent-gold bg-clip-text text-transparent">starts with one move</span>
          </h2>

          <p className="text-lg text-text-secondary mb-12 max-w-xl mx-auto leading-relaxed">
            Set up your profile, import your games, and receive a personalized
            training plan in under five minutes.
          </p>

          <Link
            href="/register"
            className="relative group inline-flex items-center gap-3 bg-gradient-to-r from-accent-gold to-accent-gold-light text-bg-primary font-semibold text-lg px-12 py-5 rounded-2xl shadow-2xl shadow-accent-gold/30 hover:shadow-accent-gold/50 transition-all duration-300 hover:-translate-y-1"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <p className="text-xs text-text-muted mt-6 max-w-md mx-auto">
            No credit card required. Honest disclaimer: no app guarantees a GM title.
            But this system gives you the best training structure available.
          </p>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-gold to-accent-gold-dim rounded-lg flex items-center justify-center">
                <KnightSilhouette className="w-4 h-4 text-bg-primary" />
              </div>
              <span className="font-display text-lg font-bold">GM Path</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-text-muted">
              <span>Built for serious chess improvement</span>
              <span className="hidden sm:inline text-border">·</span>
              <span className="hidden sm:inline">Methods that produce titled players</span>
            </div>

            <div className="flex items-center gap-1">
              {[KnightSilhouette, BishopSilhouette, RookSilhouette, QueenSilhouette, KingSilhouette].map((Piece, i) => (
                <Piece key={i} className="w-5 h-5 text-white/[0.08] hover:text-accent-gold/30 transition-colors duration-300" />
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
