# AssemblyKit

**AI-native software assembly. Reuse before manufacture.**

Most AI coding tools receive a feature request and immediately generate code —
even when large parts of the feature already exist. AssemblyKit enforces a
different model: **search first, manufacture only what is missing, then assemble**.

---

## The analogy

A chip designer does not lay out new circuits for every product.  
They reuse verified IP blocks, compose them, and manufacture the delta.

Software should work the same way. Every codebase is a catalog of capabilities.
Every feature request is mostly assembly of existing parts.

AssemblyKit makes that explicit.

---

## Manufacturing vs Assembly

| | Manufacturing | Assembly |
|---|---|---|
| **What** | Creating a new, self-contained component | Wiring existing components together |
| **When** | Only when no suitable component exists | Always — it's the primary activity |
| **Output** | A catalogued component, ready for reuse | A working feature |
| **Net-new code** | Yes | Minimal — configuration and glue only |

**The principle: reuse before manufacture.**  
Measure it. Track it. Enforce it before any code is written.

---

## What the demo shows

A real Laravel CRM with five seed companies. A product manager requests:

> "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days."

AssemblyKit analyses the request before writing any code:

- **3 components** already exist in the local catalog → reuse immediately
- **1 component** is missing → manufacture it with a defined contract
- **Reuse ratio: 75%** from the local catalog alone
- **Reuse ratio: 100%** when the verified registry is included

The demo then shows the manufactured component implemented, tests passing, and
the feature live in the browser.

---

## Repository layout

```
assemblykit-demo/
├── demo-crm/                  Laravel 11 app (SQLite, Blade views)
├── assemblykit/
│   ├── catalog/               Component catalogs
│   │   ├── local.components.yaml     CRM capabilities
│   │   └── registry.components.yaml  Verified shared registry
│   ├── manifests/             Assembly Manifests (one per feature)
│   ├── generated/             Build plan, manufacturing plan, traceability
│   └── scripts/
│       └── assemblykit.mjs    CLI (pure Node.js, no dependencies)
└── docs/
    ├── concept.md             Core concepts explained
    ├── component-model.md     Component schema reference
    ├── future-vision.md       Where this goes next
    └── demo-script.md         Annotated 5-minute demo walkthrough
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| PHP | 8.2+ | `brew install php` |
| Composer | 2.x | https://getcomposer.org |
| Node.js | 18+ | https://nodejs.org |

No database server needed. The app uses SQLite.

---

## Setup

```bash
cd demo-crm

composer install

cp .env.example .env
php artisan key:generate

php artisan migrate --seed
```

The seeder creates five companies with different staleness and headcounts:

| Company | Employees | Last updated |
|---|---|---|
| Acme Corp | 12 | 45 days ago |
| Bright Labs | 15 | 5 days ago |
| Cedar Systems | 4 | 60 days ago |
| Delta Works | 20 | 40 days ago |
| Echo Studio | 2 | 1 day ago |

---

## Run the app

```bash
cd demo-crm
php artisan serve
```

| URL | Description |
|---|---|
| http://localhost:8000/dashboard | Dashboard with stats, attention list, recent companies |
| http://localhost:8000/companies | All companies with employee counts |
| http://localhost:8000/companies/{id} | Company detail with employee list |

---

## Run the tests

```bash
cd demo-crm
php artisan test
```

Seven tests covering the filter logic and HTTP rendering.

---

## AssemblyKit CLI

Run all commands from the **repo root** (`assemblykit-demo/`).

```bash
# Print the AssemblyKit philosophy
node assemblykit/scripts/assemblykit.mjs explain

# List all catalogued components (status, kind, description)
node assemblykit/scripts/assemblykit.mjs list

# Analyse a feature request — local catalog only (75% reuse)
node assemblykit/scripts/assemblykit.mjs build "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"

# Same analysis with the verified registry (100% reuse)
node assemblykit/scripts/assemblykit.mjs build --with-registry "Add a dashboard card showing companies with more than 10 employees and no updates in 30 days"

# Show the manufacturing plan for a component
node assemblykit/scripts/assemblykit.mjs manufacture company.stale_filter
```

---

## Key files

| File | Purpose |
|---|---|
| `assemblykit/catalog/local.components.yaml` | All catalogued components in the CRM |
| `assemblykit/catalog/registry.components.yaml` | Illustrative verified registry |
| `assemblykit/manifests/stale-company-dashboard.manifest.yaml` | Assembly Manifest for the demo feature |
| `assemblykit/generated/build-plan.md` | What gets built and how |
| `assemblykit/generated/manufacturing-plan.md` | Net-new code specification |
| `assemblykit/generated/traceability.md` | Full component audit trail |
| `demo-crm/app/Services/StaleCompanyFilter.php` | The manufactured component |

---

## Reset

```bash
cd demo-crm
php artisan migrate:fresh --seed
```

---

## Learn more

- [docs/concept.md](docs/concept.md) — AssemblyKit concepts in depth
- [docs/component-model.md](docs/component-model.md) — component schema reference
- [docs/future-vision.md](docs/future-vision.md) — where this goes next
- [docs/demo-script.md](docs/demo-script.md) — annotated 5-minute demo walkthrough
