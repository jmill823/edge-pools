import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, poolType, description, fileData, fileName } = body;

    if (!name?.trim() || !email?.trim() || !poolType || !description?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate pool type
    if (!["Majors", "Weekly", "Seasonal"].includes(poolType)) {
      return NextResponse.json(
        { error: "Invalid pool type" },
        { status: 400 }
      );
    }

    // Store transfer request
    const transferRequest = await prisma.transferRequest.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        poolType,
        description: description.trim(),
        fileData: fileData || null,
        fileName: fileName || null,
      },
    });

    // Send email notification (best-effort — don't fail the request if email fails)
    try {
      await sendNotificationEmail({
        name: transferRequest.name,
        email: transferRequest.email,
        poolType: transferRequest.poolType,
        description: transferRequest.description,
        fileName: transferRequest.fileName,
      });
    } catch (emailErr) {
      console.error("[Transfer] Email notification failed:", emailErr);
    }

    return NextResponse.json({ id: transferRequest.id });
  } catch (err) {
    console.error("[Transfer] Failed to create request:", err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}

async function sendNotificationEmail(data: {
  name: string;
  email: string;
  poolType: string;
  description: string;
  fileName: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.TRANSFER_NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) {
    console.log("[Transfer] Email notification skipped — RESEND_API_KEY or TRANSFER_NOTIFY_EMAIL not configured");
    console.log("[Transfer] New request from:", data.name, data.email, data.poolType);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "TILT <onboarding@resend.dev>",
    to: notifyEmail,
    subject: `New Pool Transfer Request — ${data.name}`,
    text: [
      `New transfer request from ${data.name}`,
      "",
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Pool Type: ${data.poolType}`,
      `Description: ${data.description}`,
      data.fileName ? `Attached File: ${data.fileName}` : "",
      "",
      "---",
      "View in database to access uploaded file.",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
