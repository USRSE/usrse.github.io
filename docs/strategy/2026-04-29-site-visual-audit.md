# US-RSE Website Visual & UX Audit

**Date:** 2026-04-29
**Scope:** 29-page React SPA across 7 sections
**Purpose:** Identify visual opportunities, content reorganization, and journey improvements

---

## Executive Summary

The site has strong typographic design, consistent layout patterns, and standout pages (Board, Staff, What is an RSE?). The critical gaps are: **15+ broken CTA links**, **no real photography** (all placeholders), **the homepage doesn't explain what an RSE is**, and **the calendar/newsletter/news links are non-functional**. The biggest strategic win is adding a "What is an RSE?" section to the homepage — it makes the site self-contained for first-time visitors.

---

## Critical Findings

### 1. Broken Links & Dead-End CTAs

At least 15 CTAs across the site point to non-functional hash anchors:

| Page | Broken Link | What It Should Do |
|------|-------------|-------------------|
| FinancialStatusPage | `#donate` | Link to donation form |
| SubmitJobPage | `#submit-form` | Embed Google Form |
| CalendarPage | `#subscribe` | Calendar subscribe link |
| ConferencePage | `#cfp`, `#review`, `#sponsor`, `#mailing-list` | External links to actual resources |
| NewslettersPage | All "Read this issue" → `#` | Link to actual newsletter content |
| NewsUpdatesPage | All "Read" → `#` | Link to actual articles |
| LeadershipMessagesPage | All "Read" → `#` | Link to actual messages |
| DEIPage | `/#wg` | Link to working groups page |
| SponsorsPage | `/#join` (labeled "Make a Contribution") | Link to donation, not join |

### 2. Homepage Assumes RSE Knowledge

The homepage never defines what a Research Software Engineer is. The explanation lives on `/about/what-is-an-rse` — two clicks away. The RSE Spectrum gradient bar and code example (two of the most distinctive visual elements on the site) are invisible from the homepage.

### 3. All Photography Is Placeholder

Six homepage photo slots, the Mission page hero, and six Conference page gallery slots are all `PhotoPlaceholder` components. Zero real community imagery exists on the site.

### 4. Job Board Is Buried

The JobBoard component is the last item on the homepage. Job listings are a primary reason people visit professional association websites, but visitors must scroll past 8 sections to find them.

---

## Visual Opportunities

### Photography — Highest Impact Locations

1. **Homepage PhotoStrip** — 6 slots between CommunityMap and WorkingGroups
2. **MissionPage hero** — ultrawide community photo at top
3. **ConferencePage gallery** — 6 slots for USRSE'23, '24, '25 photography
4. **CommunityAwardsPage** — photos of award recipients (Daniel S. Katz photo exists in board-of-directors/)
5. **CommunityCallsPage** — screenshot of an actual community call
6. **VolunteerPage** — community photo to break up text

### Data Visualization Opportunities

1. **FinancialStatusPage** — horizontal bar chart for fund allocation (data already in text)
2. **Homepage Stats** — member growth sparkline (20 → 4,000 over 8 years)
3. **OrganizationsPage** — map overlay of 34 institutional RSE groups (reuse MapLibre)
4. **BrowseJobsPage** — hiring trends mini-chart
5. **NewslettersPage** — timeline visualization of 50+ newsletters since 2019

### Interactive Elements

1. **CalendarPage** — Google Calendar embed (currently placeholder)
2. **WorkingGroupsPage** — inline expandable details per group (replace dead hash links)
3. **BrowseJobsPage** — search/filter (location, type, date)
4. **OrganizationsPage** — text search for the 34-institution directory
5. **ConferencePage** — countdown timer to Oct 19-21, 2026

### Video/Media

1. **EducationPage** — embed seminar recordings (described as available but not linked)
2. **CommunityCallsPage** — past call recordings
3. **WhatIsRSEPage** — "What is an RSE?" explainer video
4. **ConferencePage** — USRSE'25 highlight reel

---

## Content Reorganization Proposals

### Surface to Homepage

| Content | Currently On | Proposed Homepage Treatment |
|---------|-------------|---------------------------|
| "What is an RSE?" definition + spectrum bar | `/about/what-is-an-rse` | New section between Mission and Stats |
| Job Board | Last position on homepage | Move above Community section |
| Community Awards winners | `/community/awards` | Feature in Community section with names/photos |
| Newsletter subscribe CTA | `/news` (broken) | New subscribe block on homepage |

### Pages to Consolidate

| Proposal | Pages Affected | Rationale |
|----------|---------------|-----------|
| Merge News Updates + Leadership Messages | 2 → 1 page | Combined 9 items; single page with type filtering is more navigable |
| Eliminate MapPage (Resources) | 1 page removed | Homepage already has a working CommunityMap; this is a confusing "Coming Soon" duplicate |
| Resources Hub → sidebar nav only | 1 page simplified | It's a table of contents with no unique content |

### Missing Cross-References

- SponsorsPage ↔ Homepage LogoMarquee (marquee entries should link to sponsors page)
- OrganizationsPage ↔ Homepage CommunityMap (same data, different formats)
- WorkingGroupsPage ↔ VolunteerPage (volunteering described on both independently)
- ConferencePage ↔ SponsorsPage (conference sponsors not referenced on conference page)
- Community Awards ↔ Board/Staff pages (award winners who are/were board members)

---

## User Journey Analysis

### New Visitor: "What is this organization?"

**Current failure:** Homepage doesn't explain what an RSE is. Explanation is 2 clicks deep.
**Fix:** Add condensed "What is an RSE?" section to homepage with spectrum bar + definition.

### Potential Member: "Should I join?"

**Current failure:** No centralized benefits page. Job board buried at bottom. "Membership is free" info on Mission page, not homepage.
**Fix:** Create "Why Join" section or page consolidating: free membership, jobs, events, calls, groups, newsletter, conference, mentorship, funds. Surface job board higher.

### Active Member: "What's happening?"

**Current failure:** Calendar is placeholder. Newsletter links broken. News links broken. Working group "Learn more" links dead. No "what's new" feed.
**Fix:** Implement calendar embed. Fix all content links. Add "Recent activity" to homepage.

### Employer/Sponsor: "I want to hire RSEs / support the community"

**Current failure:** Job submission form doesn't exist. Sponsorship tiers not visible. Donation link broken.
**Fix:** Embed Google Form on SubmitJobPage. Add sponsorship info to ConferencePage/SponsorsPage. Fix donation link.

---

## Priority Recommendations

### Tier 1: Critical (High Impact, Low Effort)

| # | Recommendation | Impact | Effort | Files |
|---|---------------|--------|--------|-------|
| 1 | Fix all broken CTA links (15+) | 5 | 2 | Multiple pages |
| 2 | Replace PhotoStrip placeholders with real images | 5 | 2 | HomePage.tsx |
| 3 | Add "What is an RSE?" section to homepage | 5 | 3 | HomePage.tsx (new component) |
| 4 | Implement Google Calendar embed | 4 | 2 | CalendarPage.tsx |

### Tier 2: High Priority (High Impact, Medium Effort)

| # | Recommendation | Impact | Effort | Files |
|---|---------------|--------|--------|-------|
| 5 | Move JobBoard higher on homepage | 4 | 1 | HomePage.tsx |
| 6 | Add real photos to MissionPage + ConferencePage | 4 | 2 | MissionPage.tsx, ConferencePage.tsx |
| 7 | Create newsletter subscription mechanism | 4 | 3 | NewslettersPage.tsx, HomePage.tsx, Footer.tsx |
| 8 | Link newsletter archive to actual content | 4 | 3 | NewslettersPage.tsx, NewsUpdatesPage.tsx, LeadershipMessagesPage.tsx |
| 9 | Fix WorkingGroupsPage dead links (inline expand) | 3 | 3 | WorkingGroupsPage.tsx |

### Tier 3: Important (Medium Impact, Medium Effort)

| # | Recommendation | Impact | Effort | Files |
|---|---------------|--------|--------|-------|
| 10 | Add data viz to FinancialStatusPage | 3 | 3 | FinancialStatusPage.tsx |
| 11 | Add sponsor logos to SponsorsPage | 3 | 3 | SponsorsPage.tsx |
| 12 | Consolidate News Updates + Leadership Messages | 2 | 3 | Two pages → one |
| 13 | Add "Become a Sponsor" pathway | 3 | 3 | SponsorsPage.tsx or ConferencePage.tsx |
| 14 | Cross-reference OrganizationsPage with CommunityMap | 3 | 4 | OrganizationsPage.tsx, CommunityMap.tsx |
| 15 | Add growth sparkline to homepage Stats | 2 | 3 | Stats.tsx |

### Tier 4: Enhancements

| # | Recommendation | Impact | Effort | Files |
|---|---------------|--------|--------|-------|
| 16 | Create dedicated Join/Benefits page | 3 | 4 | New page |
| 17 | Add search/filter to OrganizationsPage | 2 | 3 | OrganizationsPage.tsx |
| 18 | Add search/filter to BrowseJobsPage | 2 | 3 | BrowseJobsPage.tsx |
| 19 | Embed seminar recordings on EducationPage | 2 | 3 | EducationPage.tsx |
| 20 | Eliminate MapPage, redirect to homepage map | 1 | 1 | MapPage.tsx, ResourcesLayout.tsx |
