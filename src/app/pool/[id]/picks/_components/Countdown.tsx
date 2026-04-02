"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  deadline: string;
  onExpired?: () => void;
}

export function Countdown({ deadline, onExpired }: CountdownProps) {
  const [remaining, setRemaining] = useState(() => calcRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const r = calcRemaining(deadline);
      setRemaining(r);
      if (r.total <= 0) {
        clearInterval(timer);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, onExpired]);

  if (remaining.total <= 0) {
    return <span className="text-xs font-medium text-red-600">Picks are locked</span>;
  }

  const parts: string[] = [];
  if (remaining.days > 0) parts.push(`${remaining.days}d`);
  if (remaining.hours > 0 || remaining.days > 0) parts.push(`${remaining.hours}h`);
  parts.push(`${remaining.minutes}m`);
  if (remaining.days === 0) parts.push(`${remaining.seconds}s`);

  return (
    <span className="text-xs font-medium text-amber-700">
      Picks lock in {parts.join(" ")}
    </span>
  );
}

function calcRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}
