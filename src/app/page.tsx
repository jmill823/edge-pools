import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="mx-auto max-w-hero px-4 py-20 text-center sm:py-28">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-text-primary sm:text-[36px] leading-tight">
          Ditch the spreadsheet.
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-body text-base text-text-secondary">
          3-Minute Setup <span className="text-text-muted">|</span> Real-Time Leaderboard <span className="text-text-muted">|</span> Custom Category Creation
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="w-full rounded-btn bg-accent-primary px-6 py-3 font-body text-sm font-medium text-white hover:brightness-90 transition-all duration-200 active:scale-[0.98] sm:w-auto min-h-[44px] inline-flex items-center justify-center cursor-pointer"
          >
            Create a Pool
          </Link>
          <Link
            href="/join"
            className="w-full rounded-btn border border-border px-6 py-3 font-body text-sm font-medium text-text-primary hover:bg-surface-alt transition-all duration-200 active:scale-[0.98] sm:w-auto min-h-[44px] inline-flex items-center justify-center cursor-pointer"
          >
            Join a Pool
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface-alt py-16 sm:py-20">
        <div className="mx-auto max-w-hero px-4">
          <h2 className="text-center font-display text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            How It Works
          </h2>
          <div className="mt-12 overflow-x-auto">
            <div className="flex gap-6 min-w-max sm:min-w-0 sm:grid sm:grid-cols-3 px-2 sm:px-0">
              <StepCard number="1" title="Create" description="Set up your pool with pre-built categories for any PGA tournament." />
              <StepCard number="2" title="Invite" description="Share a link with your group. They pick their golfers in minutes." />
              <StepCard number="3" title="Compete" description="Watch the live leaderboard update all tournament long." />
            </div>
          </div>
        </div>
      </section>

      {/* Mini Leaderboard Preview */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-hero px-4">
          <h2 className="text-center font-display text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Your weekend looks like this
          </h2>
          <p className="text-center mt-3 font-body text-sm text-text-secondary">Live scores. Pick breakdowns. Zero spreadsheets.</p>

          <div className="mt-10 mx-auto max-w-md">
            {/* My entry — pinned */}
            <div className="rounded-card border-[1.5px] border-accent-primary bg-[#F0F5F2] overflow-hidden mb-2">
              <div className="p-3">
                <span className="font-body text-xs font-medium text-accent-primary">My Entry</span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-text-primary">T3</span>
                    <span className="font-body text-sm text-text-secondary">You</span>
                  </div>
                  <span className="font-mono text-2xl font-bold text-accent-success">-8</span>
                </div>
              </div>
              <div className="border-t border-border">
                <div className="flex gap-1.5 px-3 py-2 overflow-x-auto">
                  <DemoPick cat="Champions" golfer="Scheffler" score="-4" />
                  <DemoPick cat="Top 10" golfer="McIlroy" score="-3" />
                  <DemoPick cat="Longshots" golfer="Straka" score="+1" />
                  <DemoPick cat="Wildcard" golfer="Morikawa" score="-2" />
                </div>
              </div>
            </div>

            {/* Other entries */}
            <div className="space-y-0.5">
              <DemoRow rank="1" name="Mike" score="-12" arrow="up" arrowVal="2" />
              <DemoRow rank="2" name="Sarah" score="-10" arrow="down" arrowVal="1" />
              <DemoRow rank="T3" name="You" score="-8" highlight />
              <DemoRow rank="4" name="Jake" score="-7" arrow="up" arrowVal="3" />
              <DemoRow rank="5" name="Chris" score="-5" arrow="down" arrowVal="2" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-accent-primary py-16 text-center">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Ready to ditch the spreadsheet?</h2>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-btn bg-white px-8 py-3 font-body text-sm font-medium text-accent-primary hover:bg-surface-alt transition-all duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
          >
            Create Your Pool
          </Link>
        </div>
      </section>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="shrink-0 w-[260px] sm:w-auto rounded-card border border-border bg-surface p-6 text-center shadow-subtle">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary font-mono text-lg font-bold text-white">
        {number}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 font-body text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function DemoPick({ cat, golfer, score }: { cat: string; golfer: string; score: string }) {
  const isNeg = score.startsWith("-");
  return (
    <div className="shrink-0 rounded-data bg-surface-alt border border-border px-2.5 py-1.5 min-w-[90px]">
      <div className="font-body text-[9px] text-text-muted uppercase tracking-[0.5px] truncate leading-tight">{cat}</div>
      <div className="font-body text-[11px] font-medium text-text-primary truncate mt-0.5 leading-tight">{golfer}</div>
      <div className={`font-mono text-[10px] font-medium mt-0.5 leading-tight ${isNeg ? "text-accent-success" : "text-accent-danger"}`}>
        {score}
      </div>
    </div>
  );
}

function DemoRow({
  rank, name, score, highlight, arrow, arrowVal,
}: {
  rank: string; name: string; score: string; highlight?: boolean;
  arrow?: "up" | "down"; arrowVal?: string;
}) {
  return (
    <div className={`flex items-center justify-between px-3 py-3 rounded-data ${highlight ? "bg-[#F0F5F2] border border-accent-primary/30" : "hover:bg-surface-alt transition-colors duration-150"}`}>
      <div className="flex items-center gap-3">
        <span className="w-8 text-right font-mono text-sm font-bold text-text-primary">{rank}</span>
        {arrow === "up" && <span className="w-6 text-center font-mono text-[10px] font-bold text-accent-success">&#9650;{arrowVal}</span>}
        {arrow === "down" && <span className="w-6 text-center font-mono text-[10px] font-bold text-accent-danger">&#9660;{arrowVal}</span>}
        {!arrow && <span className="w-6 text-center text-[10px] text-text-muted">&mdash;</span>}
        <span className="font-body text-sm font-medium text-text-primary">{name}</span>
      </div>
      <span className="font-mono text-sm font-bold text-accent-success">{score}</span>
    </div>
  );
}
