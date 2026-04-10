import type { Metadata } from "next";
import Link from "next/link";
import { LandingTopBar } from "../_components/LandingTopBar";
import { LandingFooter } from "../_components/LandingFooter";

export const metadata: Metadata = {
  title: "Classic 9-Category Golf Pool Format",
  description:
    "The Classic 9-category golf pool format splits the field into tiers — Past Champions, Contenders, Dark Horses, Longshots, and more. Pick one golfer per category. Download the free template and run your pool on TILT.",
};

const categories = [
  {
    name: "Past Champions",
    desc: "previous tournament winners in the field",
  },
  {
    name: "World Top 10",
    desc: "the highest-ranked players in the world",
  },
  {
    name: "Contenders",
    desc: "OWGR 11\u201325, the guys on the edge of elite",
  },
  {
    name: "Dark Horses",
    desc: "OWGR 26\u201350, the picks that win pools",
  },
  {
    name: "Veterans 36+",
    desc: "experience over athleticism",
  },
  {
    name: "International",
    desc: "non-U.S. players",
  },
  {
    name: "Rising Stars",
    desc: "age 26 and under",
  },
  {
    name: "Favorites",
    desc: "major championship winners",
  },
  {
    name: "Longshots",
    desc: "OWGR 51+, the picks that make Friday interesting",
  },
];

export default function ClassicPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <LandingTopBar />

      <main className="flex-1">
        <article className="mx-auto max-w-[720px] px-4 py-12 sm:py-16">
          {/* H1 */}
          <h1 className="font-display text-[32px] sm:text-[40px] font-[900] leading-[1.1] tracking-tight text-text-primary">
            Classic 9-Category Golf Pool
          </h1>

          <div className="mt-2 h-[3px] w-[48px] bg-accent-primary" />

          {/* Intro */}
          <div className="mt-8 space-y-4 font-body text-[15px] leading-[1.7] text-text-secondary">
            <p>
              The Classic is a 9-category golf pool format built for groups that
              want real strategy, not just picking favorites and hoping.
            </p>
            <p>
              Split the tournament field into nine categories based on world
              ranking, age, nationality, and major championship history. Every
              player in your group picks one golfer per category. Simple to
              understand, impossible to master.
            </p>
          </div>

          {/* Categories */}
          <section className="mt-10">
            <h2 className="font-display text-[13px] font-[800] uppercase tracking-[1px] text-text-primary">
              The nine categories
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
          </section>

          {/* Cross-category rule */}
          <section className="mt-10">
            <h2 className="font-display text-[13px] font-[800] uppercase tracking-[1px] text-text-primary">
              The rule that changes everything
            </h2>
            <div className="mt-4 space-y-4 font-body text-[15px] leading-[1.7] text-text-secondary">
              <p>
                Once you pick a golfer in one category, he&rsquo;s removed from
                every other category on your sheet. Scottie Scheffler is in your
                World Top 10? He&rsquo;s gone from Favorites. Rory McIlroy in
                Past Champions? Can&rsquo;t use him as International. One rule,
                nine decisions, and every pick changes the board for the next
                one.
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
                Total strokes across all four rounds. Lowest combined score
                wins. Your commissioner sets the missed-cut penalty before the
                tournament &mdash; most groups use +8 or +10 for each missed
                round. Tiebreakers are set by the commissioner too.
              </p>
            </div>
          </section>

          {/* Social proof */}
          <section className="mt-10">
            <h2 className="font-display text-[13px] font-[800] uppercase tracking-[1px] text-text-primary">
              Why groups stick with it
            </h2>
            <div className="mt-4 space-y-4 font-body text-[15px] leading-[1.7] text-text-secondary">
              <p>
                We&rsquo;ve been running this format since 2010. Started with 5
                entries, grew to 40+ with zero marketing. 68% of players come
                back year after year. The cross-category mechanic creates
                arguments, strategy sessions, and trash talk that salary cap and
                snake draft formats just don&rsquo;t produce.
              </p>
              <p>
                Friday cuts are brutal. When your Longshot misses the cut, you
                feel it. When your Dark Horse is leading after Round 2,
                you&rsquo;re the smartest person in the group. That&rsquo;s the
                format working.
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
                Set up your Classic pool in under 3 minutes. Categories are
                pre-loaded &mdash; edit them if you want. Share the invite link.
                Picks lock at tee time. Live leaderboard handles the rest.
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
              href="/pool-formats/classic-9-category-pick-sheet.pdf"
              className="inline-flex items-center justify-center rounded-[4px] border-[1.5px] border-text-primary px-6 py-3 font-body text-[13px] font-semibold tracking-[0.5px] uppercase text-text-primary hover:bg-surface-alt transition-colors duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer text-center"
            >
              Download the Classic Pick Sheet (PDF)
            </Link>
          </div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
