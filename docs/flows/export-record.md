# Export a record

Clicking any student, parent, school or house in the portal opens its details panel. The download button exports that one record as a CSV.

```mermaid
flowchart LR
  C["Click a row or name"] --> PN["Details panel<br/>latest 15 items per list"]
  PN --> EX["Export button"]
  EX --> F["API returns the full record<br/>with no 15-item limit (?full=1)"]
  F --> CSV["CSV file: details, summary,<br/>then every list"]
```

| Record | Lists in the export |
|---|---|
| Student | Parents, calls, plans, payments, tickets |
| Parent | Calls, plans, tickets |
| School | Houses, plans, all students, all parents, plus the school settings |
| House | Students, their parents, plus the house settings |

## Rules

- API: `GET /api/lookup/{student|parent|franchise|department}/:id?full=1`. Code: `nayantara/models/lookup.js`, `assets/admin/js/nt-lookup.js`.
- Phone numbers and roll numbers with a leading zero are kept as text so Excel doesn't change them.
