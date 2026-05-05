# Component Assembly Graph — Stale Company Dashboard Card

```mermaid
flowchart TD
    REQ["Feature Request\n'companies with 10+ employees,\n30+ days stale'"]
    MAN["Assembly Manifest"]
    LIST["company.list\n── data · existing ──"]
    COUNT["employee.count_by_company\n── data · existing ──"]
    FILTER["company.stale_filter\n── logic · manufactured ──"]
    CARD["dashboard.card\n── ui · existing ──"]
    FEAT["Dashboard Feature\n'Needing Attention' card"]

    REQ --> MAN
    MAN --> LIST
    MAN --> COUNT
    MAN --> FILTER
    MAN --> CARD
    LIST --> FILTER
    COUNT --> FILTER
    FILTER --> CARD
    CARD --> FEAT

    style REQ  fill:#e2e8f0,stroke:#94a3b8,color:#1e293b
    style MAN  fill:#dbeafe,stroke:#3b82f6,color:#1e293b
    style LIST   fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style COUNT  fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style CARD   fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style FILTER fill:#fef9c3,stroke:#eab308,color:#1e293b
    style FEAT fill:#f0fdf4,stroke:#16a34a,color:#1e293b
```

**Green** — reused from local catalog  
**Yellow** — manufactured component (net-new)  
**Blue** — Assembly Manifest (decision record)

---

## Registry-enhanced path

With the Verified Component Registry, manufacturing drops to zero:

```mermaid
flowchart TD
    REG["Verified Component Registry"]
    DET["generic.stale_record_detector\n── logic · verified · 24 tests ──"]
    FILTER["company.stale_filter\n── no longer manufactured ──"]
    NOTE["Reuse ratio: 100%\nManufacture: 0"]

    REG --> DET
    DET -->|"covers timestamp filtering"| FILTER
    DET -->|"raises reuse floor"| NOTE

    style REG    fill:#ede9fe,stroke:#8b5cf6,color:#1e293b
    style DET    fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style FILTER fill:#dcfce7,stroke:#22c55e,color:#1e293b
    style NOTE   fill:#f0fdf4,stroke:#16a34a,color:#1e293b
```

**Purple** — Verified Component Registry source  
**Green** — components resolved as reuse (no manufacturing needed)

---

## Reuse ratio summary

| Path | Reuse | Manufacture | Ratio |
|---|---|---|---|
| Local catalog only | 3 | 1 | 75% |
| With Verified Component Registry | 4 | 0 | **100%** |
