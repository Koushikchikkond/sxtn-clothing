export default function ProductLoading() {
  return (
    <div className="min-h-screen">
      {/* ── Product Detail Skeleton ────────────────────────── */}
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Gallery Skeleton */}
          <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-20 h-24 bg-white/5 border border-white/10 shrink-0 animate-pulse"
                />
              ))}
            </div>
            {/* Main Image */}
            <div className="flex-1 aspect-[3/4] bg-white/5 border border-white/10 relative overflow-hidden animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
            </div>
          </div>

          {/* Product Details Skeleton */}
          <div className="flex flex-col pt-4 md:pt-10 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <div className="h-10 sm:h-12 w-4/5 bg-white/10 animate-pulse" />
              <div className="h-6 w-1/3 bg-white/5 animate-pulse" />
            </div>

            {/* Price */}
            <div className="h-8 w-2/5 bg-white/10 animate-pulse" />

            {/* Description */}
            <div className="space-y-2 py-4">
              <div className="h-4 w-full bg-white/5 animate-pulse" />
              <div className="h-4 w-11/12 bg-white/5 animate-pulse" />
              <div className="h-4 w-3/4 bg-white/5 animate-pulse" />
            </div>

            {/* Size Selector */}
            <div className="space-y-3 pt-2">
              <div className="h-4 w-24 bg-white/10 animate-pulse" />
              <div className="flex gap-2">
                {["S", "M", "L", "XL"].map((s) => (
                  <div
                    key={s}
                    className="h-12 w-14 bg-white/5 border border-white/10 animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Add to Cart button */}
            <div className="h-14 w-full bg-white/10 animate-pulse mt-4" />
          </div>
        </div>
      </div>

      {/* ── Suggestions Skeleton ─────────────────────── */}
      <section className="py-20 border-t border-white/10 w-full">
        <div className="px-4 sm:px-6 lg:px-12 mb-10">
          <div className="h-8 w-64 bg-white/10 animate-pulse" />
        </div>
        <div className="grid w-full grid-cols-2 md:grid-cols-4 gap-x-1 gap-y-10 px-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[3/4] w-full bg-white/5 animate-pulse" />
              <div className="px-2 space-y-2">
                <div className="h-4 w-3/4 bg-white/10 animate-pulse" />
                <div className="h-4 w-1/2 bg-white/5 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
