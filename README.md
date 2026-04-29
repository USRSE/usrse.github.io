# US-RSE Website

The redesigned website for the [United States Research Software Engineer Association](https://us-rse.org). Built with React 19, TypeScript 6, Tailwind CSS 4, and Vite 8.

## Quick Start

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
us-rse-site/
├── web/                          # React application (Vite)
│   ├── src/
│   │   ├── components/           # Shared UI components
│   │   │   ├── about/            # AboutLayout (shared for About pages)
│   │   │   ├── community/        # CommunityLayout
│   │   │   ├── events/           # EventsLayout
│   │   │   ├── jobs/             # JobsLayout (Opportunities)
│   │   │   ├── news/             # NewsLayout
│   │   │   ├── resources/        # ResourcesLayout
│   │   │   ├── Nav.tsx           # Mega-menu navigation
│   │   │   ├── Footer.tsx        # Site footer with socials
│   │   │   ├── Hero.tsx          # Animated hero with network canvas
│   │   │   ├── CommunityMap.tsx  # MapLibre GL full-bleed map
│   │   │   ├── NetworkCanvas.tsx # Canvas particle animation
│   │   │   ├── LogoMarquee.tsx   # Scrolling member/sponsor logos
│   │   │   └── ...
│   │   ├── pages/                # Route-level page components
│   │   │   ├── about/            # 10 About sub-pages
│   │   │   ├── community/        # 5 Community sub-pages
│   │   │   ├── events/           # 3 Events sub-pages
│   │   │   ├── jobs/             # 3 Opportunities sub-pages
│   │   │   ├── news/             # 3 News sub-pages
│   │   │   ├── resources/        # 4 Resources sub-pages
│   │   │   └── HomePage.tsx      # Homepage
│   │   ├── hooks/                # Custom React hooks
│   │   ├── App.tsx               # Router + route definitions
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Tailwind theme + custom utilities
│   ├── public/                   # Static assets (logos, board photos)
│   └── index.html                # HTML shell with font preloads
├── design-system/                # CSS design token system
│   ├── tokens/                   # Three-tier CSS custom properties
│   │   ├── global.css            # Tier 1: raw primitives (209 tokens)
│   │   ├── semantic.css          # Tier 2: intent aliases (178 tokens)
│   │   ├── components.css        # Tier 3: component bindings (387 tokens)
│   │   └── dark-mode.css         # Dark mode overrides
│   ├── components/               # CSS component implementations
│   ├── PRINCIPLES.md             # 5 design principles
│   ├── README.md                 # Design system documentation
│   ├── COMPONENTS.md             # Component API reference
│   └── TOKENS.md                 # Token hierarchy reference
├── public/                       # Source images (logos, board photos)
├── scripts/                      # Build and validation scripts
├── docs/                         # Specs and design documents
│   └── superpowers/specs/        # Approved design specs
├── pixi.toml                     # Design system workspace tasks
└── package.json                  # Root package (PostCSS tooling)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 (CSS-first `@theme`) |
| Routing | React Router 7 |
| Map | MapLibre GL (CartoDB dark-matter basemap) |
| Animation | CSS keyframes + Motion 12 |
| Fonts | Plus Jakarta Sans, Montserrat, Roboto, Fira Code |

## Pages (29 total)

| Section | Pages | Hero Color |
|---------|-------|-----------|
| Homepage | 1 | Purple gradient |
| About | 10 (Mission, RSE, DEI, Governance, Board, Elections, CoC, Sponsors, Staff, Financial) | Purple |
| Community | 5 (Working Groups, Affinity Groups, Calls, Awards, Funds) | Teal |
| Events | 3 (Upcoming, Calendar, USRSE'26) | Dark neutral |
| Opportunities | 3 (Job Board, Post a Job, Volunteer) | Teal-dark |
| News | 3 (Newsletters, Updates, Leadership) | Purple-dark |
| Resources | 4 (Hub, Education, Organizations, Map) | Teal-neutral |

## Design Principles

1. **Community-First Clarity** — Navigation is predictable; primary actions reachable in two interactions
2. **Inclusive by Default** — WCAG 2.2 AA baseline; focus states never suppressed; motion opt-in
3. **Technical Credibility** — Code blocks and data are first-class layout citizens
4. **Transparent Consistency** — All values from the token system; no hard-coded one-offs
5. **Warm Precision** — Structured and documented like a well-run open-source project

## Navigation Architecture

The site uses a mega-menu system:

- **About** — 2-column mega-menu (Organization + Leadership) with featured callout
- **Community** — 2-column mega-menu (Working Groups + Connect) with join CTA
- **Events** — Simple dropdown (3 items)
- **Opportunities** — Simple dropdown (3 items)
- **News** — Simple dropdown (3 items)
- **Resources** — Simple dropdown (4 items)

Each section has its own layout component with:
- Distinct hero gradient (purple, teal, dark, etc.)
- Numbered typographic sidebar (desktop)
- Hero progress pills (mobile + desktop)
- Prev/next journey navigation footer

## Design System

The CSS design system lives in `design-system/` and is independent of the React app. It uses a three-tier token architecture:

```
Tier 1 (global.css)    → Raw values: --color-teal-500, --space-4
        ↓
Tier 2 (semantic.css)  → Intent: --color-brand-primary, --space-stack-md
        ↓
Tier 3 (components.css) → Scoped: --button-primary-bg, --card-radius
```

Run the design system quality gate:
```bash
pixi run check    # validate + lint + format + contrast
pixi run build    # bundle into dist/
pixi run dev      # watch and rebuild
```

## Key Commands

```bash
# Web app
cd web && npm run dev       # Start dev server
cd web && npm run build     # Production build

# Design system
pixi run check              # Full quality gate
pixi run contrast           # WCAG 2.2 AA verification
pixi run validate           # Token hierarchy validator
```

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Purple 500 | `#741755` | Primary brand — nav accent, hero, CTAs |
| Teal 500 | `#188eac` | Secondary — accents, links, interactive |
| Neutral | Teal-undertoned grays | Text, backgrounds, borders |

## Upcoming Work

- [#1](../../issues/1) Membership management system (WorkOS + NeonDB + Drizzle)
- [#2](../../issues/2) Database schema & infrastructure
- [#3](../../issues/3) Authentication (WorkOS)
- [#4](../../issues/4) Member profiles
- [#5](../../issues/5) Admin dashboard
- [#6](../../issues/6) Site integration
