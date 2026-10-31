# Starting a call

The student taps a parent on the tablet. The app calls `POST /api/firebase/notification` with the parent id and `call_type` (`audio` or `video`; video if missing).

```mermaid
flowchart TD
  A["Student taps a parent"] --> B{"Parent and student found?"}
  B -- no --> E1["Error"]
  B -- yes --> C{"Audio call and<br/>school disallows audio?"}
  C -- yes --> E2["Audio calls are not enabled"]
  C -- no --> D{"Calls today that count<br/>at or over max per day?"}
  D -- yes --> E3["Daily call limit reached"]
  D -- no --> F{"Talk time today<br/>at or over daily allowance?"}
  F -- yes --> E4["Daily talk time limit reached"]
  F -- no --> G{"Student and parent balance<br/>both used up?"}
  G -- yes --> E5["Minutes not available"]
  G -- no --> H{"Now inside one of the<br/>house's calling time slots?"}
  H -- no --> E6["Not your calling time"]
  H -- yes --> I["Send Firebase notification to the parent's phone"]
  I --> J["Call saved with status 0 (ringing)<br/>and its call type"]
```

## Rules

- "Calls today that count" means ended calls today that lasted at least the school's minimum call duration.
- A limit set to 0 is not checked.
- Code: `fcmToken` in `nayantara/models/student/student_fcmtoken.js`, `callBlockReason` in `nayantara/models/call_rules.js`.
