# Signing in to the portal

There is one login page for everyone (`/`). The email decides the role.

```mermaid
flowchart TD
  A["Email + password on the login page"] --> B{"Email in tbl_admin?"}
  B -- yes --> C{"Password correct<br/>and account active?"}
  C -- no --> X["Error shown"]
  C -- yes --> D{"role column"}
  D -- super_admin --> E["Super Admin token"]
  D -- sub_admin --> F["Sub Admin token<br/>with page permissions"]
  B -- no --> G{"Email in tbl_franchise?"}
  G -- no --> X
  G -- yes --> H{"Password correct<br/>and school active?"}
  H -- no --> X
  H -- yes --> I["School token"]
  E & F & I --> J["Token saved in the nt_token cookie<br/>valid 30 days"]
  J --> K["Portal page checks the cookie on the server<br/>and builds the menu for that role"]
```

## Rules

- API: `POST /api/portal-login`. Code: `nayantara/models/auth.js`, `include/auth.php`, `super_admin/login.php`.
- Each portal page is checked on the server before it loads. No valid cookie sends you to the login page. A page you can't open sends you to your first allowed page.
- An email can belong to only one login. Creating a school or sub admin with an email that is already used is refused.
- Sub admin passwords are stored encrypted. Existing admin and school passwords still work as before.
- Old `/franchise/...` page links redirect to the login page.
