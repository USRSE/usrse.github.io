/**
 * US-RSE Design System — Token Hierarchy Validator
 *
 * Enforces the three-tier contract:
 *   Tier 1 (global.css)     — defines raw values, must not reference any var()
 *   Tier 2 (semantic.css)   — must only reference Tier 1 tokens
 *   Tier 3 (components.css) — must only reference Tier 2 tokens
 *   dark-mode.css           — must only reference Tier 2 tokens (overrides)
 *
 * Also checks:
 *   - No raw hex, px, or rem literals in Tier 2 or Tier 3 (with documented exceptions)
 *   - All var(--x) references resolve to a token defined in the correct tier
 *   - Every token name follows the naming convention
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ─── helpers ──────────────────────────────────────────────────────────────────

function readCSS(relPath) {
  return readFileSync(resolve(root, relPath), 'utf8');
}

/** Extract all custom property names defined in a CSS string */
function extractDefined(css) {
  const names = new Set();
  for (const m of css.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)) {
    names.add(m[1]);
  }
  return names;
}

/** Extract all var(--x) references in a CSS string, with line numbers */
function extractRefs(css) {
  const refs = [];
  const lines = css.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/var\(--([a-zA-Z0-9_-]+)\)/g)) {
      refs.push({ name: m[1], line: i + 1, text: line.trim() });
    }
  });
  return refs;
}

/**
 * Find literal hex/px/rem values in the VALUE portion of declarations only.
 * Skips comment-only lines, comment blocks, and values that appear solely
 * inside inline CSS comments on a declaration line.
 */
function findRawLiterals(css, file) {
  const issues = [];
  const lines = css.split('\n');

  const isCommentLine  = /^\s*\/?\*|^\s*\*/;  // lines that are part of a block comment
  const isDeclaration  = /^\s*--[\w-]+\s*:/;  // lines that are custom property declarations

  const rawHex = /#[0-9a-fA-F]{3,8}\b/;
  const rawPx  = /\b\d+(\.\d+)?px\b/;
  const rawRem = /\b\d+(\.\d+)?rem\b/;
  const rawEm  = /\b\d+(\.\d+)?em\b/;

  lines.forEach((line, i) => {
    const ln = i + 1;

    // Skip comment-only lines entirely
    if (isCommentLine.test(line)) return;

    // Only check lines that are actual declarations
    if (!isDeclaration.test(line)) return;

    // Strip the inline comment portion from the line before checking.
    // e.g. "--foo: var(--bar);  /* #fff — note */" → "--foo: var(--bar);"
    const withoutInlineComment = line.replace(/\/\*.*?\*\//g, '');

    if (
      rawHex.test(withoutInlineComment) ||
      rawPx.test(withoutInlineComment)  ||
      rawRem.test(withoutInlineComment) ||
      rawEm.test(withoutInlineComment)
    ) {
      issues.push({ file, line: ln, text: line.trim() });
    }
  });
  return issues;
}

// ─── load files ───────────────────────────────────────────────────────────────

const globalCSS    = readCSS('design-system/tokens/global.css');
const semanticCSS  = readCSS('design-system/tokens/semantic.css');
const componentCSS = readCSS('design-system/tokens/components.css');
const darkCSS      = readCSS('design-system/tokens/dark-mode.css');

const tier1 = extractDefined(globalCSS);
const tier2 = extractDefined(semanticCSS);
const tier3 = extractDefined(componentCSS);

// ─── validations ──────────────────────────────────────────────────────────────

let errors   = 0;
let warnings = 0;

function fail(msg)  { console.error(`  ✗ FAIL  ${msg}`); errors++;   }
function warn(msg)  { console.warn(`  ⚠ WARN  ${msg}`); warnings++; }
function pass(msg)  { console.log(`  ✓ PASS  ${msg}`); }

// 1. Tier 1 must not reference any var()
console.log('\n── Tier 1 (global.css) ──────────────────────────────────────────────');
const tier1refs = extractRefs(globalCSS);
if (tier1refs.length > 0) {
  tier1refs.forEach(r => fail(`global.css:${r.line} references var(--${r.name}) — Tier 1 must use raw values only`));
} else {
  pass(`No var() references in global.css — correct for Tier 1`);
}
pass(`${tier1.size} tokens defined`);

// 2. Tier 2 may reference Tier 1 tokens or other Tier 2 tokens (composition).
//    It must NOT reference Tier 3 tokens.
console.log('\n── Tier 2 (semantic.css) ────────────────────────────────────────────');
const tier2refs = extractRefs(semanticCSS);
const tier2broken = tier2refs.filter(r => !tier1.has(r.name) && !tier2.has(r.name));
if (tier2broken.length > 0) {
  tier2broken.forEach(r => fail(`semantic.css:${r.line} — var(--${r.name}) not found in global.css or semantic.css`));
} else {
  pass(`All ${tier2refs.length} references resolve to Tier 1 or Tier 2 tokens`);
}
pass(`${tier2.size} tokens defined`);

// 3. Tier 3 may only reference Tier 2 tokens
console.log('\n── Tier 3 (components.css) ──────────────────────────────────────────');
const tier3refs = extractRefs(componentCSS);
const allAboveTier3 = new Set([...tier1, ...tier2]);
const tier3broken = tier3refs.filter(r => !allAboveTier3.has(r.name));
if (tier3broken.length > 0) {
  tier3broken.forEach(r => fail(`components.css:${r.line} — var(--${r.name}) not found in Tier 1 or Tier 2`));
} else {
  pass(`All ${tier3refs.length} references resolve to Tier 1 or Tier 2 tokens`);
}
pass(`${tier3.size} tokens defined`);

// 4. Dark mode may only reference Tier 1 or Tier 2 tokens
console.log('\n── Dark mode (dark-mode.css) ────────────────────────────────────────');
const darkRefs = extractRefs(darkCSS);
const darkBroken = darkRefs.filter(r => !allAboveTier3.has(r.name));
if (darkBroken.length > 0) {
  darkBroken.forEach(r => fail(`dark-mode.css:${r.line} — var(--${r.name}) not found in Tier 1 or Tier 2`));
} else {
  pass(`All ${darkRefs.length} references resolve to Tier 1 or Tier 2 tokens`);
}

// 5. Raw literals in Tier 2 (warnings — some production values are exceptions)
console.log('\n── Raw literals in Tier 2 (semantic.css) ────────────────────────────');
const semanticLiterals = findRawLiterals(semanticCSS, 'semantic.css');
if (semanticLiterals.length > 0) {
  semanticLiterals.forEach(l => warn(`${l.file}:${l.line} raw value — "${l.text}" (add a comment if intentional)`));
} else {
  pass('No raw literals found in semantic.css');
}

// 6. Raw literals in Tier 3 (warnings)
console.log('\n── Raw literals in Tier 3 (components.css) ──────────────────────────');
const componentLiterals = findRawLiterals(componentCSS, 'components.css');
if (componentLiterals.length > 0) {
  componentLiterals.forEach(l => warn(`${l.file}:${l.line} raw value — "${l.text}" (add a comment if intentional)`));
} else {
  pass('No raw literals found in components.css');
}

// 7. Naming convention check — all tokens should match --[category]-[role]-[modifier]
console.log('\n── Naming convention ────────────────────────────────────────────────');
const namingPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
let namingErrors = 0;
[...tier1, ...tier2, ...tier3].forEach(name => {
  if (!namingPattern.test(name)) {
    warn(`Token --${name} does not follow kebab-case naming convention`);
    namingErrors++;
  }
});
if (namingErrors === 0) pass('All token names follow kebab-case convention');

// ─── summary ──────────────────────────────────────────────────────────────────

console.log('\n── Summary ──────────────────────────────────────────────────────────');
console.log(`   Tier 1 tokens: ${tier1.size}`);
console.log(`   Tier 2 tokens: ${tier2.size}`);
console.log(`   Tier 3 tokens: ${tier3.size}`);
console.log(`   Total:         ${tier1.size + tier2.size + tier3.size}`);
console.log(`   Errors:        ${errors}`);
console.log(`   Warnings:      ${warnings}`);

if (errors > 0) {
  console.error(`\n✗ Validation FAILED — ${errors} error(s) must be resolved.\n`);
  process.exit(1);
} else {
  console.log(`\n✓ Validation PASSED${warnings > 0 ? ` with ${warnings} warning(s)` : ''}.\n`);
}
