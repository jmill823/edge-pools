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
          Create your pool in 3 minutes. Invite your group. Watch the
          leaderboard all weekend.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="w-full rounded-md bg-green-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-900 sm:w-auto"
          >
            Create a Pool
          </Link>
          <Link
            href="/join"
            className="w-full rounded-md border border-green-800 px-6 py-3 text-sm font-semibold text-green-800 hover:bg-green-50 sm:w-auto"
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
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <Step
              number="1"
              title="Create"
              description="Set up your pool with pre-built categories for any PGA tournament."
            />
            <Step
              number="2"
              title="Invite"
              description="Share a link with your group. They pick their golfers in 15 minutes."
            />
            <Step
              number="3"
              title="Compete"
              description="Watch the live leaderboard all tournament long."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-800 text-lg font-bold text-white">
        {number}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-green-900">{title}</h3>
      <p className="mt-2 text-sm text-green-800/70">{description}</p>
    </div>
  );
}
