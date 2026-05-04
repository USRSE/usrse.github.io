/**
 * Deterministic monogram block generated from a member id.
 *
 * Treats the member id as a seed: the same id always produces the same
 * arrangement, but two different ids look meaningfully different. Used as
 * the photo-less fallback so empty profiles don't all look identical.
 *
 * Visual language matches the editorial aesthetic — no shadows, no fills
 * outside the palette, just typographic blocks arranged on a grid with
 * one color cell drawn from the brand palette. Corners are rounded at the
 * SVG level so the shape works inside any container.
 */
function hash(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const PALETTE: { bg: string; ink: string; accent: string }[] = [
  { bg: "#F4F0FF", ink: "#1B1238", accent: "#741755" }, // purple
  { bg: "#E8F8F4", ink: "#0E2B25", accent: "#188EAC" }, // teal
  { bg: "#FFF6E5", ink: "#2A1D03", accent: "#F4B73A" }, // amber
  { bg: "#FFE9EB", ink: "#2A0B11", accent: "#E9436A" }, // rose
  { bg: "#E6F0FF", ink: "#0F1F38", accent: "#3263E2" }, // cobalt
  { bg: "#F1F2F4", ink: "#0A0A0F", accent: "#1F1F2A" }, // graphite
];

interface MonogramProps {
  seed: string;
  initials: string;
  className?: string;
}

const RADIUS = 28; // matches rounded-3xl

export function Monogram({ seed, initials, className = "" }: MonogramProps) {
  const h = hash(seed);
  const palette = PALETTE[h % PALETTE.length];
  const rotate = ((h >> 4) % 7) - 3; // -3..+3 deg
  const accentCorner = (h >> 8) % 4;
  const stripeOffset = ((h >> 12) % 12) - 6;

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Monogram for ${initials}`}
      className={className}
    >
      {/* Rounded canvas */}
      <rect width="400" height="500" rx={RADIUS} ry={RADIUS} fill={palette.bg} />

      {/* Clip everything decorative to the rounded canvas */}
      <defs>
        <clipPath id={`mono-clip-${seed}`}>
          <rect
            width="400"
            height="500"
            rx={RADIUS}
            ry={RADIUS}
          />
        </clipPath>
      </defs>

      <g clipPath={`url(#mono-clip-${seed})`}>
        {/* Diagonal stripes — subtle editorial accents */}
        <line
          x1={-50}
          y1={250 + stripeOffset * 8}
          x2={450}
          y2={150 + stripeOffset * 8}
          stroke={palette.ink}
          strokeOpacity={0.06}
          strokeWidth={1}
        />
        <line
          x1={-50}
          y1={350 + stripeOffset * 4}
          x2={450}
          y2={250 + stripeOffset * 4}
          stroke={palette.ink}
          strokeOpacity={0.06}
          strokeWidth={1}
        />

        {/* Accent quadrant — one of four corners */}
        <rect
          x={accentCorner === 0 || accentCorner === 2 ? 0 : 200}
          y={accentCorner === 0 || accentCorner === 1 ? 0 : 250}
          width={200}
          height={250}
          fill={palette.accent}
          fillOpacity={0.08}
        />

        {/* Glyph */}
        <g transform={`translate(200 250) rotate(${rotate})`}>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Plus Jakarta Sans', 'Roboto', system-ui, sans-serif"
            fontWeight={800}
            fontSize={initials.length > 1 ? 220 : 280}
            fill={palette.ink}
            letterSpacing={initials.length > 1 ? -8 : 0}
          >
            {initials}
          </text>
        </g>

        {/* Quiet seed label */}
        <text
          x={28}
          y={478}
          fontFamily="'Fira Code', ui-monospace, monospace"
          fontSize={10}
          fill={palette.ink}
          fillOpacity={0.5}
          letterSpacing={2}
        >
          {seed.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}
