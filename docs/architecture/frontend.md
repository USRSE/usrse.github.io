# Frontend Architecture

The US-RSE website is a single-page React application with client-side routing. No backend — the site is static content with interactive components.

## Component Hierarchy

```
App (BrowserRouter)
├── Nav (mega-menu, sticky, mobile accordion)
├── ScrollToTop (resets scroll on route change)
├── Routes
│   ├── HomePage
│   │   ├── Hero (purple gradient + NetworkCanvas animation)
│   │   ├── LogoMarquee (two-row infinite scroll)
│   │   ├── Mission (asymmetric two-column layout)
│   │   ├── Stats (animated counters)
│   │   ├── CommunityMap (MapLibre GL full-bleed)
│   │   ├── PhotoStrip (placeholder grid)
│   │   ├── WorkingGroups (typographic list)
│   │   ├── Events (featured + recurring)
│   │   ├── Community (testimonials + CTA)
│   │   └── JobBoard (classified-style listings)
│   ├── /about/* → AboutLayout (purple hero, sidebar)
│   │   ├── MissionPage
│   │   ├── WhatIsRSEPage
│   │   ├── DEIPage
│   │   ├── GovernancePage (org chart)
│   │   ├── BoardPage (editorial photo grid)
│   │   ├── ElectionsPage (timeline)
│   │   ├── CodeOfConductPage (legal document style)
│   │   ├── SponsorsPage (film credits typography)
│   │   ├── StaffPage (magazine profile)
│   │   └── FinancialStatusPage
│   ├── /community/* → CommunityLayout (teal hero, sidebar)
│   │   ├── WorkingGroupsPage
│   │   ├── AffinityGroupsPage
│   │   ├── CommunityCallsPage
│   │   ├── CommunityAwardsPage
│   │   └── CommunityFundsPage
│   ├── /events/* → EventsLayout (dark hero, sidebar)
│   │   ├── UpcomingEventsPage
│   │   ├── CalendarPage
│   │   └── ConferencePage
│   ├── /jobs/* → JobsLayout (teal-dark hero, sidebar)
│   │   ├── BrowseJobsPage
│   │   ├── SubmitJobPage
│   │   └── VolunteerPage
│   ├── /news/* → NewsLayout (purple-dark hero, sidebar)
│   │   ├── NewslettersPage
│   │   ├── NewsUpdatesPage
│   │   └── LeadershipMessagesPage
│   └── /resources/* → ResourcesLayout (teal-neutral hero, sidebar)
│       ├── ResourcesHubPage
│       ├── EducationPage
│       ├── OrganizationsPage
│       └── MapPage (coming soon)
└── Footer (socials, links, legal)
```

## Layout System

Each section (About, Community, Events, etc.) has a shared layout component providing:

| Feature | Implementation |
|---------|---------------|
| Hero banner | Section-colored gradient with breadcrumb, title, subtitle |
| Progress pills | Horizontal pill nav in the hero (all pages in section) |
| Sidebar | Numbered typographic nav, sticky, desktop only |
| Content area | `max-w-3xl` article within `max-w-7xl` container |
| Journey nav | Prev/next footer linking between pages in sequence |

Hero gradients by section:

| Section | Gradient | Rationale |
|---------|----------|-----------|
| About | `purple-950 → purple-800 → purple-600` | Primary brand color |
| Community | `teal-950 → teal-800 → teal-600` | Secondary brand color |
| Events | `neutral-900 → neutral-800 → purple-950` | "Where things happen" feel |
| Opportunities | `neutral-900 → teal-950 → teal-900` | Professional/opportunity |
| News | `purple-950 → purple-900 → neutral-900` | Editorial/newspaper |
| Resources | `teal-900 → neutral-900 → neutral-800` | Knowledge/reference |

## Navigation

The Nav component uses a three-type menu system:

1. **Mega-menu** (About, Community) — Multi-column panel with grouped links, descriptions, and a featured callout. 540px+ wide.
2. **Dropdown** (Events, Opportunities, News, Resources) — Single-column list of links.
3. **Direct link** — No dropdown, navigates immediately (currently unused but supported).

Mobile uses an accordion pattern with section headings that expand/collapse.

All internal links use React Router `<Link>` via a `SmartLink` helper that conditionally renders `<Link>` or `<a>` based on a `route` flag.

## Interactive Components

### NetworkCanvas
Canvas-based particle animation in the hero. Nodes drift organically with purple-to-teal color interpolation. Connections drawn between nearby nodes. Uses `requestAnimationFrame` for smooth 60fps rendering.

### CommunityMap
Full-bleed MapLibre GL section with CartoDB dark-matter basemap. Features:
- US / International toggle (flies between views)
- 1:1 reset button (custom MapLibre control)
- Dark glassmorphic zoom controls
- Scroll zoom disabled for accessibility
- Overlaid typographic content that updates with the toggle

### LogoMarquee
Two-row infinite scroll of organizational member names (top, scrolls left) and sponsor names (bottom, scrolls right). Uses CSS `@keyframes marquee` with duplicated content for seamless looping. Fade edges via gradient overlays.

### AnimatedCounter (Stats)
Counts up from 0 to target value using `requestAnimationFrame` with cubic ease-out. Triggered by `useInView` intersection observer.

## Design Patterns

### What we use
- Monospace-numbered prose blocks (section content)
- Horizontal rules as separators (between list items)
- `border-l` indented text blocks (related items)
- Editorial pull quotes with colored rules (key statements)
- Typographic hierarchy for weight differentiation (no card wrappers)

### What we avoid
- Icon-in-colored-circle card grids
- `rounded-xl border bg-neutral-50` card patterns
- Gradient pill badges
- Colored left border cards
- Hover-shadow-lift on static content

## Scroll Animation

The `useInView` hook wraps `IntersectionObserver` and returns `{ ref, isInView }`. Components conditionally apply `animate-slide-up` (CSS keyframe with spring easing) when entering the viewport. Staggered delays via inline `animationDelay`.

All animations respect `prefers-reduced-motion` via a global CSS rule that zeroes durations.
