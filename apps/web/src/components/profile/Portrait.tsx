import { Monogram } from "@/components/Monogram";

interface PortraitProps {
  photoUrl: string | null;
  initials: string;
  memberId: string;
}

export function Portrait({ photoUrl, initials, memberId }: PortraitProps) {
  return (
    <figure className="relative aspect-[4/5] w-full max-w-md mb-10 group rounded-3xl overflow-hidden ring-1 ring-neutral-200 transition-shadow duration-500 hover:shadow-2xl">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className="w-full h-full object-cover grayscale-[40%] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.02]"
        />
      ) : (
        <Monogram
          seed={memberId}
          initials={initials}
          className="w-full h-full"
        />
      )}
      <figcaption className="absolute top-4 left-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/90 mix-blend-difference pointer-events-none">
        Portrait
      </figcaption>
      <span className="absolute bottom-4 right-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 mix-blend-difference pointer-events-none">
        4 ✕ 5
      </span>
    </figure>
  );
}
