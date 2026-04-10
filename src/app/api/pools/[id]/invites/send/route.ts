import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { sendInviteEmail, isResendConfigured } from "@/lib/email/send-invite";

const MAX_EMAILS_PER_SEND = 50;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify organizer
  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      tournament: { select: { name: true } },
      organizer: { select: { displayName: true } },
      categories: { select: { id: true } },
    },
  });

  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "Email sending not configured. Use the invite link instead." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const emails: string[] = body.emails;

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json(
      { error: "No emails provided" },
      { status: 400 }
    );
  }

  if (emails.length > MAX_EMAILS_PER_SEND) {
    return NextResponse.json(
      { error: `Maximum ${MAX_EMAILS_PER_SEND} emails per send` },
      { status: 400 }
    );
  }

  // Rate limit: check last send for this pool
  const lastSend = await prisma.poolInvite.findFirst({
    where: { poolId: params.id },
    orderBy: { sentAt: "desc" },
  });

  if (lastSend?.sentAt) {
    const elapsed = Date.now() - lastSend.sentAt.getTime();
    if (elapsed < 60_000) {
      const waitSec = Math.ceil((60_000 - elapsed) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSec} seconds before sending again` },
        { status: 429 }
      );
    }
  }

  const inviteUrl = `${getBaseUrl()}/join/${pool.inviteCode}`;
  const templateName = pool.categories.length > 0 ? "Categories" : "Standard";

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  for (const email of emails) {
    try {
      await sendInviteEmail({
        to: email,
        commissionerName: pool.organizer.displayName,
        poolName: pool.name,
        tournamentName: pool.tournament.name,
        templateName,
        categoryCount: pool.categories.length,
        inviteUrl,
      });

      // Upsert invite record
      await prisma.poolInvite.upsert({
        where: { poolId_email: { poolId: params.id, email } },
        create: {
          poolId: params.id,
          email,
          status: "sent",
          sentAt: new Date(),
        },
        update: {
          status: "sent",
          sentAt: new Date(),
        },
      });

      sent.push(email);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";

      // Record failed invite
      await prisma.poolInvite.upsert({
        where: { poolId_email: { poolId: params.id, email } },
        create: {
          poolId: params.id,
          email,
          status: "failed",
        },
        update: {
          status: "failed",
        },
      });

      failed.push({ email, error: errorMsg });
    }
  }

  return NextResponse.json({ sent, failed });
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://playtilt.io";
}
