/**
 * US-RSE Design System — Token Watcher
 *
 * Watches tokens/ for changes and re-runs the build + validate
 * pipeline on every save. Uses Node.js built-in fs.watch (no extra deps).
 *
 * Usage: pixi run dev
 */

import { watch } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot   = resolve(__dirname, '..');
const repoRoot  = resolve(pkgRoot, '../..');
const tokensDir = resolve(pkgRoot, 'tokens');

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function runStep(label, cmd) {
  try {
    execSync(cmd, { cwd: repoRoot, stdio: 'pipe' });
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    return true;
  } catch (e) {
    console.error(`  \x1b[31m✗\x1b[0m ${label}`);
    if (e.stdout) process.stdout.write(e.stdout);
    if (e.stderr) process.stderr.write(e.stderr);
    return false;
  }
}

function rebuild(changedFile) {
  console.log(`\n\x1b[2m[${timestamp()}]\x1b[0m Changed: \x1b[36m${changedFile}\x1b[0m`);

  const buildOk    = runStep('build   — bundle tokens', 'pixi run build');
  const validateOk = runStep('validate — token hierarchy', 'pixi run validate');

  if (buildOk && validateOk) {
    console.log(`\x1b[32m  Ready.\x1b[0m`);
  }
}

// Debounce — editors write files multiple times per save
let debounceTimer;
function debounced(fn, delay = 120) {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedRebuild = debounced(rebuild);

console.log(`\n\x1b[1mUS-RSE Design System — Dev Watcher\x1b[0m`);
console.log(`Watching: ${tokensDir}`);
console.log(`Press Ctrl+C to stop.\n`);

// Run once on start
rebuild('initial build');

watch(tokensDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('.css')) {
    debouncedRebuild(filename);
  }
});
