"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
      <h1 className="text-2xl font-bold text-text-primary text-center">
        Join a Pool
      </h1>
      <p className="mt-2 text-sm text-text-secondary text-center">
        Enter the invite code shared by your pool organizer.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter invite code"
          className="w-full rounded-md border border-[#E2DDD5] px-4 py-3 text-center text-lg font-mono tracking-widest focus:border-[#B09A60] focus:outline-none focus:ring-1 focus:ring-[#B09A60]"
          maxLength={8}
        />
        <Button variant="primary" type="submit" disabled={!code.trim()} className="w-full">
          Find Pool
        </Button>
      </form>
    </div>
  );
}
