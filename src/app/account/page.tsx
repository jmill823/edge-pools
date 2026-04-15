import { redirect } from "next/navigation";

/**
 * /account — no dedicated account page yet. Redirect to /dashboard.
 * Fixes QA-028 (404 on /account).
 */
export default function AccountPage() {
  redirect("/dashboard");
}
