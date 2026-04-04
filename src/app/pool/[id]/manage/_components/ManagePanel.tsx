"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StatusTransition } from "./StatusTransition";
import { PlayerStatusTracker } from "./PlayerStatusTracker";
import { PoolSettings } from "./PoolSettings";
import { ScoringAdmin } from "./ScoringAdmin";
import { InviteLinkSection } from "./InviteLinkSection";
import { AcceptingMembersToggle } from "./AcceptingMembersToggle";

interface PoolData {
  id: string;
  name: string;
  status: string;
  acceptingMembers: boolean;
  inviteCode: string;
  maxEntries: number;
  picksDeadline: string;
  rules: string | null;
  tournament: { name: string; startDate: string; endDate: string; course: string | null };
  memberCount: number;
  entryCount: number;
  lastSyncAt: string | null;
  pendingReplacements: number;
}

interface MemberData {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  hasPaid: boolean;
  joinedAt: string;
  entriesSubmitted: number;
}

interface ManagePanelProps {
  pool: PoolData;
  members: MemberData[];
  inviteUrl: string;
}

export function ManagePanel({ pool: initialPool, members: initialMembers, inviteUrl }: ManagePanelProps) {
  const router = useRouter();
  const [pool, setPool] = useState(initialPool);
  const [members, setMembers] = useState(initialMembers);

  const handleStatusChange = useCallback((newStatus: string) => {
    setPool((p) => ({ ...p, status: newStatus }));
    router.refresh();
  }, [router]);

  const handleMembersChange = useCallback((updated: MemberData[]) => {
    setMembers(updated);
  }, []);

  const handleSettingsChange = useCallback((settings: { name: string; picksDeadline: string; maxEntries: number; rules: string | null }) => {
    setPool((p) => ({ ...p, ...settings }));
    router.refresh();
  }, [router]);

  const handleAcceptingChange = useCallback((accepting: boolean) => {
    setPool((p) => ({ ...p, acceptingMembers: accepting }));
  }, []);

  return (
    <div className="mx-auto max-w-content px-4 py-6 space-y-5">
      {/* Pool Info Header */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-subtle">
        <h1 className="font-display text-lg font-bold text-text-primary truncate">{pool.name}</h1>
        <p className="font-body text-sm text-text-secondary mt-0.5">{pool.tournament.name}</p>
        {pool.tournament.course && (
          <p className="font-body text-xs text-text-muted mt-0.5">{pool.tournament.course}</p>
        )}
      </div>

      {/* 1. Status Transition */}
      <StatusTransition
        poolId={pool.id}
        status={pool.status}
        onStatusChange={handleStatusChange}
      />

      {/* 2. Invite Link Section */}
      <InviteLinkSection
        poolName={pool.name}
        tournamentName={pool.tournament.name}
        inviteCode={pool.inviteCode}
        inviteUrl={inviteUrl}
        status={pool.status}
      />

      {/* 3. Accepting Members Toggle */}
      <AcceptingMembersToggle
        poolId={pool.id}
        status={pool.status}
        acceptingMembers={pool.acceptingMembers}
        onAcceptingChange={handleAcceptingChange}
      />

      {/* 4. Player Status Tracker */}
      <PlayerStatusTracker
        poolId={pool.id}
        members={members}
        onMembersChange={handleMembersChange}
      />

      {/* 5. Pool Settings */}
      <PoolSettings
        poolId={pool.id}
        status={pool.status}
        name={pool.name}
        picksDeadline={pool.picksDeadline}
        maxEntries={pool.maxEntries}
        rules={pool.rules}
        onSettingsChange={handleSettingsChange}
      />

      {/* 6. Scoring Admin */}
      <ScoringAdmin
        status={pool.status}
        lastSyncAt={pool.lastSyncAt}
        pendingReplacements={pool.pendingReplacements}
      />
    </div>
  );
}
