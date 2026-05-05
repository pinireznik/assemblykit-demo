# AssemblyKit Demo Script — 5-Minute Walkthrough

**Audience:** Technical stakeholders, engineering leads, potential adopters  
**Duration:** ~5 minutes  
**Setup:** Laravel app running at http://localhost:8000, terminal open in repo root

---

## Act 1 — The existing app (1 min)

**Narrative:** "Here's a simple CRM. It has companies and employees.
Nothing fancy — just a working base."

1. Open http://localhost:8000/dashboard
   - Point out: total companies, total employees, recently updated list
2. Click through to http://localhost:8000/companies
   - Point out: 5 companies, employee counts
3. Click on "Acme Corp" to show the detail page
   - Point out: employee table, last-updated card

**Key message:** This is a real, running Laravel app. Blade views, SQLite,
standard structure. Nothing invented.

---

## Act 2 — The feature request (30 sec)

**Narrative:** "A product manager asks: *Add a section to the dashboard that
highlights companies that haven't been updated in the last 30 days. We want
to know which accounts are going stale.*"

Display the request in plain text on screen.

**Key message:** A feature request. Traditional AI would immediately start
generating code. AssemblyKit does something different first.

---

## Act 3 — The analysis (1 min)

**Narrative:** "Before writing a single line of code, AssemblyKit analyses
what already exists."

In the terminal, from the repo root:

```bash
node assemblykit/scripts/assemblykit.mjs catalog
```

Show the output — 9 catalogued components.

**Narrative:** "Every component in this codebase is in the catalog.
Now let's run the analysis for this specific feature."

```bash
node assemblykit/scripts/assemblykit.mjs analyze \
  assemblykit/manifests/stale-company-dashboard.manifest.yaml
```

Point out the output:
- **Reuse scan:** 5 components reused
- **Manufacturing queue:** 3 components to build
- **Reuse ratio: 63%**

**Key message:** The system knows what it has. It doesn't start from scratch.
63% of this feature already exists.

---

## Act 4 — The manifest (1 min)

Open `assemblykit/manifests/stale-company-dashboard.manifest.yaml` in the editor.

Walk through the sections:

- `reused_components` — "These five components are used as-is.
  No new code. They're already there."
- `manufactured_components` — "These three are net-new.
  Notice: we considered the registry's stale-alert-banner but it was
  too heavy for an inline badge. We manufacture a smaller one."
- `assembly_steps` — "Numbered instructions. Add scope, extend controller,
  manufacture badge, create partial, extend view. Five steps."
- `summary` — "62.5% reuse. ~38 lines of net-new code instead of ~388."

**Key message:** The manifest is written before any code is touched.
It's the contract. The AI agent works from this, not from intuition.

---

## Act 5 — The outcome (1.5 min)

**Narrative:** "The build plan, manufacturing plan, and traceability report
were generated from the manifest."

Open `assemblykit/generated/build-plan.md` — point to the table: reuse vs extend vs manufacture.

Open `assemblykit/generated/traceability.md` — point to the full trace table
and the dependency graph.

**Narrative:** "Every component is accounted for. We know where it came from,
what was decided, and why. This is an audit trail that existed before
the first line was written."

**Key message:** AssemblyKit doesn't just help you build faster.
It gives you a record of *what was built, what was reused, and why*.

---

## Closing (30 sec)

**Narrative:** "What we showed:

1. A working app — real code, not a mockup.
2. A feature request handled with a reuse-first analysis.
3. A structured manifest that separates reuse from manufacture.
4. Generated artefacts: build plan, manufacturing plan, traceability.
5. A CLI that reads the catalog and manifest and explains the plan.

The principle is simple: **reuse before manufacture**.
The practice is what AssemblyKit makes systematic."

---

## Demo reset instructions

To reset the database for a clean demo:

```bash
cd demo-crm
php artisan migrate:fresh --seed
```

To run the CLI tools:

```bash
# From repo root
node assemblykit/scripts/assemblykit.mjs catalog
node assemblykit/scripts/assemblykit.mjs analyze assemblykit/manifests/stale-company-dashboard.manifest.yaml
```
