import { SharedHeader } from "@/components/layout/SharedHeader";

/** Wrapper for backward compatibility — all pages should use SharedHeader directly */
export function LandingTopBar() {
  return <SharedHeader maxWidth="960px" />;
}
