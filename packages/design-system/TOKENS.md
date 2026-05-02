# US-RSE Design System — Token Reference

The complete reference for the three-tier CSS custom property system. Tokens are the single source of truth for every visual decision. No component file contains raw hex values, pixel literals, or hard-coded numeric values — only token references.

---

## Table of Contents

1. [Hierarchy and Rules](#hierarchy-and-rules)
2. [Naming Convention](#naming-convention)
3. [Tier 1: Global Tokens](#tier-1-global-tokens)
4. [Tier 2: Semantic Tokens](#tier-2-semantic-tokens)
5. [Tier 3: Component Tokens](#tier-3-component-tokens)
6. [Dark Mode and Theming](#dark-mode-and-theming)
7. [How to Add Tokens](#how-to-add-tokens)
8. [Validation](#validation)

---

## Hierarchy and Rules

```
global.css (Tier 1)
  Contains: raw primitive values
  May reference: nothing (raw values only)
  Must not: use var() references

semantic.css (Tier 2)
  Contains: semantic aliases with design intent
  May reference: Tier 1 tokens via var()
  Must not: use raw values (hex, px, rem literals)

components.css (Tier 3)
  Contains: component-specific property bindings
  May reference: Tier 2 tokens via var()
  Must not: use raw values or Tier 1 references

Component CSS files (button.css, card.css, etc.)
  May reference: Tier 3 tokens via var()
  Must not: reference Tier 1 or Tier 2 tokens directly
```

The `pixi run validate` task enforces this contract automatically. Run it before every commit.

**Why this matters:** If the primary brand color needs to change from teal to a new color, the change is a single line in `semantic.css`. Tier 3 tokens that reference `--color-brand-primary` update automatically. Components never change. Dark mode works the same way: `dark-mode.css` overrides only Tier 2 tokens, and all Tier 3 and component styles inherit the change.

---

## Naming Convention

**Tier 1 — Global:** `--[category]-[scale-step]`

```
--color-teal-500
--color-neutral-200
--space-4
--font-size-base
--font-weight-bold
--radius-md
--shadow-sm
--z-index-modal
--duration-normal
```

**Tier 2 — Semantic:** `--[category]-[role]-[modifier?]`

```
--color-brand-primary
--color-brand-primary-hover
--color-surface-page
--color-text-primary
--color-text-secondary
--color-border-default
--color-link-default
--space-inline-md
--space-stack-lg
--space-section-md
--radius-button
--shadow-card
--transition-interactive
```

**Tier 3 — Component:** `--[component]-[property]-[variant?]-[state?]`

```
--button-bg-primary
--button-bg-primary-hover
--button-font-size-md
--button-padding-x-sm
--input-border-error
--card-shadow-hover
--nav-bg
--hero-title-color
```

---

## Tier 1: Global Tokens

**File:** `tokens/global.css`

### Color — Teal Scale

Anchored at `#188eac` (step 500). Derived by adjusting HSL lightness in perceptual increments at Hue ≈195°.

| Token | Hex |
|---|---|
| `--color-teal-50` | `#edf9fd` |
| `--color-teal-100` | `#c9eef8` |
| `--color-teal-200` | `#96ddf0` |
| `--color-teal-300` | `#5bcae6` |
| `--color-teal-400` | `#2cb4d2` |
| `--color-teal-500` | `#188eac` |
| `--color-teal-600` | `#1685a1` |
| `--color-teal-700` | `#157c96` |
| `--color-teal-800` | `#0e5f72` |
| `--color-teal-900` | `#08404e` |
| `--color-teal-950` | `#042028` |

### Color — Purple Scale

Anchored at `#741755` (step 500). Derived at Hue ≈322°.

| Token | Hex |
|---|---|
| `--color-purple-50` | `#fdf0f7` |
| `--color-purple-100` | `#f7d6eb` |
| `--color-purple-200` | `#eeaad6` |
| `--color-purple-300` | `#e07dbc` |
| `--color-purple-400` | `#c94e99` |
| `--color-purple-500` | `#741755` |
| `--color-purple-600` | `#641349` |
| `--color-purple-700` | `#581140` |
| `--color-purple-800` | `#420d30` |
| `--color-purple-900` | `#2c0820` |
| `--color-purple-950` | `#160410` |

### Color — Neutral Scale

Hue 195°, Saturation 8%. Slight teal undertone for brand cohesion.

| Token | Hex |
|---|---|
| `--color-neutral-0` | `#ffffff` |
| `--color-neutral-50` | `#f5f7f8` |
| `--color-neutral-100` | `#eaeced` |
| `--color-neutral-200` | `#d4d8da` |
| `--color-neutral-300` | `#b8bec1` |
| `--color-neutral-400` | `#767e80` |
| `--color-neutral-500` | `#6b7476` |
| `--color-neutral-600` | `#4d5456` |
| `--color-neutral-700` | `#363c3e` |
| `--color-neutral-800` | `#22282a` |
| `--color-neutral-900` | `#111516` |
| `--color-neutral-950` | `#050809` |

### Color — Semantic Status Scales

| Token | Hex | Notes |
|---|---|---|
| `--color-success-100` | `#d4f5e0` | |
| `--color-success-200` | `#9de9bb` | |
| `--color-success-300` | `#5fd990` | |
| `--color-success-400` | `#3ec46d` | |
| `--color-success-500` | `#48c774` | Production anchor |
| `--color-success-600` | `#3abb67` | |
| `--color-success-700` | `#27a04f` | |
| `--color-success-800` | `#1a7a3a` | Text on light surfaces |
| `--color-success-900` | `#0d5226` | |
| `--color-warning-100` | `#fff8d6` | |
| `--color-warning-300` | `#ffe47d` | |
| `--color-warning-500` | `#ffdd57` | Production anchor |
| `--color-warning-700` | `#e6be00` | |
| `--color-warning-900` | `#806900` | Text on warning surfaces |
| `--color-danger-100` | `#fdd8df` | |
| `--color-danger-300` | `#f57b97` | |
| `--color-danger-500` | `#f14668` | Production anchor |
| `--color-danger-700` | `#ef2e55` | |
| `--color-danger-900` | `#8f0e2a` | |
| `--color-info-100` | `#d3ecf9` | |
| `--color-info-300` | `#6ab9eb` | |
| `--color-info-500` | `#3298dc` | Production anchor |
| `--color-info-700` | `#1a74b5` | |
| `--color-info-900` | `#0a3c60` | |

### Color — Absolute Constants

| Token | Value |
|---|---|
| `--color-white` | `#ffffff` |
| `--color-black` | `#000000` |
| `--color-transparent` | `transparent` |

### Spacing Scale

Base 4px (0.25rem). Powers of 2 with half-steps.

| Token | rem | px |
|---|---|---|
| `--space-0` | 0 | 0 |
| `--space-px` | — | 1px |
| `--space-0-5` | 0.125rem | 2px |
| `--space-1` | 0.25rem | 4px |
| `--space-1-5` | 0.375rem | 6px |
| `--space-2` | 0.5rem | 8px |
| `--space-2-5` | 0.625rem | 10px |
| `--space-3` | 0.75rem | 12px |
| `--space-3-5` | 0.875rem | 14px |
| `--space-4` | 1rem | 16px |
| `--space-5` | 1.25rem | 20px |
| `--space-6` | 1.5rem | 24px |
| `--space-7` | 1.75rem | 28px |
| `--space-8` | 2rem | 32px |
| `--space-9` | 2.25rem | 36px |
| `--space-10` | 2.5rem | 40px |
| `--space-11` | 2.75rem | 44px |
| `--space-12` | 3rem | 48px |
| `--space-14` | 3.5rem | 56px |
| `--space-16` | 4rem | 64px |
| `--space-20` | 5rem | 80px |
| `--space-24` | 6rem | 96px |
| `--space-28` | 7rem | 112px |
| `--space-32` | 8rem | 128px |
| `--space-36` | 9rem | 144px |
| `--space-40` | 10rem | 160px |
| `--space-48` | 12rem | 192px |
| `--space-56` | 14rem | 224px |
| `--space-64` | 16rem | 256px |

### Typography — Font Families

| Token | Value |
|---|---|
| `--font-family-body` | `"Montserrat", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| `--font-family-heading` | `"Roboto", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| `--font-family-mono` | `"Fira Code", "Fira Mono", "JetBrains Mono", "Cascadia Code", "Courier New", monospace` |
| `--font-family-system` | `-apple-system, BlinkMacSystemFont, "Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif` |

### Typography — Type Scale

| Token | Value | Approx px |
|---|---|---|
| `--font-size-display-2xl` | `clamp(3rem, 5vw + 1rem, 4.5rem)` | 48–72px |
| `--font-size-display-xl` | `clamp(2.5rem, 4vw + 1rem, 3.75rem)` | 40–60px |
| `--font-size-display-lg` | `clamp(2rem, 3vw + 1rem, 3rem)` | 32–48px |
| `--font-size-h1` | `clamp(1.875rem, 2.5vw + 0.75rem, 2.5rem)` | 30–40px |
| `--font-size-h2` | `clamp(1.5rem, 2vw + 0.5rem, 2rem)` | 24–32px |
| `--font-size-h3` | `clamp(1.25rem, 1.5vw + 0.25rem, 1.5rem)` | 20–24px |
| `--font-size-h4` | `clamp(1.125rem, 1vw + 0.25rem, 1.25rem)` | 18–20px |
| `--font-size-h5` | `1rem` | 16px |
| `--font-size-h6` | `0.875rem` | 14px |
| `--font-size-xl` | `1.25rem` | 20px |
| `--font-size-lg` | `1.125rem` | 18px |
| `--font-size-base` | `1rem` | 16px |
| `--font-size-sm` | `0.875rem` | 14px |
| `--font-size-xs` | `0.75rem` | 12px |
| `--font-size-2xs` | `0.625rem` | 10px |

### Typography — Font Weights

| Token | Value |
|---|---|
| `--font-weight-thin` | 100 |
| `--font-weight-extralight` | 200 |
| `--font-weight-light` | 300 |
| `--font-weight-regular` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |
| `--font-weight-extrabold` | 800 |
| `--font-weight-black` | 900 |

### Typography — Line Heights

| Token | Value |
|---|---|
| `--line-height-none` | 1 |
| `--line-height-tight` | 1.25 |
| `--line-height-snug` | 1.375 |
| `--line-height-normal` | 1.5 |
| `--line-height-relaxed` | 1.625 |
| `--line-height-loose` | 2 |

### Typography — Letter Spacing

| Token | Value | Usage |
|---|---|---|
| `--letter-spacing-tighter` | -0.05em | Display headings (optional) |
| `--letter-spacing-tight` | -0.025em | Display, large headings |
| `--letter-spacing-normal` | 0em | Body text default |
| `--letter-spacing-wide` | 0.025em | UI labels |
| `--letter-spacing-wider` | 0.05em | |
| `--letter-spacing-widest` | 0.1em | |
| `--letter-spacing-caps` | 0.08em | Uppercase labels, badges |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-none` | 0 | |
| `--radius-sm` | 2px | Tooltips |
| `--radius-md` | 4px | Buttons, inputs (production standard) |
| `--radius-lg` | 6px | Cards, dropdowns (production) |
| `--radius-xl` | 8px | Modals |
| `--radius-2xl` | 12px | |
| `--radius-3xl` | 16px | |
| `--radius-full` | 9999px | Pills, badges, avatars |

### Box Shadows (Elevation System)

| Token | Value | Usage |
|---|---|---|
| `--shadow-none` | `none` | Flat elements |
| `--shadow-sm` | `0 0.5em 1em -0.125em rgba(10,10,10,0.1), 0 0 0 1px rgba(10,10,10,0.02)` | Cards, dropdowns |
| `--shadow-md` | `0 0.5em 1.5em -0.125em rgba(10,10,10,0.15), 0 0 0 1px rgba(10,10,10,0.03)` | Modals, sticky headers |
| `--shadow-lg` | `0 1em 2em -0.25em rgba(10,10,10,0.2), 0 0 0 1px rgba(10,10,10,0.04)` | Popovers, tooltips |
| `--shadow-xl` | `0 1.5em 3em -0.5em rgba(10,10,10,0.25), 0 0 0 1px rgba(10,10,10,0.05)` | Drawers, overlays |
| `--shadow-inset-sm` | `inset 0 1px 2px rgba(10,10,10,0.2)` | Form inputs (production-matched) |
| `--shadow-inset-md` | `inset 0 2px 4px rgba(10,10,10,0.12)` | Pressed inputs |
| `--shadow-focus-teal` | `0 0 0 0.2em rgba(24,142,172,0.3)` | Teal focus rings |
| `--shadow-focus-purple` | `0 0 0 0.2em rgba(116,23,85,0.3)` | Purple focus rings |
| `--shadow-focus-default` | `0 0 0 0.2em rgba(50,115,220,0.25)` | Neutral focus rings |

### Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `--z-index-below` | -1 | Behind baseline |
| `--z-index-base` | 0 | Default stacking |
| `--z-index-raised` | 10 | Sticky elements, floating labels |
| `--z-index-dropdown` | 20 | Menus, select dropdowns |
| `--z-index-sticky` | 30 | Sticky header/nav |
| `--z-index-overlay` | 40 | Backdrop overlays |
| `--z-index-modal` | 50 | Modal dialogs |
| `--z-index-popover` | 60 | Tooltips, popovers |
| `--z-index-toast` | 70 | Notification toasts |
| `--z-index-max` | 9999 | Escape hatches — document each use |

### Transitions

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | 0ms | |
| `--duration-fast` | 100ms | Hover state changes |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Expansion, reveal |
| `--duration-slower` | 500ms | Page transitions |
| `--ease-linear` | `linear` | |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | State changes |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful elements |
| `--ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Spring-like reveals |

### Border Widths

| Token | Value |
|---|---|
| `--border-width-0` | 0 |
| `--border-width-1` | 1px |
| `--border-width-2` | 2px |
| `--border-width-4` | 4px |

### Opacity Scale

Tokens: `--opacity-0` (0) through `--opacity-100` (1), at steps 0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100.

### Breakpoints (Reference Only)

CSS custom properties cannot be used in media query expressions. These values are documented here for reference and used in JavaScript logic:

| Name | Value |
|---|---|
| sm | 640px |
| md | 769px (matches production) |
| lg | 1024px (matches production) |
| xl | 1216px (matches production) |
| 2xl | 1408px (matches production) |

---

## Tier 2: Semantic Tokens

**File:** `tokens/semantic.css`

Every value in this file references a Tier 1 token via `var()`. No raw values appear here.

### Color — Brand

| Token | References | Notes |
|---|---|---|
| `--color-brand-primary` | `--color-teal-500` | `#188eac` — production anchor |
| `--color-brand-primary-hover` | `--color-teal-600` | `#1685a1` |
| `--color-brand-primary-active` | `--color-teal-700` | `#157c96` |
| `--color-brand-primary-subtle` | `--color-teal-50` | Light teal backgrounds |
| `--color-brand-primary-muted` | `--color-teal-100` | Muted teal |
| `--color-brand-primary-light-text` | `#1a9bbc` | Text on light-teal surfaces (raw — production value) |
| `--color-brand-accent` | `--color-purple-500` | `#741755` — nav background |
| `--color-brand-accent-hover` | `--color-purple-600` | |
| `--color-brand-accent-active` | `--color-purple-700` | |
| `--color-brand-accent-subtle` | `--color-purple-50` | |
| `--color-brand-accent-muted` | `--color-purple-100` | |

### Color — Surface

| Token | References | Notes |
|---|---|---|
| `--color-surface-page` | `--color-neutral-0` | Page background |
| `--color-surface-subtle` | `--color-neutral-50` | Alternate page sections |
| `--color-surface-base` | `--color-neutral-0` | Component backgrounds |
| `--color-surface-raised` | `--color-neutral-0` | Elevated components |
| `--color-surface-overlay` | `--color-neutral-0` | Modals, dropdowns |
| `--color-surface-hover` | `--color-neutral-50` | Hover state background |
| `--color-surface-pressed` | `--color-neutral-100` | Active/pressed state |
| `--color-surface-selected` | `--color-teal-50` | Selected item |
| `--color-surface-selected-hover` | `--color-teal-100` | Hovered selected item |
| `--color-surface-primary` | `--color-teal-50` | Tinted primary surface |
| `--color-surface-accent` | `--color-purple-50` | Tinted accent surface |
| `--color-surface-footer` | `--color-neutral-50` | Footer background |
| `--color-code-inline-bg` | `--color-neutral-100` | Inline code background |
| `--color-code-inline-text` | `--color-danger-700` | Inline code text (red) |

### Color — Text

| Token | References | Contrast on light bg |
|---|---|---|
| `--color-text-primary` | `--color-neutral-900` | ~18:1 — AAA |
| `--color-text-secondary` | `--color-neutral-600` | ~6:1 — AA |
| `--color-text-tertiary` | `--color-neutral-400` | ~3.1:1 — UI minimum |
| `--color-text-disabled` | `--color-neutral-300` | Below AA — decorative only |
| `--color-text-inverse` | `--color-neutral-0` | White — for dark/colored backgrounds |
| `--color-text-inverse-secondary` | `--color-neutral-200` | Muted inverse text |
| `--color-text-brand` | `--color-teal-700` | 6.5:1 — AA |
| `--color-text-accent` | `--color-purple-500` | 8.5:1 — AAA |

### Color — Links

| Token | References | Notes |
|---|---|---|
| `--color-link-default` | `--color-purple-500` | Body links — 8.5:1, AAA |
| `--color-link-hover` | `--color-purple-600` | |
| `--color-link-active` | `--color-purple-700` | |
| `--color-link-visited` | `--color-purple-700` | |
| `--color-link-nav` | `--color-neutral-0` | White on purple navbar |
| `--color-link-nav-hover` | `--color-neutral-0` | Stays white |
| `--color-link-nav-dropdown` | `--color-text-primary` | Dark on white dropdown |
| `--color-link-nav-dropdown-hover` | `--color-brand-primary` | Teal on hover |

### Color — Border

| Token | References |
|---|---|
| `--color-border-subtle` | `--color-neutral-100` |
| `--color-border-default` | `--color-neutral-200` |
| `--color-border-strong` | `--color-neutral-400` |
| `--color-border-inverse` | `--color-neutral-700` |
| `--color-border-brand` | `--color-teal-500` |
| `--color-border-accent` | `--color-purple-500` |
| `--color-border-focus` | `--color-teal-500` |

### Color — Semantic Status

| Token | References | Notes |
|---|---|---|
| `--color-success` | `--color-success-500` | |
| `--color-success-hover` | `--color-success-600` | |
| `--color-success-subtle` | `--color-success-100` | Background |
| `--color-success-text` | `--color-success-800` | 5.7:1 on white — AA |
| `--color-success-border` | `--color-success-400` | |
| `--color-on-success` | `--color-neutral-950` | Dark text on green — white fails |
| `--color-warning` | `--color-warning-500` | Yellow |
| `--color-warning-text` | `--color-warning-900` | Always dark on yellow |
| `--color-on-warning` | `--color-neutral-950` | |
| `--color-danger` | `--color-danger-500` | |
| `--color-danger-text` | `--color-danger-700` | |
| `--color-on-danger` | `--color-neutral-0` | White on red — passes |
| `--color-info` | `--color-info-500` | |
| `--color-info-text` | `--color-info-700` | |
| `--color-on-info` | `--color-neutral-0` | |

### Color — Overlays and Selection

| Token | Value |
|---|---|
| `--color-overlay-light` | `rgba(255, 255, 255, 0.25)` |
| `--color-overlay-dark-sm` | `rgba(10, 10, 10, 0.1)` |
| `--color-overlay-dark-md` | `rgba(10, 10, 10, 0.25)` |
| `--color-overlay-dark-lg` | `rgba(10, 10, 10, 0.4)` |
| `--color-overlay-dark-xl` | `rgba(0, 0, 0, 0.7)` |
| `--color-selection-bg` | `#590040` | Production `::selection` exact value |
| `--color-selection-text` | `--color-neutral-0` | |

### Typography — Semantic Aliases

| Token | References |
|---|---|
| `--font-family-prose` | `--font-family-body` |
| `--font-family-ui` | `--font-family-body` |
| `--font-family-display` | `--font-family-heading` |
| `--font-family-code` | `--font-family-mono` |
| `--text-display-2xl` | `--font-size-display-2xl` |
| `--text-display-xl` | `--font-size-display-xl` |
| `--text-h1` through `--text-h6` | Corresponding `--font-size-h*` |
| `--text-xl` through `--text-xs` | Corresponding `--font-size-*` |
| `--leading-display` | `--line-height-tight` |
| `--leading-heading` | `--line-height-snug` |
| `--leading-body` | `--line-height-normal` |
| `--leading-relaxed` | `--line-height-relaxed` |
| `--leading-ui` | `--line-height-none` |
| `--leading-normal` | `--line-height-normal` |
| `--tracking-display` | `--letter-spacing-tight` |
| `--tracking-heading` | `--letter-spacing-normal` |
| `--tracking-body` | `--letter-spacing-normal` |
| `--tracking-ui` | `--letter-spacing-wide` |
| `--tracking-caps` | `--letter-spacing-caps` |
| `--weight-display` | `--font-weight-bold` |
| `--weight-heading` | `--font-weight-semibold` |
| `--weight-subheading` | `--font-weight-medium` |
| `--weight-body` | `--font-weight-regular` |
| `--weight-ui` | `--font-weight-medium` |
| `--weight-label` | `--font-weight-semibold` |
| `--weight-semibold` | `--font-weight-semibold` |

### Spacing — Semantic Aliases

| Token | References | px | Intent |
|---|---|---|---|
| `--space-inline-2xs` | `--space-1` | 4px | Icon margins |
| `--space-inline-xs` | `--space-2` | 8px | Small component padding |
| `--space-inline-sm` | `--space-3` | 12px | |
| `--space-inline-md` | `--space-4` | 16px | Standard component padding |
| `--space-inline-lg` | `--space-6` | 24px | |
| `--space-inline-xl` | `--space-8` | 32px | |
| `--space-stack-2xs` | `--space-1` | 4px | Tight label/input gap |
| `--space-stack-xs` | `--space-2` | 8px | Icon + text |
| `--space-stack-sm` | `--space-3` | 12px | |
| `--space-stack-md` | `--space-4` | 16px | Paragraph spacing |
| `--space-stack-lg` | `--space-6` | 24px | Section sub-elements |
| `--space-stack-xl` | `--space-8` | 32px | |
| `--space-stack-2xl` | `--space-12` | 48px | Between major content blocks |
| `--space-inset-xs` | `--space-2` | 8px | Tight cards, badges |
| `--space-inset-sm` | `--space-3` | 12px | |
| `--space-inset-md` | `--space-4` | 16px | Standard card padding |
| `--space-inset-lg` | `--space-6` | 24px | Generous card padding |
| `--space-inset-xl` | `--space-8` | 32px | Section padding |
| `--space-section-xs` | `--space-8` | 32px | Compact sections |
| `--space-section-sm` | `--space-12` | 48px | |
| `--space-section-md` | `--space-16` | 64px | Standard section padding |
| `--space-section-lg` | `--space-24` | 96px | Hero sections |
| `--space-section-xl` | `--space-32` | 128px | Major page sections |

### Layout Max-Widths

| Token | Value | Usage |
|---|---|---|
| `--layout-max-prose` | `65ch` | Optimal reading width |
| `--layout-max-wide` | `1216px` | Production xl breakpoint |
| `--layout-max-full` | `1408px` | Production 2xl breakpoint |

### Border Radius — Semantic Aliases

| Token | References | px | Usage |
|---|---|---|---|
| `--radius-button` | `--radius-md` | 4px | Buttons |
| `--radius-input` | `--radius-md` | 4px | Form inputs |
| `--radius-card` | `--radius-lg` | 6px | Cards |
| `--radius-badge` | `--radius-full` | 9999px | Pill badges |
| `--radius-tag` | `--radius-md` | 4px | Tags |
| `--radius-modal` | `--radius-xl` | 8px | Modal dialogs |
| `--radius-image` | `--radius-lg` | 6px | Images |
| `--radius-avatar` | `--radius-full` | 9999px | Avatar circles |
| `--radius-tooltip` | `--radius-sm` | 2px | Tooltips |

### Shadow — Semantic Aliases

| Token | References |
|---|---|
| `--shadow-card` | `--shadow-sm` |
| `--shadow-card-hover` | `--shadow-md` |
| `--shadow-dropdown` | `--shadow-md` |
| `--shadow-modal` | `--shadow-xl` |
| `--shadow-input` | `--shadow-inset-sm` |
| `--shadow-input-focus` | `--shadow-focus-teal` |

### Z-Index — Semantic Aliases

| Token | References |
|---|---|
| `--z-nav` | `--z-index-sticky` |
| `--z-dropdown` | `--z-index-dropdown` |
| `--z-backdrop` | `--z-index-overlay` |
| `--z-modal` | `--z-index-modal` |
| `--z-tooltip` | `--z-index-popover` |
| `--z-toast` | `--z-index-toast` |

### Transition — Composed Values

| Token | Value |
|---|---|
| `--transition-base` | `all var(--duration-normal) var(--ease-in-out)` |
| `--transition-colors` | `color, background-color, border-color — all at duration-normal / ease-in-out` |
| `--transition-opacity` | `opacity var(--duration-normal) var(--ease-in-out)` |
| `--transition-shadow` | `box-shadow var(--duration-normal) var(--ease-in-out)` |
| `--transition-transform` | `transform var(--duration-normal) var(--ease-out)` |
| `--transition-interactive` | Alias of `--transition-colors` |
| `--transition-expand` | Alias of `--transition-base` |
| `--transition-fade` | Alias of `--transition-opacity` |
| `--transition-lift` | Alias of `--transition-shadow` |
| `--transition-slide` | Alias of `--transition-transform` |

Composed transitions live in Tier 2 (not Tier 1) because they reference other Tier 1 tokens via `var()`, which is only valid in Tier 2+.

---

## Tier 3: Component Tokens

**File:** `tokens/components.css`

Every value here references a Tier 2 semantic token via `var()`. No raw values. These are the only tokens that component CSS files may consume.

### Button Tokens

```
Structure:
  --button-radius            → --radius-button
  --button-font-family       → --font-family-ui
  --button-font-weight       → --weight-ui
  --button-letter-spacing    → --tracking-ui
  --button-transition        → --transition-interactive
  --button-cursor            → pointer

Size sm (32px):
  --button-height-sm         → 2rem
  --button-padding-x-sm      → --space-3
  --button-padding-y-sm      → --space-1-5
  --button-font-size-sm      → --text-sm

Size md/default (40px):
  --button-height-md         → 2.5rem
  --button-padding-x-md      → --space-5
  --button-padding-y-md      → --space-2
  --button-font-size-md      → --text-base

Size lg (48px):
  --button-height-lg         → 3rem
  --button-padding-x-lg      → --space-6
  --button-padding-y-lg      → --space-3
  --button-font-size-lg      → --text-lg

Variant primary:
  --button-primary-bg        → --color-brand-primary
  --button-primary-bg-hover  → --color-brand-primary-hover
  --button-primary-bg-active → --color-brand-primary-active
  --button-primary-text      → --color-text-inverse
  --button-primary-border    → --color-brand-primary
  --button-primary-shadow-focus → --shadow-focus-teal

Variant secondary:
  --button-secondary-bg      → --color-surface-base
  --button-secondary-text    → --color-brand-primary
  --button-secondary-border  → --color-brand-primary
  --button-secondary-bg-hover → --color-brand-primary-subtle
  --button-secondary-shadow-focus → --shadow-focus-teal

Variant ghost:
  --button-ghost-bg          → --color-transparent
  --button-ghost-text        → --color-text-secondary
  --button-ghost-bg-hover    → --color-surface-hover
  --button-ghost-shadow-focus → --shadow-focus-default

Variant accent:
  --button-accent-bg         → --color-brand-accent
  --button-accent-text       → --color-text-inverse
  --button-accent-border     → --color-brand-accent
  --button-accent-shadow-focus → --shadow-focus-purple

Variant danger:
  --button-danger-bg         → --color-danger
  --button-danger-text       → --color-on-danger
  --button-danger-border     → --color-danger

Disabled:
  --button-disabled-opacity  → --opacity-50
  --button-disabled-cursor   → not-allowed
```

### Badge and Tag Tokens

```
Badge structure:
  --badge-radius             → --radius-badge (full/pill)
  --badge-font-size          → --text-xs
  --badge-font-weight        → --weight-label
  --badge-letter-spacing     → --tracking-caps
  --badge-padding-x          → --space-2
  --badge-padding-y          → --space-0-5

Badge color variants (bg / text):
  --badge-primary-bg         → --color-brand-primary
  --badge-primary-text       → --color-text-inverse
  --badge-accent-bg          → --color-brand-accent
  --badge-accent-text        → --color-text-inverse
  --badge-success-bg         → --color-success
  --badge-success-text       → --color-on-success
  --badge-warning-bg         → --color-warning
  --badge-warning-text       → --color-on-warning
  --badge-danger-bg          → --color-danger
  --badge-danger-text        → --color-on-danger
  --badge-info-bg            → --color-info
  --badge-info-text          → --color-on-info
  --badge-neutral-bg         → --color-neutral-200
  --badge-neutral-text       → --color-text-primary

Tag structure:
  --tag-radius               → --radius-tag (4px)
  --tag-font-size            → --text-sm
  --tag-font-weight          → --weight-body
  --tag-padding-x            → --space-3
  --tag-padding-y            → --space-1

Tag color variants:
  --tag-primary-bg           → --color-brand-primary-subtle
  --tag-primary-text         → --color-brand-primary
  --tag-primary-border       → --color-brand-primary-muted
  --tag-accent-bg            → --color-brand-accent-subtle
  --tag-accent-text          → --color-brand-accent
  --tag-neutral-bg           → --color-surface-subtle
  --tag-neutral-text         → --color-text-secondary
  --tag-neutral-border       → --color-border-default
```

### Input Tokens

```
Structure:
  --input-radius             → --radius-input (4px)
  --input-font-family        → --font-family-ui
  --input-font-size          → --text-base
  --input-line-height        → --leading-normal
  --input-transition         → --transition-interactive

Sizes:
  --input-height-sm          → 2rem
  --input-height-md          → 2.5rem
  --input-height-lg          → 3rem
  --input-padding-x-sm       → --space-3
  --input-padding-x-md       → --space-4
  --input-padding-x-lg       → --space-4
  --input-font-size-sm       → --text-sm
  --input-font-size-lg       → --text-lg

Default state:
  --input-bg                 → --color-surface-base
  --input-text               → --color-text-primary
  --input-placeholder        → --color-text-tertiary
  --input-border             → --color-border-default
  --input-shadow             → --shadow-input

Hover:
  --input-border-hover       → --color-border-strong

Focus:
  --input-border-focus       → --color-brand-primary
  --input-shadow-focus       → --shadow-input-focus

Error:
  --input-border-error       → --color-danger
  --input-text-error         → --color-danger-text

Success:
  --input-border-success     → --color-success

Disabled:
  --input-bg-disabled        → --color-surface-subtle
  --input-text-disabled      → --color-text-disabled
  --input-border-disabled    → --color-border-subtle

Label:
  --input-label-font-size    → --text-sm
  --input-label-font-weight  → --weight-label
  --input-label-color        → --color-text-primary

Help text:
  --input-help-font-size     → --text-xs
  --input-help-color         → --color-text-secondary

Error message:
  --input-error-font-size    → --text-xs
  --input-error-color        → --color-danger-text

Textarea:
  --textarea-min-height      → 6rem

Checkbox / Radio:
  --checkbox-size            → 1rem
  --checkbox-radius          → --radius-sm
  --checkbox-bg              → --color-surface-base
  --checkbox-border          → --color-border-strong
  --checkbox-checked-bg      → --color-brand-primary
  --checkbox-checked-border  → --color-brand-primary
  --checkbox-focus-shadow    → --shadow-input-focus
  --radio-radius             → --radius-full
```

### Card Tokens

```
Structure:
  --card-bg                  → --color-surface-base
  --card-border              → --color-border-subtle
  --card-border-width        → --border-width-1
  --card-radius              → --radius-card (6px)
  --card-shadow              → --shadow-card
  --card-padding             → --space-inset-lg (24px)
  --card-padding-sm          → --space-inset-md (16px)
  --card-padding-lg          → --space-inset-xl (32px)
  --card-transition          → --transition-interactive + --transition-lift

Hover:
  --card-bg-hover            → --color-surface-hover
  --card-border-hover        → --color-border-default
  --card-shadow-hover        → --shadow-card-hover

Title:
  --card-title-font-size     → --text-h4
  --card-title-font-family   → --font-family-display
  --card-title-font-weight   → --weight-heading
  --card-title-color         → --color-text-primary

Meta:
  --card-meta-font-size      → --text-xs
  --card-meta-color          → --color-text-secondary

Body:
  --card-body-font-size      → --text-base
  --card-body-color          → --color-text-secondary
  --card-body-line-height    → --leading-relaxed

Featured:
  --card-featured-border     → --color-brand-primary
  --card-featured-border-width → --border-width-4
```

### Alert Tokens

```
Structure:
  --alert-radius             → --radius-card
  --alert-padding            → --space-inset-md
  --alert-border-width       → --border-width-4
  --alert-font-size          → --text-base
  --alert-line-height        → --leading-normal

Variants (bg / border / text / icon):
  --alert-success-bg         → --color-success-subtle
  --alert-success-border     → --color-success
  --alert-success-text       → --color-success-text
  --alert-warning-bg         → --color-warning-subtle
  --alert-warning-border     → --color-warning-border
  --alert-warning-text       → --color-warning-text
  --alert-danger-bg          → --color-danger-subtle
  --alert-danger-border      → --color-danger
  --alert-danger-text        → --color-danger-text
  --alert-info-bg            → --color-info-subtle
  --alert-info-border        → --color-info
  --alert-info-text          → --color-info-text
  --alert-neutral-bg         → --color-surface-subtle
  --alert-neutral-border     → --color-border-default
  --alert-neutral-text       → --color-text-primary
```

### Navigation Tokens

```
Topbar:
  --nav-height               → 3.5rem (56px)
  --nav-height-mobile        → 3rem (48px)
  --nav-bg                   → --color-brand-accent (#741755 purple)
  --nav-z                    → --z-nav

Nav links:
  --nav-link-color           → --color-text-inverse (white on purple)
  --nav-link-font-size       → --text-sm
  --nav-link-font-weight     → --weight-ui
  --nav-link-padding-x       → --space-3
  --nav-link-padding-y       → --space-2

Dropdown:
  --nav-dropdown-bg          → --color-surface-overlay
  --nav-dropdown-shadow      → --shadow-dropdown
  --nav-dropdown-item-bg-active → --color-brand-primary (#188eac teal)
  --nav-dropdown-item-color-active → --color-text-inverse

Mobile menu:
  --nav-mobile-bg            → --color-brand-primary
  --nav-mobile-bg-gradient   → linear-gradient(141deg, teal-800 → teal-500 → teal-400)
  --nav-mobile-z             → --z-modal

Sidebar:
  --nav-sidebar-bg           → --color-surface-base
  --nav-sidebar-link-active-bg → --color-brand-primary-subtle
  --nav-sidebar-link-active-color → --color-brand-primary

Logo:
  --nav-logo-height          → 2.25rem (36px)
  --nav-logo-height-mobile   → 1.75rem (28px)

Back-to-top:
  --back-to-top-bg           → --color-brand-accent (purple)
  --back-to-top-radius       → --radius-full
  --back-to-top-opacity      → --opacity-70
```

### Hero Tokens

```
Padding:
  --hero-padding-y           → --space-section-lg (96px)
  --hero-padding-y-sm        → --space-section-md (64px)
  --hero-padding-x           → --space-inline-xl

Backgrounds:
  --hero-bg                  → --color-brand-primary (#188eac)
  --hero-bg-gradient-mobile  → linear-gradient(141deg, teal-800 → teal-500 → teal-400)
  --hero-bg-gradient-brand   → linear-gradient(135deg, teal-700 → teal-500 → purple-500)
  --hero-bg-subtle           → --color-brand-primary-subtle

Text:
  --hero-text                → --color-text-inverse (white)
  --hero-text-secondary      → rgba(255,255,255,0.7)
  --hero-title-color         → --color-brand-accent (#741755 purple — on teal)
  --hero-subtitle-color      → --color-brand-accent

Title:
  --hero-title-font-size     → --text-display-xl
  --hero-title-font-family   → --font-family-display
  --hero-title-font-weight   → --weight-display
  --hero-title-line-height   → --leading-display

Eyebrow:
  --hero-eyebrow-font-size   → --text-sm
  --hero-eyebrow-font-weight → --weight-label
  --hero-eyebrow-letter-spacing → --tracking-caps
  --hero-eyebrow-color       → --color-text-inverse (white)

CTA:
  --hero-cta-gap             → --space-4
  --hero-cta-mt              → --space-8
```

### Code Tokens

```
Font:
  --code-font-family         → --font-family-code
  --code-font-size           → --text-sm
  --code-line-height         → --leading-relaxed

Inline:
  --code-inline-bg           → --color-code-inline-bg (#eaeced)
  --code-inline-text         → --color-code-inline-text (#ef2e55)
  --code-inline-font-size    → 0.875em (production match)
  --code-inline-radius       → --radius-none

Block:
  --code-block-bg            → --color-neutral-900
  --code-block-text          → --color-neutral-100
  --code-block-border        → --color-neutral-700
  --code-block-radius        → --radius-lg
  --code-block-padding       → --space-inset-lg

Header:
  --code-header-bg           → --color-neutral-800
  --code-header-text         → --color-neutral-400

Syntax tokens:
  --code-token-keyword       → --color-teal-300
  --code-token-string        → --color-success-300
  --code-token-comment       → --color-neutral-500
  --code-token-number        → --color-warning-400
  --code-token-function      → --color-purple-300
  --code-token-operator      → --color-teal-200
  --code-token-variable      → --color-neutral-100
```

### Table Tokens

```
Structure:
  --table-font-size          → --text-sm
  --table-border             → --color-border-default
  --table-border-width       → --border-width-1
  --table-radius             → --radius-lg

Header:
  --table-header-bg          → --color-surface-subtle
  --table-header-font-weight → --weight-label
  --table-header-padding-x   → --space-4
  --table-header-padding-y   → --space-3

Body:
  --table-row-bg             → --color-surface-base
  --table-row-bg-alt         → --color-surface-subtle
  --table-row-bg-hover       → --color-surface-selected
  --table-row-padding-x      → --space-4
  --table-row-padding-y      → --space-3
  --table-row-border         → --color-border-subtle
```

### Additional Component Tokens

**Avatar:** `--avatar-radius`, `--avatar-bg`, `--avatar-size-xs` through `--avatar-size-2xl` (1.5rem–5rem)

**Pagination:** `--pagination-item-height` (2.25rem), `--pagination-item-bg-active` → `--color-brand-primary`

**Tooltip:** `--tooltip-bg` → `--color-neutral-800`, `--tooltip-text` → `--color-neutral-0`, `--tooltip-max-width` (16rem)

**Modal:** `--modal-bg` → `--color-surface-overlay`, `--modal-max-width-sm` (28rem), `--modal-max-width-md` (36rem), `--modal-max-width-lg` (48rem)

**Skip Link:** `--skip-link-bg` → `--color-brand-primary`, `--skip-link-text` → `--color-text-inverse`, `--skip-link-z` → `--z-index-max`

**Focus Ring:** `--focus-ring-color` → `--color-brand-primary`, `--focus-ring-width` (0.2em), `--focus-ring-shadow` → `--shadow-focus-teal`

---

## Dark Mode and Theming

### How Dark Mode Works

Dark mode overrides only Tier 2 semantic tokens in `tokens/dark-mode.css`. Because Tier 3 component tokens reference Tier 2, and component CSS references Tier 3, all components inherit dark mode automatically.

**No component file contains dark-mode code.** This is the payoff of the three-tier architecture.

### Activation

```html
<!-- System preference (automatic) -->
<!-- No attribute needed — prefers-color-scheme: dark media query handles it -->

<!-- Manual: force dark -->
<html data-theme="dark">

<!-- Manual: force light (wins over system preference) -->
<html data-theme="light">
```

### Tier 2 Tokens Overridden in Dark Mode

Every token below is redefined in both `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`:

**Surface:** `--color-surface-page` → neutral-950, `--color-surface-base` → neutral-900, `--color-surface-raised` → neutral-800, `--color-surface-overlay` → neutral-800

**Text:** `--color-text-primary` → neutral-50, `--color-text-secondary` → neutral-400, `--color-text-inverse` → neutral-950

**Brand:** `--color-brand-primary` → teal-400, `--color-brand-accent` → purple-400

**Links:** `--color-link-default` → purple-300

**Borders:** `--color-border-default` → neutral-700, `--color-border-subtle` → neutral-800

**Status:** All status colors shift to lighter steps (e.g., `--color-success` → success-400)

**Shadows:** All shadow tokens use higher opacity to remain visible on dark backgrounds.

### Theming Beyond Dark Mode

To add a new brand theme (multi-brand support):

1. Create a new CSS file (e.g., `tokens/brand-partner.css`).
2. Override Tier 2 semantic tokens under a `[data-brand="partner"]` selector:

```css
[data-brand="partner"] {
  --color-brand-primary: var(--color-blue-500);
  --color-brand-primary-hover: var(--color-blue-600);
  --color-brand-accent: var(--color-orange-500);
}
```

3. Apply the attribute to `<html>`: `<html data-brand="partner">`.
4. All Tier 3 and component tokens propagate automatically.

### Reduced Motion

`dark-mode.css` also overrides all duration and transition tokens to `0ms` / `none` when `prefers-reduced-motion: reduce` is active. Every component that uses `var(--transition-*)` tokens automatically respects this preference.

---

## How to Add Tokens

### Adding a global primitive (Tier 1)

Add to `tokens/global.css` under the appropriate category comment block. Use only raw values (hex, px, rem, numeric). No `var()` references.

```css
/* In the teal scale */
--color-teal-425: #22a8c6; /* Between 400 and 500 if needed */
```

Run `pixi run validate` to confirm no hierarchy violations were introduced.

### Adding a semantic alias (Tier 2)

Add to `tokens/semantic.css`. Must reference only Tier 1 tokens via `var()`.

```css
--color-brand-primary-emphasis: var(--color-teal-600);
```

Run `pixi run validate` and `pixi run contrast` if it is a color token.

### Adding component tokens (Tier 3)

Add to `tokens/components.css` under the relevant component block. Must reference only Tier 2 tokens via `var()`.

```css
/* In the BUTTON block */
--button-accent-bg-light: var(--color-brand-accent-subtle);
```

### Adding a new component token block

If you are adding an entirely new component:

1. Add a clearly labeled block to `tokens/components.css`:

```css
/* =========================================================================
   TOOLTIP
   ========================================================================= */

--tooltip-bg: var(--color-neutral-800);
--tooltip-text: var(--color-neutral-0);
--tooltip-font-size: var(--text-xs);
```

2. Reference only these tokens in the component CSS file.
3. Run `pixi run validate` to confirm no violations.

### When NOT to add a token

- Do not add a Tier 3 token that is identical to the Tier 2 token it would reference with no transformation. The indirection provides no value.
- Do not add a Tier 1 color that is not part of a scale (isolated hex values with no neighbors become orphans that cannot be systematically maintained).
- Do not add tokens for one-off overrides. If a value is used once and will never be reused or themed, write it as a comment-annotated inline value and document why.

---

## Validation

### Running the validator

```bash
pixi run validate
```

The validator (`scripts/validate-tokens.mjs`) checks:

1. Tier 2 tokens reference only Tier 1 token names
2. Tier 3 tokens reference only Tier 2 token names
3. No raw hex/px/rem literals appear in Tier 2 or Tier 3 (with noted exceptions for production-exact values that cannot be expressed as Tier 1 tokens)
4. All `var()` references resolve to a defined token in the system

### Running the contrast checker

```bash
pixi run contrast
```

The contrast checker (`scripts/check-contrast.mjs`) evaluates all color token pairings against WCAG 2.2 AA thresholds:

- 4.5:1 minimum for normal text
- 3:1 minimum for large text (≥18px regular or ≥14px bold) and UI components

### Running the full quality gate

```bash
pixi run check
```

Runs `validate`, `lint`, `format-check`, and `contrast` in sequence. All four must pass before a pull request is merged.
