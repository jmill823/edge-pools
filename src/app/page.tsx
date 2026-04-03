import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-green-900 sm:text-5xl">
          Stop using a spreadsheet
          <br className="hidden sm:block" /> to run your golf pool.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-green-800/70">
          3-minute setup | Live leaderboard | Custom categories
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="w-full rounded-md bg-green-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-900 sm:w-auto min-h-[44px] inline-flex items-center justify-center"
          >
            Create a Pool
          </Link>
          <Link
            href="/join"
            className="w-full rounded-md border border-green-800 px-6 py-3 text-sm font-semibold text-green-800 hover:bg-green-50 sm:w-auto min-h-[44px] inline-flex items-center justify-center"
          >
            Join a Pool
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-green-900/10 bg-green-50/50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
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
      <section className="border-t border-green-900/10 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold tracking-tight text-green-900 sm:text-3xl">
            Your weekend looks like this
          </h2>
          <p className="text-center mt-3 text-green-600 text-sm">Live scores. Pick breakdowns. Zero spreadsheets.</p>

          <div className="mt-10 mx-auto max-w-md">
            {/* My entry — pinned */}
            <div className="rounded-lg border-2 border-blue-300 bg-[#E6F1FB] overflow-hidden mb-2">
              <div className="p-3">
                <span className="text-xs font-medium text-blue-600">My Entry</span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-900">T3</span>
                    <span className="text-sm text-green-700">You</span>
                  </div>
                  <span className="text-2xl font-bold text-green-700">-8</span>
                </div>
              </div>
              <div className="border-t border-blue-200">
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
      <section className="border-t border-green-900/10 bg-green-800 py-16 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to ditch the spreadsheet?</h2>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3 text-sm font-semibold text-green-900 shadow-sm hover:bg-green-50 min-h-[44px]"
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
    <div className="shrink-0 w-[260px] sm:w-auto rounded-lg border border-green-200 bg-white p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-800 text-lg font-bold text-white">
        {number}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-green-900">{title}</h3>
      <p className="mt-2 text-sm text-green-800/70">{description}</p>
    </div>
  );
}

function DemoPick({ cat, golfer, score }: { cat: string; golfer: string; score: string }) {
  const isNeg = score.startsWith("-");
  return (
    <div className="shrink-0 rounded-md bg-green-50 border border-green-200 px-2.5 py-1.5 min-w-[90px]">
      <div className="text-[9px] text-green-500 truncate leading-tight">{cat}</div>
      <div className="text-[11px] font-bold text-green-900 truncate mt-0.5 leading-tight">{golfer}</div>
      <div className={`text-[10px] font-medium mt-0.5 leading-tight ${isNeg ? "text-[#0F6E56]" : "text-[#854F0B]"}`}>
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
    <div className={`flex items-center justify-between px-3 py-3 rounded ${highlight ? "bg-[#E6F1FB] border border-blue-200" : "hover:bg-gray-50"}`}>
      <div className="flex items-center gap-3">
        <span className="w-8 text-right text-sm font-bold text-green-900">{rank}</span>
        {arrow === "up" && <span className="w-6 text-center text-[10px] font-bold text-[#0F6E56]">&#9650;{arrowVal}</span>}
        {arrow === "down" && <span className="w-6 text-center text-[10px] font-bold text-[#A32D2D]">&#9660;{arrowVal}</span>}
        {!arrow && <span className="w-6 text-center text-[10px] text-gray-400">&mdash;</span>}
        <span className="text-sm font-medium text-green-900">{name}</span>
      </div>
      <span className="text-sm font-bold text-green-700">{score}</span>
    </div>
  );
}
