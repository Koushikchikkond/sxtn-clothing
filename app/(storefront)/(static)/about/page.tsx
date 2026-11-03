import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About 6XTN",
  description: "The story behind 6XTN — Six, X, T, N. Streetwear built on identity.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-36 pb-32 px-6 sm:px-10 lg:px-16 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full text-center space-y-16">
        {/* Category / Sub-header */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/40">
            ORIGIN & IDENTITY
          </span>
          <div className="h-px w-12 bg-white/20" />
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-[0.15em] font-black leading-tight text-white">
          ABOUT 6XTN
        </h1>

        {/* Manifesto Content - All Uppercase */}
        <div className="space-y-10 uppercase tracking-[0.14em] text-sm sm:text-base md:text-lg text-white/90 font-medium leading-relaxed max-w-2xl mx-auto">
          <p className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white tracking-[0.12em]">
            6XTN IS A NAME I CREATED — SIX, X, T, N.
          </p>

          <p className="text-white/80">
            IT HAS NO OBVIOUS MEANING, AND THAT&apos;S EXACTLY THE POINT.
          </p>

          <p className="text-white/80">
            I WANTED SOMETHING THAT LOOKED STRONG, SOUNDED DIFFERENT, AND COULD STAND ON ITS OWN AS AN IDENTITY.
          </p>

          <div className="border-y border-white/20 py-8 my-10 space-y-4">
            <p className="text-white/60 text-xs sm:text-sm tracking-[0.25em]">
              BECAUSE THE MEANING ISN&apos;T SOMETHING WE START WITH.
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-[0.18em] text-white">
              IT&apos;S SOMETHING WE BUILD WITH IT.
            </p>
          </div>
        </div>

        {/* Footer meta */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">
          <span>INDIA-MADE, GLOBALLY WORN</span>
          <span>EST. 2024</span>
        </div>
      </div>
    </div>
  );
}
