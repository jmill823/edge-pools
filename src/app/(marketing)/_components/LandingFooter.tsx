import { SharedFooter } from "@/components/layout/SharedFooter";

/** Wrapper for backward compatibility — all pages should use SharedFooter directly */
export function LandingFooter() {
  return <SharedFooter variant="landing" />;
}
