# AssemblyKit Demo

An MVP demo of **AI-native software assembly** — the idea that building software
should always start with reuse before manufacture.

```
assemblykit-demo/
├── demo-crm/          Laravel app (SQLite, Blade views)
├── assemblykit/       AssemblyKit artefacts and CLI
│   ├── catalog/       Component catalogs (local + registry)
│   ├── manifests/     Assembly Manifests
│   ├── generated/     Build plan, manufacturing plan, traceability
│   └── scripts/       assemblykit.mjs CLI
└── docs/              Concept explanation and demo script
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| PHP | 8.2+ | `brew install php` |
| Composer | 2.x | https://getcomposer.org |
| Node.js | 18+ | https://nodejs.org |

---

## Setup

### 1. Install PHP dependencies

```bash
cd demo-crm
composer install
```

### 2. Copy the environment file

```bash
cp .env.example .env
php artisan key:generate
```

The app is pre-configured for SQLite. No database server needed.

### 3. Create the database and seed demo data

```bash
php artisan migrate --seed
```

This creates the SQLite database at `database/database.sqlite` and seeds:

| Company | Employees | Last updated |
|---|---|---|
| Acme Corp | 12 | 45 days ago |
| Bright Labs | 15 | 5 days ago |
| Cedar Systems | 4 | 60 days ago |
| Delta Works | 20 | 40 days ago |
| Echo Studio | 2 | 1 day ago |

### 4. Start the development server

```bash
php artisan serve
```

Open http://localhost:8000

---

## Running the demo

### Laravel app

| URL | Description |
|---|---|
| http://localhost:8000/dashboard | Dashboard with stats and recent companies |
| http://localhost:8000/companies | All companies with employee counts |
| http://localhost:8000/companies/{id} | Company detail with employee list |

### AssemblyKit CLI

Run these from the **repo root** (`assemblykit-demo/`):

```bash
# List all catalogued components in the CRM
node assemblykit/scripts/assemblykit.mjs catalog

# Analyse the stale-company feature manifest
node assemblykit/scripts/assemblykit.mjs analyze \
  assemblykit/manifests/stale-company-dashboard.manifest.yaml

# Show help
node assemblykit/scripts/assemblykit.mjs help
```

---

## Demo flow (5 min)

See [docs/demo-script.md](docs/demo-script.md) for the full annotated walkthrough.

Short version:
1. Show the running CRM
2. State the feature request ("highlight stale companies on the dashboard")
3. Run `assemblykit.mjs catalog` — 9 components already exist
4. Run `assemblykit.mjs analyze` — 5 reused, 3 manufactured, 63% reuse ratio
5. Walk through the manifest and generated artefacts

---

## Key files

| File | Purpose |
|---|---|
| `assemblykit/catalog/local.components.yaml` | All components in the CRM |
| `assemblykit/catalog/registry.components.yaml` | Illustrative shared registry |
| `assemblykit/manifests/stale-company-dashboard.manifest.yaml` | Feature manifest |
| `assemblykit/generated/build-plan.md` | What gets built and how |
| `assemblykit/generated/manufacturing-plan.md` | Net-new code only |
| `assemblykit/generated/traceability.md` | Full component audit trail |
| `docs/concept.md` | AssemblyKit concepts explained |
| `docs/demo-script.md` | Annotated 5-minute demo script |

---

## Reset

To wipe the database and re-seed:

```bash
cd demo-crm
php artisan migrate:fresh --seed
```

---

## Concept

See [docs/concept.md](docs/concept.md) for a full explanation of:
- AssemblyKit and AI-native software assembly
- The "reuse before manufacture" principle
- Manufacturing vs. assembly
- The Assembly Manifest
- Component catalogues and the verified registry concept
