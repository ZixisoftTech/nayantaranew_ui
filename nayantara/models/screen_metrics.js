/*
 * Summary cards for the screens whose tables are not served by models/lists.js
 * (those return their cards with the table data instead).
 *
 *   GET /api/screen-metrics?screen=<name>     Authorization: Bearer <admin | franchise | student token>
 *
 * Each screen is scoped by its token: franchise screens to the franchise, student screens to the student.
 * Card shape matches lists.js, rendered by assets/admin/js/nt-metrics.js.
 */
const jwt = require('jsonwebtoken');
const dataBase = require('../config/db');
const { metricSelect, metricValues, M, N } = require('./lists');

const ADMIN_SECRET = 'helloiamabhisheklodhi'; // admin and franchise tokens
const STUDENT_SECRET = 'thisisastudentsecretkey';

const q = (sql, params) => new Promise((resolve, reject) => {
    dataBase.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
});

function claimsFor(req, role) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return null;
    try {
        if (role === 'student') {
            const id = Number(jwt.verify(token, STUDENT_SECRET).id);
            return Number.isInteger(id) && id > 0 ? id : null;
        }
        const c = jwt.verify(token, ADMIN_SECRET);
        if (c.role !== role) return null;
        const id = Number(c.userId);
        return Number.isInteger(id) && id > 0 ? id : null;
    } catch (e) {
        return null;
    }
}

const tickets = (table, who) => ({
    role: 'admin',
    from: `${table} t`,
    where: () => ({ sql: '1 = 1', args: [] }),
    metrics: [
        { label: 'Tickets', sql: 'COUNT(*)', icon: 'bx-support' },
        { label: 'Last 30 days', sql: N('SUM(t.created_at >= CURDATE() - INTERVAL 29 DAY)'), icon: 'bx-calendar', tone: 'orange',
          hint: { text: '{v} in the last 7 days', sql: N('SUM(t.created_at >= CURDATE() - INTERVAL 6 DAY)') } },
        { label: `${who} reporting`, sql: `COUNT(DISTINCT t.${who === 'Students' ? 'student_id' : 'parent_id'})`, icon: 'bx-user', tone: 'violet' },
        { label: 'Latest ticket', sql: 'UNIX_TIMESTAMP(MAX(t.created_at))', fmt: 'ago', icon: 'bx-time-five', tone: 'green' },
    ],
});

const SCREENS = {
    'admin.franchises': {
        role: 'admin',
        from: `tbl_franchise f
            LEFT JOIN (SELECT franchise_id, COUNT(*) AS n, SUM(total_talktime < 0) AS od FROM tbl_student GROUP BY franchise_id) st ON st.franchise_id = f.Id
            LEFT JOIN (SELECT franchise_id, COUNT(*) AS n FROM tbl_department GROUP BY franchise_id) dp ON dp.franchise_id = f.Id`,
        where: () => ({ sql: '1 = 1', args: [] }),
        metrics: [
            { label: 'Franchises', sql: 'COUNT(*)', icon: 'bx-buildings', hint: { text: '{v} active', sql: N('SUM(f.status = 1)') } },
            { label: 'Departments', sql: N('SUM(dp.n)'), icon: 'bx-sitemap', tone: 'violet' },
            { label: 'Students', sql: N('SUM(st.n)'), icon: 'bx-user', tone: 'green',
              hint: { text: '{v} avg per franchise', sql: N('AVG(COALESCE(st.n, 0))') } },
            { label: 'Overdrawn students', sql: N('SUM(st.od)'), icon: 'bx-error-circle', tone: 'red' },
        ],
    },
    'admin.student_tickets': tickets('tbl_student_issue', 'Students'),
    'admin.parent_tickets': tickets('tbl_parents_issue', 'Parents'),
    'admin.assign_plan_department': {
        role: 'admin',
        from: 'tbl_department d LEFT JOIN (SELECT department_id, COUNT(*) AS n, SUM(login_status = \'1\') AS li FROM tbl_student GROUP BY department_id) st ON st.department_id = d.id',
        where: () => ({ sql: '1 = 1', args: [] }),
        metrics: [
            { label: 'Departments', sql: 'COUNT(*)', icon: 'bx-sitemap', hint: { text: '{v} active', sql: N('SUM(d.status = 1)') } },
            { label: 'Students', sql: N('SUM(st.n)'), icon: 'bx-user', tone: 'green', hint: { text: '{v} logged in', sql: N('SUM(st.li)') } },
            { label: 'Franchises', sql: 'COUNT(DISTINCT d.franchise_id)', icon: 'bx-buildings', tone: 'orange' },
            { label: 'Subscription plans', sql: '(SELECT COUNT(*) FROM tbl_subscriptions WHERE status = 1)', icon: 'bx-package', tone: 'violet' },
        ],
    },
    'franchise.manage_students': {
        role: 'franchise',
        from: 'tbl_student s',
        where: (id) => ({ sql: 's.franchise_id = ?', args: [id] }),
        metrics: M.students.slice(0, 3).concat([
            { label: 'Departments', sql: 'COUNT(DISTINCT s.department_id)', icon: 'bx-sitemap', tone: 'orange' },
        ]),
    },
    'franchise.manage_parents': {
        role: 'franchise',
        from: 'tbl_parents p',
        where: (id) => ({ sql: 'p.franchise_id = ?', args: [id] }),
        metrics: [
            { label: 'Parents', sql: 'COUNT(*)', icon: 'bx-group' },
            { label: 'Logged in', sql: N("SUM(p.status = '1')"), icon: 'bx-log-in-circle', tone: 'green',
              hint: { text: '{v} of parents', sql: N("100 * AVG(p.status = '1')"), fmt: 'pct' } },
            { label: 'Students covered', sql: 'COUNT(DISTINCT p.student_id)', icon: 'bx-user', tone: 'violet',
              hint: { text: 'of {v} students', sql: (id) => `(SELECT COUNT(*) FROM tbl_student WHERE franchise_id = ${id})` } },
            { label: 'Talk time balance', sql: N('SUM(GREATEST(p.total_talktime, 0))'), fmt: 'duration', icon: 'bx-time-five', tone: 'orange' },
        ],
    },
    'franchise.student_skip': {
        role: 'franchise',
        from: 'tbl_studentskip k',
        where: (id) => ({ sql: 'k.franchise_id = ?', args: [id] }),
        metrics: [
            { label: 'Skipped rows', sql: 'COUNT(*)', icon: 'bx-skip-next-circle', tone: 'orange' },
            { label: 'Departments', sql: 'COUNT(DISTINCT k.department_id)', icon: 'bx-sitemap', tone: 'violet' },
            { label: 'Latest skip', sql: 'UNIX_TIMESTAMP(MAX(k.created_at))', fmt: 'ago', icon: 'bx-time-five', tone: 'green' },
        ],
    },
    'franchise.parent_skip': {
        role: 'franchise',
        from: 'tbl_parentskip k',
        where: (id) => ({ sql: 'k.franchise_id = ?', args: [id] }),
        metrics: [
            { label: 'Skipped rows', sql: 'COUNT(*)', icon: 'bx-skip-next-circle', tone: 'orange' },
            { label: 'Students affected', sql: 'COUNT(DISTINCT k.student_id)', icon: 'bx-user', tone: 'violet' },
            { label: 'Latest skip', sql: 'UNIX_TIMESTAMP(MAX(k.created_at))', fmt: 'ago', icon: 'bx-time-five', tone: 'green' },
        ],
    },
    'student.call_history': {
        role: 'student',
        from: 'tbl_callhistory c',
        where: (id) => ({ sql: 'c.student_id = ?', args: [id] }),
        metrics: M.calls('c.minute').slice(0, 3).concat([
            { label: 'Talk time left', sql: (id) => N(`(SELECT total_talktime FROM tbl_student WHERE id = ${id})`), fmt: 'duration', icon: 'bx-wallet', tone: 'orange' },
        ]),
    },
    'student.transaction_history': {
        role: 'student',
        from: 'tbl_plan_purchase pp',
        where: (id) => ({ sql: 'pp.student_id = ?', args: [id] }),
        metrics: [
            { ...M.purchases[0], label: 'Plans bought' },
            { ...M.purchases[1], label: 'Amount spent', hint: { ...M.purchases[1].hint, text: '{v} avg per plan' } },
            { ...M.purchases[2], label: 'Minutes bought' },
        ].concat([
            { label: 'Talk time left', sql: (id) => N(`(SELECT total_talktime FROM tbl_student WHERE id = ${id})`), fmt: 'duration', icon: 'bx-wallet', tone: 'orange' },
        ]),
    },
};

const screenMetrics = async (req, res) => {
    const screen = SCREENS[String(req.query.screen || '')];
    if (!screen) return res.status(404).send({ error: true, message: 'Unknown screen.' });
    const id = claimsFor(req, screen.role);
    if (!id) return res.status(401).send({ error: true, message: 'Please sign in again.' });
    try {
        const scope = screen.where(id);
        // some expressions are functions of the signed-in id (a verified positive integer, so safe to inline)
        const at = (sql) => (typeof sql === 'function' ? sql(id) : sql);
        const metrics = screen.metrics.map((m) => ({ ...m, sql: at(m.sql), hint: m.hint && { ...m.hint, sql: at(m.hint.sql) } }));
        const [row] = await q(`SELECT ${metricSelect(metrics)} FROM ${screen.from} WHERE ${scope.sql}`, scope.args);
        return res.send({ error: false, data: metricValues(metrics, row) });
    } catch (err) {
        console.log('screen metrics error', err);
        return res.status(500).send({ error: true, message: 'Could not load the summary.' });
    }
};

module.exports = { screenMetrics };
