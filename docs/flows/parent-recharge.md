# Parent recharge

```mermaid
flowchart TD
  A["Parent opens plans"] --> P["App reads /parent/get-planpermission<br/>allow_parental_recharge, allow_audio_calls"]
  P --> B["Parent buys a plan or starts a PhonePe payment"]
  B --> C{"School allows parental recharge?"}
  C -- no --> X["Recharge is not enabled for this school"]
  C -- yes --> D["Purchase saved"]
  D --> E["Plan minutes added to the student<br/>and the parents"]
```

## Rules

- Blocked endpoints when recharge is off: `POST /parent/planpurchase/parent`, `POST /api/phonepe-payement`.
- Code: `rechargeBlockReason` in `nayantara/models/call_rules.js`.
