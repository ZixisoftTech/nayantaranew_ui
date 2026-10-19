# Bulk student import

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

## Rules

- API: `POST /import-csv` (code in `nayantara/app.js`, `uploadCsv`).
- CSV columns: name, roll no, password, house ID, contact, three reference fields, default plan, auto recharge, then up to five parent name and contact pairs. Sample: `assets/student.csv`.
- The house ID is the ID column on the Houses page.
- The import writes `other_ref_1`–`3`, `defaultplan` and `autorecharge` on `tbl_student`; a database without those columns can't save new students (counted as failed).
