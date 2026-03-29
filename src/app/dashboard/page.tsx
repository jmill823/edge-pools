import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-green-900">
        Welcome, {user?.firstName ?? "Player"}
      </h1>
      <p className="mt-4 text-green-800/60">Your pools will appear here.</p>
    </div>
  );
}
