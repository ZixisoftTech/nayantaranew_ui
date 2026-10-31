/*
 * School (tbl_franchise) and house (tbl_department) settings applied to the mobile call,
 * recharge and parent-activation APIs, plus the weekly minute allotment job.
 *
 * Balances stay in seconds of talk time (tbl_student / tbl_parents.total_talktime);
 * 1 Spacs Coin = 1 minute of balance, so a call costs seconds x the school's coins/min rate.
 */
const cron = require('node-cron');
const dataBase = require('../config/db');
const { ensureColumns } = require('./schema');
const { requireManage } = require('./auth');

const q = (sql, params) => new Promise((resolve, reject) => {
    dataBase.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
});

ensureColumns('tbl_callhistory', { call_type: "VARCHAR(10) NOT NULL DEFAULT 'video'" });
// existing parents count as already activated, so only parents added from now on pay the activation fee
ensureColumns('tbl_parents', { activated_at: 'DATETIME NULL DEFAULT NULL' }, () => {
    dataBase.query('UPDATE tbl_parents SET activated_at = created_at WHERE activated_at IS NULL');
});
ensureColumns('tbl_department', { last_allotment_at: 'DATETIME NULL DEFAULT NULL' });
dataBase.query(`CREATE TABLE IF NOT EXISTS tbl_allotment_log (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    department_id INT(11) NOT NULL,
    students INT(11) NOT NULL,
    seconds_each INT(11) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
ensureColumns('tbl_allotment_log', { source: "VARCHAR(10) NOT NULL DEFAULT 'auto'" }); // auto = weekly job, manual = "Allot now"

const callType = (value) => (String(value || '').toLowerCase() === 'audio' ? 'audio' : 'video');

/** Student with its school and house settings, or null. */
async function getRules(studentId) {
    const [row] = await q(
        `SELECT s.id, s.franchise_id, s.department_id, s.total_talktime,
                f.allow_parental_recharge, f.allow_audio_calls, f.video_rate, f.audio_rate, f.activation_fee,
                f.max_calls_per_day, f.daily_duration_min, f.min_call_duration_sec,
                d.max_call_duration_sec
           FROM tbl_student s
           LEFT JOIN tbl_franchise f ON f.Id = s.franchise_id
           LEFT JOIN tbl_department d ON d.id = s.department_id
          WHERE s.id = ?`, [studentId]);
    return row || null;
}

const rateFor = (rules, type) => {
    const rate = Number(type === 'audio' ? rules.audio_rate : rules.video_rate);
    return Number.isFinite(rate) && rate >= 0 ? rate : 1;
};

/** Today's ended calls that count towards the daily limits (shorter calls are ignored). */
async function todayUsage(studentId, minSeconds) {
    const [row] = await q(
        `SELECT COUNT(*) AS calls, COALESCE(SUM(minute), 0) AS seconds
           FROM tbl_callhistory
          WHERE student_id = ? AND status = 3 AND created_at >= CURDATE() AND CAST(minute AS UNSIGNED) >= ?`,
        [studentId, Number(minSeconds) || 0]);
    return { calls: Number(row.calls), seconds: Number(row.seconds) };
}

/** Reason the student may not start a call of this type right now, or null. */
async function callBlockReason(studentId, type) {
    try {
        const rules = await getRules(studentId);
        if (!rules) return null;
        if (type === 'audio' && rules.allow_audio_calls == 0) return 'Audio calls are not enabled for this school';
        const usage = await todayUsage(studentId, rules.min_call_duration_sec);
        if (Number(rules.max_calls_per_day) > 0 && usage.calls >= Number(rules.max_calls_per_day)) {
            return `Daily call limit reached (${rules.max_calls_per_day} calls per day)`;
        }
        if (Number(rules.daily_duration_min) > 0 && usage.seconds >= Number(rules.daily_duration_min) * 60) {
            return `Daily talk time limit reached (${rules.daily_duration_min} minutes per day)`;
        }
        return null;
    } catch (error) {
        console.log('callBlockReason failed', error.message);
        return null;
    }
}

/**
 * Longest single call (seconds) the student can make now: balance at the call rate, house cap, daily
 * allowance left. Unlimited is capped at a day; undefined when the student doesn't exist.
 */
async function allowedCallSeconds(studentId, type) {
    const rules = await getRules(studentId);
    if (!rules) return undefined;
    const rate = rateFor(rules, type);
    const limits = [rate > 0 ? Math.floor(Math.max(Number(rules.total_talktime) || 0, 0) / rate) : Infinity];
    if (Number(rules.max_call_duration_sec) > 0) limits.push(Number(rules.max_call_duration_sec));
    if (Number(rules.daily_duration_min) > 0) {
        const usage = await todayUsage(studentId, rules.min_call_duration_sec);
        limits.push(Math.max(Number(rules.daily_duration_min) * 60 - usage.seconds, 0));
    }
    return Math.min(...limits, 24 * 3600);
}

/** Balance (seconds) to deduct for a finished call; falls back to the raw duration if settings can't be read. */
async function callCharge(call, durationSeconds) {
    const seconds = Number(durationSeconds) || 0;
    try {
        const rules = await getRules(call.student_id);
        return rules ? Math.ceil(seconds * rateFor(rules, callType(call.call_type))) : seconds;
    } catch (error) {
        console.log('callCharge failed', error.message);
        return seconds;
    }
}

/** Reason a parent may not buy talk time, or null. */
async function rechargeBlockReason(parentId) {
    try {
        const [row] = await q(
            `SELECT f.allow_parental_recharge FROM tbl_parents p
               LEFT JOIN tbl_student s ON s.id = p.student_id
               LEFT JOIN tbl_franchise f ON f.Id = COALESCE(s.franchise_id, p.franchise_id)
              WHERE p.id = ?`, [parentId]);
        return row && row.allow_parental_recharge == 0 ? 'Recharge is not enabled for this school' : null;
    } catch (error) {
        console.log('rechargeBlockReason failed', error.message);
        return null;
    }
}

const deductSql = 'total_talktime = IF(total_talktime > 0, GREATEST(total_talktime - ?, 0), total_talktime)';

/** Charges the school's one-time activation fee the first time a parent logs in. */
async function activateParent(parent) {
    try {
        const claimed = await q('UPDATE tbl_parents SET activated_at = NOW() WHERE id = ? AND activated_at IS NULL', [parent.id]);
        if (!claimed.affectedRows) return;
        const rules = await getRules(parent.student_id);
        const fee = rules ? Math.round(Number(rules.activation_fee) * 60) : 0;
        if (!(fee > 0)) return;
        await q(`UPDATE tbl_student SET ${deductSql} WHERE id = ?`, [fee, parent.student_id]);
        await q(`UPDATE tbl_parents SET ${deductSql} WHERE student_id = ?`, [fee, parent.student_id]);
    } catch (error) {
        console.log('activateParent failed', error.message);
    }
}

/* ------------------------------------------------ weekly minute allotment */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Current India time as { day, date: 'YYYY-MM-DD', time: 'HH:MM:SS' }. */
function nowIst() {
    const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
    const iso = ist.toISOString();
    return { day: DAYS[ist.getUTCDay()], date: iso.slice(0, 10), time: iso.slice(11, 19) };
}

/**
 * Adds the house's weekly minutes, converted to coins, to every student in it and their parents.
 * Returns { students, seconds } or null when the house has no weekly minutes.
 */
async function creditHouse(house, source) {
    const coins = Number(house.weekly_video_mins) * Number(house.video_rate) + Number(house.weekly_audio_mins) * Number(house.audio_rate);
    const seconds = Math.round(coins * 60);
    if (!(seconds > 0)) return null;
    const live = (await q("SHOW COLUMNS FROM tbl_student LIKE 'isdeleted'")).length ? ' AND isdeleted = 0' : '';
    const students = await q(`UPDATE tbl_student SET total_talktime = total_talktime + ? WHERE department_id = ?${live}`, [seconds, house.id]);
    await q(`UPDATE tbl_parents p JOIN tbl_student s ON s.id = p.student_id
                SET p.total_talktime = p.total_talktime + ? WHERE s.department_id = ?${live.replace('isdeleted', 's.isdeleted')}`, [seconds, house.id]);
    await q('INSERT INTO tbl_allotment_log (department_id, students, seconds_each, source) VALUES (?, ?, ?, ?)', [house.id, students.affectedRows, seconds, source]);
    console.log(`${source === 'manual' ? 'Manual' : 'Weekly'} allotment: house ${house.id}, ${students.affectedRows} students, ${seconds}s each`);
    return { students: students.affectedRows, seconds };
}

/*
 * Every minute: credit houses whose allotment day is today and whose time (IST) has passed,
 * once per day. last_allotment_at (IST) is claimed with a conditional UPDATE so two API
 * processes, or a restart, never credit twice.
 */
async function runAllotments() {
    const { day, date, time } = nowIst();
    const due = await q(
        `SELECT d.id, d.weekly_video_mins, d.weekly_audio_mins, f.video_rate, f.audio_rate
           FROM tbl_department d JOIN tbl_franchise f ON f.Id = d.franchise_id
          WHERE d.status = 1 AND d.allotment_day = ? AND d.allotment_time <= ?
            AND (d.weekly_video_mins > 0 OR d.weekly_audio_mins > 0)
            AND (d.last_allotment_at IS NULL OR d.last_allotment_at < ?)`, [day, time, date]);
    for (const house of due) {
        const claimed = await q(
            'UPDATE tbl_department SET last_allotment_at = ? WHERE id = ? AND (last_allotment_at IS NULL OR last_allotment_at < ?)',
            [`${date} ${time}`, house.id, date]);
        if (!claimed.affectedRows) continue;
        await creditHouse(house, 'auto');
    }
}

/**
 * POST /api/allot-now/:id — credits one house's saved weekly minutes right away ("Allot now" on the
 * Houses page). Super admin, or sub admin with manage access to Houses. The weekly schedule is unchanged.
 */
const allotNow = async (req, res) => {
    try {
        requireManage(req, 'manage_department.php');
        const [house] = await q(
            `SELECT d.id, d.status, d.weekly_video_mins, d.weekly_audio_mins, f.video_rate, f.audio_rate
               FROM tbl_department d JOIN tbl_franchise f ON f.Id = d.franchise_id
              WHERE d.id = ?`, [Number(req.params.id)]);
        if (!house) return res.status(200).send({ error: true, message: 'House not found', data: null });
        if (house.status != 1) return res.status(200).send({ error: true, message: 'This house is inactive. Activate it first.', data: null });
        const result = await creditHouse(house, 'manual');
        if (!result) return res.status(200).send({ error: true, message: 'Set weekly video or audio minutes above 0 and save the house first.', data: null });
        return res.status(200).send({
            error: false,
            message: `${+(result.seconds / 60).toFixed(2)} Spacs Coins credited to each of ${result.students} students`,
            data: result,
        });
    } catch (error) {
        if (error.status) return res.status(error.status).send({ error: true, message: error.message, data: null });
        console.log('Manual allotment failed', error.message);
        return res.status(500).send({ error: true, message: 'Allot now api not working', data: null });
    }
};

function startAllotmentJob() {
    cron.schedule('* * * * *', () => {
        runAllotments().catch((error) => console.log('Weekly allotment failed', error.message));
    });
}

/* --------------------------------------------- settings for the mobile apps */

const absolute = (req, path) => (path ? `${req.protocol}://${req.get('host')}/${path}` : null);

async function settingsFor(req, where, params) {
    const [row] = await q(
        `SELECT d.id AS house_id, d.name AS house_name, d.device_name, d.max_call_duration_sec, d.allotment_day, d.allotment_time,
                d.weekly_video_mins, d.weekly_audio_mins, d.parent_notice, d.student_notice,
                f.Id AS school_id, f.franchiseName AS school_name, f.logo, f.allow_parental_recharge, f.allow_audio_calls,
                f.video_rate, f.audio_rate, f.activation_fee, f.max_calls_per_day, f.daily_duration_min, f.min_call_duration_sec
           FROM tbl_department d JOIN tbl_franchise f ON f.Id = d.franchise_id
          WHERE ${where} LIMIT 1`, params);
    if (!row) return null;
    return { ...row, logo_url: absolute(req, row.logo) };
}

const send = (promise, res) => promise
    .then((data) => (data
        ? res.status(200).send({ error: false, message: 'Settings successfully found', data })
        : res.status(200).send({ error: true, message: 'Settings not found', data: null })))
    .catch((error) => {
        console.log('settings lookup failed', error.message);
        return res.status(500).send({ error: true, message: 'Settings api not working', data: null });
    });

/** GET /api/student-settings/:id — school + house settings and today's usage for a student (student and parent apps). */
const studentSettings = (req, res) => send((async () => {
    const id = Number(req.params.id);
    const [student] = await q('SELECT department_id FROM tbl_student WHERE id = ?', [id]);
    if (!student) return null;
    const settings = await settingsFor(req, 'd.id = ?', [student.department_id]);
    if (!settings) return null;
    const usage = await todayUsage(id, settings.min_call_duration_sec);
    return { ...settings, today_calls: usage.calls, today_seconds: usage.seconds };
})(), res);

/** GET /api/device-settings/:device — settings for a tablet before anyone logs in (student login screen notice). */
const deviceSettings = (req, res) => send(settingsFor(req, 'd.device_name = ?', [String(req.params.device)]), res);

module.exports = {
    callType, callBlockReason, allowedCallSeconds, callCharge, rechargeBlockReason, activateParent,
    startAllotmentJob, runAllotments, allotNow, studentSettings, deviceSettings,
};
