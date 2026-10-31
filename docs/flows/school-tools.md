# School tools for admins

The pages that came from the franchise portal (student and parent import, skip data) work on one school at a time. A school account is already scoped to itself. An admin picks a school first.

```mermaid
sequenceDiagram
  participant A as Admin in the portal
  participant P as School tools page
  participant API as Node API
  A->>P: open School Students and Import
  P-->>A: "Choose a school"
  A->>API: POST /api/school-token with school id
  API-->>A: token scoped to that school
  Note over A: saved as the page's school token,<br/>choice remembered in the nt_school cookie
  A->>P: page reloads for that school
  P->>API: same school endpoints the school account uses
```

## Rules

- Pages: `super_admin/school_*.php`.
- A sub admin needs at least one School Tools page in their permissions to get a school token.
- The school selector stays at the top of the page so the admin can switch schools.
