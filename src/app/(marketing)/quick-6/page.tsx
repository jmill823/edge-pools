import type { Metadata } from "next";
import Link from "next/link";
import { LandingTopBar } from "../_components/LandingTopBar";
import { LandingFooter } from "../_components/LandingFooter";

export const metadata: Metadata = {
  title: "Quick-6 Golf Pool Format",
  description:
    "The Quick-6 is a post-cut golf pool format — 6 categories, 6 picks, built from the players who made the weekend. Fast setup, real strategy. Download the free template and run your pool on TILT.",
};

const categories = [
  {
    name: "World Top 10",
    desc: "the best in the world who survived Friday",
  },
  {
    name: "Contenders",
    desc: "OWGR 11\u201325 still in the field",
  },
  {
    name: "Dark Horses",
    desc: "OWGR 26\u201350, the weekend sleepers",
  },
  {
    name: "Veterans 36+",
    desc: "the experienced picks who made the cut",
  },
  {
    name: "International",
    desc: "non-U.S. players still playing",
  },
  {
    name: "Longshots",
    desc: "OWGR 51+, the Cinderella stories",
  },
];

export default function Quick6Page() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <LandingTopBar />

      <main className="flex-1">
        <article className="mx-auto max-w-[720px] px-4 py-12 sm:py-16">
          {/* H1 */}
          <h1 className="font-display text-[32px] sm:text-[40px] font-[900] leading-[1.1] tracking-tight text-text-primary">
            Quick-6 Golf Pool
          </h1>

          <div className="mt-2 h-[3px] w-[48px] bg-accent-primary" />

          {/* Intro */}
          <div className="mt-8 space-y-4 font-body text-[15px] leading-[1.7] text-text-secondary">
            <p>
              The Quick-6 is a 6-category golf pool format designed for the
              weekend. After the Friday cut, the field gets smaller and the
              strategy gets sharper. Six picks from six categories &mdash; only
              players who made the cut are available.
            </p>
            <p>
              No draft, no salary cap, no spreadsheet. Just six decisions and a
              leaderboard for Saturday and Sunday.
            </p>
          </div>

          {/* Categories */}
          <section className="mt-10">
            <h2 className="font-display text-[13px] font-[800] uppercase tracking-[1px] text-text-primary">
              The six categories
            </h2>
            <ul className="mt-4 space-y-3">
              {categories.map((cat) => (
                <li key={cat.name} className="flex items-start gap-3">
                  <span className="mt-[6px] block h-[7px] w-[7px] shrink-0 rounded-full bg-accent-primary" />
                  <p className="font-body text-[14px] leading-[1.6] text-text-secondary">
                    <span className="font-semibold text-text-primary">
                      {cat.name}
                    </span>{" "}
                    &mdash; {cat.desc}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-body text-[14px] leading-[1.6] text-text-muted">
              Categories are populated automatically after the cut. Only golfers
              who made the weekend are available to pick.
            </p>
          </section>

          {/* Cross-category rule */}
          <section className="mt-10">
            <h2 className="font-display text-[13px] font-[800] uppercase tracking-[1px] text-text-primary">
              Same cross-category rule
            </h2>
            <div className="mt-4 space-y-4 font-body text-[15px] leading-[1.7] text-text-secondary">
              <p>
                Pick a golfer in one category, he&rsquo;s gone from every other
                category on your sheet. Even with only 6 categories, this rule
                forces real tradeoffs. Do you use Rory McIlroy as a World Top 10
                or International? That one decision ripples across your entire
                sheet.
              </p>
            </div>
          </section>

          {/* Why it works */}
          <section className="mt-10">
            <h2 className="font-display text-[13px] font-[800] uppercase tracking-[1px] text-text-primary">
              Why Quick-6 works
            </h2>
            <div className="mt-4 space-y-4 font-body text-[15px] leading-[1.7] text-text-secondary">
              <p>
                Not every group wants to commit before the tournament starts.
                The Quick-6 is built for the group chat that lights up Friday
                afternoon &mdash; &ldquo;who made the cut?&rdquo; becomes
                &ldquo;who&rsquo;s in your pool?&rdquo; The commissioner sets it
                up in 3 minutes Saturday morning, drops the invite link, and
                everyone picks before the third round.
              </p>
              <p>
                Six picks means less homework, faster decisions, and a tighter
                weekend leaderboard. But the cross-category mechanic still gives
                you enough strategy to argue about on Sunday.
              </p>
              <p>
                The cut does the filtering for you. No wasted picks on a guy who
                went home Friday.
              </p>
            </div>
          </section>

          {/* Scoring */}
          <section className="mt-10">
            <h2 className="font-display text-[13px] font-[800] uppercase tracking-[1px] text-text-primary">
              How scoring works
            </h2>
            <div className="mt-4 space-y-4 font-body text-[15px] leading-[1.7] text-text-secondary">
              <p>
                Total strokes across Rounds 3 and 4. Lowest weekend score wins.
                Commissioner sets tiebreakers before picks lock.
              </p>
            </div>
          </section>

          {/* Run it on TILT */}
          <section className="mt-10">
            <h2 className="font-display text-[13px] font-[800] uppercase tracking-[1px] text-text-primary">
              Run it on TILT
            </h2>
            <div className="mt-4 space-y-4 font-body text-[15px] leading-[1.7] text-text-secondary">
              <p>
                Set up your Quick-6 pool in under 3 minutes after the cut.
                Categories auto-populate with weekend players. Share the invite
                link. Live leaderboard handles scoring for Saturday and Sunday.
              </p>
              <p>Your first pool is free. $49/season after that.</p>
            </div>
          </section>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/create"
              className="inline-flex items-center justify-center rounded-[4px] bg-text-primary px-6 py-3 font-body text-[13px] font-semibold tracking-[0.5px] uppercase text-white hover:opacity-90 transition-opacity duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer text-center"
            >
              Create your pool &rarr;
            </Link>
            <Link
              href="/pool-formats/quick-6-post-cut-pick-sheet.pdf"
              className="inline-flex items-center justify-center rounded-[4px] border-[1.5px] border-text-primary px-6 py-3 font-body text-[13px] font-semibold tracking-[0.5px] uppercase text-text-primary hover:bg-surface-alt transition-colors duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer text-center"
            >
              Download the Quick-6 Pick Sheet (PDF)
            </Link>
          </div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
