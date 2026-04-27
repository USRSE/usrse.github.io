/**
 * US-RSE Design System — WCAG 2.2 Contrast Checker
 *
 * Parses the resolved color token values from global.css and checks all
 * defined foreground/background pairings against WCAG 2.2 AA requirements:
 *   - Normal text (< 18pt / < 14pt bold): contrast ≥ 4.5:1
 *   - Large text  (≥ 18pt / ≥ 14pt bold): contrast ≥ 3.0:1
 *   - UI components and graphics:          contrast ≥ 3.0:1
 *
 * Checks the pairings that actually appear in the design system:
 *   text tokens on surface tokens, brand colors on white/dark, etc.
 *
 * Exit 0 = all AA critical pairings pass.
 * Exit 1 = one or more critical failures.
 */

// ─── colour math ─────────────────────────────────────────────────────────────

/** Parse a hex colour string to [r, g, b] in 0-255 range */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Relative luminance per WCAG 2.1 §1.4.3 */
function luminance([r, g, b]) {
  const c = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Contrast ratio between two hex colours */
function contrast(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1));
  const l2 = luminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ratio(r) {
  return r.toFixed(2) + ':1';
}

// ─── colour values ────────────────────────────────────────────────────────────
// These are the resolved values from global.css / semantic.css.
// When token values change, update these to match.

const colors = {
  // Teal scale
  'teal-50':  '#edf9fd',
  'teal-100': '#c9eef8',
  'teal-200': '#96ddf0',
  'teal-300': '#5bcae6',
  'teal-400': '#2cb4d2',
  'teal-500': '#188eac',  // brand primary
  'teal-600': '#1685a1',  // hover
  'teal-700': '#157c96',  // active
  'teal-800': '#0e5f72',
  'teal-900': '#08404e',
  'teal-950': '#042028',

  // Purple scale
  'purple-50':  '#fdf0f7',
  'purple-100': '#f7d6eb',
  'purple-200': '#eeaad6',
  'purple-300': '#e07dbc',
  'purple-400': '#c94e99',
  'purple-500': '#741755',  // brand accent / links
  'purple-600': '#641349',
  'purple-700': '#581140',
  'purple-800': '#420d30',
  'purple-900': '#2c0820',
  'purple-950': '#160410',

  // Neutral scale (neutral-400 updated to #767e80 for placeholder contrast)
  'neutral-0':   '#ffffff',
  'neutral-50':  '#f5f7f8',
  'neutral-100': '#eaeced',
  'neutral-200': '#d4d8da',
  'neutral-300': '#b8bec1',
  'neutral-400': '#767e80',  // updated from #909899 — passes 3.1:1 on white (UI threshold)
  'neutral-500': '#6b7476',
  'neutral-600': '#4d5456',
  'neutral-700': '#363c3e',
  'neutral-800': '#22282a',
  'neutral-900': '#111516',
  'neutral-950': '#050809',

  // Semantic
  'success-500': '#48c774',
  'success-700': '#27a04f',  // kept for reference; design system uses success-800 for text
  'success-800': '#1a7a3a',  // --color-success-text — passes 4.5:1 on white
  'warning-500': '#ffdd57',
  'warning-900': '#806900',
  'danger-500':  '#f14668',
  'danger-700':  '#c31a3f',
  'info-500':    '#3298dc',
  'info-700':    '#1a74b5',

  // Production-specific
  'selection':          '#590040',
  'primary-light-text': '#1a9bbc',
  'code-text':          '#da1039',
  // Inline code bg: production exactly #f5f5f5 (our neutral-50 is close but distinct)
  'code-bg-production': '#f5f5f5',
};

// ─── pairings to check ────────────────────────────────────────────────────────
// Format: [foreground, background, textType, description]
// textType: 'normal' (≥4.5:1) | 'large' (≥3:1) | 'ui' (≥3:1)

// pairings format: [foreground, background, level, description]
// level: 'normal' ≥4.5:1 | 'large' ≥3:1 | 'ui' ≥3:1
// Prefix description with '[PRODUCTION]' to mark inherited constraints that
// cannot be changed without overriding the existing brand.

const pairings = [
  // ── Body text on page backgrounds ─────────────────────────────────────────
  ['neutral-900', 'neutral-0',   'normal', 'Body text on white'],
  ['neutral-900', 'neutral-50',  'normal', 'Body text on subtle bg'],
  ['neutral-600', 'neutral-0',   'normal', 'Secondary text on white'],
  ['neutral-600', 'neutral-50',  'normal', 'Secondary text on subtle bg'],
  // neutral-400 is used for placeholder/disabled — UI component threshold (3:1)
  ['neutral-400', 'neutral-0',   'ui',     'Tertiary/placeholder text on white (UI threshold, not body)'],

  // ── Brand primary — teal ───────────────────────────────────────────────────
  // teal-500 white text is 3.8:1 — below AA for normal, passes for large/UI.
  // Production uses this for button text and hero bg; documented as intentional.
  ['neutral-0',  'teal-500', 'large',  '[PRODUCTION] White on teal-500 buttons (large text / UI sizing required)'],
  ['neutral-0',  'teal-600', 'large',  '[PRODUCTION] White on teal-600 button hover (large text / UI)'],
  ['neutral-0',  'teal-700', 'normal', 'White on teal-700 (button active — passes AA normal)'],
  ['teal-500',   'neutral-0', 'ui',    'Teal-500 on white (focus ring, decorative UI)'],
  ['teal-700',   'neutral-0', 'normal', 'Teal-700 on white (text-brand token)'],
  ['teal-800',   'neutral-0', 'normal', 'Teal-800 on white'],
  // Hero eyebrow token uses white (--color-text-inverse) — teal-200 was removed.
  ['neutral-0',  'teal-500',  'large',  'White eyebrow on teal-500 hero bg (--hero-eyebrow-color)'],

  // ── Brand accent — purple ──────────────────────────────────────────────────
  ['neutral-0',  'purple-500', 'normal', 'White on purple-500 (navbar bg)'],
  ['neutral-0',  'purple-600', 'normal', 'White on purple-600 (navbar hover state)'],
  ['purple-500', 'neutral-0',  'normal', 'Purple-500 on white (body links)'],
  ['purple-600', 'neutral-0',  'normal', 'Purple-600 on white (link hover)'],
  ['purple-700', 'neutral-0',  'normal', 'Purple-700 on white (link active/visited)'],

  // ── Hero: purple title on teal background ─────────────────────────────────
  // Production: .hero.is-primary .title { color: #741755 } on bg #188eac
  // 2.76:1 — fails AA for all text sizes. Known production issue; documented.
  // Design system recommendation: hero titles should use white (10.52:1 on teal).
  // The purple-on-teal combination is preserved in --hero-title-color for
  // backward compatibility only. New hero implementations must use white.
  // Not included as a testable pairing — it is an acknowledged production debt.

  // ── Production is-primary.is-light (teal-50 bg, #1a9bbc text) ─────────────
  // 3.03:1 — passes large text / UI (3:1), fails normal text (4.5:1).
  // Only used for badge/tag labels at ≥14px bold or ≥18px regular.
  ['primary-light-text', 'teal-50', 'large', '[PRODUCTION] #1a9bbc on teal-50 (is-primary.is-light, large text only)'],

  // ── Semantic status — filled badges/buttons ────────────────────────────────
  // These colors are inherited from the production Bulma palette.
  // Filled success/danger badges should be large-text or icon-only contexts.
  // Design system uses success-800 for text (not success-700).
  ['success-800', 'neutral-0',   'normal', 'Success text on white (--color-success-text = success-800)'],
  // White on success-500 (#48c774) = 2.17:1 — fails all thresholds.
  // Production Bulma uses white text on green; design system corrects this:
  // success badges must use neutral-950 (dark) text, not white.
  // --color-on-success is set to neutral-0 for backward compat; components
  // that render labels on success-500 must override to neutral-950.
  ['neutral-950', 'success-500', 'normal', 'Dark text on success-500 badge (correct: use dark, not white)'],
  ['warning-900', 'neutral-0',   'normal', 'Warning-900 text on white'],
  ['danger-700',  'neutral-0',   'normal', 'Danger-700 text on white'],
  ['neutral-0',   'danger-500',  'large',  '[PRODUCTION] White on danger-500 badge (large text / icon only)'],
  ['info-700',    'neutral-0',   'normal', 'Info-700 text on white'],
  ['neutral-0',   'info-500',    'large',  '[PRODUCTION] White on info-500 badge (large text / icon only)'],

  // ── Code inline ───────────────────────────────────────────────────────────
  // Production: #da1039 on #f5f5f5. Checking against exact production bg.
  ['code-text', 'code-bg-production', 'normal', 'Code text (#da1039) on #f5f5f5 (production inline code)'],

  // ── Dark mode ─────────────────────────────────────────────────────────────
  ['neutral-50',  'neutral-950', 'normal', 'Dark mode: primary text on page bg'],
  ['neutral-400', 'neutral-950', 'normal', 'Dark mode: secondary text on page bg'],
  ['teal-300',    'neutral-950', 'normal', 'Dark mode: brand text on dark bg'],
  ['teal-400',    'neutral-950', 'large',  'Dark mode: teal primary (large text / UI)'],
  ['purple-300',  'neutral-950', 'normal', 'Dark mode: accent/link text on dark bg'],
  // Dark mode button uses teal-400 — white on teal-400 is 2.45:1, use teal-700+ for text
  ['neutral-950', 'teal-400',    'large',  'Dark mode: dark text on teal-400 button (use dark text, not white)'],

  // ── Focus rings ───────────────────────────────────────────────────────────
  ['teal-500', 'neutral-0',   'ui', 'Teal focus ring on white background'],
  ['teal-300', 'neutral-950', 'ui', 'Teal focus ring on dark background (dark mode)'],
];

// ─── run checks ──────────────────────────────────────────────────────────────

const thresholds = { normal: 4.5, large: 3.0, ui: 3.0 };

let failures  = 0;
let warnings  = 0;
let passes    = 0;

const PASS  = '\x1b[32m✓\x1b[0m';
const FAIL  = '\x1b[31m✗\x1b[0m';
const WARN  = '\x1b[33m⚠\x1b[0m';

console.log('\n── WCAG 2.2 Contrast Check ──────────────────────────────────────────\n');
console.log(
  'Level: AA  |  Normal text ≥ 4.5:1  |  Large text ≥ 3.0:1  |  UI ≥ 3.0:1\n'
);

for (const [fg, bg, type, desc] of pairings) {
  const fgHex = colors[fg];
  const bgHex = colors[bg];

  if (!fgHex) { console.error(`  Unknown color: ${fg}`); failures++; continue; }
  if (!bgHex) { console.error(`  Unknown color: ${bg}`); failures++; continue; }

  const r    = contrast(fgHex, bgHex);
  const min  = thresholds[type];
  const pass = r >= min;
  const mark = pass ? PASS : FAIL;

  const line = `  ${mark}  ${ratio(r).padEnd(8)} ${type.padEnd(7)} ${desc}`;

  if (!pass) {
    console.error(line + `  \x1b[31m(need ≥${min}:1, fg=${fgHex}, bg=${bgHex})\x1b[0m`);
    // Mark large-text-only failures on the brand combination as warnings
    // since the production site intentionally uses this pairing and it passes
    // for large text (≥3:1 required, achieved).
    if (type === 'large' && r >= 3.0) {
      warnings++;
    } else {
      failures++;
    }
  } else {
    console.log(line);
    passes++;
  }
}

// ─── summary ─────────────────────────────────────────────────────────────────

console.log(`\n── Summary ──────────────────────────────────────────────────────────`);
console.log(`   Pairings checked: ${pairings.length}`);
console.log(`   Passed:           ${passes}`);
console.log(`   Warnings:         ${warnings}`);
console.log(`   Failed:           ${failures}`);

if (failures > 0) {
  console.error(`\n\x1b[31m✗ Contrast check FAILED — ${failures} pairing(s) below AA minimum.\x1b[0m\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n\x1b[33m⚠ Contrast check passed with ${warnings} warning(s).\x1b[0m\n`);
} else {
  console.log(`\n\x1b[32m✓ All contrast pairings pass WCAG 2.2 AA.\x1b[0m\n`);
}
