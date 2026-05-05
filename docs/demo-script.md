# AssemblyKit — 7-Minute Demo Script

**Audience:** Technical stakeholders, engineering leads, potential adopters  
**Duration:** ~7 minutes  
**Setup:** Terminal open at repo root (`assemblykit-demo/`). Browser ready.

```bash
# Start the app before the demo
cd demo-crm && php artisan serve
```

---

## Opening

> "Today AI coding tools often manufacture code immediately. AssemblyKit shows
> a different model: design the product, search for components, reuse what
> exists, manufacture only what is missing, then assemble.
>
> And then — because this is a supply chain — track what you shipped, recall
> what breaks, and promote what is proven."

---

## Step 1 — The app  *(~45 sec)*

Open http://localhost:8000/dashboard

Point out:
- Two stat cards: Total Companies, Total Employees
- Recently Updated table

Go to http://localhost:8000/companies — point out Acme Corp: 12 employees, updated 45 days ago. Nothing flags it yet.

> "Real Laravel app. SQLite, Blade, seeded data. The feature request:
> 'Add a dashboard card showing companies with more than 10 employees
> and no updates in 30 days.'"

---

## Step 2 — Explain the principle  *(~20 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs explain
```

Let the last line land.

---

## Step 3 — The component catalog  *(~30 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs list
```

- Green checkmarks — components available for reuse right now
- Version, trust level, selection score next to each one

> "The catalog makes the codebase's capabilities visible as a structured
> inventory. Before writing anything, we know what we have."

---

## Step 4 — The registry  *(~45 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs registry
```

Walk through the four versions of `generic.stale_record_detector`:

- **1.2.0** — experimental, score 61, no security review
- **2.1.0** — recalled (CVE-DEMO-2026-001), score 0 — red, rejected by all profiles
- **2.1.1** — certified, score 94, security patched — the safe choice
- **3.0.0-beta** — experimental, score 72, fastest (p95 < 5ms), unsigned

> "This is a component market. Four candidates. Different trust levels,
> different trade-offs. The profile decides which one is selected."

---

## Step 5 — Build without registry  *(~45 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs build "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"
```

- Three components found in the local catalog
- `company.stale_filter` — identified as missing before a line is written
- **Reuse 3, Manufacture 1 — 75% reuse ratio**

> "The Assembly Manifest is written before any code is touched. It is the
> contract between the agent and the developer."

---

## Step 6 — Build with registry, fort-knox profile  *(~45 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs build --with-registry --profile fort-knox "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"
```

Walk through the profile selection:

- fort-knox: security first — requires certified + security-reviewed
- 1.2.0 rejected (no security review), 2.1.0 rejected (recalled), 3.0.0-beta rejected (experimental)
- **2.1.1 selected — score 94, certified, security patched**
- **Reuse 4, Manufacture 0 — 100% reuse ratio**

> "With a verified registry and a trust profile, this feature requires no
> manufacturing at all. The AI assembles entirely from known-good parts."

Try the other profiles:

```bash
node assemblykit/scripts/assemblykit.mjs registry --profile high-scale
node assemblykit/scripts/assemblykit.mjs registry --profile rapid-prototype
```

> "Same components. Different risk tolerance. Different selection. Every
> decision is recorded — the profile is in the manifest."

---

## Step 7 — The ledger  *(~30 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs ledger
```

- Assembly `asm-2026-001` — product, feature, profile, timestamp
- Every pinned component: exact version, source, trust level, decision
- One entry is flagged RECALLED

> "The ledger is the audit trail. Every assembly ever run, every component
> version ever pinned. Append-only."

---

## Step 8 — Recall  *(~30 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs recall generic.stale_record_detector@2.1.0
```

- CVE-DEMO-2026-001: timestamp parsing vulnerability
- **Scans the ledger — asm-2026-001 is affected**
- Replacement: 2.1.1 (drop-in, no API changes)

> "In a traditional project, finding which products use a vulnerable
> component might take days — or never happen at all. Here it takes
> one command."

---

## Step 9 — Reassemble  *(~30 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs reassemble asm-2026-001
```

- Preserves the original fort-knox profile
- Replaces 2.1.0 → 2.1.1
- All other pinned components confirmed valid

> "From recall disclosure to reassembly plan — seconds. The profile
> is preserved. The rationale is traceable."

---

## Step 10 — Promote  *(~20 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs promote company.stale_filter
```

- Current level: manufactured
- Next level: verified
- Checklist: tests ≥ 10 (currently 5), security review, benchmark, signature

> "Manufactured components don't disappear into the codebase.
> They have a promotion path — to verified, then certified,
> then eligible for the shared registry."

---

## Closing  *(~15 sec)*

> "The catalog is the bill of materials.
> The manifest is the build specification.
> The ledger is the audit trail.
> The recall system closes the loop.
>
> The best AI-generated code is the code it did not need to generate."

---

## All commands (quick reference)

Run from repo root (`assemblykit-demo/`):

```bash
# Principle
node assemblykit/scripts/assemblykit.mjs explain

# Catalog
node assemblykit/scripts/assemblykit.mjs list

# Registry — all versions
node assemblykit/scripts/assemblykit.mjs registry

# Registry — with profile
node assemblykit/scripts/assemblykit.mjs registry --profile fort-knox
node assemblykit/scripts/assemblykit.mjs registry --profile high-scale
node assemblykit/scripts/assemblykit.mjs registry --profile rapid-prototype

# Build
node assemblykit/scripts/assemblykit.mjs build "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"
node assemblykit/scripts/assemblykit.mjs build --with-registry --profile fort-knox "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"

# Manufacture
node assemblykit/scripts/assemblykit.mjs manufacture company.stale_filter

# Supply chain
node assemblykit/scripts/assemblykit.mjs ledger
node assemblykit/scripts/assemblykit.mjs recall generic.stale_record_detector@2.1.0
node assemblykit/scripts/assemblykit.mjs reassemble asm-2026-001
node assemblykit/scripts/assemblykit.mjs promote company.stale_filter
```

Reset the database:

```bash
cd demo-crm && php artisan migrate:fresh --seed
```
