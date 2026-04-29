/**
 * Photo placeholder component for sections awaiting real imagery.
 * Displays a styled empty state with a label indicating what photo goes there.
 * Replace the placeholder div with an <img> when photos are sourced.
 */

interface PhotoPlaceholderProps {
  label: string;
  aspect?: "wide" | "square" | "portrait" | "ultrawide";
  className?: string;
}

const aspectClasses = {
  wide: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  ultrawide: "aspect-[21/9]",
};

export function PhotoPlaceholder({ label, aspect = "wide", className = "" }: PhotoPlaceholderProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-neutral-100 ${aspectClasses[aspect]} ${className}`}
    >
      {/* Subtle diagonal pattern to distinguish from empty space */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
        <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <span className="text-xs font-mono text-neutral-400 text-center">{label}</span>
      </div>
    </div>
  );
}

/**
 * A horizontal strip of photo placeholders — used between homepage sections.
 */
export function PhotoStrip({ photos }: { photos: { label: string; span?: "wide" | "narrow" }[] }) {
  return (
    <section className="py-6 bg-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <div
              key={i}
              className={photo.span === "wide" ? "col-span-2" : ""}
            >
              <PhotoPlaceholder
                label={photo.label}
                aspect={photo.span === "wide" ? "ultrawide" : "wide"}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
