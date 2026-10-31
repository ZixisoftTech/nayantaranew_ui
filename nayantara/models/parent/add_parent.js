/*
 * POST /parent/add-parent   { student_id, name, contact, password, otp?, coins?, email? }
 *
 * Adds a parent login to an existing student. Super admin, sub admin with "manage" on parents.php,
 * or a school for its own students. A student has at most 4 parents (the edit student form has 4 slots
 * and rewrites them on save), and a contact number is unique within a school, as in add-students.
 *
 * contact: Indian numbers (10 digits, or +91 and 10 digits) are saved as the 10 digits, like every
 *          existing parent; other countries are saved as "+<country code><number>". Parents sign in
 *          with exactly the saved value.
 * otp:     optional fixed login OTP. SMS only reaches Indian numbers, so international parents keep
 *          this OTP (see Parentotp); for Indian numbers the next SMS OTP replaces it.
 * coins:   optional starting balance in Spacs Coins (1 coin = 60 s), added to the student's shared
 *          balance, i.e. to the student and all of its parents.
 */
const { claimsOf, HttpError, handle, q, isAdminRole } = require('../auth');

const MAX_PARENTS = 4;

/** Saved form of a phone number, or null when it is not a valid number. */
function normalizeContact(input) {
    const raw = String(input || '').replace(/[\s\-().]/g, '');
    if (/^\d{10}$/.test(raw)) return raw;
    const intl = raw.replace(/^00/, '+');
    if (/^\+91\d{10}$/.test(intl)) return intl.slice(3);
    if (/^\+[1-9]\d{6,14}$/.test(intl) && !intl.startsWith('+91')) return intl;
    return null;
}

const addParent = handle(async (req) => {
    const claims = claimsOf(req);
    if (claims.role === 'subadmin' && (claims.permissions || {})['parents.php'] !== 'manage') {
        throw new HttpError(403, 'You do not have permission to add parents');
    }
    if (!isAdminRole(claims.role) && claims.role !== 'franchise') throw new HttpError(403, 'Not allowed');

    const body = req.body || {};
    const name = String(body.name || '').trim();
    const contact = normalizeContact(body.contact);
    const email = String(body.email || '').trim();
    const password = String(body.password || '').trim();
    const otp = String(body.otp ?? '').trim();
    const coins = body.coins === undefined || body.coins === '' ? 0 : Number(body.coins);
    if (!name) throw new HttpError(400, 'Please enter the parent name');
    if (!contact) throw new HttpError(400, 'Enter a 10 digit Indian number, or an international number with its country code, e.g. +14155550123');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Please enter a valid email');
    if (password.length < 4 || password.length > 12) throw new HttpError(400, 'Password must be 4 to 12 characters');
    if (otp && !/^\d{4,6}$/.test(otp)) throw new HttpError(400, 'Login OTP must be 4 to 6 digits');
    if (!Number.isFinite(coins) || coins < 0 || coins > 100000) throw new HttpError(400, 'Initial balance must be 0 or more coins');

    const [student] = await q('SELECT id, franchise_id, total_talktime FROM tbl_student WHERE id = ?', [Number(body.student_id)]);
    if (!student) throw new HttpError(404, 'Please select a student');
    if (claims.role === 'franchise' && student.franchise_id != claims.userId) throw new HttpError(403, 'This student is not in your school');

    const [{ total }] = await q('SELECT COUNT(*) AS total FROM tbl_parents WHERE student_id = ?', [student.id]);
    if (total >= MAX_PARENTS) throw new HttpError(400, `This student already has ${MAX_PARENTS} parents`);
    const [taken] = await q('SELECT id FROM tbl_parents WHERE franchise_id = ? AND contact = ?', [student.franchise_id, contact]);
    if (taken) throw new HttpError(400, 'Parent contact number already exists');

    // parents share the student's talk time, as when the student is edited
    const result = await q(
        'INSERT INTO tbl_parents (franchise_id, student_id, name, contact, email, password, otp, total_talktime) VALUES (?)',
        [[student.franchise_id, student.id, name, contact, email, password, otp ? Number(otp) : null, student.total_talktime || 0]]);

    const seconds = Math.round(coins * 60);
    if (seconds > 0) {
        await q('UPDATE tbl_student SET total_talktime = total_talktime + ? WHERE id = ?', [seconds, student.id]);
        await q('UPDATE tbl_parents SET total_talktime = total_talktime + ? WHERE student_id = ?', [seconds, student.id]);
    }
    return { message: 'Parent successfully added', data: { id: result.insertId, contact } };
});

module.exports = { addParent, normalizeContact };
