# Weekly minute allotment

A job inside the API runs every minute and credits each house once on its chosen day, at or after its chosen time (India time).

```mermaid
flowchart TD
  T["Every minute"] --> A["Find active houses where:<br/>today is the allotment day,<br/>the allotment time has passed,<br/>weekly minutes are above 0,<br/>not credited yet today"]
  A --> B["Claim the house: set last allotment to now<br/>(only one claim can succeed)"]
  B --> C["Coins = video min × video rate<br/>+ audio min × audio rate"]
  C --> D["Coins × 60 seconds added to every student<br/>in the house and their parents"]
  D --> L["Logged in tbl_allotment_log"]
```

## Example

10 video minutes at 1.5 and 5 audio minutes at 1 → 20 coins → **+1200 s** for every student in the house.

## Rules

- If the API was down at the allotment time, the credit happens when it comes back the same day.
- **Allot now:** the edit house form has an "Allot now" button that credits the house's saved weekly minutes immediately (super admin, or sub admin with manage access to Houses). It is an extra credit: the weekly schedule still runs. Logged with `source = 'manual'` (the weekly job logs `auto`).
- Code: `runAllotments` and `allotNow` (`POST /api/allot-now/:id`) in `nayantara/models/call_rules.js`, the job started from `nayantara/app.js`.
