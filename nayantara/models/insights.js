/*
 * Dashboard chart data.
 *
 *   GET /api/insights?days=30&portal=admin|franchise
 *
 * Auth: "Authorization: Bearer <token>".
 *  - admin data needs an admin token with the role claim (issued at login since roles were added)
 *  - franchise data is scoped to the franchise in the token (older role-less franchise tokens are accepted
 *    here because they can only ever narrow results to one franchise)
 */
const jwt = require('jsonwebtoken');
const dataBase = require('../config/db');
const { ready: schemaReady, live: LIVE } = require('./schema');

const SECRET = 'helloiamabhisheklodhi';

const q = (sql, params) => new Promise((resolve, reject) => {
    dataBase.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
});

function scopeFor(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    let claims = null;
    try { claims = token ? jwt.verify(token, SECRET) : null; } catch (e) { claims = null; }
    if (!claims) return null;
    const portal = req.query.portal === 'franchise' ? 'franchise' : 'admin';
    if (portal === 'admin') return claims.role === 'admin' || claims.role === 'subadmin' ? { franchiseId: null } : null;
    if (claims.role && claims.role !== 'franchise') return null;
    const id = Number(claims.userId);
    return Number.isInteger(id) && id > 0 ? { franchiseId: id } : null;
}

const insights = async (req, res) => {
    const scope = scopeFor(req);
    if (!scope) return res.status(401).send({ error: true, message: 'Please sign out and sign in again to see charts.' });

    const days = [7, 30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 90;
    const fScope = scope.franchiseId ? ' AND s.franchise_id = ?' : '';
    const fArgs = scope.franchiseId ? [scope.franchiseId] : [];
    // window = today and the (days - 1) days before it
    const since = 'DATE(x.created_at) >= CURDATE() - INTERVAL ? DAY';

    try {
        await schemaReady();
        const groupJoin = scope.franchiseId
            ? { join: 'INNER JOIN tbl_department g ON g.id = s.department_id', key: 'g.id, g.name', label: 'g.name' }
            : { join: 'INNER JOIN tbl_franchise g ON g.Id = s.franchise_id', key: 'g.Id, g.franchiseName', label: 'g.franchiseName' };
        const [purchases, calls, groups, topPlans, heat, lengths, signups, revenue, balances] = await Promise.all([
            q(`SELECT DATE_FORMAT(x.created_at, '%Y-%m-%d') AS day, COUNT(*) AS count, COALESCE(SUM(x.plan_price), 0) AS value
                 FROM tbl_plan_purchase x INNER JOIN tbl_student s ON s.id = x.student_id
                WHERE ${since}${fScope}
                GROUP BY day ORDER BY day`, [days - 1, ...fArgs]),
            q(`SELECT DATE_FORMAT(x.created_at, '%Y-%m-%d') AS day, COUNT(*) AS calls, COALESCE(SUM(x.minute), 0) AS seconds
                 FROM tbl_callhistory x INNER JOIN tbl_student s ON s.id = x.student_id
                WHERE ${since}${fScope}
                GROUP BY day ORDER BY day`, [days - 1, ...fArgs]),
            scope.franchiseId
                ? q(`SELECT d.name AS label, SUM(s.status = 1) AS active, SUM(s.status <> 1) AS inactive
                       FROM tbl_student s INNER JOIN tbl_department d ON d.id = s.department_id
                      WHERE ${LIVE('tbl_student', 's')} AND s.franchise_id = ?
                      GROUP BY d.id, d.name ORDER BY COUNT(*) DESC LIMIT 10`, fArgs)
                : q(`SELECT f.franchiseName AS label, SUM(s.status = 1) AS active, SUM(s.status <> 1) AS inactive
                       FROM tbl_student s INNER JOIN tbl_franchise f ON f.Id = s.franchise_id
                      WHERE ${LIVE('tbl_student', 's')}
                      GROUP BY f.Id, f.franchiseName ORDER BY COUNT(*) DESC LIMIT 10`, []),
            q(`SELECT x.plan_name AS label, COUNT(*) AS count, COALESCE(SUM(x.plan_price), 0) AS value
                 FROM tbl_plan_purchase x INNER JOIN tbl_student s ON s.id = x.student_id
                WHERE ${since}${fScope}
                GROUP BY x.plan_name ORDER BY count DESC LIMIT 6`, [days - 1, ...fArgs]),
            // calls by weekday (1 = Sunday) and hour
            q(`SELECT DAYOFWEEK(x.created_at) AS dow, HOUR(x.created_at) AS hour, COUNT(*) AS calls
                 FROM tbl_callhistory x INNER JOIN tbl_student s ON s.id = x.student_id
                WHERE ${since}${fScope}
                GROUP BY dow, hour`, [days - 1, ...fArgs]),
            // connected calls by length (minute column holds seconds)
            q(`SELECT CASE WHEN x.minute + 0 < 60 THEN 0 WHEN x.minute + 0 < 180 THEN 1 WHEN x.minute + 0 < 300 THEN 2
                           WHEN x.minute + 0 < 600 THEN 3 WHEN x.minute + 0 < 1200 THEN 4 ELSE 5 END AS bucket, COUNT(*) AS calls
                 FROM tbl_callhistory x INNER JOIN tbl_student s ON s.id = x.student_id
                WHERE ${since} AND x.minute + 0 > 0${fScope}
                GROUP BY bucket`, [days - 1, ...fArgs]),
            q(`SELECT DATE_FORMAT(x.created_at, '%Y-%m-%d') AS day, COUNT(*) AS count
                 FROM tbl_student x INNER JOIN tbl_student s ON s.id = x.id
                WHERE ${since} AND ${LIVE('tbl_student', 'x')}${fScope}
                GROUP BY day ORDER BY day`, [days - 1, ...fArgs]),
            q(`SELECT ${groupJoin.label} AS label, COUNT(*) AS count, COALESCE(SUM(x.plan_price), 0) AS value
                 FROM tbl_plan_purchase x INNER JOIN tbl_student s ON s.id = x.student_id ${groupJoin.join}
                WHERE ${since}${fScope}
                GROUP BY ${groupJoin.key} ORDER BY value DESC LIMIT 8`, [days - 1, ...fArgs]),
            // current talk-time balance (seconds) of every student
            q(`SELECT CASE WHEN s.total_talktime < 0 THEN 0 WHEN s.total_talktime < 1800 THEN 1
                           WHEN s.total_talktime < 3600 THEN 2 WHEN s.total_talktime < 7200 THEN 3 ELSE 4 END AS bucket, COUNT(*) AS students
                 FROM tbl_student s
                WHERE ${LIVE('tbl_student', 's')}${fScope}
                GROUP BY bucket`, fArgs),
        ]);
        const byBucket = (rows, n, field) => {
            const out = new Array(n).fill(0);
            rows.forEach((r) => { out[Number(r.bucket)] = Number(r[field]); });
            return out;
        };

        return res.status(200).send({
            error: false,
            data: {
                days,
                groupBy: scope.franchiseId ? 'department' : 'franchise',
                purchases: purchases.map((r) => ({ day: r.day, count: Number(r.count), value: Number(r.value) })),
                calls: calls.map((r) => ({ day: r.day, calls: Number(r.calls), minutes: Math.round(Number(r.seconds) / 60) })),
                students: groups.map((r) => ({ label: r.label, active: Number(r.active), inactive: Number(r.inactive) })),
                topPlans: topPlans.map((r) => ({ label: r.label, count: Number(r.count), value: Number(r.value) })),
                heatmap: heat.map((r) => ({ dow: Number(r.dow), hour: Number(r.hour), calls: Number(r.calls) })),
                callLengths: byBucket(lengths, 6, 'calls'),
                signups: signups.map((r) => ({ day: r.day, count: Number(r.count) })),
                revenue: revenue.map((r) => ({ label: r.label, count: Number(r.count), value: Number(r.value) })),
                balances: byBucket(balances, 5, 'students'),
            },
        });
    } catch (err) {
        console.log('insights error', err);
        return res.status(500).send({ error: true, message: 'Could not load chart data.' });
    }
};

module.exports = { insights };
