# The AssemblyKit Supply Chain Model

Software has always borrowed the language of manufacturing — "building" features,
"shipping" products, "releasing" versions. But it has never had the infrastructure
that makes physical supply chains safe and auditable: versioned bills of materials,
trust tiers, recall systems, and traceability from a finished product back to every
component it contains.

AssemblyKit applies that infrastructure to software assembly in the AI era.

---

## Selection score

Every component has a **selection score** from 0 to 100. It is a composite signal
that reflects how suitable the component is for selection, across all dimensions:

| Factor | Raises score | Lowers score |
|---|---|---|
| Test coverage | Many tests | Few or none |
| Performance | Fast benchmark | No benchmark |
| Security | Reviewed and patched | Not reviewed |
| Trust level | Certified / verified | Experimental / unsigned |
| Stability | Stable API | Beta / breaking changes |
| Status | Active | Recalled |

A recalled component's score drops to zero. It cannot be selected by any profile.

Scores are not computed automatically in this demo — they are declared in the
catalog YAML and represent the kind of signal a real registry would surface.

---

## Trust levels

Trust levels express how much confidence exists in a component at assembly time.
They are ordered from lowest to highest:

| Level | Meaning |
|---|---|
| `missing` | Identified as needed but not yet built |
| `manufactured` | Locally built; not yet independently reviewed |
| `experimental` | Available and working; no security review or external audit |
| `verified` | Tested, benchmarked, signed, and security-reviewed |
| `certified` | All of verified, plus external audit and registry submission |

A manufactured component starts at `manufactured`. It can be promoted by meeting
the requirements for each next level. The `promote` command shows the checklist.

Registry components are typically `verified` or higher. Experimental registry
entries exist for cutting-edge components that trade stability for speed.

---

## Selection profiles

A **selection profile** is a named preference order that determines which
component version is chosen when multiple candidates exist. Profiles encode
the risk tolerance of a team or product:

### `fort-knox`
Security first. Only certified, security-reviewed components are accepted.
Any component without a security review is rejected, regardless of score.
Recalled components are always rejected.

→ Selects `generic.stale_record_detector@2.1.1` (certified, patched)  
→ Rejects 1.2.0 (no security review), 2.1.0 (recalled), 3.0.0-beta (experimental)

### `high-scale`
Performance first. The fastest acceptable component is preferred, even if
experimental. Recalled components are always rejected. Experimental components
are accepted with a warning.

→ Selects `generic.stale_record_detector@3.0.0-beta` (fastest, p95 < 5ms)  
→ Warns: beta API, no security review  
→ Rejects 2.1.0 (recalled)

### `rapid-prototype`
Integration speed first. The most feature-rich and flexible component is
preferred. Recalled components are rejected. Everything else is acceptable
for prototyping; pin to a stable version before shipping.

→ Selects `generic.stale_record_detector@3.0.0-beta` (most features, multi-field)  
→ Warns: pin to stable before production  
→ Rejects 2.1.0 (recalled)

Profiles are specified at build time: `--profile fort-knox`. The profile is
recorded in the Assembly Manifest and the ledger, so the selection rationale
is always traceable.

---

## Pinned dependencies

At assembly time, every component is **pinned** to an exact version in the
Assembly Manifest:

```yaml
pinned_components:
  - id: generic.stale_record_detector
    version: "2.1.1"
    source: registry
    trust_level: verified
    selection_score: 94
    decision: reuse
```

Pinning means the assembly is reproducible. It also means that when a recall
is issued, the ledger can be scanned to find every assembly that contains the
affected version.

---

## Manifest ledger

The **manifest ledger** is an append-only log of every completed assembly. Each
entry records:

- Assembly ID (`asm-2026-001`)
- Timestamp
- Product and feature name
- Selection profile used
- Every pinned component — exact version, source, trust level, and decision

The ledger is the audit trail. It answers: *what exact components are in production,
in which products, and when were they assembled?*

In production, the ledger would be cryptographically signed and stored in an
immutable system. In this demo it is a YAML file — the structure is identical,
only the enforcement mechanism differs.

---

## Recall and reassembly

A **recall** is issued when a component version is found to have a critical
defect — typically a security vulnerability, a data-correctness bug, or a
licensing conflict.

The recall system works in three steps:

**1. Issue the recall**  
A recall entry is added to `recalls.yaml` with the component ID, version,
CVE reference, severity, reason, and suggested replacement.

**2. Scan the ledger**  
`assemblykit recall <component@version>` scans the ledger and identifies every
assembly that pins the recalled version. The team knows immediately which
products are affected.

**3. Reassemble**  
`assemblykit reassemble <assembly-id>` produces a reassembly plan. It preserves
the original selection profile, selects the best replacement under that profile,
and confirms that all other pinned components remain valid.

The entire loop — from recall disclosure to reassembly plan — takes seconds.
In a traditional project, this discovery might take days or never happen at all.

---

## Promotion pipeline

A locally manufactured component starts at `trust_level: manufactured`. It can
be promoted through the trust hierarchy by meeting verifiable requirements:

```
manufactured  →  verified  →  certified
```

**To reach `verified`:**
- Test count ≥ 10
- Security review completed
- Benchmark documented
- Component signed

**To reach `certified`:**
- All verified requirements
- External audit
- Registry submission approved

Once a component reaches `certified`, it becomes eligible for publication to
the organisation registry or the public marketplace — where it can be reused
by other teams and raise the reuse floor for everyone.

The `promote` command shows the current checklist and what is still missing.

---

## Why this turns AI coding into a software supply chain

Without supply chain infrastructure, AI-generated code is invisible:
- No record of which version of what was used
- No mechanism to find affected products when a component has a bug
- No trust signal to distinguish well-tested components from first-draft ones
- No systematic reuse — every feature starts fresh

With supply chain infrastructure:

| Without | With |
|---|---|
| "We used some library" | Every component pinned to an exact version |
| Recalls discovered by accident | Ledger scan finds affected assemblies in seconds |
| Trust is implicit | Trust levels are explicit and enforced by profile |
| Reuse is accidental | Reuse is measured, logged, and maximised |
| Manufactured code disappears into the codebase | Manufactured components are catalogued and promoted |
| AI generates code freely | AI selects from known components first, manufactures only the delta |

The shift is from *AI as a code generator* to *AI as a supply chain operator*:
searching catalogs, applying trust profiles, assembling from known-good parts,
and manufacturing only what genuinely does not exist yet.

The component catalog is the bill of materials.  
The Assembly Manifest is the build specification.  
The ledger is the audit trail.  
The recall system closes the loop.

> "The best AI-generated code is the code it did not need to generate."
