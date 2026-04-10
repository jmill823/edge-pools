import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make Your Picks",
  description: "Pick one golfer per category. Cross-category rules apply.",
};

export default function PicksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
