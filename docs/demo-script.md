# AssemblyKit — 5-Minute Demo Script

**Audience:** Technical stakeholders, engineering leads, potential adopters  
**Duration:** ~5 minutes  
**Setup:** Terminal open at repo root (`assemblykit-demo/`). Browser ready.

```bash
# Start the app before the demo
cd demo-crm && php artisan serve
```

---

## Opening

> "Today AI coding tools often manufacture code immediately. AssemblyKit shows
> a different model: design the product, search for components, reuse what
> exists, manufacture only what is missing, then assemble."

---

## Step 1 — Show the CRM before the feature  *(~45 sec)*

Open http://localhost:8000/dashboard

Point out:
- Two stat cards: Total Companies, Total Employees
- Recently Updated table below

Go to http://localhost:8000/companies

Point out:
- Five companies, employee counts, last-updated timestamps
- Acme Corp: 12 employees, updated 45 days ago — nothing flags it yet

Click **Acme Corp** — show the detail page.

> "This is a real Laravel app. SQLite, Blade views, seeded data. Nothing invented."

---

## Step 2 — State the feature request  *(~20 sec)*

Read out loud:

> "Add a dashboard card showing companies with more than 10 employees
> and no updates in 30 days."

> "A conventional AI tool would start generating code right now. AssemblyKit
> does something different first."

---

## Step 3 — Explain the principle  *(~30 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs explain
```

Read the output. Let the last line land.

---

## Step 4 — Show the component catalog  *(~45 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs list
```

Point out:
- Green checkmarks — components available for reuse right now
- Each one has a kind (`data`, `logic`, `ui`) and a description

> "The catalog makes the codebase's capabilities visible as a structured
> inventory. Before writing anything, we know what we have."

---

## Step 5 — Analyse the feature request  *(~1 min)*

```bash
node assemblykit/scripts/assemblykit.mjs build "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"
```

Walk through the output section by section:

- **Component search:** three components found in the local catalog
- **Missing:** `company.stale_filter` — identified before a line is written
- **Assembly decision:** Reuse 3, Manufacture 1, **reuse ratio 75%**
- **Assembly Manifest:** the YAML file that records every decision

Open the manifest:

```bash
cat assemblykit/manifests/stale-company-dashboard.manifest.yaml
```

> "The Assembly Manifest is written before any code is touched. It is the
> contract between the AI agent and the developer."

---

## Step 6 — Show the manufactured component  *(~30 sec)*

```bash
node assemblykit/scripts/assemblykit.mjs manufacture company.stale_filter
```

The component is already implemented. The CLI shows:
- Implementation file
- Test coverage

Open the file:

```bash
cat demo-crm/app/Services/StaleCompanyFilter.php
```

> "This is the one net-new file for this entire feature. Everything else was reuse."

---

## Step 7 — Run the tests  *(~20 sec)*

```bash
cd demo-crm && php artisan test
```

Seven tests pass. Point out:

- Three unit-level tests on `StaleCompanyFilter` directly
- Two HTTP tests on the dashboard route

> "The quality bar was defined in the Assembly Manifest before the component was built."

---

## Step 8 — Show the final dashboard  *(~20 sec)*

Open http://localhost:8000/dashboard

Point out:
- Third stat card: **Needing Attention — 2**
- The "Companies needing attention" table: Acme Corp and Delta Works
- Amber badges showing days since last update

> "The feature is live. Two companies flagged. The CRM now surfaces the signal
> the product manager asked for."

---

## Step 9 — The registry changes everything  *(~45 sec)*

```bash
cd .. && node assemblykit/scripts/assemblykit.mjs build --with-registry "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"
```

Point out:
- Registry search finds `generic.stale_record_detector`
- Quality metadata: verified, 24 tests, p95 < 10ms, security reviewed
- **Reuse ratio jumps to 100%**
- Manufacture drops to zero

> "With a verified registry, this feature requires no manufacturing at all.
> The AI assembles entirely from existing, tested parts."

Show the registry:

```bash
node assemblykit/scripts/assemblykit.mjs registry
```

---

## Step 10 — The vision  *(~30 sec)*

> "What you saw was a local catalog and a hand-crafted registry entry.
> The real vision is larger:
>
> Every project scans its codebase and builds a catalog automatically.
> Every organisation maintains a verified registry shared across teams.
> A public marketplace of production-grade components raises the floor further.
>
> Engineers work at the assembly level. Manufacturing becomes rare —
> reserved for the genuinely novel delta that no existing component covers.
>
> The AI's job is not to generate code. It is to find the right components
> and assemble them correctly."

---

## Closing

> "The best AI-generated code is the code it did not need to generate."

---

## All commands (quick reference)

Run from repo root (`assemblykit-demo/`):

```bash
node assemblykit/scripts/assemblykit.mjs explain

node assemblykit/scripts/assemblykit.mjs list

node assemblykit/scripts/assemblykit.mjs build "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"

node assemblykit/scripts/assemblykit.mjs build --with-registry "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"

node assemblykit/scripts/assemblykit.mjs manufacture company.stale_filter

node assemblykit/scripts/assemblykit.mjs registry
```

Reset the database:

```bash
cd demo-crm && php artisan migrate:fresh --seed
```
