/*
 * Record lookup for the admin "quick view" panel and global search.
 *
 *   GET /api/lookup/search?q=          students, parents, franchises, departments
 *   GET /api/lookup/student/:id        profile + parents, calls, plans, payments, tickets
 *   GET /api/lookup/parent/:id         profile + student, calls, plans, tickets
 *   GET /api/lookup/franchise/:id      profile + departments, counts, plans   (admin only)
 *   GET /api/lookup/department/:id     profile + students
 *
 * Add ?full=1 to get every row instead of the latest 15 (used by the panel's Export).
 *
 * Auth: "Authorization: Bearer <admintoken|franchisetoken>". The token must carry a
 * role claim ("admin" or "franchise", issued at login). Franchise tokens only ever
 * see records of their own franchise. All SQL is parameterised.
 */
const jwt = require('jsonwebtoken');
const dataBase = require('../config/db');
const { ready: schemaReady, col: C, live: LIVE } = require('./schema');
const { liveName } = require('./lists');

const SECRET = 'helloiamabhisheklodhi';

// school / house settings columns (added by addFranchise.js / addDepartment.js at startup)
const FRANCHISE_SETTINGS = ['logo', 'allow_parental_recharge', 'allow_audio_calls', 'video_rate', 'audio_rate', 'activation_fee',
    'max_calls_per_day', 'daily_duration_min', 'min_call_duration_sec'];
const HOUSE_SETTINGS = ['max_call_duration_sec', 'allotment_day', 'allotment_time', 'weekly_video_mins', 'weekly_audio_mins',
    'parent_notice', 'student_notice'];

const q = (sql, params) => new Promise((resolve, reject) => {
    dataBase.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
});

class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}

function authorise(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new HttpError(401, 'Please sign in again.');
    let claims;
    try {
        claims = jwt.verify(token, SECRET);
    } catch (e) {
        throw new HttpError(401, 'Your session has expired. Please sign in again.');
    }
    if (claims.role === 'admin' || claims.role === 'subadmin') return { role: 'admin', franchiseId: null };
    if (claims.role === 'franchise') return { role: 'franchise', franchiseId: Number(claims.userId) };
    // tokens issued before roles were added can't be told apart safely
    throw new HttpError(401, 'Please sign out and sign in again to use quick view.');
}

const toId = (value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid id');
    return id;
};

const minutes = (seconds) => Math.floor((Number(seconds) || 0) / 60);
// lists show the latest 15 rows; exports ask for everything
const cap = (req) => (req.query.full === '1' ? '' : 'LIMIT 15');
// total rows behind a LIMITed list (table/column are fixed identifiers, never user input)
const count = (table, column, id) => q(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`, [id]).then((r) => r[0].n);

/* ------------------------------------------------------------------ handlers */

const handle = (fn) => async (req, res) => {
    try {
        const auth = authorise(req);
        await schemaReady();
        const data = await fn(req, auth);
        if (!data) return res.status(404).send({ error: true, message: 'Record not found' });
        return res.status(200).send({ error: false, data });
    } catch (err) {
        if (err instanceof HttpError) return res.status(err.status).send({ error: true, message: err.message });
        console.log('lookup error', err);
        return res.status(500).send({ error: true, message: 'Lookup failed' });
    }
};

const search = handle(async (req, auth) => {
    const term = String(req.query.q || '').trim();
    if (term.length < 2) return { students: [], parents: [], franchises: [], departments: [] };
    const like = `%${term}%`;
    const scope = auth.franchiseId ? ' AND s.franchise_id = ?' : '';
    const scopeArgs = auth.franchiseId ? [auth.franchiseId] : [];

    const [students, parents, franchises, departments] = await Promise.all([
        q(`SELECT s.id, s.name, s.student_roll_no, s.contact, s.status,
                  f.franchiseName AS franchise_name, d.name AS department_name
             FROM tbl_student s
             LEFT JOIN tbl_franchise f ON f.Id = s.franchise_id
             LEFT JOIN tbl_department d ON d.id = s.department_id
            WHERE ${LIVE('tbl_student', 's')}
              AND (s.name LIKE ? OR s.student_roll_no LIKE ? OR s.contact LIKE ? OR s.email LIKE ?)${scope}
            ORDER BY s.name LIMIT 8`, [like, like, like, like, ...scopeArgs]),
        q(`SELECT p.id, p.name, p.contact, p.status,
                  s.id AS student_id, s.name AS student_name, s.student_roll_no
             FROM tbl_parents p
             LEFT JOIN tbl_student s ON s.id = p.student_id
            WHERE (p.name LIKE ? OR p.contact LIKE ? OR p.email LIKE ?)
              ${auth.franchiseId ? 'AND p.franchise_id = ?' : ''}
            ORDER BY p.name LIMIT 8`, [like, like, like, ...scopeArgs]),
        auth.role === 'admin'
            ? q(`SELECT Id AS id, franchiseName AS name, franchiserName, email, status
                   FROM tbl_franchise
                  WHERE ${LIVE('tbl_franchise')} AND (franchiseName LIKE ? OR franchiserName LIKE ? OR email LIKE ?)
                  ORDER BY franchiseName LIMIT 5`, [like, like, like])
            : Promise.resolve([]),
        q(`SELECT d.id, d.name, d.device_name, f.franchiseName AS franchise_name
             FROM tbl_department d
             LEFT JOIN tbl_franchise f ON f.Id = d.franchise_id
            WHERE ${LIVE('tbl_department', 'd')} AND (d.name LIKE ? OR d.device_name LIKE ?)
              ${auth.franchiseId ? 'AND d.franchise_id = ?' : ''}
            ORDER BY d.name LIMIT 5`, [like, like, ...scopeArgs]),
    ]);
    return { students, parents, franchises, departments };
});

const student = handle(async (req, auth) => {
    const id = toId(req.params.id);
    const [row] = await q(
        `SELECT s.id, s.name, s.student_roll_no, s.email, s.contact, s.status, s.login_status, ${C('tbl_student', 's', 'validity')},
                ${C('tbl_student', 's', 'autorecharge')}, s.total_talktime, s.created_at, s.updated_at, s.franchise_id, s.department_id,
                f.franchiseName AS franchise_name, d.name AS department_name, d.device_name
           FROM tbl_student s
           LEFT JOIN tbl_franchise f ON f.Id = s.franchise_id
           LEFT JOIN tbl_department d ON d.id = s.department_id
          WHERE s.id = ?${auth.franchiseId ? ' AND s.franchise_id = ?' : ''}`,
        auth.franchiseId ? [id, auth.franchiseId] : [id]);
    if (!row) return null;

    const [parents, calls, callTotals, plans, payments, tickets] = await Promise.all([
        q(`SELECT id, name, contact, email, status, total_talktime FROM tbl_parents WHERE student_id = ? ORDER BY name`, [id]),
        // call rows keep a copy of the name taken at call time; prefer the live one
        q(`SELECT c.id, c.parent_id, ${liveName('p.name', 'c.parent_name')} AS parent_name, c.minute, c.day,
                  ${C('tbl_callhistory', 'c', 'phone_number')}, c.created_at
             FROM tbl_callhistory c LEFT JOIN tbl_parents p ON p.id = c.parent_id
            WHERE c.student_id = ? ORDER BY c.created_at DESC ${cap(req)}`, [id]),
        q(`SELECT COUNT(*) AS count, COALESCE(SUM(minute), 0) AS seconds FROM tbl_callhistory WHERE student_id = ?`, [id]),
        q(`SELECT id, plan_name, plan_price, plan_min, ${C('tbl_plan_purchase', '', 'plan_end_date')}, created_at
             FROM tbl_plan_purchase WHERE student_id = ? ORDER BY created_at DESC ${cap(req)}`, [id]),
        // tbl_student_payments is not present in every database export
        q(`SELECT id, amount, status, razorpay_payment_id, created_at
             FROM tbl_student_payments WHERE student_id = ? ORDER BY created_at DESC ${cap(req)}`, [id]).catch(() => []),
        q(`SELECT id, subject, message, status, created_at
             FROM tbl_student_issue WHERE student_id = ? ORDER BY created_at DESC ${cap(req)}`, [id]),
    ]);
    const [planTotal, paymentTotal, ticketTotal] = await Promise.all([
        count('tbl_plan_purchase', 'student_id', id),
        count('tbl_student_payments', 'student_id', id).catch(() => payments.length),
        count('tbl_student_issue', 'student_id', id),
    ]);

    return {
        type: 'student',
        profile: { ...row, available_min: minutes(row.total_talktime) },
        stats: {
            available_min: minutes(row.total_talktime),
            used_min: minutes(callTotals[0].seconds),
            calls: callTotals[0].count,
            parents: parents.length,
            plans: planTotal,
            payments: paymentTotal,
            tickets: ticketTotal,
        },
        parents,
        calls: calls.map((c) => ({ ...c, minutes: minutes(c.minute) })),
        plans,
        payments,
        tickets,
    };
});

const parent = handle(async (req, auth) => {
    const id = toId(req.params.id);
    const [row] = await q(
        `SELECT p.id, p.name, p.contact, p.email, p.status, p.total_talktime, p.created_at, p.franchise_id,
                s.id AS student_id, s.name AS student_name, s.student_roll_no,
                f.franchiseName AS franchise_name
           FROM tbl_parents p
           LEFT JOIN tbl_student s ON s.id = p.student_id
           LEFT JOIN tbl_franchise f ON f.Id = p.franchise_id
          WHERE p.id = ?${auth.franchiseId ? ' AND p.franchise_id = ?' : ''}`,
        auth.franchiseId ? [id, auth.franchiseId] : [id]);
    if (!row) return null;

    const [calls, callTotals, plans, tickets] = await Promise.all([
        q(`SELECT c.id, c.student_id, ${liveName('s.name', 'c.student_name')} AS student_name, c.minute, c.day, c.created_at
             FROM tbl_callhistory c LEFT JOIN tbl_student s ON s.id = c.student_id
            WHERE c.parent_id = ? ORDER BY c.created_at DESC ${cap(req)}`, [id]),
        q(`SELECT COUNT(*) AS count, COALESCE(SUM(minute), 0) AS seconds FROM tbl_callhistory WHERE parent_id = ?`, [id]),
        q(`SELECT id, plan_name, plan_price, plan_min, ${C('tbl_plan_purchase', '', 'plan_end_date')}, created_at
             FROM tbl_plan_purchase WHERE parent_id = ? ORDER BY created_at DESC ${cap(req)}`, [id]),
        q(`SELECT id, subject, message, status, created_at
             FROM tbl_parents_issue WHERE parent_id = ? ORDER BY created_at DESC ${cap(req)}`, [id]),
    ]);
    const [planTotal, ticketTotal] = await Promise.all([
        count('tbl_plan_purchase', 'parent_id', id),
        count('tbl_parents_issue', 'parent_id', id),
    ]);

    return {
        type: 'parent',
        profile: row,
        stats: { calls: callTotals[0].count, used_min: minutes(callTotals[0].seconds), plans: planTotal, tickets: ticketTotal },
        calls: calls.map((c) => ({ ...c, minutes: minutes(c.minute) })),
        plans,
        tickets,
    };
});

const franchise = handle(async (req, auth) => {
    const id = toId(req.params.id);
    if (auth.role !== 'admin' && auth.franchiseId !== id) throw new HttpError(403, 'Not allowed');
    const [row] = await q(
        `SELECT Id AS id, ${C('tbl_franchise', '', 'franchiseId')}, franchiseName AS name, franchiserName, email, address, pincode, status,
                ${['schoolemail', 'schoolcontact1', 'schoolcontact2', 'startdate', 'enddate', 'totaldevices', ...FRANCHISE_SETTINGS].map((c) => C('tbl_franchise', '', c)).join(', ')}, created_at
           FROM tbl_franchise WHERE Id = ?`, [id]);
    if (!row) return null;
    const full = req.query.full === '1';

    const [departments, counts, plans, students, parents] = await Promise.all([
        q(`SELECT d.id, d.name, d.device_name, d.status,
                  (SELECT COUNT(*) FROM tbl_student s WHERE s.department_id = d.id AND ${LIVE('tbl_student', 's')}) AS students
             FROM tbl_department d WHERE d.franchise_id = ? AND ${LIVE('tbl_department', 'd')} ORDER BY d.name`, [id]),
        q(`SELECT
              (SELECT COUNT(*) FROM tbl_student WHERE franchise_id = ? AND ${LIVE('tbl_student')}) AS students,
              (SELECT COUNT(*) FROM tbl_student WHERE franchise_id = ? AND ${LIVE('tbl_student')} AND status = 1) AS active_students,
              (SELECT COUNT(*) FROM tbl_parents WHERE franchise_id = ?) AS parents,
              (SELECT COALESCE(SUM(total_talktime), 0) FROM tbl_student WHERE franchise_id = ? AND ${LIVE('tbl_student')}) AS talktime`,
          [id, id, id, id]),
        q(`SELECT id, plan_name, price, talktime_minutes, ${C('tbl_subscriptions', '', 'days')}, status
             FROM tbl_subscriptions WHERE franchise_id = ? AND ${LIVE('tbl_subscriptions')} ORDER BY price`, [id]),
        full ? q(`SELECT s.id, s.name, s.student_roll_no, s.contact, s.email, d.name AS department_name, s.status, s.total_talktime, s.created_at
                    FROM tbl_student s LEFT JOIN tbl_department d ON d.id = s.department_id
                   WHERE s.franchise_id = ? AND ${LIVE('tbl_student', 's')} ORDER BY s.name`, [id]) : null,
        full ? q(`SELECT p.id, p.name, p.contact, p.email, s.name AS student_name, s.student_roll_no, p.status, p.created_at
                    FROM tbl_parents p LEFT JOIN tbl_student s ON s.id = p.student_id
                   WHERE p.franchise_id = ? ORDER BY p.name`, [id]) : null,
    ]);

    return {
        type: 'franchise',
        profile: row,
        stats: {
            students: counts[0].students,
            active_students: counts[0].active_students,
            parents: counts[0].parents,
            available_min: minutes(counts[0].talktime),
        },
        departments,
        plans: plans.map((p) => ({ ...p, talktime_min: minutes(p.talktime_minutes) })),
        ...(full && {
            students: students.map((s) => ({ ...s, available_min: minutes(s.total_talktime) })),
            parents,
        }),
    };
});

const department = handle(async (req, auth) => {
    const id = toId(req.params.id);
    const [row] = await q(
        `SELECT d.id, d.name, d.device_name, d.status, ${C('tbl_department', 'd', 'emergency_contact_1')}, ${C('tbl_department', 'd', 'emergency_contact_2')},
                ${C('tbl_department', 'd', 'emergency_contact_3')}, ${HOUSE_SETTINGS.map((c) => C('tbl_department', 'd', c)).join(', ')},
                d.created_at, d.franchise_id, f.franchiseName AS franchise_name
           FROM tbl_department d
           LEFT JOIN tbl_franchise f ON f.Id = d.franchise_id
          WHERE d.id = ?${auth.franchiseId ? ' AND d.franchise_id = ?' : ''}`,
        auth.franchiseId ? [id, auth.franchiseId] : [id]);
    if (!row) return null;

    const students = await q(
        `SELECT id, name, student_roll_no, contact, status, total_talktime
           FROM tbl_student WHERE department_id = ? AND ${LIVE('tbl_student')} ORDER BY name`, [id]);
    const parents = req.query.full === '1' ? await q(
        `SELECT p.id, p.name, p.contact, p.email, s.name AS student_name, s.student_roll_no, p.status, p.created_at
           FROM tbl_parents p JOIN tbl_student s ON s.id = p.student_id
          WHERE s.department_id = ? ORDER BY p.name`, [id]) : null;

    return {
        type: 'department',
        profile: row,
        stats: {
            students: students.length,
            active_students: students.filter((s) => s.status == 1).length,
            available_min: minutes(students.reduce((sum, s) => sum + (Number(s.total_talktime) || 0), 0)),
        },
        students: students.map((s) => ({ ...s, available_min: minutes(s.total_talktime) })),
        ...(parents && { parents }),
    };
});

module.exports = { search, student, parent, franchise, department };
