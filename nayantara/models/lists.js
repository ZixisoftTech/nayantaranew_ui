/*
 * Filterable list endpoints for the admin & franchise tables.
 *
 * These replace the old handlers that returned nothing until a department/student
 * was picked. Now every list loads all rows by default; the page filters
 * (franchise, department, student, date range) only narrow it down.
 * Response shape and column keys are unchanged, so the pages' DataTables work as before.
 *
 * Query params (all optional): id (department or student, see each list),
 *   franchise_id, department_id, student_id, start_date, end_date (YYYY-MM-DD)
 * Franchise-portal lists are scoped to the franchise in the Authorization token.
 *
 * All values are bound as SQL parameters; sort columns are whitelisted.
 */
const jwt = require('jsonwebtoken');
const dataBase = require('../config/db');

const SECRET = 'helloiamabhisheklodhi';

const q = (sql, params) => new Promise((resolve, reject) => {
    dataBase.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
});

const intParam = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
};
const dateParam = (v) => {
    const s = String(v || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const us = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); // bootstrap-datepicker default mm/dd/yyyy
    return us ? `${us[3]}-${us[1]}-${us[2]}` : null;
};

function franchiseFromToken(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return null;
    try {
        const claims = jwt.verify(token, SECRET);
        if (claims.role && claims.role !== 'franchise') return null;
        return intParam(claims.userId);
    } catch (e) {
        return null;
    }
}

const esc = (v) => (v === null || v === undefined || v === '') ? null : String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* summary metrics ---------------------------------------------------------- */

const metricSelect = (metrics) => metrics.map((m, i) => `${m.sql} AS m${i}${m.hint && m.hint.sql ? `, ${m.hint.sql} AS h${i}` : ''}`).join(', ');

const metricValues = (metrics, row) => ({
    cards: metrics.map((m, i) => ({
        label: m.label,
        value: row[`m${i}`] === null ? 0 : Number(row[`m${i}`]),
        fmt: m.fmt || 'num',
        icon: m.icon,
        tone: m.tone || 'blue',
        hint: m.hint ? { text: m.hint.text, value: m.hint.sql ? Number(row[`h${i}`]) || 0 : null, fmt: m.hint.fmt || 'num' } : null,
    })),
});

const N = (v) => `COALESCE(${v}, 0)`;
const SECS = (col) => `(${col} + 0)`;
const M = {
    calls: (c) => [
        { label: 'Calls', sql: 'COUNT(*)', icon: 'bx-phone-call', hint: { text: '{v} connected', sql: `SUM(${SECS(c)} > 0)` } },
        { label: 'Talk time', sql: N(`SUM(${SECS(c)})`), fmt: 'duration', icon: 'bx-time-five', tone: 'green' },
        { label: 'Avg connected call', sql: N(`AVG(NULLIF(${SECS(c)}, 0))`), fmt: 'duration', icon: 'bx-stopwatch', tone: 'violet',
          hint: { text: 'longest {v}', sql: N(`MAX(${SECS(c)})`), fmt: 'duration' } },
        { label: 'Students calling', sql: 'COUNT(DISTINCT c.student_id)', icon: 'bx-user', tone: 'orange',
          hint: { text: ['{v} parent', '{v} parents'], sql: 'COUNT(DISTINCT c.parent_id)' } },
    ],
    purchases: [
        { label: 'Purchases', sql: 'COUNT(*)', icon: 'bx-receipt' },
        { label: 'Revenue', sql: N('SUM(pp.plan_price)'), fmt: 'money', icon: 'bx-rupee', tone: 'green',
          hint: { text: '{v} avg per purchase', sql: N('AVG(pp.plan_price)'), fmt: 'money' } },
        { label: 'Minutes sold', sql: N('SUM(pp.plan_min) / 60'), icon: 'bx-time-five', tone: 'violet' },
        { label: 'Buying students', sql: 'COUNT(DISTINCT pp.student_id)', icon: 'bx-user', tone: 'orange',
          hint: { text: ['{v} plan', '{v} plans'], sql: 'COUNT(DISTINCT pp.plan_name)' } },
    ],
    students: [
        { label: 'Students', sql: 'COUNT(*)', icon: 'bx-user', hint: { text: '{v} logged in', sql: "SUM(s.login_status = '1')" } },
        { label: 'Talk time balance', sql: N('SUM(GREATEST(s.total_talktime, 0))'), fmt: 'duration', icon: 'bx-time-five', tone: 'green',
          hint: { text: '{v} avg per student', sql: N('AVG(GREATEST(s.total_talktime, 0))'), fmt: 'duration' } },
        { label: 'Overdrawn', sql: N('SUM(s.total_talktime < 0)'), icon: 'bx-error-circle', tone: 'red',
          hint: { text: '{v} owed', sql: N('-SUM(LEAST(s.total_talktime, 0))'), fmt: 'duration' } },
        { label: 'Departments', sql: 'COUNT(DISTINCT s.department_id)', icon: 'bx-sitemap', tone: 'orange',
          hint: { text: ['{v} franchise', '{v} franchises'], sql: 'COUNT(DISTINCT s.franchise_id)' } },
    ],
};

/**
 * Generic DataTables server-side handler.
 * spec: { from, where(req) -> {sql:[], args:[]} | null, select, search:[cols], order:{key: sqlExpr}, defaultOrder, row(r, i),
 *         metrics?: [{ label, sql, fmt: 'num'|'money'|'duration'|'pct', icon, tone?, hint?: { sql, fmt, text } }] }
 *
 * Metrics are the summary cards above each table (assets/admin/js/nt-metrics.js). They use the same
 * filters and search as the rows, and are only computed for the first page (start = 0), so paging
 * through a table costs nothing extra.
 */
const list = (spec) => async (req, res) => {
    const draw = Number(req.query.draw) || 0;
    const empty = { draw, iTotalRecords: 0, iTotalDisplayRecords: 0, aaData: [] };
    try {
        const scope = spec.where(req);
        if (!scope) return res.json(empty);

        const where = scope.sql.length ? scope.sql : ['1 = 1'];
        const args = scope.args;

        const term = String((req.query.search && req.query.search.value) || '').trim();
        const searchSql = term ? ` AND (${spec.search.map((c) => `${c} LIKE ?`).join(' OR ')})` : '';
        const searchArgs = term ? spec.search.map(() => `%${term}%`) : [];

        let orderSql = spec.defaultOrder;
        const ord = req.query.order && req.query.order[0];
        if (ord && req.query.columns && req.query.columns[ord.column]) {
            const key = req.query.columns[ord.column].data;
            if (spec.order[key]) orderSql = `${spec.order[key]} ${ord.dir === 'asc' ? 'ASC' : 'DESC'}`;
        }

        const start = Math.max(0, Number(req.query.start) || 0);
        let length = Number(req.query.length);
        if (!Number.isInteger(length) || length === 0) length = 10;
        const limitSql = length < 0 ? '' : ' LIMIT ?, ?';
        const limitArgs = length < 0 ? [] : [start, Math.min(length, 500000)];

        const base = `FROM ${spec.from} WHERE ${where.join(' AND ')}`;
        const wantMetrics = spec.metrics && start === 0 && length > 0 && length <= 1000;
        const [[total], [filtered], rows, agg] = await Promise.all([
            q(`SELECT COUNT(*) AS n ${base}`, args),
            q(`SELECT COUNT(*) AS n ${base}${searchSql}`, [...args, ...searchArgs]),
            q(`SELECT ${spec.select} ${base}${searchSql} ORDER BY ${orderSql}${limitSql}`, [...args, ...searchArgs, ...limitArgs]),
            wantMetrics ? q(`SELECT ${metricSelect(spec.metrics)} ${base}${searchSql}`, [...args, ...searchArgs]) : null,
        ]);

        const body = {
            draw,
            iTotalRecords: total.n,
            iTotalDisplayRecords: filtered.n,
            aaData: rows.map((r, i) => spec.row(r, start + i + 1)),
        };
        if (agg) body.nt_metrics = metricValues(spec.metrics, agg[0]);
        return res.json(body);
    } catch (err) {
        console.log('list error', err);
        return res.json(empty);
    }
};

/* shared filter builders --------------------------------------------------- */

function studentFilters(req, alias, { departmentParam = 'id', parentCol = null } = {}) {
    const sql = [];
    const args = [];
    const department = intParam(req.query[departmentParam]) || intParam(req.query.department_id);
    const franchise = intParam(req.query.franchise_id);
    const student = intParam(req.query.student_id);
    const parent = parentCol ? intParam(req.query.parent_id) : null;
    if (department) { sql.push(`${alias}.department_id = ?`); args.push(department); }
    if (franchise) { sql.push(`${alias}.franchise_id = ?`); args.push(franchise); }
    if (student) { sql.push(`${alias}.id = ?`); args.push(student); }
    if (parent) { sql.push(`${parentCol} = ?`); args.push(parent); }
    return { sql, args };
}

function dateFilters(req, column, filter) {
    const from = dateParam(req.query.start_date);
    const to = dateParam(req.query.end_date);
    if (from) { filter.sql.push(`DATE(${column}) >= ?`); filter.args.push(from); }
    if (to) { filter.sql.push(`DATE(${column}) <= ?`); filter.args.push(to); }
    return filter;
}

const MMSS = (col) => `CONCAT(LPAD(FLOOR(${col} / 60), 2, '0'), ':', LPAD(MOD(${col}, 60), 2, '0'))`;

/* super admin: call history ------------------------------------------------ */

const adminCallHistory = list({
    metrics: M.calls('c.minute'),
    from: 'tbl_callhistory c LEFT JOIN tbl_student s ON s.id = c.student_id',
    where: (req) => dateFilters(req, 'c.created_at', studentFilters(req, 's', { parentCol: 'c.parent_id' })),
    select: `c.id, c.student_id, c.parent_id, c.student_name, c.parent_name, ${MMSS('c.minute')} AS minutes,
             DATE_FORMAT(c.created_at, '%d-%m-%Y') AS dates`,
    search: ['c.student_name', 'c.parent_name', 's.student_roll_no'],
    order: { index: 'c.id', date: 'c.created_at', student_name: 'c.student_name', parent_name: 'c.parent_name', minutes: 'c.minute' },
    defaultOrder: 'c.created_at DESC',
    row: (r, i) => ({
        _ref: { student: r.student_id, parent: r.parent_id },
        index: i, date: r.dates, student_name: esc(r.student_name), parent_name: esc(r.parent_name), minutes: r.minutes,
    }),
});

/* super admin: transactions (plan purchases) ------------------------------- */

const adminTransactions = list({
    metrics: M.purchases,
    from: 'tbl_plan_purchase pp LEFT JOIN tbl_student s ON s.id = pp.student_id',
    where: (req) => dateFilters(req, 'pp.created_at', studentFilters(req, 's', { parentCol: 'pp.parent_id' })),
    select: `pp.id, pp.student_id, s.name, pp.plan_name, pp.plan_price AS price, FLOOR(pp.plan_min / 60) AS minute,
             DATE_FORMAT(pp.created_at, '%d-%m-%Y') AS dates`,
    search: ['pp.plan_name', 's.name', 's.student_roll_no'],
    order: { index: 'pp.id', purchase_date: 'pp.created_at', name: 's.name', plan_name: 'pp.plan_name', price: 'pp.plan_price', minute: 'pp.plan_min' },
    defaultOrder: 'pp.created_at DESC',
    row: (r, i) => ({
        _ref: { name: 'student', student: r.student_id },
        index: i, purchase_date: r.dates, name: esc(r.name), plan_name: esc(r.plan_name), price: r.price, minute: r.minute,
    }),
});

/* super admin: students (minutes) ------------------------------------------ */

const STUDENT_FROM = `tbl_student s
    LEFT JOIN tbl_department d ON d.id = s.department_id
    LEFT JOIN tbl_franchise f ON f.Id = s.franchise_id`;
const STUDENT_SELECT = `s.id, s.name, s.student_roll_no, s.contact, s.email, s.franchise_id, s.department_id,
    FLOOR(s.total_talktime / 60) AS minutes, d.name AS department_name, f.franchiseName AS franchise_name`;
const STUDENT_SEARCH = ['s.name', 's.student_roll_no', 's.contact', 's.email'];

const adminStudents = list({
    metrics: M.students,
    from: STUDENT_FROM,
    where: (req) => studentFilters(req, 's'),
    select: STUDENT_SELECT,
    search: STUDENT_SEARCH,
    order: { index: 's.id', name: 's.name', roll_no: 's.student_roll_no', contact: 's.contact', email: 's.email',
             minutes: 's.total_talktime', franchise_name: 'f.franchiseName', department_name: 'd.name' },
    defaultOrder: 's.id DESC',
    row: (r, i) => ({
        _ref: { name: 'student', student: r.id, franchise: r.franchise_id, department: r.department_id },
        index: i, name: esc(r.name), roll_no: esc(r.student_roll_no), contact: esc(r.contact), email: esc(r.email), minutes: r.minutes,
        franchise_name: esc(r.franchise_name), department_name: esc(r.department_name),
        action: `<a href="javascript:void(0);" data-toggle="modal" data-target=".edit" class="btn-sm" onclick="getMin(${r.id})"><i class="bx bx-edit-alt"></i></a>`,
    }),
});

/* super admin: assign plan (logged-in students) ---------------------------- */

const assignPlanStudents = list({
    metrics: M.students,
    from: STUDENT_FROM,
    where: (req) => {
        const f = studentFilters(req, 's');
        f.sql.push("s.login_status = '1'");
        return f;
    },
    select: STUDENT_SELECT,
    search: STUDENT_SEARCH,
    order: { index: 's.id', name: 's.name', student_roll_no: 's.student_roll_no', contact: 's.contact', email: 's.email',
             department_name: 'd.name', franchise_name: 'f.franchiseName' },
    defaultOrder: 's.id DESC',
    row: (r, i) => ({
        _ref: { name: 'student', student: r.id, franchise: r.franchise_id, department: r.department_id },
        index: i,
        checkbox: `<input type="checkbox" value="${r.id}" class="checkbox" data-id="${r.id}">`,
        name: esc(r.name), student_roll_no: esc(r.student_roll_no), contact: esc(r.contact), email: esc(r.email),
        department_name: esc(r.department_name), franchise_name: esc(r.franchise_name),
    }),
});

/* super admin: parents ----------------------------------------------------- */

const adminParents = list({
    metrics: [
        { label: 'Parents', sql: 'COUNT(*)', icon: 'bx-group' },
        { label: 'Logged in', sql: N("SUM(p.status = '1')"), icon: 'bx-log-in-circle', tone: 'green',
          hint: { text: '{v} of parents', sql: N("100 * AVG(p.status = '1')"), fmt: 'pct' } },
        { label: 'Students covered', sql: 'COUNT(DISTINCT p.student_id)', icon: 'bx-user', tone: 'violet' },
        { label: 'Talk time balance', sql: N('SUM(GREATEST(p.total_talktime, 0))'), fmt: 'duration', icon: 'bx-time-five', tone: 'orange' },
    ],
    from: 'tbl_parents p LEFT JOIN tbl_student s ON s.id = p.student_id',
    where: (req) => {
        const sql = [];
        const args = [];
        const student = intParam(req.query.id) || intParam(req.query.student_id);
        const franchise = intParam(req.query.franchise_id);
        if (student) { sql.push('p.student_id = ?'); args.push(student); }
        else if (franchise) { sql.push('p.franchise_id = ?'); args.push(franchise); }
        return { sql, args };
    },
    select: 'p.id, p.student_id, p.name, p.contact, p.email, p.password, p.status, s.name AS student_name, s.student_roll_no',
    search: ['p.name', 'p.contact', 'p.email', 's.name', 's.student_roll_no'],
    order: { index: 'p.id', student_roll_no: 's.student_roll_no', student_name: 's.name', name: 'p.name', contact: 'p.contact', email: 'p.email' },
    defaultOrder: 'p.id DESC',
    row: (r, i) => ({
        _ref: { name: 'parent', parent: r.id, student: r.student_id },
        index: i, student_roll_no: esc(r.student_roll_no), student_name: esc(r.student_name),
        name: esc(r.name), contact: esc(r.contact), email: esc(r.email), password: esc(r.password),
        action: r.status == 1 ? `<button class="btn-success" onClick="parentLogout(${r.id})">Logout</button>` : '',
    }),
});

/* franchise portal: call history & transactions ---------------------------- */

function franchiseScope(req, alias, parentCol) {
    const franchise = franchiseFromToken(req);
    if (!franchise) return null;
    const filter = { sql: [`${alias}.franchise_id = ?`], args: [franchise] };
    const student = intParam(req.query.id) || intParam(req.query.student_id);
    const department = intParam(req.query.department_id);
    if (student) { filter.sql.push(`${alias}.id = ?`); filter.args.push(student); }
    else if (department) { filter.sql.push(`${alias}.department_id = ?`); filter.args.push(department); }
    if (parentCol && intParam(req.query.parent_id)) { filter.sql.push(`${parentCol} = ?`); filter.args.push(intParam(req.query.parent_id)); }
    return filter;
}

const franchiseCallHistory = list({
    metrics: M.calls('c.minute'),
    from: 'tbl_callhistory c INNER JOIN tbl_student s ON s.id = c.student_id',
    where: (req) => {
        const f = franchiseScope(req, 's', 'c.parent_id');
        return f && dateFilters(req, 'c.created_at', f);
    },
    select: `c.id, c.student_id, c.parent_id, c.student_name, c.parent_name, ${MMSS('c.minute')} AS minutes,
             DATE_FORMAT(c.created_at, '%d-%m-%Y') AS dates, DATE_FORMAT(c.created_at, '%H:%i:%s') AS times`,
    search: ['c.student_name', 'c.parent_name', 's.student_roll_no'],
    order: { index: 'c.id', date: 'c.created_at', student_name: 'c.student_name', parent_name: 'c.parent_name', minutes: 'c.minute' },
    defaultOrder: 'c.created_at DESC',
    row: (r, i) => ({
        _ref: { student: r.student_id, parent: r.parent_id },
        index: i, date: `${r.dates} and ${r.times}`, student_name: esc(r.student_name), parent_name: esc(r.parent_name), minutes: r.minutes,
    }),
});

const franchiseTransactions = list({
    metrics: M.purchases,
    from: 'tbl_plan_purchase pp INNER JOIN tbl_student s ON s.id = pp.student_id',
    where: (req) => {
        const f = franchiseScope(req, 's', 'pp.parent_id');
        return f && dateFilters(req, 'pp.created_at', f);
    },
    select: `pp.id, pp.student_id, s.name, pp.plan_name, pp.plan_price AS price, FLOOR(pp.plan_min / 60) AS minute,
             DATE_FORMAT(pp.created_at, '%d-%m-%Y') AS dates`,
    search: ['pp.plan_name', 's.name', 's.student_roll_no'],
    order: { index: 'pp.id', purchase_date: 'pp.created_at', name: 's.name', plan_name: 'pp.plan_name', price: 'pp.plan_price', minute: 'pp.plan_min' },
    defaultOrder: 'pp.created_at DESC',
    row: (r, i) => ({
        _ref: { name: 'student', student: r.student_id },
        index: i, purchase_date: r.dates, name: esc(r.name), plan_name: esc(r.plan_name), price: r.price, minute: r.minute,
    }),
});


/* super admin: departments ------------------------------------------------- */

const statusButton = (r) => (r.status == 1
    ? `<button onclick="statusDeactive(${r.id})" id="active" class="btn-success" value="0">active</button>`
    : `<button class="btn-danger" onclick="statusActive(${r.id})" id="inactive" value="1">inactive</button>`);

const byFranchise = (alias) => (req) => {
    const franchise = intParam(req.query.franchise_id);
    return franchise ? { sql: [`${alias}.franchise_id = ?`], args: [franchise] } : { sql: [], args: [] };
};

const adminDepartments = list({
    metrics: [
        { label: 'Departments', sql: 'COUNT(*)', icon: 'bx-sitemap' },
        { label: 'Active', sql: N('SUM(d.status = 1)'), icon: 'bx-check-circle', tone: 'green' },
        { label: 'Inactive', sql: N('SUM(d.status <> 1)'), icon: 'bx-pause-circle', tone: 'red' },
        { label: 'Franchises', sql: 'COUNT(DISTINCT d.franchise_id)', icon: 'bx-buildings', tone: 'orange' },
    ],
    from: 'tbl_department d LEFT JOIN tbl_franchise f ON f.Id = d.franchise_id',
    where: byFranchise('d'),
    select: 'd.id, d.name, d.device_name, d.status, d.franchise_id, f.franchiseName AS franchise_name',
    search: ['d.name', 'd.device_name', 'f.franchiseName'],
    order: { index: 'd.id', id: 'd.id', name: 'd.name', device_name: 'd.device_name', franchise_name: 'f.franchiseName', status: 'd.status' },
    defaultOrder: 'd.id DESC',
    row: (r, i) => ({
        _ref: { name: 'department', department: r.id, franchise: r.franchise_id },
        index: i, id: r.id, name: esc(r.name), device_name: esc(r.device_name), franchise_name: esc(r.franchise_name),
        status: statusButton(r),
        action: `<a href="javascript:void(0);" data-toggle="modal" data-target=".edit" class="btn-sm" onclick="getUpdateValue(${r.id})"><i class="bx bx-edit-alt"></i></a>
                 <a href="javascript:void(0);" data-toggle="modal" data-target=".view" class="btn-sm" onclick="getDays(${r.id})"><i class="fas fa-eye"></i></a>
                 <a href="javascript:void(0);" id="sa-params" class="btn-sm delete" data-id=${r.id}><i class="bx bx-trash-alt"></i></a>`,
    }),
});

/* super admin: subscriptions ----------------------------------------------- */

const adminSubscriptions = list({
    metrics: [
        { label: 'Plans', sql: 'COUNT(*)', icon: 'bx-package' },
        { label: 'Active', sql: N('SUM(p.status = 1)'), icon: 'bx-check-circle', tone: 'green',
          hint: { text: '{v} inactive', sql: N('SUM(p.status <> 1)') } },
        { label: 'Price range', sql: N('MIN(p.price)'), fmt: 'money', icon: 'bx-rupee', tone: 'violet',
          hint: { text: 'up to {v}', sql: N('MAX(p.price)'), fmt: 'money' } },
        { label: 'Franchises', sql: 'COUNT(DISTINCT p.franchise_id)', icon: 'bx-buildings', tone: 'orange' },
    ],
    from: 'tbl_subscriptions p LEFT JOIN tbl_franchise f ON f.Id = p.franchise_id',
    where: byFranchise('p'),
    select: 'p.id, p.plan_name, p.price, p.status, p.franchise_id, FLOOR(p.talktime_minutes / 60) AS talk_time_min, f.franchiseName AS franchise_name',
    search: ['p.plan_name', 'p.price', 'p.talktime_minutes', 'f.franchiseName'],
    order: { index: 'p.id', franchise_name: 'f.franchiseName', plan_name: 'p.plan_name', price: 'p.price', talk_time_min: 'p.talktime_minutes', status: 'p.status' },
    defaultOrder: 'p.id DESC',
    row: (r, i) => ({
        _ref: { franchise: r.franchise_id },
        index: i, franchise_name: esc(r.franchise_name), plan_name: esc(r.plan_name), price: r.price, talk_time_min: r.talk_time_min,
        status: statusButton(r),
        action: `<a href="javascript:void(0);" data-toggle="modal" data-target=".edit" class="btn-sm" onclick="getUpdateValue(${r.id})"><i class="bx bx-edit-alt"></i></a>
                 <a href="javascript:void(0);" id="sa-params" class="btn-sm delete" data-id=${r.id}><i class="bx bx-trash-alt"></i></a>`,
    }),
});


/* super admin: student summary (available vs used minutes) ----------------- */
// Call minutes are totalled once per request in a grouped sub-select instead of a
// correlated sub-query per student (which took ~37s for a full export on 184k calls).

const studentSummary = list({
    metrics: [
        { label: 'Students', sql: 'COUNT(*)', icon: 'bx-user' },
        { label: 'Talk time available', sql: N('SUM(GREATEST(s.total_talktime, 0))'), fmt: 'duration', icon: 'bx-time-five', tone: 'green' },
        { label: 'Talk time used', sql: N('SUM(cu.secs)'), fmt: 'duration', icon: 'bx-phone-call', tone: 'violet',
          hint: { text: '{v} avg per student', sql: N('AVG(COALESCE(cu.secs, 0))'), fmt: 'duration' } },
        { label: 'Overdrawn', sql: N('SUM(s.total_talktime < 0)'), icon: 'bx-error-circle', tone: 'red',
          hint: { text: '{v} never called', sql: N('SUM(cu.secs IS NULL)') } },
    ],
    from: `tbl_student s
        LEFT JOIN tbl_franchise f ON f.Id = s.franchise_id
        LEFT JOIN tbl_department d ON d.id = s.department_id
        LEFT JOIN (SELECT student_id, SUM(minute) AS secs FROM tbl_callhistory GROUP BY student_id) cu ON cu.student_id = s.id`,
    where: (req) => studentFilters(req, 's', { departmentParam: 'department_id' }),
    select: `s.id, s.name, s.student_roll_no, s.franchise_id, s.department_id,
             FLOOR(s.total_talktime / 60) AS talk_time_min, FLOOR(cu.secs / 60) AS used_min,
             f.franchiseName AS franchise_name, d.name AS department_name`,
    search: ['s.name', 's.student_roll_no', 'f.franchiseName', 'd.name'],
    order: { index: 's.id', name: 's.name', student_roll_no: 's.student_roll_no', franchise_name: 'f.franchiseName',
             department_name: 'd.name', talk_time_min: 's.total_talktime', used_min: 'cu.secs' },
    defaultOrder: 's.id DESC',
    row: (r, i) => ({
        _ref: { name: 'student', student: r.id, franchise: r.franchise_id, department: r.department_id },
        index: i, name: esc(r.name), student_roll_no: esc(r.student_roll_no), franchise_name: esc(r.franchise_name),
        department_name: esc(r.department_name), talk_time_min: r.talk_time_min, used_min: r.used_min,
    }),
});

module.exports = {
    metricSelect,
    metricValues,
    M,
    N,
    adminCallHistory,
    adminTransactions,
    adminStudents,
    assignPlanStudents,
    adminParents,
    franchiseCallHistory,
    franchiseTransactions,
    adminDepartments,
    adminSubscriptions,
    studentSummary,
};
