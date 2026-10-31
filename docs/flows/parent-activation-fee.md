# Parent activation fee

```mermaid
flowchart TD
  A["Parent logs in to the app"] --> B{"Login successful?"}
  B -- no --> X["Error"]
  B -- yes --> C{"Parent activated before?"}
  C -- yes --> Z["Nothing charged"]
  C -- no --> D["Mark activated now"]
  D --> E{"School activation fee above 0?"}
  E -- no --> Z
  E -- yes --> F["Fee × 60 seconds taken from the student<br/>and the student's parents"]
```

## Rules

- Parents who existed before this feature were marked as already activated (`activated_at`), so only new parents can be charged.
- The fee is charged once per parent, even if two logins happen at the same moment.
- Code: `activateParent` in `nayantara/models/call_rules.js`, called from parent login.
