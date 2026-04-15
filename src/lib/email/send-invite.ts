import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface InviteEmailParams {
  to: string;
  commissionerName: string;
  poolName: string;
  tournamentName: string;
  templateName: string;
  categoryCount: number;
  inviteUrl: string;
  picksDeadline?: string | null;
  maxEntries?: number | null;
}

export async function sendInviteEmail(params: InviteEmailParams) {
  if (!resend) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  const {
    to,
    commissionerName,
    poolName,
    tournamentName,
    templateName,
    categoryCount,
    inviteUrl,
    picksDeadline,
    maxEntries,
  } = params;

  const { error } = await resend.emails.send({
    from: "TILT <noreply@playtilt.io>",
    to,
    subject: `Join ${poolName} on Tilt \u2014 Ditch the spreadsheet.`,
    html: buildInviteHtml({
      commissionerName,
      poolName,
      tournamentName,
      templateName,
      categoryCount,
      inviteUrl,
      picksDeadline,
      maxEntries,
    }),
  });

  if (error) {
    throw new Error(error.message);
  }
}

function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "\u2014";
  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return "\u2014";
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return "\u2014";
  }
}

function buildInviteHtml(params: Omit<InviteEmailParams, "to">) {
  const {
    commissionerName,
    poolName,
    inviteUrl,
    picksDeadline,
    maxEntries,
  } = params;

  const deadlineDisplay = formatDeadline(picksDeadline);
  const entriesDisplay = maxEntries && maxEntries > 0 ? String(maxEntries) : "1";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#FAFAFA;color:#2C2925;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAFA;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border-radius:12px;border:1px solid #E2DDD5;padding:40px 32px;">
          <tr>
            <td>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#2C2925;">
                Hi &mdash; you have been invited to join <strong>${poolName}</strong>.
              </p>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#2C2925;">
                Here&rsquo;s the details:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="padding:4px 0;font-size:14px;color:#2C2925;"><strong>Deadline:</strong> ${deadlineDisplay}</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#2C2925;"><strong>Entry(s):</strong> ${entriesDisplay}</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#2C2925;"><strong>Host:</strong> ${commissionerName}</td></tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#2C2925;">
                More details on TILT: <a href="${inviteUrl}" style="color:#B09A60;font-weight:600;text-decoration:underline;">${inviteUrl}</a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#B09A60,#9E8A52);color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      Join Pool &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-size:12px;color:#A39E96;text-align:center;">
                <strong>TILT</strong> &mdash; Ditch the spreadsheet.<br>
                <a href="https://playtilt.io" style="color:#A39E96;">playtilt.io</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
