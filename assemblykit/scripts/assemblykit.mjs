#!/usr/bin/env node
/**
 * AssemblyKit CLI
 *
 * Commands:
 *   explain                                     Print the AssemblyKit philosophy
 *   list                                        List local components by status
 *   registry                                    Show Verified Component Registry
 *   build [--with-registry] "<request>"         Analyse a feature request
 *   manufacture <component-id>                  Show manufacturing plan (or implemented details)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, '..');

// ── Colour codes ──────────────────────────────────────────────────────────────

const B = '\x1b[1m';   // bold
const D = '\x1b[2m';   // dim
const G = '\x1b[32m';  // green
const Y = '\x1b[33m';  // yellow
const C = '\x1b[36m';  // cyan
const R = '\x1b[0m';   // reset

// ── Layout helpers ────────────────────────────────────────────────────────────

function box(title) {
  const inner = `  ${title}  `;
  const bar   = '─'.repeat(inner.length);
  console.log(`\n┌${bar}┐`);
  console.log(`│${inner}│`);
  console.log(`└${bar}┘`);
}

function section(label, note = '') {
  const noteText = note ? `  ${D}${note}${R}` : '';
  console.log(`\n  ${B}${label}${R}${noteText}`);
  const bareLen = label.length + (note ? note.length + 2 : 0);
  console.log('  ' + '─'.repeat(Math.max(bareLen, 44)));
}

function kv(key, value, pad = 18) {
  console.log(`    ${D}${key.padEnd(pad)}${R}${value}`);
}

function rule() {
  console.log(`\n  ${'─'.repeat(66)}`);
}

// ── File helpers ──────────────────────────────────────────────────────────────

function readFile(rel) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`\n  File not found: ${abs}\n`);
    process.exit(1);
  }
  return readFileSync(abs, 'utf8');
}

// ── YAML parsers ──────────────────────────────────────────────────────────────

function parseComponents(yaml) {
  return yaml.split(/\n  - id:/).slice(1).map(block => {
    const id             = block.split('\n')[0].trim();
    const kind           = (block.match(/\bkind:\s+(\S+)/)               || [])[1] ?? '—';
    const status         = (block.match(/\bstatus:\s+(\S+)/)             || [])[1] ?? '—';
    const implementation = (block.match(/\bimplementation:\s+(\S+)/)     || [])[1] ?? null;
    const mfgTarget      = (block.match(/manufacturing_target:\s+(\S+)/) || [])[1] ?? null;

    // Description: collect block-scalar continuation lines (6-space indent) or inline value.
    let description = '';
    const di = block.indexOf('description:');
    if (di !== -1) {
      const after = block.slice(di);
      if (/^description:\s*>/.test(after)) {
        const contLines = [];
        for (const line of after.split('\n').slice(1)) {
          if (/^\s{6}/.test(line)) contLines.push(line.trim());
          else if (line.trim()) break;
        }
        description = contLines.join(' ');
      } else {
        description = (after.match(/^description:\s+(.+)/) || [])[1]?.trim() ?? '';
      }
    }

    return { id, kind, status, description, implementation, mfgTarget, raw: block };
  });
}

function parseInputs(block) {
  const sec = block.split('\n    outputs:')[0].split('\n    inputs:')[1] ?? '';
  if (!sec.trim() || sec.trim().startsWith('[]')) return [];
  return sec.split('      - name:').slice(1).map(item => {
    const name     = item.split('\n')[0].trim();
    const type     = (item.match(/type:\s+(.+)/)     || [])[1]?.trim() ?? '—';
    const required = !item.includes('required: false');
    const def      = (item.match(/default:\s+(\S+)/) || [])[1] ?? null;
    return { name, type, required, default: def };
  });
}

function parseOutputs(block) {
  const sec = block.split('\n    effects:')[0].split('\n    outputs:')[1] ?? '';
  return sec.split('      - name:').slice(1).map(item => {
    const name = item.split('\n')[0].trim();
    const type = (item.match(/type:\s+(.+)/) || [])[1]?.trim() ?? '—';
    return { name, type };
  });
}

function parseRegistryQuality(block) {
  const q = block.split('\n    composition_notes:')[0].split('\n    quality:')[1] ?? '';
  return {
    verification: (q.match(/verification:\s+(\S+)/)           || [])[1] ?? '—',
    tests:        (q.match(/tests:\s+(\d+)/)                   || [])[1] ?? '—',
    benchmark:    (q.match(/benchmark:\s+"?(.+?)"?\s*\n/)       || [])[1]?.trim() ?? '—',
    security:     (q.match(/security:\s+(\S+)/)                || [])[1] ?? '—',
  };
}

function parseLocalQuality(block) {
  const sec = block.split('\n    quality:')[1] ?? '';
  if (!sec.trim()) return null;
  return {
    tests:    (sec.match(/tests:\s+(\d+)/)     || [])[1] ?? null,
    testFile: (sec.match(/test_file:\s+(\S+)/) || [])[1] ?? null,
  };
}

function parseNotes(block) {
  const sec = block.split('\n    composition_notes:')[1] ?? '';
  return [...sec.matchAll(/- (.+)/g)].map(m => m[1].trim());
}

function parseManifestTests(yaml) {
  const sec = yaml.split(/^quality:/m)[1]?.split(/^metrics:/m)[0] ?? '';
  return [...sec.matchAll(/- id:\s+(\S+)/g)].map(m => m[1]);
}

// ── Commands ──────────────────────────────────────────────────────────────────

function cmdExplain() {
  box('AssemblyKit');

  console.log(`
  AssemblyKit separates ${B}manufacturing${R} from ${B}assembly${R}.

  Most AI tools receive a feature request and immediately generate code —
  even when large parts of the feature already exist in the codebase.

  AssemblyKit enforces a different order of operations:

    ${B}1.${R}  Identify what the feature needs.
    ${B}2.${R}  Search the ${C}local catalog${R} for existing components.
    ${B}3.${R}  Search the ${C}Verified Component Registry${R} for shared components.
    ${B}4.${R}  ${Y}Manufacture${R} only what cannot be found.
    ${B}5.${R}  ${G}Assemble${R} — wire the pieces together.

  Every manufactured component is catalogued.
  Over time, more features can be assembled entirely from existing parts.
  Registry components raise the floor — each one is one less thing to build.
`);

  rule();
  console.log(`  ${B}The best AI-generated code is the code it did not need to generate.${R}`);
  rule();
  console.log();
}

function cmdList() {
  box('AssemblyKit — Local Component Catalog');

  const components = parseComponents(readFile('catalog/local.components.yaml'));
  const existing   = components.filter(c => c.status === 'existing');
  const missing    = components.filter(c => c.status === 'missing');
  const idW        = Math.max(...components.map(c => c.id.length)) + 2;
  const kindW      = 8;

  section('Existing components', 'available for reuse');
  for (const c of existing) {
    console.log(`  ${G}✓${R}  ${B}${c.id.padEnd(idW)}${R}  ${D}${c.kind.padEnd(kindW)}${R}  ${c.description}`);
  }

  if (missing.length > 0) {
    section('Missing components', 'manufacturing targets');
    for (const c of missing) {
      console.log(`  ${Y}✦${R}  ${B}${c.id.padEnd(idW)}${R}  ${D}${c.kind.padEnd(kindW)}${R}  ${c.description}`);
    }
  }

  console.log();
  const missingNote = missing.length > 0 ? `  ·  ${Y}${missing.length} manufacturing target${missing.length > 1 ? 's' : ''}${R}` : '';
  console.log(`  ${G}${existing.length} components available for reuse${R}${missingNote}\n`);
}

function cmdRegistry() {
  box('AssemblyKit — Verified Component Registry');

  const components = parseComponents(readFile('catalog/registry.components.yaml'));

  section('Registry components', 'quality-gated and verified');

  for (const c of components) {
    console.log(`\n  ${G}✓${R}  ${B}${c.id}${R}  ${D}${c.kind}${R}`);
    console.log(`\n     ${c.description}`);

    const q = parseRegistryQuality(c.raw);
    console.log(`\n     ${B}Quality${R}`);
    console.log(`     ${D}Verification  ${R}${q.verification}`);
    console.log(`     ${D}Tests         ${R}${q.tests}`);
    console.log(`     ${D}Benchmark     ${R}${q.benchmark}`);
    console.log(`     ${D}Security      ${R}${q.security}`);

    const notes = parseNotes(c.raw);
    if (notes.length > 0) {
      console.log(`\n     ${B}Composition notes${R}`);
      notes.forEach(n => console.log(`     ${D}·${R}  ${n}`));
    }
    console.log();
  }
}

function cmdBuild(args) {
  const withRegistry = args.includes('--with-registry');
  const request      = args.filter(a => !a.startsWith('-')).join(' ').replace(/^"|"$/g, '') ||
                       'Add a dashboard card showing companies with more than 10 employees and no updates in 30 days.';

  box('AssemblyKit — Build Analysis');

  section('Feature request');
  console.log(`\n  "${request}"\n`);

  section('Principle');
  console.log(`\n  ${C}Reuse before manufacture.${R}\n`);

  // ── Local component search
  section('Component search', 'local catalog');
  const found = [
    { id: 'company.list',              note: 'returns all companies' },
    { id: 'employee.count_by_company', note: 'returns employee count per company' },
    { id: 'dashboard.card',            note: 'renders a labelled stat card' },
  ];
  const missing = [
    { id: 'company.stale_filter', note: 'no component combines staleness + employee count' },
  ];
  const idW = Math.max(...[...found, ...missing].map(c => c.id.length)) + 2;

  console.log();
  for (const c of found) {
    console.log(`  ${G}✓  Reuse${R}       ${B}${c.id.padEnd(idW)}${R}  ${D}local  ·  ${c.note}${R}`);
  }
  for (const c of missing) {
    console.log(`  ${Y}✦  Manufacture${R}  ${B}${c.id.padEnd(idW)}${R}  ${Y}missing${R}  ${D}${c.note}${R}`);
  }

  if (withRegistry) {
    // ── Registry search
    section('Registry search', 'Verified Component Registry');
    console.log();
    console.log(`  ${G}✓  Reuse${R}       ${B}generic.stale_record_detector${R}  ${D}registry${R}`);
    console.log(`              ${D}verified  ·  24 tests  ·  p95 < 10ms  ·  security reviewed${R}`);
    console.log(`              Covers timestamp filtering. Employee-count threshold applied at assembly.`);

    section('Assembly decision', 'with Verified Component Registry');
    console.log();
    kv('Reuse',       `${G}4${R}  (company.list, employee.count_by_company, dashboard.card, generic.stale_record_detector)`, 14);
    kv('Manufacture', `0`, 14);
    kv('Reuse ratio', `${G}${B}100%${R}`, 14);

    console.log(`\n  ${D}Note: in this MVP the registry plan is illustrative. The implemented app`);
    console.log(`  uses the locally manufactured component (app/Services/StaleCompanyFilter.php).${R}\n`);

  } else {
    section('Assembly decision');
    console.log();
    kv('Reuse',       `3  (company.list, employee.count_by_company, dashboard.card)`, 14);
    kv('Manufacture', `${Y}1${R}  (company.stale_filter)`, 14);
    kv('Reuse ratio', `${B}75%${R}`, 14);

    section('Assembly Manifest');
    console.log();
    console.log(`  ${D}→${R}  assemblykit/manifests/stale-company-dashboard.manifest.yaml`);
    console.log(`  ${D}→${R}  assemblykit/generated/build-plan.md`);
    console.log(`  ${D}→${R}  assemblykit/generated/manufacturing-plan.md\n`);
  }
}

function cmdManufacture(componentId) {
  if (!componentId) {
    console.error(`\n  Usage: assemblykit manufacture <component-id>\n`);
    process.exit(1);
  }

  const components = parseComponents(readFile('catalog/local.components.yaml'));
  const component  = components.find(c => c.id === componentId);

  if (!component) {
    console.error(`\n  Component not found in local catalog: ${componentId}`);
    console.error(`  Run "assemblykit list" to see available components.\n`);
    process.exit(1);
  }

  if (component.status === 'existing') {
    box(`AssemblyKit — Component: ${componentId}`);

    section('Status');
    console.log(`\n  ${G}✓${R}  ${B}${componentId}${R}  is implemented and catalogued.\n`);
    kv('Kind',   component.kind);
    if (component.implementation) kv('Implementation', `${C}${component.implementation}${R}`);

    const q = parseLocalQuality(component.raw);
    if (q?.tests) {
      const fileNote = q.testFile ? `  ${D}${q.testFile}${R}` : '';
      kv('Tests', `${q.tests}${fileNote}`);
    }

    if (component.description) {
      console.log();
      console.log(`    ${component.description}`);
    }

    console.log(`\n  ${G}No manufacturing needed — available for Reuse.${R}\n`);
    return;
  }

  box(`AssemblyKit — Manufacturing Plan: ${componentId}`);

  section('Component');
  console.log();
  kv('Status', `${Y}missing${R}  —  scheduled for Manufacture`);
  kv('Kind',   component.kind);
  if (component.mfgTarget) kv('Target file', `${C}${component.mfgTarget}${R}`);
  if (component.description) {
    console.log();
    console.log(`    ${component.description}`);
  }

  const inputs  = parseInputs(component.raw);
  const outputs = parseOutputs(component.raw);

  section('Contract');

  if (inputs.length > 0) {
    console.log(`\n    ${B}Inputs${R}`);
    const nameW = Math.max(...inputs.map(i => i.name.length)) + 2;
    const typeW = Math.max(...inputs.map(i => i.type.length)) + 2;
    for (const inp of inputs) {
      const req = inp.required
        ? 'required'
        : `optional${inp.default !== null ? `  (default: ${inp.default})` : ''}`;
      console.log(`    ${inp.name.padEnd(nameW)}  ${D}${inp.type.padEnd(typeW)}${R}  ${D}${req}${R}`);
    }
  }

  if (outputs.length > 0) {
    console.log(`\n    ${B}Output${R}`);
    for (const out of outputs) {
      console.log(`    ${out.name}  ${D}${out.type}${R}`);
    }
  }

  console.log(`\n    ${B}Effects${R}`);
  console.log(`    ${D}reads    none  (operates on an already-loaded collection)${R}`);
  console.log(`    ${D}writes   none${R}`);
  console.log(`    ${D}external none${R}`);

  section('Required tests');
  let tests = [];
  try {
    const manifest = readFile('manifests/stale-company-dashboard.manifest.yaml');
    tests = parseManifestTests(manifest);
  } catch (_) { /* manifest may not exist */ }

  if (tests.length === 0) {
    console.log(`\n    ${D}(no tests defined in Assembly Manifest)${R}`);
  } else {
    console.log();
    tests.forEach(t => console.log(`  ${Y}○${R}  ${t}`));
  }

  console.log();
}

function cmdUsage() {
  box('AssemblyKit CLI');
  console.log(`
  ${B}Commands${R}

    ${C}explain${R}
        Print the AssemblyKit philosophy and principle.

    ${C}list${R}
        List local components grouped by status.

    ${C}build${R} ${D}"<feature request>"${R}
        Analyse a request: search components, decide Reuse vs Manufacture,
        show Assembly Manifest references. Reuse ratio: 75%.

    ${C}build --with-registry${R} ${D}"<feature request>"${R}
        Same, but also searches the Verified Component Registry.
        Reuse ratio: 100%.

    ${C}manufacture${R} ${D}<component-id>${R}
        Show the manufacturing plan for a missing component,
        or implementation details for an existing one.

    ${C}registry${R}
        Show Verified Component Registry components and quality metadata.

  ${D}Principle: Reuse before manufacture.${R}
`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'explain':     cmdExplain();               break;
  case 'list':        cmdList();                  break;
  case 'registry':    cmdRegistry();              break;
  case 'build':       cmdBuild(args);             break;
  case 'manufacture': cmdManufacture(args[0]);    break;
  case 'help':
  case undefined:     cmdUsage();                 break;
  default:
    console.error(`\n  Unknown command: ${cmd}\n`);
    cmdUsage();
    process.exit(1);
}
