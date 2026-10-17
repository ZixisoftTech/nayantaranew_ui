/*
 * Super admin dashboard: everything above the charts that isn't a plain count.
 *
 *   GET /api/overview
 *
 * Auth: "Authorization: Bearer <admin token>" (same rule as /api/insights).
 * Talk time (tbl_student.total_talktime, tbl_callhistory.minute) is stored in seconds.
 * The database runs in IST, so NOW()/CURDATE() are Indian time.
 */
const jwt = require('jsonwebtoken');
const dataBase = require('../config/db');
const { ready: schemaReady, live: LIVE } = require('./schema');

const SECRET = 'helloiamabhisheklodhi';
const LOW_BALANCE = 300;   // seconds: "under 5 minutes"
const INACTIVE_DAYS = 30;

const q = (sql, params) => new Promise((resolve, reject) => {
    dataBase.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
});

function isAdmin(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    try { return !!token && jwt.verify(token, SECRET).role === 'admin'; } catch (e) { return false; }
}

// tbl_department_timeslots.day uses full day names, with Saturday stored as "Satuarday"
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayIndex = (name) => {
    const d = String(name || '').toLowerCase().replace('satuarday', 'saturday').trim();
    return DAYS.indexOf(d);
};
const toMinutes = (t) => {
    const [h, m] = String(t || '0:0').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

/* Which departments can call right now, and when each one opens next. */
function callWindows(slots, departments, now) {
    const byDept = {};
    slots.forEach((s) => {
        const day = dayIndex(s.day);
        const start = toMinutes(s.start_time);
        const end = toMinutes(s.end_time);
        if (day < 0 || end - start < 5) return; // 00:00–00:00 (or 00:00–00:01) rows are unused slots
        (byDept[s.department_id] = byDept[s.department_id] || []).push({ day, start, end });
    });

    const nowDay = now.dow;
    const nowMin = now.minutes;
    return departments.map((d) => {
        const list = byDept[d.id] || [];
        const open = list.find((s) => s.day === nowDay && s.start <= nowMin && nowMin < s.end);
        let next = null;
        if (!open) {
            // look ahead up to a week, starting later today
            for (let i = 0; i < 8 && !next; i++) {
                const day = (nowDay + i) % 7;
                const candidates = list
                    .filter((s) => s.day === day && (i > 0 || s.start > nowMin))
                    .sort((a, b) => a.start - b.start);
                if (candidates.length) next = { inDays: i, day, start: candidates[0].start, end: candidates[0].end };
            }
        }
        return {
            id: d.id,
            name: d.name,
            franchise: d.franchise,
            franchise_id: d.franchise_id,
            students: Number(d.students) || 0,
            configured: list.length > 0,
            open: open ? { start: open.start, end: open.end } : null,
            next,
        };
    });
}

const overview = async (req, res) => {
    if (!isAdmin(req)) return res.status(401).send({ error: true, message: 'Please sign out and sign in again to see the overview.' });

    try {
        await schemaReady();
        const liveS = LIVE('tbl_student', 's');
        const [
            [attention], noPlan, [today], [yesterday], tickets, [ticketCounts], franchises, slots, departments, [clock],
        ] = await Promise.all([
            q(`SELECT SUM(s.total_talktime <= 0) AS zero,
                      SUM(s.total_talktime > 0 AND s.total_talktime < ?) AS low,
                      -- uncorrelated subquery: tbl_callhistory has no index on student_id, so a correlated
                      -- NOT EXISTS would scan the whole table once per student
                      SUM(s.login_status = '1' AND s.id NOT IN (
                          SELECT c.student_id FROM tbl_callhistory c
                           WHERE c.created_at >= NOW() - INTERVAL ? DAY AND c.student_id IS NOT NULL)) AS inactive,
                      SUM(s.login_status = '1') AS logged_in,
                      COUNT(*) AS students
                 FROM tbl_student s WHERE ${liveS}`, [LOW_BALANCE, INACTIVE_DAYS]),
            // active franchises (with students) that have no active plan to assign
            q(`SELECT f.Id AS id, f.franchiseName AS name, COUNT(s.id) AS students
                 FROM tbl_franchise f
                 LEFT JOIN tbl_student s ON s.franchise_id = f.Id AND ${liveS}
                WHERE NOT EXISTS (SELECT 1 FROM tbl_subscriptions p WHERE p.franchise_id = f.Id AND p.status = 1)
                GROUP BY f.Id, f.franchiseName
               HAVING students > 0
                ORDER BY students DESC`, []),
            // today so far
            q(`SELECT
                 (SELECT COUNT(*) FROM tbl_callhistory WHERE created_at >= CURDATE()) AS calls,
                 (SELECT COALESCE(SUM(minute + 0), 0) FROM tbl_callhistory WHERE created_at >= CURDATE()) AS seconds,
                 (SELECT COUNT(*) FROM tbl_plan_purchase WHERE created_at >= CURDATE()) AS plans,
                 (SELECT COALESCE(SUM(plan_price), 0) FROM tbl_plan_purchase WHERE created_at >= CURDATE()) AS revenue,
                 (SELECT COUNT(DISTINCT student_id) FROM tbl_callhistory WHERE created_at >= CURDATE()) AS callers`, []),
            // yesterday up to the same time of day, so the comparison is fair
            q(`SELECT
                 (SELECT COUNT(*) FROM tbl_callhistory WHERE created_at >= CURDATE() - INTERVAL 1 DAY AND created_at < NOW() - INTERVAL 1 DAY) AS calls,
                 (SELECT COALESCE(SUM(minute + 0), 0) FROM tbl_callhistory WHERE created_at >= CURDATE() - INTERVAL 1 DAY AND created_at < NOW() - INTERVAL 1 DAY) AS seconds,
                 (SELECT COUNT(*) FROM tbl_plan_purchase WHERE created_at >= CURDATE() - INTERVAL 1 DAY AND created_at < NOW() - INTERVAL 1 DAY) AS plans,
                 (SELECT COALESCE(SUM(plan_price), 0) FROM tbl_plan_purchase WHERE created_at >= CURDATE() - INTERVAL 1 DAY AND created_at < NOW() - INTERVAL 1 DAY) AS revenue,
                 (SELECT COUNT(DISTINCT student_id) FROM tbl_callhistory WHERE created_at >= CURDATE() - INTERVAL 1 DAY AND created_at < NOW() - INTERVAL 1 DAY) AS callers`, []),
            q(`(SELECT 'student' AS kind, i.id, i.student_id AS person_id, i.student_name AS name, i.subject, i.message,
                       DATE_FORMAT(i.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
                  FROM tbl_student_issue i ORDER BY i.id DESC LIMIT 6)
               UNION ALL
               (SELECT 'parent' AS kind, i.id, i.parent_id AS person_id, i.parent_name AS name, i.subject, i.message,
                       DATE_FORMAT(i.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
                  FROM tbl_parents_issue i ORDER BY i.id DESC LIMIT 6)
               ORDER BY created_at DESC LIMIT 6`, []),
            q(`SELECT
                 (SELECT COUNT(*) FROM tbl_student_issue WHERE created_at >= NOW() - INTERVAL 7 DAY) AS student_week,
                 (SELECT COUNT(*) FROM tbl_parents_issue WHERE created_at >= NOW() - INTERVAL 7 DAY) AS parent_week`, []),
            // franchise leaderboard (last 30 days for activity and revenue)
            q(`SELECT f.Id AS id, f.franchiseName AS name,
                      COALESCE(st.students, 0) AS students, COALESCE(st.logged_in, 0) AS logged_in,
                      COALESCE(st.zero, 0) AS zero_balance,
                      COALESCE(ca.callers, 0) AS callers, COALESCE(ca.seconds, 0) AS seconds,
                      COALESCE(pu.purchases, 0) AS purchases, COALESCE(pu.revenue, 0) AS revenue,
                      DATE_FORMAT(lp.last_purchase, '%Y-%m-%dT%H:%i:%s') AS last_purchase,
                      EXISTS (SELECT 1 FROM tbl_subscriptions p WHERE p.franchise_id = f.Id AND p.status = 1) AS has_plan
                 FROM tbl_franchise f
                 LEFT JOIN (SELECT s.franchise_id, COUNT(*) AS students, SUM(s.login_status = '1') AS logged_in,
                                   SUM(s.total_talktime <= 0) AS zero
                              FROM tbl_student s WHERE ${liveS} GROUP BY s.franchise_id) st ON st.franchise_id = f.Id
                 LEFT JOIN (SELECT s.franchise_id, COUNT(DISTINCT c.student_id) AS callers, SUM(c.minute + 0) AS seconds
                              FROM tbl_callhistory c INNER JOIN tbl_student s ON s.id = c.student_id
                             WHERE c.created_at >= NOW() - INTERVAL ? DAY GROUP BY s.franchise_id) ca ON ca.franchise_id = f.Id
                 LEFT JOIN (SELECT s.franchise_id, COUNT(*) AS purchases, SUM(x.plan_price) AS revenue
                              FROM tbl_plan_purchase x INNER JOIN tbl_student s ON s.id = x.student_id
                             WHERE x.created_at >= NOW() - INTERVAL ? DAY GROUP BY s.franchise_id) pu ON pu.franchise_id = f.Id
                 LEFT JOIN (SELECT s.franchise_id, MAX(x.created_at) AS last_purchase
                              FROM tbl_plan_purchase x INNER JOIN tbl_student s ON s.id = x.student_id
                             GROUP BY s.franchise_id) lp ON lp.franchise_id = f.Id
                WHERE COALESCE(st.students, 0) > 0
                ORDER BY revenue DESC, students DESC`, [INACTIVE_DAYS, INACTIVE_DAYS]),
            q('SELECT department_id, day, start_time, end_time FROM tbl_department_timeslots', []),
            q(`SELECT d.id, d.name, d.franchise_id, f.franchiseName AS franchise,
                      (SELECT COUNT(*) FROM tbl_student s WHERE s.department_id = d.id AND ${liveS}) AS students
                 FROM tbl_department d LEFT JOIN tbl_franchise f ON f.Id = d.franchise_id
                WHERE d.status = 1`, []),
            q(`SELECT DAYOFWEEK(NOW()) - 1 AS dow, HOUR(NOW()) * 60 + MINUTE(NOW()) AS minutes,
                      DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') AS now`, []),
        ]);

        const num = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number(v) || 0]));
        const windows = callWindows(slots, departments, { dow: Number(clock.dow), minutes: Number(clock.minutes) })
            .filter((w) => w.students > 0);

        return res.status(200).send({
            error: false,
            data: {
                now: clock.now,
                lowBalanceSeconds: LOW_BALANCE,
                inactiveDays: INACTIVE_DAYS,
                attention: {
                    ...num(attention),
                    noPlan: noPlan.map((f) => ({ id: f.id, name: f.name, students: Number(f.students) })),
                },
                today: num(today),
                yesterday: num(yesterday),
                tickets: tickets.map((t) => ({
                    kind: t.kind, id: t.id, person_id: t.person_id, name: t.name,
                    subject: t.subject, message: t.message, created_at: t.created_at,
                })),
                ticketCounts: num(ticketCounts),
                franchises: franchises.map((f) => ({
                    id: f.id, name: f.name,
                    students: Number(f.students), logged_in: Number(f.logged_in), zero_balance: Number(f.zero_balance),
                    callers: Number(f.callers), minutes: Math.round(Number(f.seconds) / 60),
                    purchases: Number(f.purchases), revenue: Number(f.revenue),
                    last_purchase: f.last_purchase, has_plan: !!Number(f.has_plan),
                })),
                windows,
            },
        });
    } catch (err) {
        console.log('overview error', err);
        return res.status(500).send({ error: true, message: 'Could not load the overview.' });
    }
};

module.exports = { overview };
