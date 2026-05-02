# US-RSE Design Principles

These five principles are the foundation of every visual and interactive decision made in the US-RSE design system. They are not aspirations — they are constraints. When two design options are in conflict, these principles resolve the tie.

---

## 1. Community-First Clarity

> Every screen is a gathering place, not a billboard.

The purpose of the US-RSE website is to connect people — to each other, to resources, to opportunities, and to the broader mission. The design must always serve that connection before it serves aesthetics or organizational self-promotion. Information must be findable without effort, and the path from "I'm new here" to "I belong here" must be short.

**This means:**
- Navigation is predictable and consistently positioned across all pages
- Primary actions (join, attend, contribute) are always reachable within two interactions
- Content hierarchy is set by what the community needs most, not what leadership wants showcased
- Member-generated content (blog posts, working group pages, event recaps) receives the same visual weight as official content

**This does NOT mean:**
- That aesthetics are unimportant. Visual quality signals respect for the community's time and credibility.
- That every page must be a crowded directory. Curation is an act of hospitality.

---

## 2. Inclusive by Default

> Accessibility is not a feature. It is the baseline.

US-RSE's core commitment is to welcome everyone regardless of background, geography, or affiliation. The design system must make that commitment concrete and verifiable. Every component ships with WCAG 2.2 AA compliance. Keyboard navigation, screen reader support, and sufficient color contrast are required — not optional — for a component to be considered complete.

**This means:**
- All color combinations in the token system are verified to meet a 4.5:1 contrast ratio for normal text and 3:1 for large text (WCAG 2.2 AA)
- Interactive elements have visible focus states that are never suppressed with `outline: none` without a custom replacement
- Semantic HTML is the foundation; ARIA attributes supplement, never substitute for, proper markup
- Motion and animation are opt-in. Users with `prefers-reduced-motion` see no animation unless it is critical to comprehension.
- Forms are operable by keyboard alone, with clear error messages that do not rely solely on color

**This does NOT mean:**
- That every user experience must be identical across all assistive technologies. Equivalent access is the goal, not identical rendering.
- That accessible design is constrained or boring. Strong contrast ratios and clear hierarchy make interfaces more usable for everyone.

---

## 3. Technical Credibility

> The people we serve build the software behind scientific breakthroughs. The design should reflect that precision.

Research Software Engineers are highly technical, intellectually rigorous, and allergic to marketing language and visual noise. The design system must project competence, not showmanship. Visual decisions should feel deliberate and earned, not decorative. Code examples, data visualizations, and technical documentation should be first-class citizens of the layout system — never afterthoughts squeezed into generic blog templates.

**This means:**
- Typography is used to communicate hierarchy and meaning, not to signal effort through visual complexity
- Code blocks, terminal output, and technical notation are styled with the same care as prose
- Data density is respected — tables and structured content are legible and not over-padded
- Visual elements earn their place by carrying information, not by filling space

**This does NOT mean:**
- That warmth and personality are inappropriate. Technical credibility and approachability are not opposites.
- That the site should look like a paper preprint or a raw Git README. Professional polish is compatible with intellectual seriousness.

---

## 4. Transparent Consistency

> One token, one truth. No surprises in the interface.

A design system is a promise: that the button the user clicks on the homepage works and looks the same as the button on the job board. Consistency builds trust. It also builds speed — developers should be able to implement a new page feature without checking whether their spacing values match the rest of the site. The token system is the single source of truth, and components are the enforcers of that truth.

**This means:**
- All color values, spacing, typography, and radius decisions are defined in the three-tier token system and consumed from it — never hard-coded
- Component APIs have consistent prop names across atoms (`size`, `variant`, `disabled`) so that learning one component transfers to another
- New components are built from existing tokens before any new token is introduced
- Design decisions are documented where they are made — in the component file, in the token comment, in the principle that governs them

**This does NOT mean:**
- That every page must look identical. Contextual variation (hero sections, event listing pages, blog posts) is intentional. It must be expressed through the token system, not around it.
- That the system cannot evolve. Tokens can be added, deprecated, and replaced — but always with intention and documentation.

---

## 5. Warm Precision

> Rigorous enough to trust. Human enough to belong to.

US-RSE sits at the intersection of science and community — a rare combination that the design must honor. The visual language should feel like a well-run open-source project: structured, documented, reliable, and built by people who genuinely care. The teal and purple palette is not arbitrary — teal signals clarity and focus, purple signals creativity and depth. Together they mark a space that takes both the science and the people seriously.

**This means:**
- The brand palette is used with intention, not saturation. Color carries meaning, not just decoration.
- Typography combines a readable body face (Montserrat) with a structured heading face (Roboto) to balance approachability with authority
- White space is generous — it communicates respect for the reader's attention
- Microinteractions (hover states, focus rings, transitions) are subtle and purposeful, not performative

**This does NOT mean:**
- That the design should be cold, minimal, or sterile. Community warmth is a design value.
- That playfulness is off-limits. Event pages, spotlights, and celebration moments can and should feel energetic within the system.

---

## Using These Principles

These principles are decision-making tools, not decoration. When a design or engineering choice is unclear, test it against these five questions:

1. Does this serve the community's connection and discovery needs?
2. Can every member access this, regardless of ability or assistive technology?
3. Does this reflect the technical precision and intellectual seriousness our community deserves?
4. Does this use the token system consistently, or is it introducing one-off values?
5. Does this feel both rigorous and human — the right balance of precision and warmth?

If the answer to any of these questions is "no" or "I'm not sure," the design needs more work.
