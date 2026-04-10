import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invite Players",
  description: "Share your pool invite link.",
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
