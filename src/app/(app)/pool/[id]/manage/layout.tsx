import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Pool",
  description: "Commissioner controls — status, players, scoring.",
};

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
