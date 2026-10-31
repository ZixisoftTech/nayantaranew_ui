# Nayan Tara: all system flows

Every flow in one file. The same content is split into one file per flow in this folder (see [README.md](README.md)); this file includes all of them.

## Contents

**Basics**

- [Big picture](#big-picture)
- [Coins and balance](#coins-and-balance)

**Portal**

- [Signing in to the portal](#signing-in-to-the-portal)
- [Roles and access](#roles-and-access)
- [School tools for admins](#school-tools-for-admins)
- [School and house settings](#school-and-house-settings)
- [Bulk student import](#bulk-student-import)
- [Export a record](#export-a-record)

**Calls and money**

- [Starting a call](#starting-a-call)
- [Call states](#call-states)
- [Call length](#call-length)
- [Ending and charging a call](#ending-and-charging-a-call)
- [Parent recharge](#parent-recharge)
- [Parent activation fee](#parent-activation-fee)
- [Weekly minute allotment](#weekly-minute-allotment)

**Reference**

- [App endpoints](#app-endpoints)

---

## Big picture

Three front ends talk to one Node API, which owns the MySQL database. The API also sends call notifications through Firebase, takes payments through PhonePe and runs the weekly allotment job.

```mermaid
flowchart LR
  S["Student app<br/>(tablet in a house)"] --> API
  P["Parent app"] --> API
  W["Portal<br/>super admin, sub admin, school"] --> API
  API["Node API"] --> DB[("MySQL")]
  API --> FCM["Firebase<br/>call notification"]
  FCM --> P
  API --> PP["PhonePe<br/>payments"]
  JOB["Weekly allotment job<br/>runs every minute"] --> DB
```

### Rules

- A **school** is a row in `tbl_franchise`. A **house** is a row in `tbl_department` and belongs to one school.
- Each student belongs to one school and one house. Each parent is linked to one student.
- The house's **Device ID** is the tablet the students of that house use.

| Part | Where |
|---|---|
| Portal (PHP) | `super_admin/*.php`, `include/` |
| API (Node) | `nayantara/` |
| Rules for calls, recharge, activation, allotment | `nayantara/models/call_rules.js` |
| Portal sign-in and sub admins | `nayantara/models/auth.js`, `include/auth.php` |

---

## Coins and balance

Balances are stored as **seconds of talk time** in `total_talktime`, on the student and copied on each of the student's parents. **1 Spacs Coin = 1 minute of balance.**

```mermaid
flowchart LR
  PLAN["Plan bought by parent"] -- "+ plan minutes" --> BAL["Balance<br/>(seconds, student + parents)"]
  ALLOT["Weekly allotment"] -- "+ coins × 60" --> BAL
  BAL -- "− seconds × rate" --> CALL["Video / audio call"]
  BAL -- "− fee × 60, once" --> ACT["Parent activation fee"]
```

| Thing | How it becomes balance | Example |
|---|---|---|
| Plan bought by a parent | Plan minutes added to the student and the parents | 30 min plan → +1800 s |
| Video call | Seconds talked × school video rate | 100 s at 1.5 → −150 s |
| Audio call | Seconds talked × school audio rate | 100 s at 1.0 → −100 s |
| Parent activation fee | Fee coins × 60, once per parent | 2 coins → −120 s |
| Weekly allotment | (video min × video rate + audio min × audio rate) × 60 | 10 + 5 min → +1200 s |

### Rules

- Deductions never take a positive balance below 0. A balance that is already negative is left as it is.
- Every change is applied to the student and to all of that student's parents, so both apps show the same balance.

---

## Signing in to the portal

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

### Rules

- API: `POST /api/portal-login`. Code: `nayantara/models/auth.js`, `include/auth.php`, `super_admin/login.php`.
- Each portal page is checked on the server before it loads. No valid cookie sends you to the login page. A page you can't open sends you to your first allowed page.
- An email can belong to only one login. Creating a school or sub admin with an email that is already used is refused.
- Sub admin passwords are stored encrypted. Existing admin and school passwords still work as before.
- Old `/franchise/...` page links redirect to the login page.

---

## Roles and access

| Role | Who | Sees | Data |
|---|---|---|---|
| **Super Admin** | Owner account | Every admin page, School Tools and Sub Admins | All schools |
| **Sub Admin** | Staff created on the Sub Admins page | Only the pages ticked for them, each as View or Manage | All schools |
| **School** | The email + password set on the school | The old franchise pages: Dashboard, Students, Parents, Transactions, Call History, Skip Data | Their own school only |

```mermaid
flowchart LR
  P["Sub admin opens a page"] --> Q{"Page in their permissions?"}
  Q -- no --> R["Redirect to their first page"]
  Q -- "yes, View" --> V["Page opens read-only<br/>Create, Edit, Delete and status buttons hidden and blocked<br/>Viewing records and export still work"]
  Q -- "yes, Manage" --> M["Page works fully"]
```

### Rules

- The super admin creates sub admins on **Administration → Sub Admins** and sets each page to No access, View or Manage.
- Changes to a sub admin's access take effect the next time they sign in.
- School logins are listed on the Sub Admins page too; their email, password and active status are edited on the school itself.
- The page list lives in `nt_pages()` in `include/auth.php`.

> **Limit:** the portal controls which pages and buttons a sub admin can use. The data API itself does not check logins yet, so someone calling the API directly is not stopped.

---

## School tools for admins

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

### Rules

- Pages: `super_admin/school_*.php`.
- A sub admin needs at least one School Tools page in their permissions to get a school token.
- The school selector stays at the top of the page so the admin can switch schools.

---

## School and house settings

Set on the **Schools** and **Houses** pages in the portal. Missing database columns are added automatically when the API starts.

```mermaid
flowchart LR
  ADMIN["Admin saves a school or house"] --> CHECK{"Values valid?<br/>numbers ≥ 0, logo PNG/JPG ≤ 512 KB,<br/>notices ≤ 2000 chars"}
  CHECK -- no --> ERR["Error shown"]
  CHECK -- yes --> DB[("tbl_franchise / tbl_department")]
  DB --> RULES["Call, recharge, activation<br/>and allotment rules"]
  DB --> APPS["Settings endpoints<br/>for the apps"]
```

| Setting | Level | Default | Where it is enforced |
|---|---|---|---|
| Logo | School | None | Returned to the apps by the settings endpoints |
| Allow parental recharge | School | On | [Parent recharge](#parent-recharge) |
| Allow audio calls | School | On | [Starting a call](#starting-a-call) |
| Video rate / audio rate | School | 1 coin/min each | [Call length](#call-length), [charging](#ending-and-charging-a-call), [allotment](#weekly-minute-allotment) |
| Parent activation fee | School | 0 | [Activation fee](#parent-activation-fee) |
| Max calls per day | School | 0 = unlimited | [Starting a call](#starting-a-call) |
| Daily duration allowance | School | 0 = unlimited | [Starting a call](#starting-a-call), [call length](#call-length) |
| Min call duration to count | School | 30 s | Shorter calls don't count towards the two daily limits |
| Max call duration | House | 120 s (0 = unlimited) | [Call length](#call-length) |
| Allotment day, time, weekly video and audio minutes | House | Sunday 07:00 IST, 0 min | [Weekly allotment](#weekly-minute-allotment) |
| Parent notice, student notice | House | Empty, up to 2000 characters | [App endpoints](#app-endpoints) |
| Calling time slots | House | Set per day | [Starting a call](#starting-a-call) |

The defaults keep the old behaviour, so nothing changes for a school until someone edits its settings.

---

## Bulk student import

From the super admin **Students** page there is no school to pick: each row's `department_id` (house ID) decides the school. From a school's own Students page, the school is fixed.

```mermaid
flowchart TD
  U["Upload CSV"] --> R["Read each row"]
  R --> H{"House ID exists?<br/>(and in this school, if a school is fixed)"}
  H -- "no, and no school fixed" --> UN["Not imported<br/>counted as unknown house"]
  H -- "no, school fixed" --> SK["Saved to Student Skip Data"]
  H -- yes --> D{"Roll no already in that school?"}
  D -- yes --> SK
  D -- no --> ADD["Student added to the house's school<br/>parents from the row added too"]
  ADD & SK & UN --> SUM["Summary shown:<br/>added, skipped, unknown house, failed"]
```

### Rules

- API: `POST /import-csv` (code in `nayantara/app.js`, `uploadCsv`).
- CSV columns: name, roll no, password, house ID, contact, three reference fields, default plan, auto recharge, then up to five parent name and contact pairs. Sample: `assets/student.csv`.
- The house ID is the ID column on the Houses page.
- The import writes `other_ref_1`–`3`, `defaultplan` and `autorecharge` on `tbl_student`; a database without those columns can't save new students (counted as failed).

---

## Export a record

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

### Rules

- API: `GET /api/lookup/{student|parent|franchise|department}/:id?full=1`. Code: `nayantara/models/lookup.js`, `assets/admin/js/nt-lookup.js`.
- Phone numbers and roll numbers with a leading zero are kept as text so Excel doesn't change them.

---

## Starting a call

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

### Rules

- "Calls today that count" means ended calls today that lasted at least the school's minimum call duration.
- A limit set to 0 is not checked.
- Code: `fcmToken` in `nayantara/models/student/student_fcmtoken.js`, `callBlockReason` in `nayantara/models/call_rules.js`.

---

## Call states

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

### Rules

- Only a call that goes from Answered to Ended is charged, and only once even if both apps report the end.
- A declined or unanswered call costs nothing.

---

## Call length

Before the call, the app asks `POST /api/get-callminute` how long this call may last, and disconnects at that point.

```mermaid
flowchart LR
  A["Balance in seconds<br/>÷ rate for the call type"] --> MIN
  B["House max call duration<br/>(if not 0)"] --> MIN
  C["Daily allowance left today<br/>(if set)"] --> MIN
  D["24 hours"] --> MIN
  MIN{"Smallest of these"} --> R["Response: data = whole minutes,<br/>seconds = exact seconds"]
```

### Example

600 s balance, video at 1.5 coins/min, house cap 120 s → **120 s**.
With the house cap at 0 → **400 s** for video, **600 s** for audio.

### Rules

- Send `call_type` (`audio` / `video`) so the right rate is used.
- `data` is whole minutes and shows 0 when less than a minute is left; use `seconds` for the exact limit.
- Code: `callMinute` in `student_fcmtoken.js`, `allowedCallSeconds` in `call_rules.js`.

---

## Ending and charging a call

```mermaid
flowchart TD
  A["App reports the end with seconds talked"] --> B{"Call is Answered (status 2)?"}
  B -- no --> X["Not charged<br/>(already ended or never answered)"]
  B -- yes --> C["Call set to Ended with its duration"]
  C --> D["Charge = seconds × school rate for this call type<br/>rounded up"]
  D --> E["Charge taken from the student<br/>and all of the student's parents"]
  E --> F["Balance never goes below 0"]
```

### Rules

- Endpoints: `POST /api/statusupdate-callhistory` (student), `POST /parent/parent-callend` (parent), `POST /api/update-min`.
- If the school settings can't be read, the raw seconds are charged.
- Code: `callCharge` in `nayantara/models/call_rules.js`.

---

## Parent recharge

```mermaid
flowchart TD
  A["Parent opens plans"] --> P["App reads /parent/get-planpermission<br/>allow_parental_recharge, allow_audio_calls"]
  P --> B["Parent buys a plan or starts a PhonePe payment"]
  B --> C{"School allows parental recharge?"}
  C -- no --> X["Recharge is not enabled for this school"]
  C -- yes --> D["Purchase saved"]
  D --> E["Plan minutes added to the student<br/>and the parents"]
```

### Rules

- Blocked endpoints when recharge is off: `POST /parent/planpurchase/parent`, `POST /api/phonepe-payement`.
- Code: `rechargeBlockReason` in `nayantara/models/call_rules.js`.

---

## Parent activation fee

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

### Rules

- Parents who existed before this feature were marked as already activated (`activated_at`), so only new parents can be charged.
- The fee is charged once per parent, even if two logins happen at the same moment.
- Code: `activateParent` in `nayantara/models/call_rules.js`, called from parent login.

---

## Weekly minute allotment

A job inside the API runs every minute and credits each house once on its chosen day, at or after its chosen time (India time).

```mermaid
flowchart TD
  T["Every minute"] --> A["Find active houses where:<br/>today is the allotment day,<br/>the allotment time has passed,<br/>weekly minutes are above 0,<br/>not credited yet today"]
  A --> B["Claim the house: set last allotment to now<br/>(only one claim can succeed)"]
  B --> C["Coins = video min × video rate<br/>+ audio min × audio rate"]
  C --> D["Coins × 60 seconds added to every student<br/>in the house and their parents"]
  D --> L["Logged in tbl_allotment_log"]
```

### Example

10 video minutes at 1.5 and 5 audio minutes at 1 → 20 coins → **+1200 s** for every student in the house.

### Rules

- If the API was down at the allotment time, the credit happens when it comes back the same day.
- **Allot now:** the edit house form has an "Allot now" button that credits the house's saved weekly minutes immediately (super admin, or sub admin with manage access to Houses). It is an extra credit: the weekly schedule still runs. Logged with `source = 'manual'` (the weekly job logs `auto`).
- Code: `runAllotments` and `allotNow` (`POST /api/allot-now/:id`) in `nayantara/models/call_rules.js`, the job started from `nayantara/app.js`.

---

## App endpoints

What the student and parent apps call for these rules.

| Endpoint | Used for |
|---|---|
| `POST /api/firebase/notification` | Start a call. Send `call_type`: audio or video. |
| `POST /api/get-callminute` | How long the next call may last (`data` minutes, `seconds`). |
| `POST /parent/status-updateparent` | Parent accepts (2) or declines (3) a ringing call. |
| `POST /api/statusupdate-callhistory` | Student ends a call; charges it. |
| `POST /parent/parent-callend` | Parent ends a call; charges it. |
| `POST /parent/get-planpermission` | Whether recharge and audio calls are allowed. |
| `POST /parent/planpurchase/parent` | Buy a plan (blocked when recharge is off). |
| `GET /api/student-settings/:studentId` | School and house settings, logo URL, both notices, today's calls and seconds. |
| `GET /api/device-settings/:deviceId` | The same for a tablet before anyone logs in (student login screen notice). |

```mermaid
sequenceDiagram
  participant S as Student app
  participant API as Node API
  participant P as Parent app
  S->>API: GET /api/device-settings/:deviceId (login screen notice)
  S->>API: POST /api/get-callminute
  S->>API: POST /api/firebase/notification
  API-->>P: Firebase notification
  P->>API: POST /parent/status-updateparent (accept = 2)
  S->>API: POST /api/statusupdate-callhistory (end, charge)
```
