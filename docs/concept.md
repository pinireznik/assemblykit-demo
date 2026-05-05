# AssemblyKit — Core Concepts

## What is AssemblyKit?

AssemblyKit is a framework and workflow for **AI-native software assembly**.
It separates two distinct activities — **manufacturing** and **assembly** — that
traditional software development blends together in every task.

In most teams today, an AI assistant receives a feature request and immediately
starts generating code, even when large portions of that feature already exist
in the codebase or in a shared component registry.

AssemblyKit changes the default: **reuse before manufacture**.

---

## The principle: Reuse before manufacture

When a feature is requested, the first question is not *"how do I build this?"*
but *"what already exists that I can use?"*

This mirrors how mature engineering disciplines work:
- An architect does not design every structural component from scratch.
- A chip designer reuses verified IP blocks before laying out new circuits.
- A logistics company assembles routes from known depots and lanes.

Software has always had the *ideal* of reuse (libraries, packages, components)
but lacks a systematic, AI-assisted mechanism for enforcing it at the feature
level before any code is written.

AssemblyKit provides that mechanism.

---

## Manufacturing vs. Assembly

These are two separate phases in the AssemblyKit workflow:

### Manufacturing
Manufacturing is the act of **creating a new, self-contained component**.
A manufactured component is:
- Independently testable
- Catalogued with a stable ID
- Described in the component catalog
- Potentially shareable to the registry

Manufacturing only happens when no existing component can satisfy the need.

### Assembly
Assembly is the act of **combining components** — local, manufactured, or
registry-sourced — to deliver a feature.

Assembly does not produce net-new code. It wires, extends, and configures
existing pieces. The Assembly Manifest is the specification that guides it.

**Key insight:** most feature requests require more assembly than manufacturing.
AssemblyKit makes that ratio explicit and measurable.

---

## The Assembly Manifest

The Assembly Manifest is a structured document (YAML) generated at the start
of every feature request. It answers four questions:

1. **What components already exist** that are relevant to this feature?
2. **Which components will be reused** without modification?
3. **Which components will be extended** (minimally modified)?
4. **Which components must be manufactured** because nothing suitable exists?

The manifest is written before any code is touched. It serves as:
- A contract between the AI agent and the developer
- An audit trail for every component decision
- Input to the build plan, manufacturing plan, and traceability report

---

## Component Catalogue

The component catalogue describes the **capabilities** of a codebase, not just
its files. Each entry records what a component does, what it accepts, what it
returns, and what side-effects it has — the information an AI agent needs to
decide whether to reuse it.

There are two catalogue levels.

### Local catalog (`catalog/local.components.yaml`)

Every component in the current project that has been catalogued is a candidate
for reuse. The schema describes components in terms of:

- **kind** — `data` (reads/writes state), `logic` (pure transformation), `ui` (renders output)
- **status** — `existing` (ready to reuse) or `missing` (identified need, manufacturing target)
- **inputs / outputs** — typed interface contract
- **effects** — what the component reads, writes, and calls externally

A component marked `missing` is a manufacturing target: it has been identified
as necessary but not yet built. Recording it in the catalog before building it
prevents duplicate manufacturing when the same need arises from a different
feature request.

Example entries in the demo catalog:

| ID | Kind | Status | Description |
|---|---|---|---|
| `company.list` | data | existing | Returns all companies |
| `company.get` | data | existing | Returns one company by ID |
| `employee.count_by_company` | data | existing | Employee count for a company |
| `dashboard.card` | ui | existing | Stat card UI component |
| `company.stale_filter` | logic | **missing** | Filters companies by staleness |

### Verified Component Registry (`catalog/registry.components.yaml`)

The registry is a shared, cross-project library of components that have passed
a quality gate. Registry components carry additional metadata:

- **verification** — whether the component has been formally reviewed
- **test count** — number of automated tests covering it
- **benchmark** — measured performance under load
- **security** — whether a security review has been completed

Registry components are the highest-confidence reuse candidates. When a local
component does not exist, AssemblyKit checks the registry before scheduling
manufacturing.

### Why registry components reduce manufacturing

A registry component represents work that has already been done, tested, and
verified — often by a different team or in a different project. Pulling from
the registry means:

1. **Zero net-new code** for the consuming team
2. **Known quality** — the component arrives with test coverage and a benchmark
3. **Shared improvement** — fixes and enhancements flow to all consumers

In the demo, `generic.stale_record_detector` (registry) can detect record
staleness for any model and any timestamp field. It handles the common case.
The local `company.stale_filter` (missing, to be manufactured) adds the
Company-specific logic it cannot: minimum employee count filtering.

This is the intended pattern — registry handles the generic problem, local
manufacturing handles the domain-specific delta.

---

## Why it matters

| Without AssemblyKit | With AssemblyKit |
|---|---|
| Every feature starts from scratch | Every feature starts with a reuse scan |
| Duplication grows silently | Reuse is measured and recorded |
| AI generates code it does not need to | AI generates only the net-new parts |
| No audit trail for component decisions | Manifest records every decision |
| Reuse is accidental | Reuse is systematic and enforced |

In mature codebases, 50–80% of any feature's components already exist in some
form. AssemblyKit makes that potential visible and captures it.
