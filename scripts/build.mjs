/**
 * US-RSE Design System — Token Bundler
 *
 * Resolves all @import chains in design-system/tokens/index.css and writes:
 *   dist/tokens.css     — full readable bundle
 *   dist/tokens.min.css — minified bundle for production
 *
 * Uses postcss + postcss-import for @import resolution and cssnano for minification.
 * No binary dependencies — works on all platforms.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import cssnano from 'cssnano';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = resolve(__dirname, '..');
const entry     = resolve(root, 'design-system/tokens/index.css');
const outDir    = resolve(root, 'dist');

mkdirSync(outDir, { recursive: true });

const css = readFileSync(entry, 'utf8');

// ── readable bundle ──────────────────────────────────────────────────────────
const bundled = await postcss([postcssImport()]).process(css, {
  from: entry,
  to:   resolve(outDir, 'tokens.css'),
});

writeFileSync(resolve(outDir, 'tokens.css'), bundled.css);
console.log(`✓ dist/tokens.css       (${(bundled.css.length / 1024).toFixed(1)} KB)`);

// ── minified bundle ──────────────────────────────────────────────────────────
const minified = await postcss([postcssImport(), cssnano({ preset: 'default' })]).process(css, {
  from: entry,
  to:   resolve(outDir, 'tokens.min.css'),
});

writeFileSync(resolve(outDir, 'tokens.min.css'), minified.css);
console.log(`✓ dist/tokens.min.css   (${(minified.css.length / 1024).toFixed(1)} KB)`);
