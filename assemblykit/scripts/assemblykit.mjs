#!/usr/bin/env node
/**
 * AssemblyKit CLI — software supply chain for the AI era
 *
 * Commands:
 *   explain                                       Print the AssemblyKit philosophy
 *   list                                          List local components (version + trust)
 *   registry [--profile <name>]                   Show Verified Component Registry
 *   build [--with-registry] [--profile <name>]    Analyse a feature request
 *   manufacture <component-id>                    Component details or manufacturing plan
 *   ledger                                        Print the manifest ledger
 *   recall <component@version>                    Show recall details and affected assemblies
 *   reassemble <assembly-id>                      Simulate reassembly preserving profile
 *   promote <component-id>                        Show promotion checklist
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, '..');

// ── Colour codes ──────────────────────────────────────────────────────────────

const B  = '\x1b[1m';   // bold
const D  = '\x1b[2m';   // dim
const G  = '\x1b[32m';  // green
const Y  = '\x1b[33m';  // yellow
const RD = '\x1b[31m';  // red
const C  = '\x1b[36m';  // cyan
const M  = '\x1b[35m';  // magenta
const R  = '\x1b[0m';   // reset

// ── Trust level presentation ──────────────────────────────────────────────────

function trustColour(level) {
  switch (level) {
    case 'verified':     return G;
    case 'manufactured': return Y;
    case 'experimental': return Y;
    case 'legacy':       return D;
    case 'recalled':     return RD;
    default:             return D;
  }
}

function trustBadge(level) {
  const col = trustColour(level);
  return `${col}${level}${R}`;
}

function scoreBadge(score) {
  const n = parseInt(score ?? 0);
  if (n >= 90) return `${G}${n}${R}`;
  if (n >= 70) return `${n}`;
  if (n >   0) return `${Y}${n}${R}`;
  return `${RD}${n}${R}`;
}

// ── Profile definitions (deterministic) ──────────────────────────────────────

const PROFILES = {
  'fort-knox': {
    label:     'fort-knox',
    priority:  'security first — requires certified + security-reviewed',
    selected:  { id: 'generic.stale_record_detector', version: '2.1.1' },
    reason:    'Highest-scored certified component (score 94). Security patched. Drop-in replacement.',
    warns:     [],
    rejects:   [
      { version: '1.2.0',     reason: 'experimental — no security review' },
      { version: '2.1.0',     reason: 'recalled — CVE-DEMO-2026-001' },
      { version: '3.0.0-beta', reason: 'experimental — beta API, no security review' },
    ],
  },
  'high-scale': {
    label:     'high-scale',
    priority:  'performance first — fastest acceptable component',
    selected:  { id: 'generic.stale_record_detector', version: '3.0.0-beta' },
    reason:    'Fastest available (p95 < 5ms). Highest test count (31). Acceptable for high-throughput.',
    warns:     ['3.0.0-beta is experimental — beta API, no security review. Proceed with monitoring.'],
    rejects:   [
      { version: '2.1.0',  reason: 'recalled — CVE-DEMO-2026-001' },
    ],
  },
  'rapid-prototype': {
    label:     'rapid-prototype',
    priority:  'speed of integration — most flexible, batteries-included',
    selected:  { id: 'generic.stale_record_detector', version: '3.0.0-beta' },
    reason:    'Most features (multi-field timestamp support), highest test count, fastest iteration.',
    warns:     ['3.0.0-beta is experimental. Pin to a stable version before shipping.'],
    rejects:   [
      { version: '2.1.0',  reason: 'recalled — CVE-DEMO-2026-001' },
    ],
  },
};

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

function warn(msg) {
  console.log(`\n  ${Y}⚠  ${msg}${R}`);
}

function recallBanner(component, version) {
  const bar = '─'.repeat(56);
  console.log(`\n  ${RD}${B}┌${bar}┐${R}`);
  console.log(`  ${RD}${B}│  RECALL  ${component}@${version}${''.padEnd(56 - 10 - component.length - version.length - 1)}│${R}`);
  console.log(`  ${RD}${B}└${bar}┘${R}`);
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
    const version        = (block.match(/\bversion:\s+"?([^"\n]+?)"?\s*\n/) || [])[1]?.trim() ?? null;
    const kind           = (block.match(/\bkind:\s+(\S+)/)                  || [])[1] ?? '—';
    const status         = (block.match(/\bstatus:\s+(\S+)/)                || [])[1] ?? 'existing';
    const trustLevel     = (block.match(/\btrust_level:\s+(\S+)/)           || [])[1] ?? '—';
    const selectionScore = (block.match(/\bselection_score:\s+(\d+)/)       || [])[1] ?? null;
    const signature      = (block.match(/\bsignature:\s+(\S+)/)             || [])[1] ?? null;
    const implementation = (block.match(/\bimplementation:\s+(\S+)/)        || [])[1] ?? null;
    const mfgTarget      = (block.match(/manufacturing_target:\s+(\S+)/)    || [])[1] ?? null;
    const recalled       = status === 'recalled';

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

    return { id, version, kind, status, trustLevel, selectionScore, signature,
             recalled, description, implementation, mfgTarget, raw: block };
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
  // Find quality: key at 4-space indent, extract until the next 4-space key.
  const qi = block.indexOf('\n    quality:');
  if (qi === -1) return { verification: '—', tests: '—', benchmark: '—', security: '—' };
  const after = block.slice(qi + '\n    quality:'.length);
  // Stop at the next key at the same indent level (4 spaces).
  let q = '';
  for (const line of after.split('\n')) {
    if (/^\s{4}[a-z]/.test(line)) break;
    q += line + '\n';
  }
  return {
    verification: (q.match(/verification:\s+([^\n]+)/)     || [])[1]?.trim() ?? '—',
    tests:        (q.match(/tests:\s+(\d+)/)               || [])[1] ?? '—',
    benchmark:    (q.match(/benchmark:\s+"?(.+?)"?\s*\n/)  || [])[1]?.trim() ?? '—',
    security:     (q.match(/security:\s+([^\n]+)/)         || [])[1]?.trim() ?? '—',
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

function parseListField(block, fieldName) {
  const idx = block.indexOf(`\n    ${fieldName}:`);
  if (idx === -1) return [];
  const after = block.slice(idx + `\n    ${fieldName}:`.length);
  const items = [];
  for (const line of after.split('\n').slice(1)) {
    if (/^\s{6}-\s/.test(line)) items.push(line.trim().replace(/^-\s+/, ''));
    else if (/^\s{4}[a-z]/.test(line)) break;
  }
  return items;
}

function parseRegistryProfiles(block) {
  const idx = block.indexOf('\n    profiles:');
  if (idx === -1) return {};
  const after = block.slice(idx + '\n    profiles:'.length);
  const profiles = {};
  for (const line of after.split('\n').slice(1)) {
    if (/^\s{6}[a-z]/.test(line)) {
      const m = line.match(/\s+([^:]+):\s+(.+)/);
      if (m) profiles[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1');
    } else if (/^\s{4}[a-z]/.test(line) || line.trim() === '') {
      break;
    }
  }
  return profiles;
}

function parseManifestTests(yaml) {
  const sec = yaml.split(/^quality:/m)[1]?.split(/^metrics:/m)[0] ?? '';
  return [...sec.matchAll(/- id:\s+(\S+)/g)].map(m => m[1]);
}

function parsePromotionPath(block) {
  const idx = block.indexOf('\n    promotion_path:');
  if (idx === -1) return null;
  const after = block.slice(idx + '\n    promotion_path:'.length);
  const nextLevel = (after.match(/next_level:\s+(\S+)/) || [])[1] ?? '—';
  const required = [];
  const toReachIdx = after.indexOf('\n      to_reach_certified:');
  const reqSection = toReachIdx !== -1 ? after.slice(0, toReachIdx) : after;
  for (const line of reqSection.split('\n')) {
    if (/^\s{8}-\s/.test(line)) required.push(line.trim().replace(/^-\s+/, ''));
  }
  const certified = [];
  if (toReachIdx !== -1) {
    const certSection = after.slice(toReachIdx);
    for (const line of certSection.split('\n').slice(1)) {
      if (/^\s{8}-\s/.test(line)) certified.push(line.trim().replace(/^-\s+/, ''));
      else if (/^\s{4}[a-z]/.test(line)) break;
    }
  }
  return { nextLevel, required, certified };
}

// ── Ledger parser ─────────────────────────────────────────────────────────────

function parseLedger(yaml) {
  return yaml.split(/\n  - id: asm-/).slice(1).map(block => {
    const id       = 'asm-' + block.split('\n')[0].trim();
    const ts       = (block.match(/timestamp:\s+"([^"]+)"/) || [])[1] ?? '—';
    const product  = (block.match(/product:\s+(\S+)/)       || [])[1] ?? '—';
    const feature  = (block.match(/feature:\s+"([^"]+)"/)   || [])[1]?.trim() ?? '—';
    const profile  = (block.match(/profile:\s+(\S+)/)       || [])[1] ?? '—';
    const path     = (block.match(/path:\s+(\S+)/)          || [])[1] ?? '—';
    const manifest = (block.match(/manifest:\s+(\S+)/)      || [])[1] ?? null;

    const compSec  = block.split('\n    components:')[1] ?? '';
    const components = compSec.split('\n      - id:').slice(1).map(cb => {
      const cid     = cb.split('\n')[0].trim();
      const ver     = (cb.match(/version:\s+"([^"]+)"/) || [])[1]?.trim() ?? '—';
      const source  = (cb.match(/source:\s+(\S+)/)      || [])[1] ?? '—';
      const trust   = (cb.match(/trust_level:\s+(\S+)/) || [])[1] ?? '—';
      const dec     = (cb.match(/decision:\s+(\S+)/)    || [])[1] ?? '—';
      const note    = (cb.match(/note:\s+"([^"]+)"/)    || [])[1]?.trim() ?? null;
      return { id: cid, version: ver, source, trust, decision: dec, note };
    });

    return { id, timestamp: ts, product, feature, profile, path, manifest, components };
  });
}

// ── Recalls parser ────────────────────────────────────────────────────────────

function parseRecalls(yaml) {
  return yaml.split(/\n  - component:/).slice(1).map(block => {
    const component   = block.split('\n')[0].trim();
    const version     = (block.match(/version:\s+"([^"]+)"/)      || [])[1]?.trim() ?? '—';
    const cve         = (block.match(/cve:\s+(\S+)/)              || [])[1] ?? null;
    const severity    = (block.match(/severity:\s+(\S+)/)         || [])[1] ?? '—';
    const disclosed   = (block.match(/disclosed:\s+"([^"]+)"/)    || [])[1]?.trim() ?? '—';
    const replacement = (block.match(/replacement:\s+"([^"]+)"/)  || [])[1]?.trim() ?? null;
    const actionReq   = (block.match(/action_required:\s+(\S+)/)  || [])[1] ?? '—';

    // multi-line reason
    let reason = '';
    const ri = block.indexOf('reason:');
    if (ri !== -1) {
      const after = block.slice(ri);
      if (/^reason:\s*>/.test(after)) {
        const lines = [];
        for (const line of after.split('\n').slice(1)) {
          if (/^\s{6}/.test(line)) lines.push(line.trim());
          else if (line.trim()) break;
        }
        reason = lines.join(' ');
      } else {
        reason = (after.match(/^reason:\s+"?([^"\n]+)"?/) || [])[1]?.trim() ?? '';
      }
    }

    // replacement notes
    let replacementNotes = '';
    const rni = block.indexOf('replacement_notes:');
    if (rni !== -1) {
      const after = block.slice(rni);
      if (/^replacement_notes:\s*>/.test(after)) {
        const lines = [];
        for (const line of after.split('\n').slice(1)) {
          if (/^\s{6}/.test(line)) lines.push(line.trim());
          else if (line.trim()) break;
        }
        replacementNotes = lines.join(' ');
      }
    }

    // affected assemblies
    const affectedSec = block.split('\n    affected_assemblies:')[1] ?? '';
    const affected = [...affectedSec.matchAll(/- (asm-\S+)/g)].map(m => m[1]);

    return { component, version, cve, severity, disclosed, reason,
             replacement, replacementNotes, affected, actionRequired: actionReq };
  });
}

// ── Commands ──────────────────────────────────────────────────────────────────

function cmdExplain() {
  box('AssemblyKit — Software Supply Chain for the AI Era');

  console.log(`
  AssemblyKit separates ${B}manufacturing${R} from ${B}assembly${R}.

  Most AI tools receive a feature request and immediately generate code —
  even when large parts of the feature already exist in the codebase.

  AssemblyKit enforces a different order of operations:

    ${B}1.${R}  Identify what the feature needs.
    ${B}2.${R}  Search the ${C}local catalog${R} for existing components.
    ${B}3.${R}  Search the ${C}Verified Component Registry${R} for shared components.
    ${B}4.${R}  Select components by ${M}trust profile${R} — fort-knox, high-scale, rapid-prototype.
    ${B}5.${R}  ${Y}Manufacture${R} only what cannot be found.
    ${B}6.${R}  ${G}Assemble${R} — wire the pieces together.
    ${B}7.${R}  ${C}Pin${R} every component version. Log to the manifest ledger.

  Every manufactured component is catalogued and can be promoted.
  Every assembly is logged. Every recalled component triggers reassembly.
  The reuse ratio is measured and improves over time.

  This is a software supply chain.
  The catalog is the bill of materials.
  The ledger is the audit trail.
  The recall system closes the loop.
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
  const verW       = 8;
  const trustW     = 14;
  const kindW      = 7;

  section('Components', 'version · trust level · kind');
  console.log();
  for (const c of existing) {
    const id      = c.id.padEnd(idW);
    const ver     = (c.version ?? '—').padEnd(verW);
    const trust   = trustBadge(c.trustLevel).padEnd(trustW + 9); // +9 for escape codes
    const score   = scoreBadge(c.selectionScore);
    const kind    = c.kind.padEnd(kindW);
    const sig     = c.signature === 'demo-signed' ? `${G}✓${R}` : `${Y}?${R}`;
    console.log(`  ${G}✓${R}  ${B}${id}${R} ${D}v${ver}${R} ${trust} ${D}score:${R}${score}  ${D}${kind}${R} ${sig}  ${D}${c.description.slice(0, 55)}${R}`);
  }

  if (missing.length > 0) {
    section('Missing', 'manufacturing targets');
    for (const c of missing) {
      console.log(`  ${Y}✦${R}  ${B}${c.id.padEnd(idW)}${R}  ${D}${c.kind}${R}  ${c.description.slice(0, 60)}`);
    }
  }

  console.log();
  const mfg = components.filter(c => c.trustLevel === 'manufactured');
  if (mfg.length > 0) {
    console.log(`  ${Y}${mfg.length} manufactured${R} — run ${D}promote <id>${R} to advance trust level`);
  }
  console.log(`  ${G}${existing.length} components catalogued${R}\n`);
}

function cmdRegistry(args) {
  const profileName = extractProfile(args);
  const profile     = profileName ? PROFILES[profileName] : null;
  const trustW      = 14;

  box('AssemblyKit — Verified Component Registry');

  if (profile) {
    section(`Profile: ${profile.label}`, profile.priority);
    console.log();
    const sel = profile.selected;
    console.log(`  ${G}✓  Selected${R}  ${B}${sel.id}@${sel.version}${R}`);
    console.log(`             ${profile.reason}`);
    if (profile.warns.length > 0) {
      profile.warns.forEach(w => warn(w));
    }
    if (profile.rejects.length > 0) {
      console.log();
      console.log(`  ${D}Rejected:${R}`);
      for (const r of profile.rejects) {
        console.log(`  ${RD}✗${R}  ${D}${sel.id}@${r.version.padEnd(12)}${R}  ${r.reason}`);
      }
    }
    console.log();
  }

  const components = parseComponents(readFile('catalog/registry.components.yaml'));
  const groups     = {};
  for (const c of components) {
    if (!groups[c.id]) groups[c.id] = [];
    groups[c.id].push(c);
  }

  for (const [gid, versions] of Object.entries(groups)) {
    section(gid, `${versions.length} versions available`);
    console.log();

    for (const c of versions) {
      const recalled = c.recalled || c.status === 'recalled';
      const badge    = recalled
        ? `${RD}${B}RECALLED${R}`
        : trustBadge(c.trustLevel);
      const score    = recalled ? `${RD}score:0${R}` : `${D}score:${R}${scoreBadge(c.selectionScore)}`;

      const isSel = profile && profile.selected.version === c.version;
      const prefix = isSel ? `${G}→${R}` : ' ';

      console.log(`  ${prefix}  ${B}v${c.version.padEnd(14)}${R} ${badge.padEnd(trustW + 9)}  ${score}`);

      const q = parseRegistryQuality(c.raw);
      console.log(`       ${D}tests: ${q.tests.padEnd(4)}  bench: ${q.benchmark.padEnd(28)}  security: ${q.security}${R}`);

      if (recalled) {
        const cve = (c.raw.match(/cve:\s+(\S+)/) || [])[1] ?? '';
        const rep = (c.raw.match(/replacement:\s+"([^"]+)"/) || [])[1] ?? '';
        console.log(`       ${RD}Recalled: ${cve}  →  replace with ${rep}${R}`);
      } else {
        const profiles = parseRegistryProfiles(c.raw);
        if (Object.keys(profiles).length > 0) {
          const parts = Object.entries(profiles)
            .map(([p, v]) => {
              const col = v.startsWith('preferred') ? G : v === 'acceptable' ? '' : D;
              return `${D}${p}:${R}${col}${v}${R}`;
            })
            .join('  ');
          console.log(`       ${parts}`);
        }
      }
      console.log();
    }
  }
}

function extractProfile(args) {
  const idx = args.indexOf('--profile');
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function cmdBuild(args) {
  const withRegistry = args.includes('--with-registry');
  const profileName  = extractProfile(args);
  const profile      = profileName ? PROFILES[profileName] : null;
  const request      = args.filter(a => !a.startsWith('-') && a !== profileName)
                           .join(' ').replace(/^"|"$/g, '') ||
                       'Add a dashboard card showing companies with more than 10 employees and no updates in 30 days.';

  box('AssemblyKit — Build Analysis');

  section('Feature request');
  console.log(`\n  "${request}"\n`);

  if (profile) {
    section('Profile', profile.label);
    console.log(`\n  ${M}${profile.label}${R}  ${D}${profile.priority}${R}\n`);
  }

  section('Principle');
  console.log(`\n  ${C}Reuse before manufacture.${R}\n`);

  // ── Local search
  section('Component search', 'local catalog');
  const found = [
    { id: 'company.list',              ver: '1.0.0', trust: 'verified',     note: 'returns all companies' },
    { id: 'employee.count_by_company', ver: '1.0.0', trust: 'verified',     note: 'returns employee count per company' },
    { id: 'dashboard.card',            ver: '1.1.0', trust: 'verified',     note: 'renders a labelled stat card' },
  ];
  const missing = [
    { id: 'company.stale_filter',      ver: null,    trust: 'missing',      note: 'no component combines staleness + employee count' },
  ];
  const idW = Math.max(...[...found, ...missing].map(c => c.id.length)) + 2;
  console.log();
  for (const c of found) {
    console.log(`  ${G}✓  Reuse${R}       ${B}${c.id.padEnd(idW)}${R} ${D}v${c.ver}${R}  ${trustBadge(c.trust)}  ${D}${c.note}${R}`);
  }
  for (const c of missing) {
    console.log(`  ${Y}✦  Manufacture${R}  ${B}${c.id.padEnd(idW)}${R}  ${Y}missing${R}  ${D}${c.note}${R}`);
  }

  if (withRegistry || profile) {
    // ── Registry search
    const profileLabel = profile ? `profile: ${profile.label}` : 'Verified Component Registry';
    section('Registry search', profileLabel);
    console.log();

    if (profile) {
      const sel = profile.selected;
      console.log(`  ${G}✓  Reuse${R}       ${B}${sel.id}@${sel.version}${R}  ${D}registry${R}`);
      console.log(`              ${profile.reason}`);
      if (profile.warns.length > 0) {
        profile.warns.forEach(w => console.log(`              ${Y}⚠  ${w}${R}`));
      }
      if (profile.rejects.length > 0) {
        console.log();
        profile.rejects.forEach(r =>
          console.log(`  ${RD}✗${R}  ${D}${sel.id}@${r.version.padEnd(12)}${R}  ${r.reason}`)
        );
      }
    } else {
      console.log(`  ${G}✓  Reuse${R}       ${B}generic.stale_record_detector@2.1.1${R}  ${D}registry${R}`);
      console.log(`              ${D}certified  ·  26 tests  ·  p95 < 10ms  ·  security reviewed and patched${R}`);
      console.log(`              Covers timestamp filtering. Employee-count threshold applied at assembly.`);
    }

    // ── Assembly decision with registry
    const profileSuffix = profile ? `with ${profile.label} profile` : 'with Verified Component Registry';
    section('Assembly decision', profileSuffix);
    console.log();
    const sel = profile ? profile.selected : { id: 'generic.stale_record_detector', version: '2.1.1' };
    kv('Reuse',       `4  (company.list, employee.count_by_company, dashboard.card, ${sel.id}@${sel.version})`, 14);
    kv('Manufacture', `0`, 14);
    kv('Reuse ratio', `${G}${B}100%${R}`, 14);

    console.log(`\n  ${D}Note: MVP implementation uses locally manufactured company.stale_filter.${R}`);
    console.log(`  ${D}This analysis records the supply chain target state.${R}\n`);

  } else {
    // ── Local only
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
    console.log();
    kv('Version',        component.version ?? '—');
    kv('Trust level',    trustBadge(component.trustLevel));
    kv('Score',          scoreBadge(component.selectionScore));
    kv('Kind',           component.kind);
    kv('Signature',      component.signature === 'demo-signed' ? `${G}demo-signed${R}` : `${Y}unsigned${R}`);
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

    const promo = parsePromotionPath(component.raw);
    if (promo && component.trustLevel !== 'verified') {
      console.log(`\n  ${D}→ Run ${R}${C}promote ${componentId}${R}${D} to advance to ${promo.nextLevel}.${R}`);
    }

    console.log(`\n  ${G}No manufacturing needed — available for Reuse.${R}\n`);
    return;
  }

  box(`AssemblyKit — Manufacturing Plan: ${componentId}`);

  section('Component');
  console.log();
  kv('Status',      `${Y}missing${R}  —  scheduled for Manufacture`);
  kv('Kind',        component.kind);
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
  console.log(`    ${D}pure — no reads, writes, or external calls${R}`);

  section('Required tests');
  let tests = [];
  try { tests = parseManifestTests(readFile('manifests/stale-company-dashboard.manifest.yaml')); } catch (_) {}
  if (tests.length === 0) {
    console.log(`\n    ${D}(no tests defined in Assembly Manifest)${R}`);
  } else {
    console.log();
    tests.forEach(t => console.log(`  ${Y}○${R}  ${t}`));
  }
  console.log();
}

function cmdLedger() {
  box('AssemblyKit — Manifest Ledger');

  const assemblies = parseLedger(readFile('ledger/manifest-ledger.yaml'));

  if (assemblies.length === 0) {
    console.log(`\n  ${D}No assemblies logged yet.${R}\n`);
    return;
  }

  for (const asm of assemblies) {
    section(`${asm.id}`, `${asm.timestamp.slice(0, 10)}  ·  ${asm.product}  ·  ${M}${asm.profile}${R}`);
    console.log(`\n  ${D}Feature:${R}  ${asm.feature}`);
    if (asm.manifest) console.log(`  ${D}Manifest:${R} ${asm.manifest}`);
    console.log();

    const idW    = Math.max(...asm.components.map(c => c.id.length)) + 2;
    const verW   = 10;
    const srcW   = 9;
    let hasRecall = false;

    for (const c of asm.components) {
      const isRecalled = c.note && c.note.includes('RECALLED');
      const decCol  = c.decision === 'reuse' ? G : Y;
      const recFlag = isRecalled ? `  ${RD}${B}⚠ RECALLED${R}` : '';
      console.log(`  ${decCol}${c.decision.padEnd(10)}${R}  ${B}${c.id.padEnd(idW)}${R}  ${D}v${c.version.padEnd(verW)}${R}  ${D}${c.source.padEnd(srcW)}${R}  ${trustBadge(c.trust)}${recFlag}`);
      if (isRecalled) hasRecall = true;
    }

    if (hasRecall) {
      console.log(`\n  ${RD}${B}⚠  This assembly contains recalled components.${R}`);
      console.log(`  Run ${C}recall generic.stale_record_detector@2.1.0${R} for details.`);
      console.log(`  Run ${C}reassemble ${asm.id}${R} to get the fix plan.`);
    }
    console.log();
  }
}

function cmdRecall(componentAtVersion) {
  if (!componentAtVersion) {
    console.error(`\n  Usage: assemblykit recall <component@version>\n`);
    process.exit(1);
  }

  const [component, version] = componentAtVersion.split('@');
  if (!component || !version) {
    console.error(`\n  Format: <component>@<version>  e.g. generic.stale_record_detector@2.1.0\n`);
    process.exit(1);
  }

  const recalls = parseRecalls(readFile('ledger/recalls.yaml'));
  const recall  = recalls.find(r => r.component === component && r.version === version);

  if (!recall) {
    console.log(`\n  ${G}No recall found for ${component}@${version}${R}\n`);
    return;
  }

  recallBanner(component, version);

  section('Recall details');
  console.log();
  kv('CVE',         `${RD}${recall.cve}${R}`);
  kv('Severity',    `${RD}${B}${recall.severity.toUpperCase()}${R}`);
  kv('Disclosed',   recall.disclosed.slice(0, 10));
  kv('Replacement', `${G}${recall.replacement}${R}`);

  console.log(`\n    ${B}Reason${R}`);
  console.log(`    ${recall.reason}\n`);

  if (recall.replacementNotes) {
    console.log(`    ${B}Replacement notes${R}`);
    console.log(`    ${recall.replacementNotes}\n`);
  }

  // Scan ledger for affected assemblies
  section('Affected assemblies', 'scanned from ledger');
  const assemblies = parseLedger(readFile('ledger/manifest-ledger.yaml'));
  const affected   = assemblies.filter(a =>
    a.components.some(c => c.id === component && c.version === version)
  );

  if (affected.length === 0) {
    console.log(`\n  ${G}No affected assemblies found in ledger.${R}\n`);
  } else {
    console.log();
    for (const a of affected) {
      console.log(`  ${RD}⚠${R}  ${B}${a.id}${R}  ${D}${a.product}  ·  "${a.feature}"  ·  profile: ${a.profile}${R}`);
    }
    console.log();
    section('Recommended action');
    console.log();
    for (const a of affected) {
      console.log(`  ${C}node assemblykit/scripts/assemblykit.mjs reassemble ${a.id}${R}`);
    }
    console.log();
  }
}

function cmdReassemble(assemblyId) {
  if (!assemblyId) {
    console.error(`\n  Usage: assemblykit reassemble <assembly-id>\n`);
    process.exit(1);
  }

  const assemblies = parseLedger(readFile('ledger/manifest-ledger.yaml'));
  const asm        = assemblies.find(a => a.id === assemblyId);

  if (!asm) {
    console.error(`\n  Assembly not found in ledger: ${assemblyId}\n`);
    process.exit(1);
  }

  box(`AssemblyKit — Reassembly Plan: ${assemblyId}`);

  section('Original assembly');
  console.log();
  kv('Product',   asm.product);
  kv('Feature',   asm.feature);
  kv('Profile',   `${M}${asm.profile}${R}  ${D}(preserved)${R}`);
  kv('Assembled', asm.timestamp.slice(0, 10));

  // Find recalled components
  const recalls   = parseRecalls(readFile('ledger/recalls.yaml'));
  const toReplace = [];
  const unchanged = [];

  for (const c of asm.components) {
    const recall = recalls.find(r => r.component === c.id && r.version === c.version);
    if (recall) {
      toReplace.push({ component: c, recall });
    } else {
      unchanged.push(c);
    }
  }

  if (toReplace.length > 0) {
    section('Component changes required');
    console.log();
    for (const { component: c, recall: r } of toReplace) {
      const newVer = r.replacement.split('@')[1] ?? '—';
      console.log(`  ${RD}✗${R}  ${B}${c.id}${R}  ${RD}v${c.version}${R}  →  ${G}v${newVer}${R}  ${D}(${r.cve} — see recall)${R}`);
      console.log(`       ${G}drop-in replacement — no API changes required${R}`);
    }
  }

  if (unchanged.length > 0) {
    section('Unchanged components');
    console.log();
    for (const c of unchanged) {
      console.log(`  ${G}✓${R}  ${B}${c.id}${R}  ${D}v${c.version}  ·  ${c.source}  ·  ${c.trust}${R}`);
    }
  }

  // Profile-aware re-selection
  const profile = PROFILES[asm.profile];
  if (profile && toReplace.length > 0) {
    section('Profile re-selection', `${asm.profile}`);
    console.log();
    const sel = profile.selected;
    console.log(`  ${G}✓  Selected${R}  ${B}${sel.id}@${sel.version}${R}`);
    console.log(`             Profile ${M}${asm.profile}${R} criterion: ${profile.priority}`);
    console.log(`             ${profile.reason}`);
    if (profile.warns.length > 0) {
      profile.warns.forEach(w => warn(w));
    }
  }

  section('Reassembly verdict');
  if (toReplace.length > 0 && profile) {
    console.log(`\n  ${G}${B}READY${R}  All replacements meet the ${asm.profile} trust threshold.`);
    console.log(`  ${D}Update pinned versions in the manifest and re-run the test suite.${R}\n`);
  } else if (toReplace.length === 0) {
    console.log(`\n  ${G}${B}CLEAN${R}  No recalled components found. No reassembly needed.\n`);
  } else {
    console.log(`\n  ${Y}REVIEW${R}  Manual review required — check profile compatibility.\n`);
  }
}

function cmdPromote(componentId) {
  if (!componentId) {
    console.error(`\n  Usage: assemblykit promote <component-id>\n`);
    process.exit(1);
  }

  const components = parseComponents(readFile('catalog/local.components.yaml'));
  const component  = components.find(c => c.id === componentId);

  if (!component) {
    console.error(`\n  Component not found: ${componentId}\n`);
    process.exit(1);
  }

  box(`AssemblyKit — Promotion Analysis: ${componentId}`);

  section('Current status');
  console.log();
  kv('Version',     component.version ?? '—');
  kv('Trust level', trustBadge(component.trustLevel));
  kv('Score',       scoreBadge(component.selectionScore));
  kv('Signature',   component.signature === 'demo-signed' ? `${G}demo-signed${R}` : `${Y}unsigned — needs signing${R}`);
  const q = parseLocalQuality(component.raw);
  if (q?.tests) kv('Tests', q.tests);

  const promo = parsePromotionPath(component.raw);

  if (!promo) {
    console.log(`\n  ${D}No promotion path defined for this component.${R}\n`);
    return;
  }

  // Map of known requirements with current pass/fail
  const testCount = parseInt(q?.tests ?? 0);
  const reqs = [
    { label: `Implementation exists (${component.implementation ?? '—'})`, pass: !!component.implementation },
    { label: `Tests exist (${testCount} found)`,                           pass: testCount > 0 },
    { label: `Tests >= 10 (currently ${testCount})`,                       pass: testCount >= 10 },
    { label: 'Security review completed',                                   pass: false },
    { label: 'Benchmark documented',                                        pass: false },
    { label: 'Signature: demo-signed',                                      pass: component.signature === 'demo-signed' },
  ];

  section(`Requirements for ${B}${promo.nextLevel}${R}`);
  console.log();
  for (const r of reqs) {
    const icon = r.pass ? `${G}✓${R}` : `${RD}✗${R}`;
    console.log(`  ${icon}  ${r.pass ? '' : D}${r.label}${r.pass ? '' : R}`);
  }

  if (promo.certified.length > 0) {
    section(`Further requirements for ${B}certified${R}`);
    console.log();
    promo.certified.forEach(r => console.log(`  ${RD}✗${R}  ${D}${r}${R}`));
  }

  const passed  = reqs.filter(r => r.pass).length;
  const total   = reqs.length;
  const pct     = Math.round(passed / total * 100);
  const readyCol = pct === 100 ? G : pct >= 50 ? Y : RD;

  section('Promotion readiness');
  console.log(`\n  ${readyCol}${passed}/${total} requirements met (${pct}%)${R}`);

  if (passed < total) {
    const failing = reqs.filter(r => !r.pass);
    console.log(`\n  ${D}Next steps:${R}`);
    failing.forEach(r => console.log(`    ${Y}→${R}  ${r.label}`));
  } else {
    console.log(`\n  ${G}${B}Ready to promote to ${promo.nextLevel}.${R}`);
    console.log(`  ${D}Submit to registry: assemblykit registry submit ${componentId}${R}`);
  }
  console.log();
}

function cmdUsage() {
  box('AssemblyKit CLI');
  console.log(`
  ${B}Commands${R}

    ${C}explain${R}
        Print the AssemblyKit philosophy and supply chain model.

    ${C}list${R}
        List local components with version, trust level, and score.

    ${C}registry${R} ${D}[--profile <name>]${R}
        Show Verified Component Registry. Use --profile to filter by
        selection profile (fort-knox | high-scale | rapid-prototype).

    ${C}build${R} ${D}"<feature request>"${R}
        Analyse a request against the local catalog. Reuse ratio: 75%.

    ${C}build --with-registry${R} ${D}[--profile <name>] "<feature request>"${R}
        Include registry search. Use --profile for profile-aware selection.
        Reuse ratio: 100%.

    ${C}manufacture${R} ${D}<component-id>${R}
        Show manufacturing plan or implemented component details.

    ${C}ledger${R}
        Print the manifest ledger — all logged assemblies.

    ${C}recall${R} ${D}<component@version>${R}
        Show recall details and all affected assemblies.

    ${C}reassemble${R} ${D}<assembly-id>${R}
        Simulate reassembly preserving the original selection profile.

    ${C}promote${R} ${D}<component-id>${R}
        Show promotion checklist: manufactured → verified → certified.

  ${D}Profiles: fort-knox  ·  high-scale  ·  rapid-prototype${R}
  ${D}Principle: Reuse before manufacture.${R}
`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'explain':     cmdExplain();                  break;
  case 'list':        cmdList();                     break;
  case 'registry':    cmdRegistry(args);             break;
  case 'build':       cmdBuild(args);                break;
  case 'manufacture': cmdManufacture(args[0]);       break;
  case 'ledger':      cmdLedger();                   break;
  case 'recall':      cmdRecall(args[0]);            break;
  case 'reassemble':  cmdReassemble(args[0]);        break;
  case 'promote':     cmdPromote(args[0]);           break;
  case 'help':
  case undefined:     cmdUsage();                    break;
  default:
    console.error(`\n  Unknown command: ${cmd}\n`);
    cmdUsage();
    process.exit(1);
}
