# US-RSE Design System

The design system for the United States Research Software Engineer Association. A single source of truth for every visual and interactive decision on the US-RSE website.

---

## Overview

This system consists of CSS custom properties organized into three token tiers, a set of component stylesheets that consume those tokens, and tooling to keep the system valid and accessible. The audience is Research Software Engineers — technically precise people who expect documentation to be accurate, complete, and immediately useful.

**What this system provides:**
- A three-tier CSS token architecture (global primitives, semantic aliases, component bindings)
- Dark mode that propagates automatically through the token layer
- WCAG 2.2 AA verified color pairings throughout
- Nine component families, each prefixed `.usrse-` to coexist safely with Bulma during migration
- Utility classes for layout, spacing, typography, and color

**Who this is for:** Anyone implementing or modifying UI on the US-RSE website. Designers use the token layer as the source of truth. Engineers implement using component classes and tokens directly.

---

## Quick Start

### 1. Load fonts

Add to `<head>` before any stylesheets:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Montserrat:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 2. Import the token system

```html
<link rel="stylesheet" href="/design-system/tokens/index.css">
```

Or in a CSS bundler:

```css
@import url('/design-system/tokens/index.css');
```

Or in a JavaScript bundler (Vite, webpack):

```js
import '/design-system/tokens/index.css';
```

### 3. Import the component styles

```html
<link rel="stylesheet" href="/design-system/tokens/index.css">
<link rel="stylesheet" href="/design-system/components/index.css">
```

The token import must come first. Components consume `--button-*`, `--card-*`, etc., which are defined in the token layer.

### 4. Use a component

```html
<button class="usrse-button usrse-button--primary">Join US-RSE</button>
```

For pre-built distribution files, run `pixi run build` to produce `dist/tokens.css` and `dist/tokens.min.css`.

---

## Design Principles

Five principles govern every decision made in this system. When two design options conflict, these resolve the tie:

1. **Community-First Clarity** — Navigation is predictable; primary actions are reachable in two interactions; member-generated content receives the same visual weight as official content.
2. **Inclusive by Default** — WCAG 2.2 AA compliance is a baseline requirement, not an enhancement. Focus states are never suppressed without a custom replacement. Motion is opt-in.
3. **Technical Credibility** — Code blocks, tables, and technical notation are first-class layout citizens. Visual elements earn their place by carrying information.
4. **Transparent Consistency** — All color, spacing, and typographic values live in the token system. No hard-coded values in component files.
5. **Warm Precision** — The system is structured and documented like a well-run open-source project: reliable, precise, and built by people who care about both the science and the community.

Full detail in `PRINCIPLES.md`.

---

## Architecture

### Three-Tier Token System

```
Tier 1: Global (global.css)
  Raw primitive values. Named, but no semantic meaning.
  --color-teal-500: #188eac
  --space-4: 1rem
  --font-size-base: 1rem

        |
        v

Tier 2: Semantic (semantic.css)
  Maps primitives to design intent. This layer changes for dark mode and theming.
  --color-brand-primary: var(--color-teal-500)
  --color-text-primary: var(--color-neutral-900)
  --space-inline-md: var(--space-4)

        |
        v

Tier 3: Component (components.css)
  Binds semantic tokens to specific component properties.
  --button-primary-bg: var(--color-brand-primary)
  --button-padding-x-md: var(--space-inline-md)
  --button-font-size-md: var(--text-base)

        |
        v

Components (button.css, card.css, ...)
  Consume only Tier 3 tokens. No direct reference to Tiers 1 or 2.
  .usrse-button--primary {
    background-color: var(--button-primary-bg);
  }
```

**Why three tiers matter:** Changing the primary brand color from teal to any other color requires editing a single line in `semantic.css`. All Tier 3 component tokens that reference `--color-brand-primary` update automatically. Components never need to change.

Dark mode works the same way: `dark-mode.css` overrides only Tier 2 semantic tokens. Because Tier 3 and components all reference Tier 2, every component automatically renders correctly in dark mode without any component-level dark-mode code.

### The Hierarchy Contract

- Tier 1 tokens contain raw values (hex, px, rem). No `var()` references.
- Tier 2 tokens reference only Tier 1 tokens via `var()`. No raw values.
- Tier 3 tokens reference only Tier 2 tokens via `var()`. No raw values.
- Components reference only Tier 3 tokens. No Tier 1 or Tier 2 direct references.

The `pixi run validate` task enforces this contract programmatically.

---

## Color Palette

### Teal Scale — Primary Brand

Anchored at `#188eac` (step 500), derived by adjusting lightness in perceptual increments.

| Token | Hex | Notes |
|---|---|---|
| `--color-teal-50` | `#edf9fd` | Subtle backgrounds, surface tints |
| `--color-teal-100` | `#c9eef8` | Muted surfaces |
| `--color-teal-200` | `#96ddf0` | |
| `--color-teal-300` | `#5bcae6` | Dark mode interactive |
| `--color-teal-400` | `#2cb4d2` | Dark mode primary brand |
| `--color-teal-500` | `#188eac` | **Brand anchor** — 3.4:1 on white (large text AA) |
| `--color-teal-600` | `#1685a1` | Hover state |
| `--color-teal-700` | `#157c96` | Active state |
| `--color-teal-800` | `#0e5f72` | 9.6:1 on white — AAA |
| `--color-teal-900` | `#08404e` | |
| `--color-teal-950` | `#042028` | |

### Purple Scale — Accent / Navigation

Anchored at `#741755` (step 500).

| Token | Hex | Notes |
|---|---|---|
| `--color-purple-50` | `#fdf0f7` | Subtle backgrounds |
| `--color-purple-100` | `#f7d6eb` | Muted surfaces |
| `--color-purple-200` | `#eeaad6` | |
| `--color-purple-300` | `#e07dbc` | Dark mode accent |
| `--color-purple-400` | `#c94e99` | Dark mode accent brand |
| `--color-purple-500` | `#741755` | **Brand accent** — 8.5:1 on white — AAA; nav background |
| `--color-purple-600` | `#641349` | 7.8:1 on white — AAA |
| `--color-purple-700` | `#581140` | 9.1:1 on white — AAA |
| `--color-purple-800` | `#420d30` | |
| `--color-purple-900` | `#2c0820` | |
| `--color-purple-950` | `#160410` | |

### Neutral Scale — Slight Teal Undertone (H=195°, S=8%)

| Token | Hex | Notes |
|---|---|---|
| `--color-neutral-0` | `#ffffff` | White |
| `--color-neutral-50` | `#f5f7f8` | Page subtle background |
| `--color-neutral-100` | `#eaeced` | Inline code background |
| `--color-neutral-200` | `#d4d8da` | Default borders |
| `--color-neutral-300` | `#b8bec1` | Disabled borders |
| `--color-neutral-400` | `#767e80` | Tertiary text — 3.1:1 on white (UI minimum) |
| `--color-neutral-500` | `#6b7476` | |
| `--color-neutral-600` | `#4d5456` | Secondary text |
| `--color-neutral-700` | `#363c3e` | |
| `--color-neutral-800` | `#22282a` | Dark surface (elevated) |
| `--color-neutral-900` | `#111516` | Dark surface (base) |
| `--color-neutral-950` | `#050809` | Dark page background |

### Semantic Status Colors

| Name | 500-step hex | Usage |
|---|---|---|
| Success | `#48c774` | Confirmation, valid states |
| Warning | `#ffdd57` | Caution — always dark text on this background |
| Danger | `#f14668` | Errors, destructive actions |
| Info | `#3298dc` | Informational messages |

### Contrast Verification

All contrast-critical pairings are WCAG 2.2 AA verified:

| Pairing | Ratio | Result |
|---|---|---|
| `teal-700` on white | 6.5:1 | AA pass (normal text) |
| `teal-800` on white | 9.6:1 | AAA pass |
| `purple-500` on white | 8.5:1 | AAA pass |
| `purple-600` on white | 7.8:1 | AAA pass |
| `purple-700` on white | 9.1:1 | AAA pass |
| `teal-500` on white | 3.4:1 | AA pass (large text / UI only) |
| `neutral-50` on `neutral-950` | ~18:1 | AAA pass |
| `neutral-400` on `neutral-950` | ~6:1 | AA pass |
| `teal-300` on `neutral-950` | ~6.8:1 | AA pass |
| `purple-300` on `neutral-950` | ~7.4:1 | AA pass |

**Production identity note:** The hero title uses purple (`#741755`) on teal (`#188eac`) — a 3.1:1 ratio. This passes at large text sizes (≥18px or ≥14px bold), which is always satisfied by the `--font-size-display-xl` applied to hero titles.

---

## Typography

### Font Families

| Token | Value | Role |
|---|---|---|
| `--font-family-body` | `"Montserrat", system-ui, …` | Body text, UI labels, forms |
| `--font-family-heading` | `"Roboto", system-ui, …` | Page headings, card titles |
| `--font-family-mono` | `"Fira Code", "Fira Mono", …` | Code blocks, inline code, terminal |
| `--font-family-system` | `-apple-system, BlinkMacSystemFont, …` | System UI fallback |

### Type Scale

All heading sizes are fluid using `clamp()`. Body sizes are fixed.

| Token | Value | Usage |
|---|---|---|
| `--font-size-display-2xl` | `clamp(3rem, 5vw + 1rem, 4.5rem)` | 48–72px hero banners |
| `--font-size-display-xl` | `clamp(2.5rem, 4vw + 1rem, 3.75rem)` | 40–60px hero titles |
| `--font-size-display-lg` | `clamp(2rem, 3vw + 1rem, 3rem)` | 32–48px section banners |
| `--font-size-h1` | `clamp(1.875rem, 2.5vw + 0.75rem, 2.5rem)` | 30–40px page titles |
| `--font-size-h2` | `clamp(1.5rem, 2vw + 0.5rem, 2rem)` | 24–32px section headings |
| `--font-size-h3` | `clamp(1.25rem, 1.5vw + 0.25rem, 1.5rem)` | 20–24px subsections |
| `--font-size-h4` | `clamp(1.125rem, 1vw + 0.25rem, 1.25rem)` | 18–20px card titles |
| `--font-size-h5` | `1rem` | 16px small headings |
| `--font-size-h6` | `0.875rem` | 14px labels |
| `--font-size-xl` | `1.25rem` | 20px large body |
| `--font-size-lg` | `1.125rem` | 18px large body |
| `--font-size-base` | `1rem` | 16px standard body |
| `--font-size-sm` | `0.875rem` | 14px small body, code |
| `--font-size-xs` | `0.75rem` | 12px captions, badges |
| `--font-size-2xs` | `0.625rem` | 10px — use sparingly |

### Font Weights

| Token | Value |
|---|---|
| `--font-weight-regular` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |
| `--font-weight-extrabold` | 800 |

### Line Heights

| Token | Value | Semantic alias | Usage |
|---|---|---|---|
| `--line-height-none` | 1 | `--leading-ui` | Single-line UI labels |
| `--line-height-tight` | 1.25 | `--leading-display` | Display headings |
| `--line-height-snug` | 1.375 | `--leading-heading` | H1–H4 |
| `--line-height-normal` | 1.5 | `--leading-body` | Standard body text |
| `--line-height-relaxed` | 1.625 | `--leading-relaxed` | Long-form prose |
| `--line-height-loose` | 2 | — | Decorative / overrides |

---

## Spacing

Base: 4px (0.25rem). Scale uses powers of 2 with half-steps at small values.

| Token | px | rem |
|---|---|---|
| `--space-0-5` | 2px | 0.125rem |
| `--space-1` | 4px | 0.25rem |
| `--space-1-5` | 6px | 0.375rem |
| `--space-2` | 8px | 0.5rem |
| `--space-2-5` | 10px | 0.625rem |
| `--space-3` | 12px | 0.75rem |
| `--space-4` | 16px | 1rem |
| `--space-5` | 20px | 1.25rem |
| `--space-6` | 24px | 1.5rem |
| `--space-8` | 32px | 2rem |
| `--space-10` | 40px | 2.5rem |
| `--space-12` | 48px | 3rem |
| `--space-16` | 64px | 4rem |
| `--space-20` | 80px | 5rem |
| `--space-24` | 96px | 6rem |
| `--space-32` | 128px | 8rem |

### Semantic Spacing Aliases

Use these in component design instead of raw step values:

| Alias | Maps to | px | Role |
|---|---|---|---|
| `--space-inline-md` | `--space-4` | 16px | Standard component padding |
| `--space-inline-lg` | `--space-6` | 24px | Generous padding |
| `--space-stack-md` | `--space-4` | 16px | Paragraph spacing |
| `--space-stack-2xl` | `--space-12` | 48px | Between major content blocks |
| `--space-inset-md` | `--space-4` | 16px | Standard card padding |
| `--space-inset-lg` | `--space-6` | 24px | Generous card padding |
| `--space-section-md` | `--space-16` | 64px | Standard section padding |
| `--space-section-lg` | `--space-24` | 96px | Hero sections |

---

## Components

All component classes use the `.usrse-` prefix. Full examples and accessibility requirements are in `COMPONENTS.md`. Component token details are in `TOKENS.md`.

### Button

**File:** `components/button.css`  
**Purpose:** All interactive actions. The primary variant is the main call-to-action.

| Variant class | Color | Use |
|---|---|---|
| `usrse-button--primary` | Teal fill | Main CTA actions |
| `usrse-button--secondary` | Teal outline | Secondary actions |
| `usrse-button--ghost` | Transparent | Tertiary / toolbar actions |
| `usrse-button--accent` | Purple fill | Accent actions (navigation, membership) |
| `usrse-button--danger` | Red fill | Destructive, irreversible actions |

| Size class | Height | Use |
|---|---|---|
| `usrse-button--sm` | 32px | Dense layouts, table actions |
| *(default)* | 40px | Standard |
| `usrse-button--lg` | 48px | Hero CTAs, primary page action |

States: `disabled` / `aria-disabled="true"`, `aria-busy="true"` (loading spinner).  
Layout: `usrse-button--icon-only`, `usrse-button--full`, `usrse-button-group`.

```html
<button class="usrse-button usrse-button--primary">Join US-RSE</button>
<button class="usrse-button usrse-button--secondary">Learn More</button>
<button class="usrse-button usrse-button--primary usrse-button--lg">Register Now</button>
```

**Accessibility:** Use `<button>` for actions, `<a>` for navigation. Icon-only buttons require `aria-label`. Loading state uses `aria-busy="true"`. Disabled links use `aria-disabled="true"` instead of `disabled`.

---

### Card

**File:** `components/card.css`  
**Purpose:** Container for structured content: events, blog posts, working groups, member spotlights.

| Modifier class | Purpose |
|---|---|
| `usrse-card--featured` | Teal left border — pinned/highlighted content |
| `usrse-card--compact` | Reduced padding for sidebars |
| `usrse-card--spacious` | Extra padding for standalone displays |
| `usrse-card--flat` | No shadow or border — for elevated surfaces |
| `usrse-card--interactive` | Full card is a link with hover lift |

Sub-elements: `usrse-card__header`, `usrse-card__meta`, `usrse-card__title`, `usrse-card__body`, `usrse-card__footer`, `usrse-card__image`.

Grid layout: `usrse-card-grid`, `usrse-card-grid--dense`, `usrse-card-grid--wide`.

```html
<article class="usrse-card">
  <header class="usrse-card__header">
    <p class="usrse-card__meta">Event</p>
    <h3 class="usrse-card__title">US-RSE Annual Conference</h3>
  </header>
  <div class="usrse-card__body">Join thousands of RSEs for three days of talks.</div>
  <footer class="usrse-card__footer">
    <a href="#" class="usrse-button usrse-button--secondary usrse-button--sm">Register</a>
  </footer>
</article>
```

**Accessibility:** Use semantic HTML elements (`<article>`, `<section>`, heading hierarchy). Interactive cards use `<a>` as the root element. Focus ring is always visible on interactive cards.

---

### Input (Form Controls)

**File:** `components/input.css`  
**Purpose:** All form inputs: text, email, password, number, search, textarea, select, checkbox, radio.

| Class | Element |
|---|---|
| `usrse-input` | `<input type="text|email|password|number|search">` |
| `usrse-textarea` | `<textarea>` |
| `usrse-select` | `<select>` |
| `usrse-check` | Wrapper for checkbox/radio + label |
| `usrse-check__control` | The `<input type="checkbox|radio">` |
| `usrse-check__label` | The associated `<label>` text |

States: `usrse-input--error` / `aria-invalid="true"`, `usrse-input--success`, `:disabled`.  
Sizes: `usrse-input--sm`, default (md), `usrse-input--lg`.

Form anatomy: `usrse-field`, `usrse-label`, `usrse-field-help`, `usrse-field-error`.  
Input groups (prefix/suffix): `usrse-input-group`, `usrse-input-group__addon`.

```html
<div class="usrse-field">
  <label class="usrse-label" for="email">
    Email <span class="usrse-label__required" aria-hidden="true">*</span>
  </label>
  <input class="usrse-input" type="email" id="email" aria-required="true">
  <p class="usrse-field-help">We will never share your email address.</p>
</div>
```

**Accessibility:** Every input must have an associated `<label>`. Error messages must be linked via `aria-describedby`. Required fields use `aria-required="true"`. Focus is never suppressed.

---

### Navigation

**File:** `components/nav.css`  
**Purpose:** Site header (sticky, purple background), dropdown menus, mobile hamburger menu, sidebar navigation, back-to-top button.

| Class | Purpose |
|---|---|
| `usrse-skip-link` | Keyboard skip-navigation link (first focusable element) |
| `usrse-nav` | Sticky topbar — purple `#741755` background |
| `usrse-nav__brand` | Logo/brand link area |
| `usrse-nav__menu` | Desktop navigation list |
| `usrse-nav__item` | Nav item with optional dropdown |
| `usrse-nav__link` | Nav link / dropdown trigger |
| `usrse-nav__dropdown` | Dropdown panel |
| `usrse-nav__dropdown-item` | Dropdown link |
| `usrse-nav__burger` | Mobile hamburger button |
| `usrse-nav__mobile-menu` | Mobile menu panel (teal gradient) |
| `usrse-nav-sidebar` | Sidebar section navigation |
| `usrse-back-to-top` | Fixed back-to-top button |

**Production color identity:** The navbar background is purple (`#741755`). Dropdown item hover uses teal `#188eac` background with white text — the only place teal appears in the navigation.

```html
<a class="usrse-skip-link" href="#main-content">Skip to main content</a>
<nav class="usrse-nav" aria-label="Main navigation">
  <div class="usrse-nav__container">
    <a class="usrse-nav__brand" href="/">
      <img class="usrse-nav__logo" src="/logo.svg" alt="US-RSE">
    </a>
    <ul class="usrse-nav__menu" role="list">
      <li class="usrse-nav__item">
        <a class="usrse-nav__link" href="/about">About</a>
      </li>
    </ul>
  </div>
</nav>
```

**Accessibility:** The skip link must be the first focusable element on the page. Use `aria-expanded` on dropdown triggers. Use `aria-current="page"` on the active link. Mobile menu uses `aria-hidden` toggled by JavaScript.

---

### Hero

**File:** `components/hero.css`  
**Purpose:** Full-width section banner at the top of a page.

| Variant class | Background | Title color |
|---|---|---|
| `usrse-hero--primary` | Solid teal `#188eac` | Purple `#741755` |
| `usrse-hero--gradient` | Teal-to-purple gradient | White |
| `usrse-hero--subtle` | Light teal (`teal-50`) | Purple |

Size modifiers: `usrse-hero--sm`, default (md), `usrse-hero--lg`.  
Layout: `usrse-hero--centered`, `usrse-hero--split` (text + image).

Sub-elements: `usrse-hero__container`, `usrse-hero__content`, `usrse-hero__eyebrow`, `usrse-hero__title`, `usrse-hero__subtitle`, `usrse-hero__body`, `usrse-hero__cta-group`, `usrse-hero__image-wrap`, `usrse-hero__image`.

```html
<section class="usrse-hero usrse-hero--primary">
  <div class="usrse-hero__container">
    <div class="usrse-hero__content">
      <span class="usrse-hero__eyebrow">Annual Conference 2025</span>
      <h1 class="usrse-hero__title">US-RSE'25</h1>
      <p class="usrse-hero__subtitle">Connecting research software engineers across the nation.</p>
      <p class="usrse-hero__body">Three days of talks, workshops, and community building.</p>
      <div class="usrse-hero__cta-group">
        <a href="#" class="usrse-button usrse-button--accent usrse-button--lg">Register Now</a>
        <a href="#" class="usrse-button usrse-button--ghost">Learn More</a>
      </div>
    </div>
  </div>
</section>
```

---

### Badge and Tag

**File:** `components/badge.css`  
**Purpose:** Badges are filled pills for status and counts. Tags are outlined rectangles for categories and skills.

**Badge variants:** `usrse-badge--primary`, `--accent`, `--success`, `--warning`, `--danger`, `--info`, `--neutral`.  
**Tag variants:** `usrse-tag--primary`, `--accent`, `--neutral`.  
**Tag modifiers:** `usrse-tag--removable` (with `usrse-tag__remove` button), `usrse-tag--interactive` (toggle chip).

Groups: `usrse-badge-group`, `usrse-tag-group`, with `--tight` modifier.

```html
<span class="usrse-badge usrse-badge--primary">New</span>
<span class="usrse-badge usrse-badge--success">Active</span>
<span class="usrse-tag usrse-tag--neutral">Python</span>
<span class="usrse-tag usrse-tag--primary">
  HPC
  <button class="usrse-tag__remove" aria-label="Remove HPC tag"></button>
</span>
```

---

### Alert

**File:** `components/alert.css`  
**Purpose:** Status messages, error notifications, informational banners.

| Variant class | Color |
|---|---|
| `usrse-alert--success` | Green |
| `usrse-alert--warning` | Amber |
| `usrse-alert--danger` | Red |
| `usrse-alert--info` | Blue |
| `usrse-alert--neutral` | Gray |

Sub-elements: `usrse-alert__icon`, `usrse-alert__content`, `usrse-alert__title`, `usrse-alert__body`, `usrse-alert__close`.  
Modifiers: `usrse-alert--inline` (compact, no border-radius), `data-dismissed="true"` (animated exit).  
Stack: `usrse-alert-stack`.

```html
<div class="usrse-alert usrse-alert--success" role="status" aria-live="polite">
  <div class="usrse-alert__content">
    <p class="usrse-alert__title">Registration confirmed</p>
    <p class="usrse-alert__body">You are registered for US-RSE'25.</p>
  </div>
</div>

<div class="usrse-alert usrse-alert--danger" role="alert" aria-live="assertive">
  <div class="usrse-alert__content">
    <p class="usrse-alert__body">Your session has expired. Please log in again.</p>
  </div>
  <button class="usrse-alert__close" aria-label="Dismiss alert"></button>
</div>
```

**Accessibility:** Use `role="alert"` with `aria-live="assertive"` for errors. Use `role="status"` with `aria-live="polite"` for success and informational messages.

---

### Code

**File:** `components/code.css`  
**Purpose:** Inline code within prose, code blocks with syntax highlighting, terminal examples.

Code is a first-class citizen for RSE audiences. The inline style matches the production rouge highlighter: gray background (`#eaeced`), red text (`--color-danger-700`).

| Class | Purpose |
|---|---|
| `usrse-code` / `:not(pre) > code` | Inline code within prose |
| `usrse-code-block` | Outer wrapper for block code |
| `usrse-code-block__header` | Language label + copy button bar |
| `usrse-code-block__lang` | Language label text |
| `usrse-code-block__copy` | Copy-to-clipboard button |
| `usrse-pre` | Standalone `<pre>` without wrapper |

Modifiers: `usrse-code-block--bare` (no header), `usrse-code-block--line-numbers`, `usrse-code-block--shell` (terminal dark green), `usrse-code-block--scroll` (fixed max-height).

Syntax token classes: `usrse-token-keyword`, `--string`, `--comment`, `--number`, `--function`, `--operator`, `--variable`. Rouge highlighter `.highlight .k`, `.s`, `.c`, etc. are also targeted.

```html
<p>Use the <code>pixi run check</code> command before merging.</p>

<div class="usrse-code-block">
  <div class="usrse-code-block__header">
    <span class="usrse-code-block__lang">python</span>
    <button class="usrse-code-block__copy" aria-label="Copy code">Copy</button>
  </div>
  <pre><code>def hello(name: str) -> str:
    return f"Hello, {name}!"</code></pre>
</div>
```

---

### Table

**File:** `components/table.css`  
**Purpose:** Structured data for technical audiences. Precision and legibility take priority.

The `.usrse-table-wrap` container enables horizontal scroll on mobile without breaking layout.

| Modifier class | Purpose |
|---|---|
| `usrse-table--striped` | Alternating row backgrounds |
| `usrse-table--hoverable` | Row highlight on hover |
| `usrse-table--compact` | Tighter row height |
| `usrse-table--comfortable` | More generous row height |

Column helpers: `usrse-table__col--numeric` (right-aligned), `usrse-table__col--checkbox`.  
Cell helpers: `usrse-table__cell--mono`, `usrse-table__cell--nowrap`, `usrse-table__cell--truncate`.  
Sortable headers: add `aria-sort="ascending|descending|none"` on `<th>`.  
Selected rows: `aria-selected="true"` on `<tr>`.

```html
<div class="usrse-table-wrap">
  <table class="usrse-table usrse-table--striped usrse-table--hoverable">
    <caption>Working Group Members</caption>
    <thead>
      <tr>
        <th aria-sort="ascending">Name</th>
        <th>Institution</th>
        <th class="usrse-table__col--numeric">Joined</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Jane Smith</td>
        <td>National Lab</td>
        <td class="usrse-table__col--numeric">2022</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Accessibility:** Tables must have a `<caption>` or `aria-label`. Sortable column headers must update `aria-sort` via JavaScript when clicked. Row selection uses `aria-selected` on `<tr>` elements.

---

## Dark Mode

Dark mode overrides only Tier 2 semantic tokens. All components inherit the correct colors automatically — no component-level dark-mode code exists.

### How it activates

**System preference (automatic):**

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark token overrides */ }
}
```

**Manual override — force dark:**

```html
<html data-theme="dark">
```

**Manual override — force light** (wins over system preference):

```html
<html data-theme="light">
```

### What changes in dark mode

| Property | Light | Dark |
|---|---|---|
| Page background | `#ffffff` | `#050809` (neutral-950) |
| Surface base | `#ffffff` | `#111516` (neutral-900) |
| Surface raised | `#ffffff` | `#22282a` (neutral-800) |
| Primary text | `#111516` (neutral-900) | `#f5f7f8` (neutral-50) |
| Secondary text | `#4d5456` (neutral-600) | `#767e80` (neutral-400) |
| Brand primary | teal-500 `#188eac` | teal-400 `#2cb4d2` |
| Brand accent | purple-500 `#741755` | purple-400 `#c94e99` |
| Default links | purple-500 | purple-300 |
| Default borders | neutral-200 | neutral-700 |

**Dark mode button text note:** White on `teal-400` (`#2cb4d2`) only achieves 2.45:1 — this fails AA. The dark mode overrides set `--color-text-inverse` to `neutral-950` (near-black), so primary button text is dark on the lighter teal in dark mode.

### Reduced motion

`dark-mode.css` also includes:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    /* all transition tokens set to none */
  }
}
```

This means every component that uses `var(--transition-*)` tokens automatically has its animations disabled for users with reduced-motion preferences. No per-component code is needed.

---

## Utilities

Utility classes are defined in `components/utilities.css` and loaded last so they win specificity ties over component defaults.

Most utilities are unprefixed for brevity. Layout utilities use the `usrse-` prefix.

### Accessibility

| Class | Purpose |
|---|---|
| `.sr-only` | Visually hidden, accessible to screen readers |
| `.sr-only-focusable` | Hidden until focused (skip links) |

### Spacing

Margin: `.mt-{0-16}`, `.mb-{0-16}`, `.mx-{0,auto}`, `.my-{0-12}`  
Padding: `.p-{0-8}`, `.px-{0-8}`, `.py-{0-16}`  
Gap: `.gap-{0-12}`

### Typography

Sizes: `.text-2xs` through `.text-4xl`  
Weights: `.font-normal`, `.font-medium`, `.font-semibold`, `.font-bold`, `.font-extrabold`  
Families: `.font-body`, `.font-heading`, `.font-mono`  
Alignment: `.text-left`, `.text-center`, `.text-right`  
Transforms: `.uppercase`, `.lowercase`, `.capitalize`  
Tracking: `.tracking-tight`, `.tracking-wide`, `.tracking-caps`  
Leading: `.leading-none` through `.leading-loose`  
Overflow: `.truncate`, `.text-nowrap`, `.text-break`

### Color (semantic, dark-mode aware)

Text: `.text-primary`, `.text-secondary`, `.text-tertiary`, `.text-disabled`, `.text-inverse`, `.text-brand`, `.text-accent`, `.text-success`, `.text-warning`, `.text-danger`, `.text-info`, `.text-link`

Background: `.bg-surface`, `.bg-surface-subtle`, `.bg-primary`, `.bg-accent`, `.bg-success`, `.bg-warning`, `.bg-danger`, `.bg-info`, `.bg-transparent`

Border color: `.border-default`, `.border-subtle`, `.border-brand`, `.border-accent`

### Layout

| Class | Purpose |
|---|---|
| `.usrse-container` | Max-width 1216px, centered, horizontal padding |
| `.usrse-container--narrow` | Max-width 65ch (prose reading width) |
| `.usrse-container--wide` | Max-width 1408px |
| `.usrse-section` | Vertical padding `64px` (section-md) |
| `.usrse-section--sm` | Vertical padding `48px` |
| `.usrse-section--lg` | Vertical padding `96px` |
| `.usrse-stack` | Vertical flex container |
| `.usrse-stack--{xs-2xl}` | Stack gap variants |
| `.usrse-cluster` | Horizontal wrapping flex |
| `.usrse-cluster--{xs-lg}` | Cluster gap variants |
| `.usrse-prose` | Max-width 65ch, relaxed line-height |
| `.usrse-divider` | Horizontal rule using border token |
| `.usrse-push` | `margin-inline-start: auto` pusher |

### Display

`.block`, `.inline`, `.inline-block`, `.flex`, `.inline-flex`, `.grid`, `.hidden`, `.contents`

Flex: `.flex-row`, `.flex-col`, `.flex-wrap`, `.flex-1`, `.flex-none`, `.flex-shrink-0`, `.flex-grow`

Alignment: `.items-{start,center,end,stretch,baseline}`, `.justify-{start,center,end,between,around,evenly}`, `.self-{start,center,end,stretch,baseline}`

Overflow: `.overflow-hidden`, `.overflow-auto`, `.overflow-x-auto`

Position: `.relative`, `.absolute`, `.fixed`, `.sticky`

Sizing: `.w-full`, `.h-full`, `.h-screen`, `.min-w-0`

### Responsive Visibility

| Class | Behavior |
|---|---|
| `.hidden-mobile` | Hidden below 769px |
| `.hidden-desktop` | Hidden above 769px |
| `.hidden-tablet-down` | Hidden below 1024px |
| `.mobile-only` | Visible only below 640px |

### Miscellaneous

Border radius: `.rounded-none`, `.rounded-sm`, `.rounded`, `.rounded-lg`, `.rounded-full`  
Opacity: `.opacity-0`, `.opacity-50`, `.opacity-75`, `.opacity-100`  
Cursor: `.cursor-pointer`, `.cursor-default`, `.cursor-not-allowed`  
Pointer events: `.pointer-events-none`, `.pointer-events-auto`  
User select: `.select-none`, `.select-text`, `.select-all`  
Aspect ratio: `.aspect-square`, `.aspect-video`, `.aspect-portrait`  
Object fit: `.object-cover`, `.object-contain`, `.object-center`  
Motion: `.motion-safe`, `.motion-reduce`

---

## Contributing

### Adding a new token

1. Determine which tier the token belongs to.
2. Tier 1: Add a raw primitive value to `tokens/global.css`.
3. Tier 2: Add a semantic alias to `tokens/semantic.css` that references only Tier 1 tokens.
4. Tier 3: Add a component binding to `tokens/components.css` that references only Tier 2 tokens.
5. Run `pixi run validate` to confirm the hierarchy contract is intact.
6. Run `pixi run contrast` if you added color tokens — verify all critical pairings pass AA.

**Rule:** Before introducing any new token, check whether an existing token satisfies the need. New tokens are a commitment to maintain.

### Adding a new component

1. Create `components/{component-name}.css`.
2. Add Tier 3 tokens for the new component in `tokens/components.css`. Reference only Tier 2 tokens.
3. Write the component CSS. Reference only `--{component-name}-*` Tier 3 tokens. No raw values.
4. Add the import to `components/index.css` in the appropriate atomic design position (atoms, molecules, organisms).
5. Add documentation to `COMPONENTS.md`.
6. Run `pixi run check` to validate, lint, format, and contrast-check.

### Modifying an existing component's visual style

Edit the relevant `--{component}-*` token in `tokens/components.css`, not the component CSS file. The change propagates automatically. This preserves the token hierarchy contract.

### Modifying a semantic-level decision (e.g., changing what "primary" means)

Edit `tokens/semantic.css`. Because components only reference Tier 3, which references Tier 2, the change propagates to all components that use `--color-brand-primary`. Run `pixi run check` after.

---

## Build and Tooling

The build system uses [pixi](https://pixi.sh) for task running and environment management, with Node.js scripts for CSS processing.

### Setup

```bash
# Install pixi (if not already installed)
curl -fsSL https://pixi.sh/install.sh | bash

# Install dependencies
pixi install
pixi run install-node-deps
```

### Tasks

| Task | Command | What it does |
|---|---|---|
| `build` | `pixi run build` | Bundles all token CSS into `dist/tokens.css` and `dist/tokens.min.css` via postcss + cssnano |
| `validate` | `pixi run validate` | Checks token hierarchy contract: Tier 2 refs only Tier 1, Tier 3 refs only Tier 2, no raw values in Tiers 2–3, all `var()` references resolve |
| `lint` | `pixi run lint` | Runs stylelint over all token CSS files |
| `lint-fix` | `pixi run lint-fix` | Auto-fixes stylelint issues |
| `format` | `pixi run format` | Formats all CSS files with prettier |
| `format-check` | `pixi run format-check` | Checks formatting without writing (for CI) |
| `contrast` | `pixi run contrast` | Checks WCAG 2.2 AA contrast ratios for all color token pairings |
| `check` | `pixi run check` | Full quality gate: validate + lint + format-check + contrast. Run before every merge. |
| `dev` | `pixi run dev` | Watch mode: re-bundles tokens on file change |

### CI

The `check-ci` task runs the full quality gate and outputs machine-readable JSON for stylelint results to `reports/stylelint.json`:

```bash
pixi run -e ci check-ci
```

### Distribution

After `pixi run build`:
- `dist/tokens.css` — Full token system with comments, for development and debugging
- `dist/tokens.min.css` — Minified, for production

The component CSS files are not bundled into `dist/` — they are imported directly or processed by the site's own build pipeline.
