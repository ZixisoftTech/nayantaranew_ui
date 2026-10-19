# Call states

```mermaid
stateDiagram-v2
  [*] --> Ringing: call started (status 0)
  Ringing --> Answered: parent accepts (status 2)
  Ringing --> Ended: parent declines or call is cancelled (status 3)
  Answered --> Ended: student or parent ends the call (status 3)
  Ended --> [*]
```

| Status | Meaning | Set by |
|---|---|---|
| 0 | Ringing | Call start (`/api/firebase/notification`) |
| 2 | Answered | Parent accepts (`/parent/status-updateparent`) |
| 3 | Ended | Parent declines, call cancelled (`/parent/parent-calldefuse`), or call ended |

## Rules

- Only a call that goes from Answered to Ended is charged, and only once even if both apps report the end.
- A declined or unanswered call costs nothing.
