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
  } = params;

  const { error } = await resend.emails.send({
    from: "TILT <noreply@playtilt.io>",
    to,
    subject: `You're invited to join ${poolName} on TILT`,
    html: buildInviteHtml({
      commissionerName,
      poolName,
      tournamentName,
      templateName,
      categoryCount,
      inviteUrl,
    }),
  });

  if (error) {
    throw new Error(error.message);
  }
}

function buildInviteHtml(params: Omit<InviteEmailParams, "to">) {
  const {
    commissionerName,
    poolName,
    tournamentName,
    templateName,
    categoryCount,
    inviteUrl,
  } = params;

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
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#2C2925;">
                <strong>${commissionerName}</strong> invited you to join their golf pool for <strong>${tournamentName}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAFA;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr><td style="padding:4px 0;font-size:14px;color:#6B6560;">Pool</td><td style="padding:4px 0;font-size:14px;color:#2C2925;font-weight:600;text-align:right;">${poolName}</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#6B6560;">Format</td><td style="padding:4px 0;font-size:14px;color:#2C2925;text-align:right;">${templateName} (${categoryCount} categories)</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#6B6560;">Tournament</td><td style="padding:4px 0;font-size:14px;color:#2C2925;text-align:right;">${tournamentName}</td></tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;color:#6B6560;">
                Join and make your picks &mdash; no account needed.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(to right,#10B981,#059669);color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      Join Pool &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:#A39E96;text-align:center;">
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
