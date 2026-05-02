# US-RSE Design System — Component Reference

Full HTML markup examples for every component, every variant, and every state. This document is the developer reference. The README covers architecture and quick start.

All component classes use the `.usrse-` prefix. All components consume Tier 3 tokens exclusively — no raw values appear in component files.

---

## Table of Contents

1. [Button](#button)
2. [Card](#card)
3. [Input (Form Controls)](#input-form-controls)
4. [Navigation](#navigation)
5. [Hero](#hero)
6. [Badge and Tag](#badge-and-tag)
7. [Alert](#alert)
8. [Code](#code)
9. [Table](#table)

---

## Button

**File:** `components/button.css`  
**Tokens:** `--button-*` in `tokens/components.css`

### Purpose

Use `<button>` for all actions that do not navigate to a new URL. Use `<a>` styled as a button for navigation. Never use `<div>` or `<span>` for clickable actions.

Choose the variant based on the action's emphasis:
- **Primary** for the single most important action on the page or section.
- **Secondary** when a primary action exists and this is a supporting option.
- **Ghost** for toolbars, icon actions, or low-emphasis choices.
- **Accent** for membership, conference, and community-brand actions.
- **Danger** only for irreversible destructive actions (delete, revoke).

### Variants

```html
<!-- Primary — teal fill, white text -->
<button class="usrse-button usrse-button--primary">
  Join US-RSE
</button>

<!-- Secondary — teal outline, teal text -->
<button class="usrse-button usrse-button--secondary">
  Learn More
</button>

<!-- Ghost — transparent, no border -->
<button class="usrse-button usrse-button--ghost">
  Dismiss
</button>

<!-- Accent — purple fill, white text -->
<button class="usrse-button usrse-button--accent">
  Register Now
</button>

<!-- Danger — red fill, white text -->
<button class="usrse-button usrse-button--danger">
  Delete Account
</button>
```

### Sizes

```html
<!-- Small — 32px height, for dense layouts, table row actions -->
<button class="usrse-button usrse-button--primary usrse-button--sm">
  Submit
</button>

<!-- Medium (default) — 40px height -->
<button class="usrse-button usrse-button--primary">
  Submit
</button>

<!-- Large — 48px height, for hero CTAs -->
<button class="usrse-button usrse-button--primary usrse-button--lg">
  Get Started
</button>
```

### States

```html
<!-- Disabled — native disabled attribute (for <button>) -->
<button class="usrse-button usrse-button--primary" disabled>
  Unavailable
</button>

<!-- Disabled — aria-disabled for <a> styled as button (no native disabled) -->
<a href="#" class="usrse-button usrse-button--primary" aria-disabled="true" tabindex="-1">
  Unavailable
</a>

<!-- Loading — hides text, shows spinner, sets aria-busy -->
<button class="usrse-button usrse-button--primary usrse-button--loading" aria-busy="true">
  <span class="usrse-button__text">Submitting…</span>
</button>
```

### Icon Support

```html
<!-- Icon left -->
<button class="usrse-button usrse-button--primary">
  <svg class="usrse-button__icon" aria-hidden="true" viewBox="0 0 20 20">
    <!-- SVG path here -->
  </svg>
  Download
</button>

<!-- Icon right -->
<button class="usrse-button usrse-button--secondary">
  Next Step
  <svg class="usrse-button__icon" aria-hidden="true" viewBox="0 0 20 20">
    <!-- SVG path here -->
  </svg>
</button>

<!-- Icon only — MUST have aria-label -->
<button class="usrse-button usrse-button--ghost usrse-button--icon-only" aria-label="Close menu">
  <svg class="usrse-button__icon" aria-hidden="true" viewBox="0 0 20 20">
    <!-- X icon path here -->
  </svg>
</button>

<!-- Icon only, small -->
<button class="usrse-button usrse-button--ghost usrse-button--icon-only usrse-button--sm" aria-label="Edit">
  <svg class="usrse-button__icon" aria-hidden="true" viewBox="0 0 20 20">
    <!-- Edit icon path here -->
  </svg>
</button>
```

### Full Width

```html
<button class="usrse-button usrse-button--primary usrse-button--full">
  Sign In
</button>
```

### Button Group

Adjacent related actions. Internal borders collapse to avoid doubling.

```html
<div class="usrse-button-group" role="group" aria-label="Text alignment">
  <button class="usrse-button usrse-button--secondary usrse-button--sm">Left</button>
  <button class="usrse-button usrse-button--secondary usrse-button--sm">Center</button>
  <button class="usrse-button usrse-button--secondary usrse-button--sm">Right</button>
</div>
```

### Link as Button

For navigation that should look like a button:

```html
<!-- Primary CTA that navigates -->
<a href="/join" class="usrse-button usrse-button--primary">Join US-RSE</a>

<!-- Opens in new tab — include context for screen readers -->
<a href="https://conference.us-rse.org" class="usrse-button usrse-button--accent" target="_blank" rel="noopener noreferrer">
  Conference Site
  <span class="sr-only">(opens in new tab)</span>
</a>
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-button` | Base — required on all buttons |
| `.usrse-button--primary` | Teal fill variant |
| `.usrse-button--secondary` | Teal outline variant |
| `.usrse-button--ghost` | Transparent variant |
| `.usrse-button--accent` | Purple fill variant |
| `.usrse-button--danger` | Red fill variant |
| `.usrse-button--sm` | Small size |
| `.usrse-button--lg` | Large size |
| `.usrse-button--icon-only` | Square, no text padding |
| `.usrse-button--full` | 100% width |
| `.usrse-button--loading` | Loading state |
| `.usrse-button__text` | Text wrapper (hidden during loading) |
| `.usrse-button__icon` | SVG icon inside button |
| `.usrse-button-group` | Group wrapper |

### Accessibility Requirements

- Use `<button>` for actions. Use `<a>` for navigation.
- Every `usrse-button--icon-only` must have `aria-label` describing the action.
- Loading state: add `aria-busy="true"` to the button element.
- Disabled `<a>` elements: add `aria-disabled="true"` and `tabindex="-1"`.
- Keyboard: all buttons are natively keyboard operable. Focus rings are always visible (never `outline: none` without replacement).
- Do not suppress the focus ring. The `:focus-visible` rule applies a colored box-shadow.

### Do's and Don'ts

**Do:**
- Use one primary button per distinct action group.
- Provide descriptive text — "Register for Conference" not "Click Here".
- Use danger variant only for truly destructive, irreversible actions.

**Don't:**
- Place two primary buttons side-by-side without a hierarchy reason.
- Use a button when a link (`<a>`) is semantically correct.
- Disable a button without explaining why (use help text or a tooltip).

---

## Card

**File:** `components/card.css`  
**Tokens:** `--card-*` in `tokens/components.css`

### Purpose

Cards group related content into a contained unit. Use them for: events, blog posts, working groups, job listings, member spotlights, resource links. Cards should represent a single, coherent entity — not a mixed content feed.

### Base Card

```html
<article class="usrse-card">
  <header class="usrse-card__header">
    <p class="usrse-card__meta">Event</p>
    <h3 class="usrse-card__title">US-RSE Annual Conference 2025</h3>
  </header>
  <div class="usrse-card__body">
    Three days of talks, workshops, and community events for research software engineers.
  </div>
  <footer class="usrse-card__footer">
    <a href="/conference" class="usrse-button usrse-button--secondary usrse-button--sm">
      View Details
    </a>
    <span class="text-secondary text-sm">Oct 2025 · Philadelphia</span>
  </footer>
</article>
```

### Featured Card (teal left border)

Use for pinned announcements, featured events, priority content.

```html
<article class="usrse-card usrse-card--featured">
  <header class="usrse-card__header">
    <p class="usrse-card__meta">Announcement</p>
    <h3 class="usrse-card__title">Steering Council Election Now Open</h3>
  </header>
  <div class="usrse-card__body">
    Nominations are open through December 15. All US-RSE members are eligible to run.
  </div>
  <footer class="usrse-card__footer">
    <a href="/election" class="usrse-button usrse-button--primary usrse-button--sm">Nominate</a>
  </footer>
</article>
```

### Compact Card

For sidebars, dense lists, or widget panels.

```html
<article class="usrse-card usrse-card--compact">
  <p class="usrse-card__meta">Working Group</p>
  <h4 class="usrse-card__title">Education and Training</h4>
  <p class="usrse-card__body">Resources and curriculum for RSE skill development.</p>
</article>
```

### Spacious Card

For standalone large-format content.

```html
<article class="usrse-card usrse-card--spacious">
  <header class="usrse-card__header">
    <p class="usrse-card__meta">Member Spotlight</p>
    <h3 class="usrse-card__title">Jane Smith — Senior RSE at National Lab</h3>
  </header>
  <div class="usrse-card__body">
    Jane has spent 15 years building simulation software for climate research.
  </div>
</article>
```

### Flat Card

Use inside already-elevated surfaces (modal bodies, colored sections) where adding another shadow would create visual noise.

```html
<div class="usrse-card usrse-card--flat">
  <p>Content in a card without elevation.</p>
</div>
```

### Interactive Card (entire card is a link)

```html
<!-- The <a> is the card root. All content is inside. -->
<a href="/blog/post-slug" class="usrse-card usrse-card--interactive">
  <header class="usrse-card__header">
    <p class="usrse-card__meta">Blog</p>
    <h3 class="usrse-card__title">What Makes a Good Research Software Engineer?</h3>
  </header>
  <div class="usrse-card__body">
    A reflection on the skills, practices, and community that define the RSE role.
  </div>
  <footer class="usrse-card__footer">
    <span class="text-secondary text-sm">March 12, 2025</span>
  </footer>
</a>
```

### Card with Image

The image bleeds to the card edges using negative margins. The card's `overflow: hidden` clips it to the border-radius.

```html
<article class="usrse-card">
  <img
    class="usrse-card__image"
    src="/images/conference-2024.jpg"
    alt="Attendees at US-RSE 2024 in Albuquerque"
    width="640"
    height="360"
    loading="lazy"
  >
  <header class="usrse-card__header">
    <p class="usrse-card__meta">Event Recap</p>
    <h3 class="usrse-card__title">US-RSE'24 — A Community Milestone</h3>
  </header>
  <div class="usrse-card__body">
    Over 400 attendees gathered in Albuquerque for the third annual conference.
  </div>
</article>
```

### Card Grid Layout

Responsive grid that wraps without breakpoint classes. Cards fill available space with a minimum width.

```html
<!-- Standard grid — min card width 18rem -->
<div class="usrse-card-grid">
  <article class="usrse-card">…</article>
  <article class="usrse-card">…</article>
  <article class="usrse-card">…</article>
</div>

<!-- Dense grid — min card width 14rem -->
<div class="usrse-card-grid usrse-card-grid--dense">
  <article class="usrse-card usrse-card--compact">…</article>
</div>

<!-- Wide grid — min card width 24rem -->
<div class="usrse-card-grid usrse-card-grid--wide">
  <article class="usrse-card usrse-card--spacious">…</article>
</div>
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-card` | Base card |
| `.usrse-card--featured` | Teal left border accent |
| `.usrse-card--compact` | Reduced padding |
| `.usrse-card--spacious` | Generous padding |
| `.usrse-card--flat` | No shadow or border |
| `.usrse-card--interactive` | Full card is a clickable link |
| `.usrse-card__header` | Header area |
| `.usrse-card__meta` | Small uppercase label |
| `.usrse-card__title` | Card heading |
| `.usrse-card__body` | Main content area |
| `.usrse-card__footer` | Action or metadata row |
| `.usrse-card__image` | Bleed image at card top |
| `.usrse-card-grid` | Responsive card grid |
| `.usrse-card-grid--dense` | Dense grid (min 14rem) |
| `.usrse-card-grid--wide` | Wide grid (min 24rem) |

### Accessibility Requirements

- Use semantic HTML: `<article>` for self-contained content, `<section>` for related groups.
- Heading levels must follow the document outline — card titles are typically `<h3>` or `<h4>`.
- Interactive cards: use `<a>` as the root element. Do not nest multiple interactive elements inside an interactive card — it creates ambiguous tab order.
- Images: always provide descriptive `alt` text. Decorative images use `alt=""`.
- Card footers with both a button and a date: ensure the button has clear text (not just "Read More" with no context).

### Do's and Don'ts

**Do:**
- Use `usrse-card__meta` for category labels (event type, content type) — they provide context before the title.
- Keep card body text to 2–3 sentences. Cards are teasers, not full articles.
- Use `usrse-card--featured` sparingly — when everything is featured, nothing is.

**Don't:**
- Nest interactive elements inside `usrse-card--interactive`. The entire card is already a link.
- Use cards for single-line items that belong in a list.
- Stack more than 3 columns of `usrse-card-grid--wide` cards — the grid handles it but the content suffers.

---

## Input (Form Controls)

**File:** `components/input.css`  
**Tokens:** `--input-*`, `--checkbox-*`, `--textarea-*` in `tokens/components.css`

### Purpose

All form controls. The accessibility contract is non-negotiable: every input must have a label. Error messages must be programmatically linked. Required fields must be indicated both visually and via `aria-required`.

### Form Field Anatomy

The complete pattern for a single form field:

```html
<div class="usrse-field">
  <label class="usrse-label" for="email">
    Email address
    <span class="usrse-label__required" aria-hidden="true">*</span>
  </label>
  <input
    class="usrse-input"
    type="email"
    id="email"
    name="email"
    aria-required="true"
    autocomplete="email"
    placeholder="you@institution.edu"
  >
  <p class="usrse-field-help" id="email-help">
    Your institutional email is preferred but not required.
  </p>
</div>
```

With `aria-describedby` linking help text:

```html
<div class="usrse-field">
  <label class="usrse-label" for="username">Username</label>
  <input
    class="usrse-input"
    type="text"
    id="username"
    aria-describedby="username-help"
  >
  <p class="usrse-field-help" id="username-help">
    3–20 characters. Letters, numbers, and hyphens only.
  </p>
</div>
```

### Text Input — All States

```html
<!-- Default -->
<input class="usrse-input" type="text" placeholder="Enter your name">

<!-- Hover — strengthened border (CSS-only, no class needed) -->

<!-- Focus — teal ring (CSS-only, no class needed) -->

<!-- Error -->
<div class="usrse-field">
  <label class="usrse-label" for="name-error">Full name</label>
  <input
    class="usrse-input usrse-input--error"
    type="text"
    id="name-error"
    aria-invalid="true"
    aria-describedby="name-error-msg"
    value="J"
  >
  <p class="usrse-field-error" id="name-error-msg" role="alert">
    Name must be at least 2 characters.
  </p>
</div>

<!-- Success -->
<input class="usrse-input usrse-input--success" type="text" value="Jane Smith">

<!-- Disabled -->
<input class="usrse-input" type="text" value="Read-only value" disabled>
```

### Input Sizes

```html
<!-- Small -->
<input class="usrse-input usrse-input--sm" type="text" placeholder="Search…">

<!-- Medium (default) -->
<input class="usrse-input" type="text" placeholder="Search…">

<!-- Large -->
<input class="usrse-input usrse-input--lg" type="text" placeholder="Search…">
```

### Input Types

All standard text-type inputs share the same `.usrse-input` class:

```html
<input class="usrse-input" type="text" placeholder="Full name">
<input class="usrse-input" type="email" placeholder="Email address" autocomplete="email">
<input class="usrse-input" type="password" placeholder="Password" autocomplete="current-password">
<input class="usrse-input" type="number" placeholder="0" min="0" max="100">
<input class="usrse-input" type="search" placeholder="Search members…" role="searchbox">
<input class="usrse-input" type="url" placeholder="https://github.com/username">
<input class="usrse-input" type="tel" placeholder="+1 (555) 000-0000" autocomplete="tel">
```

### Textarea

```html
<div class="usrse-field">
  <label class="usrse-label" for="bio">Short bio</label>
  <textarea
    class="usrse-textarea"
    id="bio"
    name="bio"
    rows="4"
    placeholder="Tell the community about your RSE work…"
  ></textarea>
  <p class="usrse-field-help">Maximum 300 characters.</p>
</div>

<!-- Error state -->
<textarea
  class="usrse-textarea usrse-textarea--error"
  aria-invalid="true"
  aria-describedby="bio-error"
></textarea>

<!-- Disabled -->
<textarea class="usrse-textarea" disabled>This content cannot be edited.</textarea>
```

### Select

```html
<div class="usrse-field">
  <label class="usrse-label" for="institution-type">Institution type</label>
  <select class="usrse-select" id="institution-type" name="institution-type">
    <option value="">Select one…</option>
    <option value="national-lab">National Laboratory</option>
    <option value="university">University</option>
    <option value="federal-agency">Federal Agency</option>
    <option value="nonprofit">Nonprofit</option>
    <option value="industry">Industry</option>
    <option value="other">Other</option>
  </select>
</div>

<!-- Error state -->
<select class="usrse-select usrse-select--error" aria-invalid="true">
  <option value="">Select one…</option>
</select>

<!-- Disabled -->
<select class="usrse-select" disabled>
  <option>Unavailable</option>
</select>
```

### Checkbox

```html
<!-- Single checkbox -->
<label class="usrse-check">
  <input class="usrse-check__control" type="checkbox" name="newsletter">
  <span class="usrse-check__label">Subscribe to the US-RSE newsletter</span>
</label>

<!-- Checked state -->
<label class="usrse-check">
  <input class="usrse-check__control" type="checkbox" name="terms" checked>
  <span class="usrse-check__label">I agree to the code of conduct</span>
</label>

<!-- Disabled -->
<label class="usrse-check">
  <input class="usrse-check__control" type="checkbox" disabled>
  <span class="usrse-check__label">This option is not available</span>
</label>

<!-- Checkbox group (fieldset required for groups) -->
<fieldset>
  <legend class="usrse-label">Areas of interest</legend>
  <div class="usrse-stack usrse-stack--sm mt-2">
    <label class="usrse-check">
      <input class="usrse-check__control" type="checkbox" name="interests" value="hpc">
      <span class="usrse-check__label">High Performance Computing</span>
    </label>
    <label class="usrse-check">
      <input class="usrse-check__control" type="checkbox" name="interests" value="ml">
      <span class="usrse-check__label">Machine Learning</span>
    </label>
    <label class="usrse-check">
      <input class="usrse-check__control" type="checkbox" name="interests" value="data">
      <span class="usrse-check__label">Data Management</span>
    </label>
  </div>
</fieldset>
```

### Radio

```html
<fieldset>
  <legend class="usrse-label">Membership level</legend>
  <div class="usrse-stack usrse-stack--sm mt-2">
    <label class="usrse-check">
      <input class="usrse-check__control" type="radio" name="level" value="member" checked>
      <span class="usrse-check__label">Member</span>
    </label>
    <label class="usrse-check">
      <input class="usrse-check__control" type="radio" name="level" value="affiliate">
      <span class="usrse-check__label">Affiliate</span>
    </label>
    <label class="usrse-check">
      <input class="usrse-check__control" type="radio" name="level" value="student">
      <span class="usrse-check__label">Student</span>
    </label>
  </div>
</fieldset>
```

### Input Group (prepend / append)

```html
<!-- Prepend text label -->
<div class="usrse-input-group">
  <span class="usrse-input-group__addon">https://</span>
  <input class="usrse-input" type="url" placeholder="github.com/username">
</div>

<!-- Append button -->
<div class="usrse-input-group">
  <input class="usrse-input" type="email" placeholder="your@email.com">
  <button class="usrse-button usrse-button--primary">Subscribe</button>
</div>

<!-- Both sides -->
<div class="usrse-input-group">
  <span class="usrse-input-group__addon">$</span>
  <input class="usrse-input" type="number" placeholder="0.00">
  <span class="usrse-input-group__addon">USD</span>
</div>
```

### Complete Form Example

```html
<form class="usrse-form" novalidate>
  <div class="usrse-field">
    <label class="usrse-label" for="reg-name">
      Full name
      <span class="usrse-label__required" aria-hidden="true">*</span>
    </label>
    <input
      class="usrse-input"
      type="text"
      id="reg-name"
      name="name"
      aria-required="true"
      autocomplete="name"
    >
  </div>

  <div class="usrse-field">
    <label class="usrse-label" for="reg-email">
      Email address
      <span class="usrse-label__required" aria-hidden="true">*</span>
    </label>
    <input
      class="usrse-input"
      type="email"
      id="reg-email"
      name="email"
      aria-required="true"
      aria-describedby="reg-email-help"
      autocomplete="email"
    >
    <p class="usrse-field-help" id="reg-email-help">
      Used for event notifications only.
    </p>
  </div>

  <div class="usrse-field">
    <label class="usrse-label" for="reg-type">Institution type</label>
    <select class="usrse-select" id="reg-type" name="institution_type">
      <option value="">Select…</option>
      <option>National Laboratory</option>
      <option>University</option>
    </select>
  </div>

  <div class="mt-6">
    <button class="usrse-button usrse-button--primary" type="submit">
      Complete Registration
    </button>
    <button class="usrse-button usrse-button--ghost" type="button">
      Cancel
    </button>
  </div>
</form>
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-field` | Form field wrapper |
| `.usrse-label` | Input label |
| `.usrse-label__required` | Required indicator asterisk |
| `.usrse-label__optional` | Optional indicator text |
| `.usrse-input` | Text-type inputs |
| `.usrse-input--sm` | Small size |
| `.usrse-input--lg` | Large size |
| `.usrse-input--error` | Error state |
| `.usrse-input--success` | Success state |
| `.usrse-textarea` | Textarea |
| `.usrse-textarea--error` | Textarea error state |
| `.usrse-select` | Select element |
| `.usrse-select--error` | Select error state |
| `.usrse-check` | Checkbox/radio wrapper label |
| `.usrse-check__control` | The native input element |
| `.usrse-check__label` | Label text |
| `.usrse-field-help` | Help text below input |
| `.usrse-field-error` | Error message below input |
| `.usrse-input-group` | Input with prefix/suffix |
| `.usrse-input-group__addon` | Prefix or suffix content |
| `.usrse-form` | Form wrapper (controls field spacing) |

### Accessibility Requirements

- Every input must have a `<label>` element with a matching `for`/`id` pair. Placeholder text is not a label.
- Required fields: use `aria-required="true"` on the input and a visual indicator in the label.
- Error messages: use `aria-invalid="true"` on the input and link the error message with `aria-describedby`.
- Error message elements should use `role="alert"` to announce errors to screen readers.
- Checkbox and radio groups: wrap in `<fieldset>` with `<legend>` — never skip this for groups of related controls.
- Focus is never suppressed. The teal focus ring appears on all interactive states.
- Disabled inputs: use the native `disabled` attribute, which removes the field from tab order and marks it as unavailable to assistive technology.

---

## Navigation

**File:** `components/nav.css`  
**Tokens:** `--nav-*`, `--back-to-top-*`, `--skip-link-*` in `tokens/components.css`

### Purpose

The site header. Purple background (`#741755`) matching the production us-rse.org navbar. Sticky at the top of the viewport. Contains the logo, primary navigation, dropdown menus, and the hamburger menu for mobile.

The skip link must always be the first focusable element on the page.

### Skip Link (required on every page)

```html
<a class="usrse-skip-link" href="#main-content">Skip to main content</a>
<!-- ... rest of page ... -->
<main id="main-content">…</main>
```

The skip link is visually hidden until keyboard focus, then slides into view at the top of the viewport.

### Full Topbar Navigation

```html
<a class="usrse-skip-link" href="#main-content">Skip to main content</a>

<nav class="usrse-nav" aria-label="Main navigation">
  <div class="usrse-nav__container">
    <!-- Logo -->
    <a class="usrse-nav__brand" href="/">
      <img
        class="usrse-nav__logo"
        src="/assets/img/us-rse-logo-white.svg"
        alt="US-RSE — United States Research Software Engineer Association"
        width="120"
        height="36"
      >
    </a>

    <!-- Desktop menu -->
    <ul class="usrse-nav__menu" role="list">
      <li class="usrse-nav__item">
        <a class="usrse-nav__link" href="/about" aria-current="page">About</a>
      </li>

      <!-- Item with dropdown -->
      <li class="usrse-nav__item">
        <button
          class="usrse-nav__link usrse-nav__link--has-dropdown"
          aria-expanded="false"
          aria-controls="community-dropdown"
        >
          Community
        </button>
        <ul class="usrse-nav__dropdown" id="community-dropdown" role="list">
          <li>
            <a class="usrse-nav__dropdown-item" href="/working-groups">Working Groups</a>
          </li>
          <li>
            <a class="usrse-nav__dropdown-item" href="/events">Events</a>
          </li>
          <li>
            <a class="usrse-nav__dropdown-item" href="/blog">Blog</a>
          </li>
          <hr class="usrse-nav__dropdown-separator" role="separator">
          <li>
            <a class="usrse-nav__dropdown-item usrse-nav__dropdown-item--active" href="/conference" aria-current="page">
              Conference 2025
            </a>
          </li>
        </ul>
      </li>

      <li class="usrse-nav__item">
        <a class="usrse-nav__link" href="/jobs">Jobs</a>
      </li>
    </ul>

    <!-- Hamburger (hidden on desktop, visible on mobile) -->
    <button
      class="usrse-nav__burger"
      aria-label="Toggle navigation menu"
      aria-expanded="false"
      aria-controls="mobile-menu"
    >
      <span class="usrse-nav__burger-line"></span>
      <span class="usrse-nav__burger-line"></span>
      <span class="usrse-nav__burger-line"></span>
    </button>
  </div>
</nav>

<!-- Mobile menu panel -->
<div class="usrse-nav__mobile-menu" id="mobile-menu" aria-hidden="true">
  <a class="usrse-nav__mobile-link" href="/about">About</a>
  <a class="usrse-nav__mobile-link" href="/community">Community</a>
  <a class="usrse-nav__mobile-sublink" href="/working-groups">Working Groups</a>
  <a class="usrse-nav__mobile-sublink" href="/events">Events</a>
  <a class="usrse-nav__mobile-link" href="/jobs">Jobs</a>
</div>
```

### Scrolled State

JavaScript adds `usrse-nav--scrolled` when `window.scrollY > 0` to apply a drop shadow:

```js
window.addEventListener('scroll', () => {
  document.querySelector('.usrse-nav')
    .classList.toggle('usrse-nav--scrolled', window.scrollY > 0);
});
```

### Sidebar Navigation

For section navigation on documentation, settings, or category pages.

```html
<nav class="usrse-nav-sidebar" aria-label="Section navigation">
  <p class="usrse-nav-sidebar__label">Resources</p>
  <a class="usrse-nav-sidebar__link usrse-nav-sidebar__link--active" href="/resources/getting-started" aria-current="page">
    Getting Started
  </a>
  <a class="usrse-nav-sidebar__link" href="/resources/career">Career Resources</a>
  <a class="usrse-nav-sidebar__link" href="/resources/funding">Funding</a>

  <p class="usrse-nav-sidebar__label">Community</p>
  <a class="usrse-nav-sidebar__link" href="/working-groups">Working Groups</a>
  <a class="usrse-nav-sidebar__link" href="/slack">Slack</a>
</nav>
```

### Back-to-Top Button

```html
<!-- Hidden until JS determines scroll position -->
<button class="usrse-back-to-top" aria-label="Back to top" hidden>
  <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20">
    <path d="M10 3l7 7H3l7-7z" fill="currentColor"/>
  </svg>
</button>
```

```js
// Minimal JS to show/hide the button
const btn = document.querySelector('.usrse-back-to-top');
window.addEventListener('scroll', () => {
  btn.hidden = window.scrollY < 400;
});
btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-skip-link` | First focusable element — keyboard skip navigation |
| `.usrse-nav` | Sticky topbar with purple background |
| `.usrse-nav--scrolled` | JS-toggled: adds drop shadow on scroll |
| `.usrse-nav__container` | Max-width content wrapper |
| `.usrse-nav__brand` | Logo/brand link |
| `.usrse-nav__logo` | Logo `<img>` |
| `.usrse-nav__menu` | Desktop nav list |
| `.usrse-nav__item` | Nav list item (with positioning for dropdown) |
| `.usrse-nav__link` | Nav link or dropdown trigger |
| `.usrse-nav__link--has-dropdown` | Adds chevron icon |
| `.usrse-nav__dropdown` | Dropdown panel |
| `.usrse-nav__dropdown-item` | Dropdown link |
| `.usrse-nav__dropdown-item--active` | Active page item (teal bg) |
| `.usrse-nav__dropdown-separator` | Visual separator in dropdown |
| `.usrse-nav__burger` | Mobile hamburger button |
| `.usrse-nav__burger-line` | One of three hamburger lines |
| `.usrse-nav__mobile-menu` | Mobile menu panel (teal gradient) |
| `.usrse-nav__mobile-menu--open` | Open state (JS toggled) |
| `.usrse-nav__mobile-link` | Mobile primary link |
| `.usrse-nav__mobile-sublink` | Mobile nested link |
| `.usrse-nav-sidebar` | Section sidebar navigation |
| `.usrse-nav-sidebar__label` | Sidebar section heading |
| `.usrse-nav-sidebar__link` | Sidebar link |
| `.usrse-nav-sidebar__link--active` | Active sidebar link |
| `.usrse-back-to-top` | Fixed back-to-top button |

### Accessibility Requirements

- The skip link must be the first focusable element in the document. Place it before `<nav>`.
- Dropdown triggers must be `<button>` elements (not `<a>`). Manage `aria-expanded` with JavaScript.
- Mobile menu: toggle `aria-expanded` on the burger button and `aria-hidden` on the menu panel.
- Active navigation link: use `aria-current="page"` on the link, not just a CSS class.
- The `<nav>` element must have an `aria-label` — especially important when multiple `<nav>` elements exist on a page.
- Dropdown menus: implement keyboard behavior — `Escape` closes the dropdown, arrow keys move between items.

---

## Hero

**File:** `components/hero.css`  
**Tokens:** `--hero-*` in `tokens/components.css`

### Purpose

Full-width banner section at the top of a page. The primary variant matches the production us-rse.org hero: solid teal background with purple title text. This color combination — purple text on teal — is the defining visual identity of US-RSE and must be preserved on primary hero sections.

### Primary Hero (production-matched)

```html
<section class="usrse-hero usrse-hero--primary" aria-label="Page hero">
  <div class="usrse-hero__container">
    <div class="usrse-hero__content">
      <span class="usrse-hero__eyebrow">Welcome to US-RSE</span>
      <h1 class="usrse-hero__title">
        United States Research Software Engineer Association
      </h1>
      <p class="usrse-hero__subtitle">
        Supporting the growing community of research software engineers.
      </p>
      <p class="usrse-hero__body">
        We advocate for RSEs at every career stage, connect practitioners, and work to advance the RSE profession across academic, government, and industry research settings.
      </p>
      <div class="usrse-hero__cta-group">
        <a href="/join" class="usrse-button usrse-button--accent usrse-button--lg">Join US-RSE</a>
        <a href="/about" class="usrse-button usrse-button--ghost">Learn More</a>
      </div>
    </div>
  </div>
</section>
```

### Gradient Hero (teal-to-purple)

For conference banners, campaign pages, or featured announcements. The title switches to white because purple text on a teal-to-purple gradient loses contrast at the purple edge.

```html
<section class="usrse-hero usrse-hero--gradient">
  <div class="usrse-hero__container">
    <div class="usrse-hero__content usrse-hero--centered">
      <span class="usrse-hero__eyebrow">US-RSE Annual Conference</span>
      <h1 class="usrse-hero__title">US-RSE'25</h1>
      <p class="usrse-hero__subtitle">Philadelphia, Pennsylvania — October 2025</p>
      <div class="usrse-hero__cta-group">
        <a href="/register" class="usrse-button usrse-button--accent usrse-button--lg">Register</a>
        <a href="/program" class="usrse-button usrse-button--ghost">View Program</a>
      </div>
    </div>
  </div>
</section>
```

### Subtle Hero (light teal, dark text)

For secondary pages where a full-intensity teal background would compete with page content.

```html
<section class="usrse-hero usrse-hero--subtle usrse-hero--sm">
  <div class="usrse-hero__container">
    <div class="usrse-hero__content">
      <span class="usrse-hero__eyebrow">Resources</span>
      <h1 class="usrse-hero__title">Career Resources for RSEs</h1>
      <p class="usrse-hero__subtitle">Guides, templates, and community knowledge for every career stage.</p>
    </div>
  </div>
</section>
```

### Centered Hero

```html
<section class="usrse-hero usrse-hero--primary usrse-hero--centered">
  <div class="usrse-hero__container">
    <div class="usrse-hero__content">
      <h1 class="usrse-hero__title">Join the US-RSE Community</h1>
      <p class="usrse-hero__subtitle">Membership is free and open to everyone.</p>
      <div class="usrse-hero__cta-group">
        <a href="/join" class="usrse-button usrse-button--accent usrse-button--lg">Become a Member</a>
      </div>
    </div>
  </div>
</section>
```

### Split Hero (text + image)

```html
<section class="usrse-hero usrse-hero--primary usrse-hero--split">
  <div class="usrse-hero__content">
    <span class="usrse-hero__eyebrow">About US-RSE</span>
    <h1 class="usrse-hero__title">Who We Are</h1>
    <p class="usrse-hero__subtitle">
      A growing community of software professionals in research settings.
    </p>
    <div class="usrse-hero__cta-group">
      <a href="/about" class="usrse-button usrse-button--accent">Our Mission</a>
    </div>
  </div>
  <div class="usrse-hero__image-wrap">
    <img
      class="usrse-hero__image"
      src="/images/community.jpg"
      alt="US-RSE members at a community meetup"
      width="600"
      height="400"
    >
  </div>
</section>
```

### Size Variants

```html
<!-- Small — compact vertical padding (section-md: 64px) -->
<section class="usrse-hero usrse-hero--primary usrse-hero--sm">…</section>

<!-- Medium (default — section-lg: 96px) -->
<section class="usrse-hero usrse-hero--primary">…</section>

<!-- Large — 1.5× the default padding -->
<section class="usrse-hero usrse-hero--primary usrse-hero--lg">…</section>
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-hero` | Base hero |
| `.usrse-hero--primary` | Solid teal background, purple title |
| `.usrse-hero--gradient` | Teal-to-purple gradient, white title |
| `.usrse-hero--subtle` | Light teal bg, dark text |
| `.usrse-hero--sm` | Compact padding |
| `.usrse-hero--lg` | Generous padding |
| `.usrse-hero--centered` | Center-aligned content |
| `.usrse-hero--split` | Two-column text + image layout |
| `.usrse-hero__container` | Max-width constraint |
| `.usrse-hero__content` | Content column (max-width 52rem) |
| `.usrse-hero__eyebrow` | Small caps label above title |
| `.usrse-hero__title` | Main heading (display-xl, fluid) |
| `.usrse-hero__subtitle` | Subtitle (xl size, lighter weight) |
| `.usrse-hero__body` | Supporting body text |
| `.usrse-hero__cta-group` | Button row |
| `.usrse-hero__image-wrap` | Image column wrapper |
| `.usrse-hero__image` | Image element |

### Accessibility Requirements

- Use `<section>` with a descriptive `aria-label` (not `<div>`) for the hero wrapper.
- The hero title should always be `<h1>` — it is the main page heading.
- Images in the hero must have descriptive `alt` text. Decorative background images should be CSS `background-image`, not `<img>`.
- CTA buttons: provide context in the button text. "Join US-RSE" is better than "Join Now" when there is no surrounding context for screen reader users navigating by landmarks.
- The ghost button on colored backgrounds uses a semi-transparent white border — verify it still meets 3:1 contrast for UI components.

---

## Badge and Tag

**File:** `components/badge.css`  
**Tokens:** `--badge-*`, `--tag-*` in `tokens/components.css`

### Purpose

**Badges** are filled pill-shaped labels. Use for: status indicators (Active, Pending, Closed), numeric counts (3 new), category identifiers. Badges are informational — they do not need to be interactive.

**Tags** are outlined rectangular labels. Use for: skill categories, topic filters, content classifications. Tags can be removable (selected filter chips) or interactive (toggle filters).

### All Badge Variants

```html
<span class="usrse-badge usrse-badge--primary">New</span>
<span class="usrse-badge usrse-badge--accent">Featured</span>
<span class="usrse-badge usrse-badge--success">Active</span>
<span class="usrse-badge usrse-badge--warning">Pending</span>
<span class="usrse-badge usrse-badge--danger">Closed</span>
<span class="usrse-badge usrse-badge--info">Upcoming</span>
<span class="usrse-badge usrse-badge--neutral">Draft</span>
```

### Badge with Dot (status indicator)

```html
<span class="usrse-badge usrse-badge--success">
  <span class="usrse-badge__dot" aria-hidden="true"></span>
  Online
</span>

<span class="usrse-badge usrse-badge--neutral">
  <span class="usrse-badge__dot" aria-hidden="true"></span>
  Offline
</span>
```

### Badge with Count

```html
<!-- Inside a heading or title context -->
<h3>
  Working Groups
  <span class="usrse-badge usrse-badge--neutral" aria-label="12 working groups">12</span>
</h3>
```

### All Tag Variants

```html
<span class="usrse-tag usrse-tag--primary">Python</span>
<span class="usrse-tag usrse-tag--accent">HPC</span>
<span class="usrse-tag usrse-tag--neutral">Data Science</span>
```

### Removable Tag

The remove button must have `aria-label="Remove [tag name]"`.

```html
<span class="usrse-tag usrse-tag--primary usrse-tag--removable">
  Python
  <button class="usrse-tag__remove" aria-label="Remove Python tag" type="button"></button>
</span>

<span class="usrse-tag usrse-tag--neutral usrse-tag--removable">
  Machine Learning
  <button class="usrse-tag__remove" aria-label="Remove Machine Learning tag" type="button"></button>
</span>
```

### Interactive Tag (filter chip / toggle)

```html
<!-- Unselected -->
<button class="usrse-tag usrse-tag--neutral usrse-tag--interactive" type="button" aria-pressed="false">
  Python
</button>

<!-- Selected (aria-pressed="true" triggers CSS selected state) -->
<button class="usrse-tag usrse-tag--primary usrse-tag--interactive" type="button" aria-pressed="true">
  HPC
</button>
```

### Groups

```html
<!-- Badge group -->
<div class="usrse-badge-group" aria-label="Event status">
  <span class="usrse-badge usrse-badge--success">Registration Open</span>
  <span class="usrse-badge usrse-badge--info">Virtual Option</span>
  <span class="usrse-badge usrse-badge--accent">Featured</span>
</div>

<!-- Tag group (skills list) -->
<div class="usrse-tag-group" aria-label="Required skills">
  <span class="usrse-tag usrse-tag--neutral">Python</span>
  <span class="usrse-tag usrse-tag--neutral">Fortran</span>
  <span class="usrse-tag usrse-tag--neutral">MPI</span>
  <span class="usrse-tag usrse-tag--neutral">CUDA</span>
</div>

<!-- Tight group -->
<div class="usrse-tag-group usrse-tag-group--tight">…</div>
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-badge` | Base badge (pill, filled) |
| `.usrse-badge--primary` | Teal fill |
| `.usrse-badge--accent` | Purple fill |
| `.usrse-badge--success` | Green fill |
| `.usrse-badge--warning` | Amber fill (dark text) |
| `.usrse-badge--danger` | Red fill |
| `.usrse-badge--info` | Blue fill |
| `.usrse-badge--neutral` | Gray fill |
| `.usrse-badge__dot` | Status dot inside badge |
| `.usrse-badge__icon` | SVG icon inside badge |
| `.usrse-badge-group` | Wrapping badge row |
| `.usrse-badge-group--tight` | Compact badge row |
| `.usrse-tag` | Base tag (outlined, rectangular) |
| `.usrse-tag--primary` | Teal outline |
| `.usrse-tag--accent` | Purple outline |
| `.usrse-tag--neutral` | Gray outline |
| `.usrse-tag--removable` | Tag with close button |
| `.usrse-tag--interactive` | Clickable toggle tag |
| `.usrse-tag--selected` | Selected state |
| `.usrse-tag__remove` | Close button inside removable tag |
| `.usrse-tag-group` | Wrapping tag row |
| `.usrse-tag-group--tight` | Compact tag row |

### Accessibility Requirements

- Badges are usually decorative — ensure the surrounding context communicates the same information in text.
- Status badges: if the badge is the only indicator of status, add `aria-label` with explicit context. Example: `<span class="usrse-badge usrse-badge--success" aria-label="Event status: Active">Active</span>`.
- Badge dots: mark as `aria-hidden="true"` — the text label communicates the meaning.
- Removable tags: the remove button must have `aria-label="Remove [tag name]"` — the CSS `×` character is not readable by screen readers.
- Interactive tags: use `<button>` elements and toggle `aria-pressed="true"/"false"` with JavaScript. Never use `<div>` or `<span>` for interactive tags.
- Tag groups used as filter controls: wrap in a `<fieldset>` with a `<legend>` describing what is being filtered.

---

## Alert

**File:** `components/alert.css`  
**Tokens:** `--alert-*` in `tokens/components.css`

### Purpose

Status messages, error notifications, informational banners, and form-level validation summaries. Alerts communicate the result of an action or the state of a system condition.

Choose `role="alert"` with `aria-live="assertive"` for errors and critical messages. Use `role="status"` with `aria-live="polite"` for success and informational messages.

### All Variants

```html
<div class="usrse-alert usrse-alert--success" role="status" aria-live="polite">
  <div class="usrse-alert__content">
    <p class="usrse-alert__body">Your registration has been confirmed.</p>
  </div>
</div>

<div class="usrse-alert usrse-alert--warning" role="status" aria-live="polite">
  <div class="usrse-alert__content">
    <p class="usrse-alert__body">Registration closes in 48 hours.</p>
  </div>
</div>

<div class="usrse-alert usrse-alert--danger" role="alert" aria-live="assertive">
  <div class="usrse-alert__content">
    <p class="usrse-alert__body">Your session has expired. Please log in again.</p>
  </div>
</div>

<div class="usrse-alert usrse-alert--info" role="status" aria-live="polite">
  <div class="usrse-alert__content">
    <p class="usrse-alert__body">Working group applications open on March 1.</p>
  </div>
</div>

<div class="usrse-alert usrse-alert--neutral">
  <div class="usrse-alert__content">
    <p class="usrse-alert__body">This page is archived. Some links may no longer work.</p>
  </div>
</div>
```

### Alert with Title

```html
<div class="usrse-alert usrse-alert--danger" role="alert" aria-live="assertive">
  <div class="usrse-alert__content">
    <p class="usrse-alert__title">Form submission failed</p>
    <p class="usrse-alert__body">
      Please correct the errors below and try again. Your data has not been lost.
    </p>
  </div>
</div>
```

### Alert with Icon

Insert a 20×20 SVG in the icon slot. The icon is decorative (`aria-hidden="true"`).

```html
<div class="usrse-alert usrse-alert--success" role="status" aria-live="polite">
  <div class="usrse-alert__icon" aria-hidden="true">
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clip-rule="evenodd"/>
    </svg>
  </div>
  <div class="usrse-alert__content">
    <p class="usrse-alert__body">Member profile updated successfully.</p>
  </div>
</div>
```

### Dismissible Alert

JavaScript sets `data-dismissed="true"` to trigger the collapse animation, then removes the element from the DOM after the animation completes.

```html
<div class="usrse-alert usrse-alert--info" role="status" aria-live="polite" id="banner-notice">
  <div class="usrse-alert__content">
    <p class="usrse-alert__title">US-RSE'25 CFP is now open</p>
    <p class="usrse-alert__body">
      Submit your talk, workshop, or tutorial proposal by May 1.
      <a href="/cfp">Submit a proposal</a>
    </p>
  </div>
  <button
    class="usrse-alert__close"
    aria-label="Dismiss this notice"
    onclick="
      this.closest('.usrse-alert').dataset.dismissed = 'true';
      setTimeout(() => this.closest('.usrse-alert').remove(), 300);
    "
  ></button>
</div>
```

### Alert Stack

Multiple alerts stacked with consistent gap:

```html
<div class="usrse-alert-stack" role="status" aria-live="polite" aria-label="Form validation errors">
  <div class="usrse-alert usrse-alert--danger usrse-alert--inline">
    <div class="usrse-alert__content">
      <p class="usrse-alert__body">Email address is required.</p>
    </div>
  </div>
  <div class="usrse-alert usrse-alert--danger usrse-alert--inline">
    <div class="usrse-alert__content">
      <p class="usrse-alert__body">Institution name must be at least 3 characters.</p>
    </div>
  </div>
</div>
```

### Inline Alert (form-level validation banner)

```html
<!-- At the top of a form after a failed submission -->
<div class="usrse-alert usrse-alert--danger usrse-alert--inline" role="alert" aria-live="assertive">
  <div class="usrse-alert__content">
    <p class="usrse-alert__body">3 errors found. Correct the fields highlighted below.</p>
  </div>
</div>
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-alert` | Base alert (left border accent) |
| `.usrse-alert--success` | Green variant |
| `.usrse-alert--warning` | Amber variant |
| `.usrse-alert--danger` | Red variant |
| `.usrse-alert--info` | Blue variant |
| `.usrse-alert--neutral` | Gray variant |
| `.usrse-alert--inline` | Compact form-level alert |
| `.usrse-alert__icon` | Icon slot (20×20) |
| `.usrse-alert__content` | Text content area |
| `.usrse-alert__title` | Bold heading line |
| `.usrse-alert__body` | Main message text |
| `.usrse-alert__close` | Dismiss button |
| `.usrse-alert-stack` | Vertical stack of alerts |

### Accessibility Requirements

- `role="alert"` + `aria-live="assertive"`: for errors and critical failures. The browser immediately announces this to screen readers.
- `role="status"` + `aria-live="polite"`: for success and informational messages. Announced at the next pause in speech.
- Dismissible alerts: the close button must have a descriptive `aria-label` ("Dismiss this notice", not "Close").
- Never rely on color alone to communicate status. The text content must convey the meaning independently.
- Alert links: inherit the alert's text color — they are always accessible by the alert variant's contrast specifications.

---

## Code

**File:** `components/code.css`  
**Tokens:** `--code-*` in `tokens/components.css`

### Purpose

Code is a first-class UI element for Research Software Engineers. Inline code appears within prose. Block code is for multi-line examples, terminal output, configuration files, and scientific computation snippets.

Production behavior is matched precisely: inline code uses a light gray background with red text, matching the us-rse.org rouge highlighter output.

### Inline Code

The base style applies automatically to `:not(pre) > code` so standard Markdown-rendered code is styled without adding classes.

```html
<p>Run <code>pixi run check</code> before submitting a pull request.</p>
<p>The <code>--color-brand-primary</code> token resolves to <code>#188eac</code> in light mode.</p>

<!-- Explicit class for non-prose contexts -->
<span class="usrse-code">git commit -m "Fix token hierarchy"</span>
```

### Code Block — Standard

```html
<div class="usrse-code-block">
  <div class="usrse-code-block__header">
    <span class="usrse-code-block__lang">python</span>
    <button class="usrse-code-block__copy" aria-label="Copy code to clipboard">
      Copy
    </button>
  </div>
  <pre><code>import numpy as np

def normalize(data: np.ndarray) -> np.ndarray:
    """Normalize data to the range [0, 1]."""
    return (data - data.min()) / (data.max() - data.min())

result = normalize(np.array([1, 2, 3, 4, 5]))
print(result)  # [0.   0.25 0.5  0.75 1.  ]</code></pre>
</div>
```

### Code Block — Without Header

```html
<div class="usrse-code-block usrse-code-block--bare">
  <pre><code>pixi run check</code></pre>
</div>
```

### Code Block — Shell / Terminal

Darker background, green prompt color.

```html
<div class="usrse-code-block usrse-code-block--shell">
  <div class="usrse-code-block__header">
    <span class="usrse-code-block__lang">bash</span>
  </div>
  <pre><code><span class="usrse-token-prompt">$ </span>pixi install
<span class="usrse-token-prompt">$ </span>pixi run build
<span class="usrse-token-prompt">$ </span>pixi run check</code></pre>
</div>
```

### Code Block — Line Numbers

```html
<div class="usrse-code-block usrse-code-block--line-numbers">
  <div class="usrse-code-block__header">
    <span class="usrse-code-block__lang">fortran</span>
  </div>
  <pre><code><span class="usrse-code-line">program hello</span>
<span class="usrse-code-line">  implicit none</span>
<span class="usrse-code-line">  character(len=20) :: name</span>
<span class="usrse-code-line">  name = 'US-RSE'</span>
<span class="usrse-code-line">  print *, 'Hello, ', name</span>
<span class="usrse-code-line">end program hello</span></code></pre>
</div>
```

### Code Block — Scrollable (long files)

Max height is 28rem (448px). Content scrolls vertically.

```html
<div class="usrse-code-block usrse-code-block--scroll">
  <div class="usrse-code-block__header">
    <span class="usrse-code-block__lang">yaml</span>
  </div>
  <pre><code><!-- long configuration file content here --></code></pre>
</div>
```

### Code Block — Highlighted Lines

```html
<div class="usrse-code-block">
  <pre><code><span class="usrse-code-line">import os</span>
<span class="usrse-code-line usrse-code-line--highlight">SECRET_KEY = os.environ["SECRET_KEY"]  # Always from environment</span>
<span class="usrse-code-line">DEBUG = os.environ.get("DEBUG", "false").lower() == "true"</span></code></pre>
</div>
```

### Copy Button JavaScript (minimal)

```js
document.querySelectorAll('.usrse-code-block__copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const code = btn.closest('.usrse-code-block').querySelector('code').textContent;
    await navigator.clipboard.writeText(code);
    btn.dataset.copied = 'true';
    btn.textContent = 'Copied!';
    setTimeout(() => {
      delete btn.dataset.copied;
      btn.textContent = 'Copy';
    }, 2000);
  });
});
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-code` | Inline code (explicit class) |
| `:not(pre) > code` | Inline code (auto-matched) |
| `.usrse-code-block` | Block code outer wrapper |
| `.usrse-code-block--bare` | No header, rounded corners on pre |
| `.usrse-code-block--line-numbers` | Line numbering via CSS counter |
| `.usrse-code-block--shell` | Terminal dark green variant |
| `.usrse-code-block--scroll` | Fixed max-height, vertical scroll |
| `.usrse-code-block__header` | Language + copy button bar |
| `.usrse-code-block__lang` | Language label |
| `.usrse-code-block__copy` | Copy-to-clipboard button |
| `.usrse-pre` | Standalone `<pre>` |
| `.usrse-code-line` | Line for line numbering |
| `.usrse-code-line--highlight` | Highlighted line |
| `.usrse-token-keyword` | Keyword color |
| `.usrse-token-string` | String color |
| `.usrse-token-comment` | Comment color (italic) |
| `.usrse-token-number` | Number color |
| `.usrse-token-function` | Function/class color |
| `.usrse-token-operator` | Operator color |
| `.usrse-token-variable` | Variable/identifier color |
| `.usrse-token-prompt` | Shell prompt (non-selectable) |

---

## Table

**File:** `components/table.css`  
**Tokens:** `--table-*` in `tokens/components.css`

### Purpose

Structured data for technical audiences. Precision and legibility take priority over decoration. Always wrap the table in `.usrse-table-wrap` for horizontal scroll on narrow viewports.

### Basic Striped Table

```html
<div class="usrse-table-wrap">
  <table class="usrse-table usrse-table--striped">
    <caption>US-RSE Working Groups</caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Status</th>
        <th scope="col">Members</th>
        <th scope="col">Chair</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Education and Training</td>
        <td><span class="usrse-badge usrse-badge--success">Active</span></td>
        <td>42</td>
        <td>Jane Smith</td>
      </tr>
      <tr>
        <td>Diversity, Equity, and Inclusion</td>
        <td><span class="usrse-badge usrse-badge--success">Active</span></td>
        <td>38</td>
        <td>Alex Johnson</td>
      </tr>
      <tr>
        <td>Software Sustainability</td>
        <td><span class="usrse-badge usrse-badge--warning">Forming</span></td>
        <td>12</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Hoverable Table

```html
<div class="usrse-table-wrap">
  <table class="usrse-table usrse-table--striped usrse-table--hoverable">
    <thead>…</thead>
    <tbody>…</tbody>
  </table>
</div>
```

### Sortable Columns

JavaScript must toggle `aria-sort` when column headers are clicked.

```html
<div class="usrse-table-wrap">
  <table class="usrse-table usrse-table--striped">
    <thead>
      <tr>
        <th scope="col" aria-sort="ascending" tabindex="0">Name</th>
        <th scope="col" aria-sort="none" tabindex="0">Institution</th>
        <th scope="col" aria-sort="none" tabindex="0" class="usrse-table__col--numeric">Year Joined</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Chen</td>
        <td>Argonne National Laboratory</td>
        <td class="usrse-table__col--numeric">2021</td>
      </tr>
      <tr>
        <td>Bob Martinez</td>
        <td>University of Colorado</td>
        <td class="usrse-table__col--numeric">2019</td>
      </tr>
    </tbody>
  </table>
</div>
```

```js
// Minimal sort toggle example
document.querySelectorAll('.usrse-table th[aria-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const current = th.getAttribute('aria-sort');
    // Reset all
    th.closest('thead').querySelectorAll('th[aria-sort]').forEach(t => {
      t.setAttribute('aria-sort', 'none');
    });
    // Toggle clicked header
    th.setAttribute('aria-sort', current === 'ascending' ? 'descending' : 'ascending');
    // ... sort the table rows here ...
  });
});
```

### Row Selection (checkbox pattern)

```html
<div class="usrse-table-wrap">
  <table class="usrse-table usrse-table--hoverable" aria-label="Member list with selection">
    <thead>
      <tr>
        <th scope="col" class="usrse-table__col--checkbox">
          <label class="usrse-check">
            <input class="usrse-check__control" type="checkbox" id="select-all" aria-label="Select all members">
          </label>
        </th>
        <th scope="col">Name</th>
        <th scope="col">Institution</th>
      </tr>
    </thead>
    <tbody>
      <tr aria-selected="false">
        <td class="usrse-table__col--checkbox">
          <label class="usrse-check">
            <input class="usrse-check__control" type="checkbox" aria-label="Select Alice Chen">
          </label>
        </td>
        <td>Alice Chen</td>
        <td>Argonne National Laboratory</td>
      </tr>
      <tr aria-selected="true" class="usrse-table__row--selected">
        <td class="usrse-table__col--checkbox">
          <label class="usrse-check">
            <input class="usrse-check__control" type="checkbox" checked aria-label="Select Bob Martinez">
          </label>
        </td>
        <td>Bob Martinez</td>
        <td>University of Colorado</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Density Variants

```html
<!-- Compact — tighter rows for dense data displays -->
<table class="usrse-table usrse-table--compact">…</table>

<!-- Comfortable — more generous row spacing for readable lists -->
<table class="usrse-table usrse-table--comfortable">…</table>
```

### Table with Footer (summary row)

```html
<div class="usrse-table-wrap">
  <table class="usrse-table usrse-table--striped">
    <thead>
      <tr>
        <th scope="col">Working Group</th>
        <th scope="col" class="usrse-table__col--numeric">Members</th>
        <th scope="col" class="usrse-table__col--numeric">Events (2024)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Education and Training</td>
        <td class="usrse-table__col--numeric">42</td>
        <td class="usrse-table__col--numeric">8</td>
      </tr>
      <tr>
        <td>Diversity, Equity, and Inclusion</td>
        <td class="usrse-table__col--numeric">38</td>
        <td class="usrse-table__col--numeric">6</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>Total</td>
        <td class="usrse-table__col--numeric">80</td>
        <td class="usrse-table__col--numeric">14</td>
      </tr>
    </tfoot>
  </table>
</div>
```

### Cell Content Variants

```html
<td class="usrse-table__cell--mono">abc123f</td>        <!-- Monospace for hashes, IDs -->
<td class="usrse-table__cell--nowrap">March 12, 2025</td> <!-- Prevent date wrapping -->
<td class="usrse-table__cell--truncate" title="Long institution name">Very Long Institution…</td>
```

### Class Reference

| Class | Purpose |
|---|---|
| `.usrse-table-wrap` | Responsive scroll wrapper (required) |
| `.usrse-table` | Base table |
| `.usrse-table--striped` | Alternating row background |
| `.usrse-table--hoverable` | Row highlight on hover |
| `.usrse-table--compact` | Tighter padding |
| `.usrse-table--comfortable` | More generous padding |
| `.usrse-table__col--numeric` | Right-aligned numeric column |
| `.usrse-table__col--checkbox` | Checkbox selection column |
| `.usrse-table__row--selected` | Selected row state |
| `.usrse-table__cell--mono` | Monospace cell content |
| `.usrse-table__cell--nowrap` | Prevent cell text wrapping |
| `.usrse-table__cell--truncate` | Truncate with ellipsis |

### Accessibility Requirements

- Always include a `<caption>` or `aria-label` on the table. Screen reader users navigate tables by landmark and caption.
- Use `scope="col"` on column headers and `scope="row"` on row headers. Never use a data cell as a de facto header.
- Sortable columns: toggle `aria-sort="ascending|descending|none"` via JavaScript — the CSS indicators alone are not sufficient.
- Row selection: use `aria-selected="true|false"` on `<tr>` elements. The `aria-label` on each checkbox should identify the row ("Select Alice Chen", not just "Select").
- Numeric columns: right-alignment is set by `usrse-table__col--numeric`. Apply this class to both the `<th>` and corresponding `<td>` elements.
- Do not use color alone to communicate cell status. Pair semantic badge components with text labels.
