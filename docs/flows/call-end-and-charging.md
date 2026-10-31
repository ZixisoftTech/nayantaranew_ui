# Ending and charging a call

```mermaid
flowchart TD
  A["App reports the end with seconds talked"] --> B{"Call is Answered (status 2)?"}
  B -- no --> X["Not charged<br/>(already ended or never answered)"]
  B -- yes --> C["Call set to Ended with its duration"]
  C --> D["Charge = seconds × school rate for this call type<br/>rounded up"]
  D --> E["Charge taken from the student<br/>and all of the student's parents"]
  E --> F["Balance never goes below 0"]
```

## Rules

- Endpoints: `POST /api/statusupdate-callhistory` (student), `POST /parent/parent-callend` (parent), `POST /api/update-min`.
- If the school settings can't be read, the raw seconds are charged.
- Code: `callCharge` in `nayantara/models/call_rules.js`.
