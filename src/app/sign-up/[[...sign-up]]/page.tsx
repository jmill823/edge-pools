import { SignUp } from "@clerk/nextjs";

/**
 * Social login providers (Google, Apple, etc.) are configured in the Clerk Dashboard:
 * https://dashboard.clerk.com → User & Authentication → Social Connections
 *
 * For Edge Pools (consumer users):
 * - Enable: Google, Apple
 * - Disable: GitHub, Vercel, and any developer-focused providers
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <SignUp />
    </div>
  );
}
