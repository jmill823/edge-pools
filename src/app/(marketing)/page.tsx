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
    <div className="bg-[var(--bg-brand)] min-h-screen flex flex-col">
      <LandingTopBar />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-10 pb-8">
          <div className="mx-auto max-w-[960px] px-4 text-center">
            {/* TILT wordmark — 76px Montserrat 900 italic, gold gradient, rotated -3deg */}
            <div className="inline-block" style={{ transform: "rotate(-3deg)" }}>
              <h1
                className="font-sans text-[76px] font-black italic tracking-[-2px] leading-none"
                style={{
                  background: "linear-gradient(180deg, var(--brand-gold-gradient-start), var(--brand-gold-gradient-end))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TILT
              </h1>
              <div
                className="mx-auto mt-1"
                style={{
                  width: "200px",
                  height: "4px",
                  background: "var(--brand-gold-rule)",
                  borderRadius: "2px",
                }}
              />
            </div>
            <p className="mt-5 font-sans text-[17px] font-semibold tracking-[-0.3px]" style={{ color: "var(--neutral-text)" }}>
              Ditch the spreadsheet.
            </p>
          </div>
        </section>

        {/* CTA Buttons — gold ghost */}
        <section className="pb-8">
          <div className="mx-auto max-w-[400px] px-5">
            <div className="flex gap-2">
              <button
                onClick={() => setModalView("commissioner")}
                className="flex-1 rounded-[8px] bg-transparent pt-3.5 pb-2.5 text-center hover:bg-[var(--bg-brand)] transition-colors duration-200 active:scale-[0.98] cursor-pointer min-h-[44px]"
                style={{ border: "2px solid var(--brand-gold-cta-border)" }}
              >
                <span className="block font-sans text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--brand-gold-cta-text)" }}>
                  CREATE
                </span>
                <span className="block font-sans text-[8px] font-medium mt-0.5" style={{ color: "var(--brand-gold-rule)" }}>
                  [1]
                </span>
              </button>
              <button
                onClick={() => setModalView("player")}
                className="flex-1 rounded-[8px] bg-transparent pt-3.5 pb-2.5 text-center hover:bg-[var(--bg-brand)] transition-colors duration-200 active:scale-[0.98] cursor-pointer min-h-[44px]"
                style={{ border: "2px solid var(--brand-gold-cta-border)" }}
              >
                <span className="block font-sans text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--brand-gold-cta-text)" }}>
                  JOIN
                </span>
                <span className="block font-sans text-[8px] font-medium mt-0.5" style={{ color: "var(--brand-gold-rule)" }}>
                  [2]
                </span>
              </button>
              <button
                onClick={() => router.push("/switch")}
                className="flex-1 rounded-[8px] bg-transparent pt-3.5 pb-2.5 text-center hover:bg-[var(--bg-brand)] transition-colors duration-200 active:scale-[0.98] cursor-pointer min-h-[44px]"
                style={{ border: "2px solid var(--brand-gold-cta-border)" }}
              >
                <span className="block font-sans text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--brand-gold-cta-text)" }}>
                  IMPORT
                </span>
                <span className="block font-sans text-[8px] font-medium mt-0.5" style={{ color: "var(--brand-gold-rule)" }}>
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
