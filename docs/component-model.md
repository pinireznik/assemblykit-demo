# Component Model

Every component in AssemblyKit is described by a structured metadata block in
a YAML catalog. The schema is designed to give an AI agent — or a human reader —
enough information to decide whether a component can be reused for a given task.

---

## Fields

### `id`

A dot-namespaced identifier: `<domain>.<capability>`.

```yaml
id: company.stale_filter
```

IDs are stable references. They appear in Assembly Manifests, traceability
reports, and CLI output. Changing an ID is a breaking change.

---

### `kind`

The nature of the component's work:

| Kind | Meaning |
|---|---|
| `data` | Reads or writes persistent state (database, file, API) |
| `logic` | Transforms or filters data without I/O |
| `ui` | Renders output to the user |

```yaml
kind: logic
```

Kind helps an agent understand how a component fits into a data-flow pipeline.
A `logic` component can be safely composed between a `data` source and a `ui`
renderer without side effects.

---

### `description`

A plain-English description of what the component does — written from the
perspective of a caller deciding whether to reuse it.

```yaml
description: >
  Filters a list of companies down to those that have not been updated
  within a given number of days and optionally meet a minimum employee count.
```

Good descriptions answer: *what does it do, given what, returning what?*

---

### `inputs`

The typed parameters the component accepts.

```yaml
inputs:
  - name: companies
    type: list<Company>
    required: true
  - name: stale_days
    type: integer
    required: true
  - name: min_employee_count
    type: integer
    required: false
    default: 0
```

Each input has:
- `name` — the parameter name
- `type` — a type annotation (not enforced, used for documentation and AI reasoning)
- `required` — whether the caller must supply it
- `default` — the value used when the input is omitted (optional fields only)

---

### `outputs`

What the component returns.

```yaml
outputs:
  - name: stale_companies
    type: list<Company>
```

Outputs are typed for the same reason as inputs: to let an agent trace data
flow across a pipeline without reading implementation code.

---

### `effects`

Side-effects the component has on the system:

```yaml
effects:
  reads:    [companies]   # tables / collections read
  writes:   []            # tables / collections written
  external: []            # external services called
```

A `logic` component with empty `reads`, `writes`, and `external` is a pure
function — the safest kind to reuse. A `data` component with `reads: [companies]`
signals that it depends on database state and should not be used in contexts
where the database is unavailable.

---

### `status`

Whether the component is available for reuse:

| Status | Meaning |
|---|---|
| `existing` | Implemented and catalogued — available for reuse right now |
| `missing` | Identified as needed, not yet built — a manufacturing target |

```yaml
status: existing
```

Recording a component as `missing` before building it is intentional. It
prevents duplicate manufacturing when the same need arises from a different
feature request, and lets the Assembly Manifest reference it by ID even before
the implementation exists.

---

### `implementation`

The path to the file that implements this component (set after manufacturing).

```yaml
implementation: app/Services/StaleCompanyFilter.php
```

For `data` components this often points to a model file; for `ui` components
it points to a view or component template.

---

### `quality`

Test coverage and location (set after manufacturing or for existing components
that have been audited):

```yaml
quality:
  tests: 5
  test_file: tests/Feature/StaleCompanyDashboardTest.php
```

Registry components carry an extended quality block:

```yaml
quality:
  verification: verified
  tests: 24
  benchmark: "p95 < 10ms for 10k records"
  security: reviewed
```

Quality metadata is what differentiates a registry component from a local one.
It signals that the component has been independently validated, not just written.

---

## Full example

```yaml
- id: company.stale_filter
  kind: logic
  status: existing
  description: >
    Filters a list of companies down to those that have not been updated
    within a given number of days and optionally meet a minimum employee count.
  inputs:
    - name: companies
      type: list<Company>
      required: true
    - name: stale_days
      type: integer
      required: true
    - name: min_employee_count
      type: integer
      required: false
      default: 0
  outputs:
    - name: stale_companies
      type: list<Company>
  effects:
    reads:    []
    writes:   []
    external: []
  implementation: app/Services/StaleCompanyFilter.php
  quality:
    tests: 5
    test_file: tests/Feature/StaleCompanyDashboardTest.php
```

---

## Design notes

The schema is intentionally capability-focused, not file-focused. A single file
(`app/Models/Company.php`) can provide multiple catalogued capabilities:
`company.list`, `company.get`, and `employee.count_by_company` are all
implemented in the same file but catalogued as separate components because
they satisfy different needs.

This distinction matters at assembly time. An AI agent searching for "returns
all companies" and one searching for "returns employee count" are looking for
different things. The catalog lets them find the right capability without
reading implementation files.
