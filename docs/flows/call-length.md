# Call length

Before the call, the app asks `POST /api/get-callminute` how long this call may last, and disconnects at that point.

```mermaid
flowchart LR
  A["Balance in seconds<br/>÷ rate for the call type"] --> MIN
  B["House max call duration<br/>(if not 0)"] --> MIN
  C["Daily allowance left today<br/>(if set)"] --> MIN
  D["24 hours"] --> MIN
  MIN{"Smallest of these"} --> R["Response: data = whole minutes,<br/>seconds = exact seconds"]
```

## Example

600 s balance, video at 1.5 coins/min, house cap 120 s → **120 s**.
With the house cap at 0 → **400 s** for video, **600 s** for audio.

## Rules

- Send `call_type` (`audio` / `video`) so the right rate is used.
- `data` is whole minutes and shows 0 when less than a minute is left; use `seconds` for the exact limit.
- Code: `callMinute` in `student_fcmtoken.js`, `allowedCallSeconds` in `call_rules.js`.
