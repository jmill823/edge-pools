"use client";

import { useState, useCallback } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCards } from "./StatCards";
import { ActionBanner } from "./ActionBanner";
import { InviteShareRow } from "./InviteShareRow";
import { FilterPills, FilterType } from "./FilterPills";
import { MembersGrid, MemberRow } from "./MembersGrid";

interface PoolData {
  id: string;
  name: string;
  status: string;
  acceptingMembers: boolean;
  inviteCode: string;
  maxEntries: number;
  picksDeadline: string;
  categoryCount: number;
  tournamentId: string;
  tournament: { name: string; startDate: string; endDate: string; course: string | null };
  memberCount: number;
  totalEntries: number;
  paidEntries: number;
  lastSyncAt: string | null;
  pendingReplacements: number;
  winnerName: string | null;
}

interface MemberData {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  hasPaid: boolean;
  entryCount: number;
  completePicks: number;
  isGuest: boolean;
}

interface GuestMemberData {
  entryId: string;
  displayName: string;
  email: string | null;
  paymentStatus: string;
  entryCount: number;
  completePicks: number;
  isGuest: boolean;
}

interface ManagePanelProps {
  pool: PoolData;
  members: MemberData[];
  guestMembers: GuestMemberData[];
  inviteUrl: string;
}

export function ManagePanel({ pool: initialPool, members: initialMembers, guestMembers: initialGuests, inviteUrl }: ManagePanelProps) {
  const [pool, setPool] = useState(initialPool);
  const [members, setMembers] = useState(initialMembers);
  const [guests, setGuests] = useState(initialGuests);
  const [filter, setFilter] = useState<FilterType>("all");

  // Computed counts
  const totalMembersPaid = members.filter((m) => m.hasPaid).length;
  const totalGuestsPaid = guests.filter((g) => g.paymentStatus === "paid").length;
  const totalPaid = totalMembersPaid + totalGuestsPaid;
  const totalEntries = pool.totalEntries;
  const totalMembers = members.length + guests.length;

  // Build unified rows for MembersGrid
  const allRows: MemberRow[] = [
    ...members.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      role: m.role,
      hasPaid: m.hasPaid,
      entryCount: m.entryCount,
      completePicks: m.completePicks,
      isGuest: false,
      email: m.email,
    })),
    ...guests.map((g) => ({
      id: `guest-${g.entryId}`,
      displayName: g.displayName,
      role: "PLAYER",
      hasPaid: g.paymentStatus === "paid",
      entryCount: g.entryCount,
      completePicks: g.completePicks,
      isGuest: true,
      entryId: g.entryId,
      email: g.email,
      paymentStatus: g.paymentStatus,
    })),
  ];

  // Filter counts
  const unpaidRows = allRows.filter((r) => !(r.isGuest ? r.paymentStatus === "paid" : r.hasPaid));
  const noPicksRows = allRows.filter((r) => r.completePicks === 0 && r.entryCount === 0);

  // Apply filter
  let filteredRows = allRows;
  if (filter === "unpaid") {
    filteredRows = unpaidRows;
  } else if (filter === "no-picks") {
    filteredRows = noPicksRows;
  }

  const handleStatusChange = useCallback((newStatus: string) => {
    setPool((p) => ({ ...p, status: newStatus }));
  }, []);

  const handleAcceptingChange = useCallback((accepting: boolean) => {
    setPool((p) => ({ ...p, acceptingMembers: accepting }));
  }, []);

  const handleSyncTimeUpdate = useCallback((time: string) => {
    setPool((p) => ({ ...p, lastSyncAt: time }));
  }, []);

  const handleMemberPaidToggle = useCallback((memberId: string, newPaid: boolean) => {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, hasPaid: newPaid } : m));
  }, []);

  const handleGuestPaidToggle = useCallback((entryId: string, newStatus: string) => {
    setGuests((prev) => prev.map((g) => g.entryId === entryId ? { ...g, paymentStatus: newStatus } : g));
  }, []);

  const handlePaidTap = useCallback(() => {
    setFilter("unpaid");
  }, []);

  // Tournament date display
  const startDate = new Date(pool.tournament.startDate);
  const endDate = new Date(pool.tournament.endDate);
  const dateDisplay = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="mx-auto max-w-content px-4 py-4 space-y-3">
      {/* A. Pool Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="font-sans text-[18px] font-medium text-[#1A1A18] truncate">
            {pool.name}
          </h1>
          <StatusBadge status={pool.status} />
        </div>
        <p className="font-sans text-[11px] text-[#A39E96]">
          {pool.tournament.name} · {dateDisplay}
        </p>
      </div>

      {/* B. Stat Cards */}
      <StatCards
        memberCount={totalMembers}
        totalEntries={totalEntries}
        paidEntries={totalPaid}
        poolId={pool.id}
        status={pool.status}
        acceptingMembers={pool.acceptingMembers}
        onAcceptingChange={handleAcceptingChange}
        onPaidTap={handlePaidTap}
      />

      {/* C. Action Banner */}
      <ActionBanner
        poolId={pool.id}
        status={pool.status}
        categoryCount={pool.categoryCount}
        picksDeadline={pool.picksDeadline}
        lastSyncAt={pool.lastSyncAt}
        pendingReplacements={pool.pendingReplacements}
        winnerName={pool.winnerName}
        tournamentName={pool.tournament.name}
        onStatusChange={handleStatusChange}
        onSyncTimeUpdate={handleSyncTimeUpdate}
      />

      {/* D. Invite + Share Row */}
      <InviteShareRow
        inviteUrl={inviteUrl}
        poolName={pool.name}
        tournamentName={pool.tournament.name}
        status={pool.status}
      />

      {/* E. Filter Pills */}
      <FilterPills
        active={filter}
        unpaidCount={unpaidRows.length}
        noPicksCount={noPicksRows.length}
        onChange={setFilter}
      />

      {/* F. Members Grid */}
      <MembersGrid
        members={filteredRows}
        poolId={pool.id}
        status={pool.status}
        maxEntries={pool.maxEntries}
        onMemberPaidToggle={handleMemberPaidToggle}
        onGuestPaidToggle={handleGuestPaidToggle}
      />
    </div>
  );
}
