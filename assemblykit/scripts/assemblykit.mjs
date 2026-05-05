#!/usr/bin/env node
/**
 * AssemblyKit CLI — Demo script
 *
 * This is a lightweight, demo-friendly script that simulates the
 * AssemblyKit "analyse → plan → manufacture → assemble" workflow.
 *
 * It reads the local component catalog and a feature manifest, then
 * prints a human-readable assembly plan to stdout.
 *
 * Usage:
 *   node assemblykit.mjs analyze <manifest-path>
 *   node assemblykit.mjs catalog
 *   node assemblykit.mjs help
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadYaml(filePath) {
  // Minimal YAML parser for the simple key: value / list structures we use.
  // Not a full spec — just enough for demo catalogs and manifests.
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  // For the demo, return raw text with a note.
  return readFileSync(filePath, 'utf8');
}

function header(text) {
  const line = '─'.repeat(text.length + 4);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${text}  │`);
  console.log(`└${line}┘`);
}

function section(title) {
  console.log(`\n  ${title}`);
  console.log(`  ${'─'.repeat(title.length)}`);
}

function indent(lines) {
  lines.forEach(l => console.log(`    ${l}`));
}

// ── Commands ──────────────────────────────────────────────────────────────────

function cmdHelp() {
  header('AssemblyKit CLI — Demo');
  console.log(`
  Commands:

    node assemblykit.mjs catalog
        List all components in the local catalog.

    node assemblykit.mjs analyze <manifest-path>
        Read an Assembly Manifest and print the build + manufacturing plan.

    node assemblykit.mjs help
        Show this help message.

  Principle: Reuse before manufacture.
  `);
}

function cmdCatalog() {
  header('Local Component Catalog');
  const raw = loadYaml(resolve(ROOT, 'catalog/local.components.yaml'));

  // Split into per-component blocks on "  - id:" boundaries.
  const blocks = raw.split(/\n  - id:/).slice(1);

  const components = blocks.map(block => {
    const id     = block.split('\n')[0].trim();                       // first token after "- id:"
    const kind   = (block.match(/\bkind:\s+(\S+)/)   || [])[1] ?? '—';
    const status = (block.match(/\bstatus:\s+(\S+)/) || [])[1] ?? '—';
    return { id, kind, status };
  });

  const existing = components.filter(c => c.status === 'existing');
  const missing  = components.filter(c => c.status === 'missing');

  section('Existing components (available for reuse)');
  existing.forEach(c =>
    console.log(`    ✓  ${c.id.padEnd(32)} kind: ${c.kind}`)
  );

  if (missing.length > 0) {
    section('Missing components (manufacturing targets)');
    missing.forEach(c =>
      console.log(`    ✦  ${c.id.padEnd(32)} kind: ${c.kind}`)
    );
  }

  console.log(`\n  ${existing.length} existing · ${missing.length} missing · ${components.length} total\n`);
}

function cmdAnalyze(manifestPath) {
  if (!manifestPath) {
    console.error('Usage: node assemblykit.mjs analyze <path-to-manifest.yaml>');
    process.exit(1);
  }

  const absPath = resolve(process.cwd(), manifestPath);
  const raw = loadYaml(absPath);

  header('AssemblyKit Analysis');

  // Top-level fields.
  const product   = (raw.match(/^product:\s+(.+)$/m)           || [])[1]?.trim() ?? 'Unknown';
  const createdAt = (raw.match(/^created_at:\s+"?(.+?)"?$/m)   || [])[1]?.trim() ?? '—';
  // request: is a block scalar; grab the first quoted/unquoted content line after it.
  const requestLine = (raw.match(/^request:\s*>?\s*\n\s+"?([^"\n]+)"?/m) || [])[1]?.trim()
                   ?? (raw.match(/^request:\s+"?([^"\n]+)"?$/m) || [])[1]?.trim()
                   ?? '—';

  section(`Product: ${product}`);
  indent([
    `Date    : ${createdAt}`,
    `Request : ${requestLine}`,
    `File    : ${absPath}`,
  ]);

  // required_components section ends at 'assembly:'.
  const reqSection = raw.split(/^assembly:/m)[0].split(/^required_components:/m)[1] || '';

  // Each component block starts with "  - id:"; parse id and decision.
  const componentBlocks = reqSection.split(/\n  - id:/).slice(1);
  const reusedIds = [];
  const mfrIds    = [];

  for (const block of componentBlocks) {
    const id       = block.split('\n')[0].trim();                        // first token after "- id:"
    const decision = (block.match(/\bdecision:\s+(\S+)/) || [])[1] ?? 'reuse';
    if (decision === 'manufacture') mfrIds.push(id);
    else                            reusedIds.push(id);
  }

  section('Reuse scan');
  reusedIds.forEach(id => console.log(`    ✓  REUSE        ${id}`));

  section('Manufacturing queue');
  if (mfrIds.length === 0) console.log('    (nothing to manufacture)');
  mfrIds.forEach(id => console.log(`    ✦  MANUFACTURE  ${id}`));

  // Assembly steps: between 'assembly:' and 'quality:'.
  const assemblySection = raw.split(/^quality:/m)[0].split(/^assembly:/m)[1] || '';
  const steps = [...assemblySection.matchAll(/- step:\s+(\d+)\s+\n\s+action:\s+(\S+)\s+\n\s+component:\s+(\S+)/g)];

  section('Assembly steps');
  if (steps.length === 0) {
    // Fallback: parse compact form  "  - step: N\n    action: X\n    component: Y"
    const compact = [...assemblySection.matchAll(/step:\s+(\d+)[\s\S]*?action:\s+(\S+)[\s\S]*?component:\s+(\S+)/g)];
    if (compact.length === 0) console.log('    (see manifest for assembly steps)');
    compact.forEach(m => console.log(`    ${m[1].padStart(2, '0')}. [${m[2]}]  ${m[3]}`));
  } else {
    steps.forEach(m => console.log(`    ${m[1].padStart(2, '0')}. [${m[2]}]  ${m[3]}`));
  }

  // Metrics — stop before registry_enhanced_plan.
  const metricsSection = raw.split(/^registry_enhanced_plan:/m)[0].split(/^metrics:/m)[1] || '';
  const reuseRatio = (metricsSection.match(/reuse_ratio:\s+"?(.+?)"?\s*$$/m) || [])[1]?.trim() ?? null;
  const total = reusedIds.length + mfrIds.length;

  section('Summary');
  console.log(`    Total components : ${total}`);
  console.log(`    Reused           : ${reusedIds.length}`);
  console.log(`    Manufactured     : ${mfrIds.length}`);
  console.log(`    Reuse ratio      : ${reuseRatio ?? (total ? ((reusedIds.length / total) * 100).toFixed(0) + '%' : '—')}`);

  // Registry-enhanced plan, if present.
  if (raw.includes('registry_enhanced_plan:')) {
    const regSection = raw.split(/^registry_enhanced_plan:/m)[1] || '';
    const regMetrics = regSection.split(/^  note:/m)[0].split(/^  metrics:/m)[1] || '';
    const regRatio   = (regMetrics.match(/reuse_ratio:\s+"?(.+?)"?$/m)      || [])[1]?.trim() ?? '—';
    const regMfr     = (regMetrics.match(/manufactured_count:\s+(\d+)/)     || [])[1]?.trim() ?? '—';
    console.log();
    console.log('    ── Registry-enhanced plan (future state) ──────────');
    console.log(`    Reuse ratio (with registry) : ${regRatio}`);
    console.log(`    Manufactured                : ${regMfr}`);
  }

  console.log();
}

// ── Entry point ───────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'catalog':
    cmdCatalog();
    break;
  case 'analyze':
    cmdAnalyze(args[0]);
    break;
  case 'help':
  case undefined:
    cmdHelp();
    break;
  default:
    console.error(`Unknown command: ${cmd}. Run "node assemblykit.mjs help".`);
    process.exit(1);
}
