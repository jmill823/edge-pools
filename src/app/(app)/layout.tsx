import { SharedHeader } from "@/components/layout/SharedHeader";
import { SharedFooter } from "@/components/layout/SharedFooter";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SharedHeader maxWidth="80%" />
      <main className="flex-1">{children}</main>
      {/* Footer hidden on mobile when BottomNav is present */}
      <div className="hidden sm:block">
        <SharedFooter variant="app" />
      </div>
    </>
  );
}
