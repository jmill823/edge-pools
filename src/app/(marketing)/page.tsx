"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LandingTopBar } from "./_components/LandingTopBar";
import { MiniLeaderboard } from "./_components/MiniLeaderboard";
import { SocialProof } from "./_components/SocialProof";
import { TestimonialCards } from "./_components/TestimonialCards";
import { FeaturedTestimonial } from "./_components/FeaturedTestimonial";
import { HowItWorks } from "./_components/HowItWorks";
import { LandingFooter } from "./_components/LandingFooter";
import { RoleModal } from "./_components/RoleModal";

type ModalView = "commissioner" | "player" | null;

export default function HomePage() {
  const [modalView, setModalView] = useState<ModalView>(null);
  const router = useRouter();

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <LandingTopBar />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-10 pb-8">
          <div className="mx-auto max-w-[960px] px-4 text-center">
            <h1 className="font-sans text-[76px] font-[900] italic tracking-[6px] leading-none text-text-primary">
              TILT
            </h1>
            <div className="mx-auto mt-4 h-[3px] w-12 bg-accent-primary" />
            <p className="mt-5 font-sans text-[17px] font-semibold tracking-[-0.3px] text-text-primary">
              Ditch the spreadsheet.
            </p>
          </div>
        </section>

        {/* CTA Buttons */}
        <section className="pb-8">
          <div className="mx-auto max-w-[400px] px-5">
            <div className="flex gap-2">
              <button
                onClick={() => setModalView("commissioner")}
                className="flex-1 rounded-[6px] bg-[var(--neutral-you-row)] pt-3.5 pb-2.5 text-center hover:bg-[var(--neutral-light-border)] transition-colors duration-200 active:scale-[0.98] cursor-pointer min-h-[44px]"
              >
                <span className="block font-sans text-[13px] font-[800] uppercase tracking-[1px] text-accent-primary">
                  CREATE
                </span>
                <span className="block font-sans text-[9px] font-medium text-[#8BBF9A] mt-0.5">
                  [1]
                </span>
              </button>
              <button
                onClick={() => setModalView("player")}
                className="flex-1 rounded-[6px] bg-[var(--neutral-you-row)] pt-3.5 pb-2.5 text-center hover:bg-[var(--neutral-light-border)] transition-colors duration-200 active:scale-[0.98] cursor-pointer min-h-[44px]"
              >
                <span className="block font-sans text-[13px] font-[800] uppercase tracking-[1px] text-accent-primary">
                  JOIN
                </span>
                <span className="block font-sans text-[9px] font-medium text-[#8BBF9A] mt-0.5">
                  [2]
                </span>
              </button>
              <button
                onClick={() => router.push("/switch")}
                className="flex-1 rounded-[6px] bg-[var(--neutral-you-row)] pt-3.5 pb-2.5 text-center hover:bg-[var(--neutral-light-border)] transition-colors duration-200 active:scale-[0.98] cursor-pointer min-h-[44px]"
              >
                <span className="block font-sans text-[13px] font-[800] uppercase tracking-[1px] text-accent-primary">
                  IMPORT
                </span>
                <span className="block font-sans text-[9px] font-medium text-[#8BBF9A] mt-0.5">
                  [3]
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Mini Leaderboard */}
        <section className="pb-8">
          <MiniLeaderboard />
        </section>

        {/* Social Proof */}
        <SocialProof />

        {/* Short Testimonials */}
        <section className="py-8">
          <TestimonialCards />
        </section>

        {/* Featured Testimonial */}
        <section className="pb-10">
          <FeaturedTestimonial />
        </section>

        {/* How It Works */}
        <HowItWorks />
      </main>

      <LandingFooter />

      {/* Role Modal */}
      {modalView && (
        <RoleModal
          initialView={modalView}
          onClose={() => setModalView(null)}
        />
      )}
    </div>
  );
}
