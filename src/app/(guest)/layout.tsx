import { SharedHeader } from "@/components/layout/SharedHeader";
import { SharedFooter } from "@/components/layout/SharedFooter";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SharedHeader maxWidth="80%" />
      <main className="flex-1">{children}</main>
      <SharedFooter variant="app" />
    </>
  );
}
