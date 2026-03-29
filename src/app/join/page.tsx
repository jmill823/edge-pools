"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/join/${code.trim()}`);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-green-900 text-center">
        Join a Pool
      </h1>
      <p className="mt-2 text-sm text-green-600 text-center">
        Enter the invite code shared by your pool organizer.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter invite code"
          className="w-full rounded border border-green-200 px-4 py-3 text-center text-lg font-mono tracking-widest focus:border-green-500 focus:outline-none"
          maxLength={8}
        />
        <button
          type="submit"
          disabled={!code.trim()}
          className="w-full rounded-md bg-green-800 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-900 disabled:opacity-50"
        >
          Find Pool
        </button>
      </form>
    </div>
  );
}
