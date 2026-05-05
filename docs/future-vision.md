# Future Vision

AssemblyKit is currently a demo — a CLI, a hand-maintained catalog, and a
single illustrative feature. The path from here to production tooling is a
sequence of concrete steps. Each step raises the reuse floor for everyone
using it.

---

## Today: the demo

A developer maintains a YAML catalog by hand, runs a CLI to analyse feature
requests, and consults the Assembly Manifest before writing code.

The value is real even at this level: the reuse scan happens before code
generation, decisions are recorded, and the manufactured component is
catalogued for next time.

---

## Step 1: Automated catalog generation

Instead of maintaining the catalog by hand, a scanner analyses an existing
codebase and infers component entries from:

- Model methods, service classes, and query scopes
- View components and templates
- Utility functions and transformation pipelines
- API clients and external integrations

The output is a catalog that describes what the codebase *can do*, not just
what files it contains. The catalog is regenerated on demand — kept current
with the code automatically.

---

## Step 2: Organisation registry

Once individual projects have local catalogs, the next layer is an
organisation-wide registry: a curated collection of components that have been
promoted from local projects because they are broadly useful.

A component enters the registry through a quality gate:
- Test coverage above a threshold
- Performance benchmark measured
- Security review completed
- API contract stabilised

Registry components are versioned. Consuming projects pin to a version.
When a component is improved, the update is available to all consumers.

The practical effect: a team building a new feature finds that the hard part
— a verified, tested, benchmarked implementation — already exists. They assemble.
They do not manufacture.

---

## Step 3: Public verified marketplace

The organisation registry generalises to a public marketplace of
production-grade components covering common patterns across the industry:

- Record staleness detection
- Pagination and cursor-based listing
- Permission checks and access control
- Audit trails and change logging
- Notification dispatch
- Rate limiting and throttling

Any project can pull from the marketplace. The quality guarantees are higher
than an npm package — components arrive with contracts, benchmarks, and
security reviews attached.

The reuse floor rises industry-wide.

---

## Step 4: Assembly as the primary interface

With a rich local catalog, a mature organisation registry, and a public
marketplace, the economics shift:

- **Most features** are assembled entirely from existing components
- **Some features** require a small manufactured delta to adapt a registry
  component to local domain requirements
- **Rare features** require genuine manufacturing of something novel

Engineers spend most of their time at the assembly level — specifying what to
wire together, reviewing Assembly Manifests, validating contracts — rather than
writing implementation code.

AI agents do the searching, matching, and wiring. Manufacturing, when it
happens, is targeted: a single contract-first, test-driven component that enters
the catalog and is never manufactured again.

---

## Step 5: Implementation language becomes secondary

Once components are catalogued by capability rather than file, the underlying
implementation language is an implementation detail.

A component described as:

```
inputs:  list<Record>, stale_days: int
outputs: list<Record>
effects: none
```

...can be implemented in PHP, TypeScript, Python, Go, or eventually a
machine-native representation optimised for execution by an AI runtime.

Today's implementations are regular languages — readable, debuggable,
familiar. Future implementations may be generated and optimised automatically,
with the catalog contract remaining the stable interface that humans and agents
reason about.

The assembly layer stays human-readable.
The manufacturing layer becomes increasingly automated.

---

## The constant

Across all of these steps, one principle does not change:

**Reuse before manufacture.**

The catalog is the mechanism. The Assembly Manifest is the record. The quality
gate is what makes reuse trustworthy.

The goal is not to stop generating code entirely. It is to ensure that code is
generated only when it genuinely needs to exist — and that when it is
manufactured, it enters the catalog and raises the floor for every future
feature.

---

> "The best AI-generated code is the code it did not need to generate."
