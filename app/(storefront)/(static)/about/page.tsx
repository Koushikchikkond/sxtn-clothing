import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About 6XTN",
  description: "The story behind 6XTN — Six, X, T, N. Streetwear built on identity.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-36 pb-32 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
      <div className="space-y-16">
        {/* Title */}
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">
            Origin & Identity
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-wider font-bold">
            About 6XTN
          </h1>
        </div>

        {/* Narrative */}
        <div className="space-y-10 text-lg sm:text-xl md:text-2xl font-light text-white/90 leading-relaxed tracking-wide">
          <p className="text-2xl sm:text-3xl font-display font-medium text-white">
            6XTN is a name I created — Six, X, T, N.
          </p>

          <p>
            It has no obvious meaning, and that&apos;s exactly the point.
          </p>

          <p>
            I wanted something that looked strong, sounded different, and could stand on its own as an identity.
          </p>

          <div className="border-l-2 border-white pl-6 sm:pl-8 py-2 my-12 text-white font-medium">
            <p className="italic">
              Because the meaning isn&apos;t something we start with.
            </p>
            <p className="mt-4 text-2xl sm:text-3xl font-display uppercase tracking-wider not-italic text-white">
              It&apos;s something we build with it.
            </p>
          </div>
        </div>

        {/* Footer manifesto / meta */}
        <div className="pt-12 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs uppercase tracking-[0.2em] text-white/40">
          <span>India-Made, Globally Worn</span>
          <span>EST. 2024</span>
        </div>
      </div>
    </div>
  );
}

