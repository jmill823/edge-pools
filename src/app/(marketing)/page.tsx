"use client";

import { useRef, useCallback } from "react";
import { LandingTopBar } from "./_components/LandingTopBar";
import { Hero } from "./_components/Hero";
import { SocialProof } from "./_components/SocialProof";
import { Testimonials } from "./_components/Testimonials";
import { HowItWorks } from "./_components/HowItWorks";
import { CommissionerFlow } from "./_components/CommissionerFlow";
import { PlayerFlow } from "./_components/PlayerFlow";
import { RoleSelector } from "./_components/RoleSelector";
import { LandingFooter } from "./_components/LandingFooter";

export default function HomePage() {
  const commissionerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const scrollToCommissioner = useCallback(() => {
    commissionerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToPlayer = useCallback(() => {
    playerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <LandingTopBar />

      <main className="flex-1">
        <div className="mx-auto max-w-hero">
          <Hero />
        </div>
        <SocialProof />
        <div className="mx-auto max-w-hero">
          <Testimonials />
          <HowItWorks />
        </div>
        <div ref={commissionerRef}>
          <CommissionerFlow onScrollToPlayer={scrollToPlayer} />
        </div>
        <div ref={playerRef}>
          <PlayerFlow onScrollToCommissioner={scrollToCommissioner} />
        </div>
      </main>

      <LandingFooter />

      <RoleSelector
        onSelectCommissioner={scrollToCommissioner}
        onSelectPlayer={scrollToPlayer}
      />
    </div>
  );
}
