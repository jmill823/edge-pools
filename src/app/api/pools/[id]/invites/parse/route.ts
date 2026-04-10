import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import * as XLSX from "xlsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  });
  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let rawEmails: string[] = [];

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // File upload
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      rawEmails = parseSpreadsheet(buffer);
    } else {
      // CSV or TXT — treat as plain text
      const text = buffer.toString("utf-8");
      rawEmails = parseTextEmails(text);
    }
  } else {
    // JSON body with emails string
    const body = await req.json();
    if (typeof body.text === "string") {
      rawEmails = parseTextEmails(body.text);
    } else if (Array.isArray(body.emails)) {
      rawEmails = body.emails.map((e: string) => e.trim().toLowerCase());
    } else {
      return NextResponse.json(
        { error: "Provide 'text' string or 'emails' array" },
        { status: 400 }
      );
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const email of rawEmails) {
    const lower = email.toLowerCase().trim();
    if (lower && !seen.has(lower)) {
      seen.add(lower);
      deduped.push(lower);
    }
  }

  // Categorize
  const ready: string[] = [];
  const invalid: string[] = [];
  const alreadyInPool: string[] = [];

  // Get existing pool member emails + guest emails
  const [members, guests, existingInvites] = await Promise.all([
    prisma.poolMember.findMany({
      where: { poolId: params.id },
      include: { user: { select: { email: true } } },
    }),
    prisma.guestPlayer.findMany({
      where: { poolId: params.id },
      select: { email: true },
    }),
    prisma.poolInvite.findMany({
      where: { poolId: params.id, status: "sent" },
      select: { email: true },
    }),
  ]);

  const poolEmails = new Set<string>();
  for (const m of members) {
    poolEmails.add(m.user.email.toLowerCase());
  }
  for (const g of guests) {
    poolEmails.add(g.email.toLowerCase());
  }

  const alreadySent = new Set(existingInvites.map((i) => i.email.toLowerCase()));

  for (const email of deduped) {
    if (!EMAIL_REGEX.test(email)) {
      invalid.push(email);
    } else if (poolEmails.has(email)) {
      alreadyInPool.push(email);
    } else if (alreadySent.has(email)) {
      alreadyInPool.push(email); // already invited
    } else {
      ready.push(email);
    }
  }

  return NextResponse.json({ ready, alreadyInPool, invalid });
}

function parseTextEmails(text: string): string[] {
  // Split by newlines, commas, semicolons
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes("@"));
}

function parseSpreadsheet(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const emails: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as unknown[][];

    for (const row of data) {
      for (const cell of row) {
        const val = String(cell).trim().toLowerCase();
        if (val.includes("@") && EMAIL_REGEX.test(val)) {
          emails.push(val);
        }
      }
    }
  }

  return emails;
}
