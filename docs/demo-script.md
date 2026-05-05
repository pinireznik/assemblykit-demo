# AssemblyKit Demo Script — 5-Minute Walkthrough

**Audience:** Technical stakeholders, engineering leads, potential adopters  
**Duration:** ~5 minutes  
**Setup:** Terminal open at the repo root (`assemblykit-demo/`). Laravel app running at http://localhost:8000.

```bash
# Start the app (if not already running)
cd demo-crm && php artisan serve
```

---

## Act 1 — The existing app (1 min)

**Narrative:** "Here's a simple CRM. Companies, employees. A working base."

1. Open http://localhost:8000/dashboard
   - Point out: total companies card, total employees card, recently updated list
2. Click through to http://localhost:8000/companies
   - Point out: 5 companies, employee counts, last-updated timestamps
3. Click on **Acme Corp**
   - Point out: detail page with stat cards and employee table

**Key message:** This is a real Laravel app — SQLite, Blade views, seed data. Nothing invented.

---

## Act 2 — The feature request (30 sec)

**Narrative:** "The product manager asks for something new."

State the request out loud:

> "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days."

**Key message:** A normal feature request. A conventional AI would start generating code immediately. AssemblyKit does something different first.

---

## Act 3 — Explain the principle (30 sec)

```bash
node assemblykit/scripts/assemblykit.mjs explain
```

Read the output aloud. Let the line at the bottom land:

> The best AI-generated code is the code it did not need to generate.

---

## Act 4 — The catalog (45 sec)

**Narrative:** "Before writing anything, AssemblyKit checks what already exists."

```bash
node assemblykit/scripts/assemblykit.mjs list
```

Point out:
- 4 existing components (green ✓) — available for reuse right now
- 1 missing component (yellow ✦) — identified as needed, not yet built

**Key message:** The catalog makes the codebase's capabilities visible. `company.stale_filter` is already known to be missing — before a single line is written.

---

## Act 5 — The build analysis (1 min)

**Narrative:** "Now let's analyse the feature request."

```bash
node assemblykit/scripts/assemblykit.mjs build \
  "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"
```

Walk through the output:

- **Component search:** 3 found locally, 1 missing
- **Assembly decision:** Reuse 3, Manufacture 1, **Reuse ratio 75%**
- **Generated artefacts:** manifest, build plan, manufacturing plan already exist

**Key message:** 75% of this feature already exists. The AI identifies that before touching any code.

---

## Act 6 — The registry (45 sec)

**Narrative:** "Now imagine we have a verified component registry. What changes?"

First, show what's in the registry:

```bash
node assemblykit/scripts/assemblykit.mjs registry
```

Point out the quality metadata: verified, 24 tests, p95 < 10ms, security reviewed.

Then re-run the build with registry enabled:

```bash
node assemblykit/scripts/assemblykit.mjs build --with-registry \
  "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"
```

Point out:
- Registry search finds `generic.stale_record_detector`
- **Reuse ratio jumps to 100%**
- Manufacture drops to 0

**Key message:** Registry components raise the reuse floor. A single verified component can eliminate manufacturing entirely.

---

## Act 7 — The manufacturing plan (45 sec)

**Narrative:** "Back to the MVP — one component needs to be built. Here's what AssemblyKit tells us about it."

```bash
node assemblykit/scripts/assemblykit.mjs manufacture company.stale_filter
```

Walk through:
- **Target file:** `app/Services/StaleCompanyFilter.php`
- **Contract:** inputs, output, effects — the interface is defined before the code exists
- **Required tests:** 3 tests specified — the quality bar is set in advance

**Key message:** Manufacturing isn't ad-hoc code generation. It's a contract-first, test-driven process. The component enters the catalog when done — ready to be reused next time.

---

## Closing (30 sec)

**Narrative:** "What we showed:

1. A real app — not a mockup.
2. A feature request analysed before any code is written.
3. 75% reuse identified from the local catalog alone.
4. 100% reuse possible with a verified registry.
5. The one missing component specified with a clear contract and test obligations.

The principle is simple: **reuse before manufacture**.  
AssemblyKit makes that systematic."

---

## All commands (reference)

From the repo root (`assemblykit-demo/`):

```bash
# List local components by status
node assemblykit/scripts/assemblykit.mjs list

# Show verified registry components
node assemblykit/scripts/assemblykit.mjs registry

# Analyse a feature request (local catalog only)
node assemblykit/scripts/assemblykit.mjs build \
  "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"

# Analyse a feature request (with registry)
node assemblykit/scripts/assemblykit.mjs build --with-registry \
  "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"

# Show manufacturing plan for a missing component
node assemblykit/scripts/assemblykit.mjs manufacture company.stale_filter

# Print the AssemblyKit philosophy
node assemblykit/scripts/assemblykit.mjs explain
```

---

## Reset

```bash
# Reset the database
cd demo-crm && php artisan migrate:fresh --seed
```
