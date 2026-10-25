/*
 * Single portal sign-in and sub admin management.
 *
 *   POST /api/portal-login        email + password -> super admin, sub admin (tbl_admin) or school (tbl_franchise)
 *   GET  /api/me                  the signed-in user (fresh name + permissions)
 *   POST /api/school-token        admin / sub admin -> token scoped to one school, for the school tools pages
 *   GET|POST|PUT|DELETE /api/sub-admins[/:id]   super admin only
 *
 * Token roles: "admin" (super admin), "subadmin", "franchise" (school). Sub admin tokens carry
 * { permissions: { "students.php": "view" | "manage", ... } }; the PHP portal reads them to build
 * the menu and guard pages.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dataBase = require('../config/db');
const { ensureColumns } = require('./schema');

const SECRET = 'helloiamabhisheklodhi';
const TOKEN_TTL = '30d';

ensureColumns('tbl_admin', {
    role: "VARCHAR(20) NOT NULL DEFAULT 'super_admin'",
    permissions: 'TEXT NULL',
});
// bcrypt hashes are 60 characters; the original columns were VARCHAR(30)
const WIDER = { password: 255, email: 100 };
dataBase.query(
    `SELECT COLUMN_NAME AS name, CHARACTER_MAXIMUM_LENGTH AS len FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_admin' AND COLUMN_NAME IN ('password', 'email')`,
    (error, rows) => {
        if (error) return console.log('tbl_admin column check failed', error.message);
        rows.filter((r) => r.len < WIDER[r.name]).forEach((r) => {
            dataBase.query(`ALTER TABLE tbl_admin MODIFY ?? VARCHAR(${WIDER[r.name]}) NOT NULL`, [r.name], (err) => {
                if (err) console.log(`Unable to widen tbl_admin.${r.name}`, err.message);
            });
        });
    });

const q = (sql, params) => new Promise((resolve, reject) => {
    dataBase.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
});

class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}

const handle = (fn) => async (req, res) => {
    try {
        const data = await fn(req);
        return res.status(200).send({ error: false, message: data.message || 'Success', data: data.data === undefined ? null : data.data });
    } catch (err) {
        if (err instanceof HttpError) return res.status(err.status).send({ error: true, message: err.message, data: null });
        console.log('auth error', err);
        return res.status(500).send({ error: true, message: 'Something went wrong', data: null });
    }
};

function claimsOf(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new HttpError(401, 'Please sign in again.');
    try {
        return jwt.verify(token, SECRET);
    } catch (e) {
        throw new HttpError(401, 'Your session has expired. Please sign in again.');
    }
}

const isAdminRole = (role) => role === 'admin' || role === 'subadmin';

const parsePermissions = (text) => {
    try {
        const value = JSON.parse(text || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (e) {
        return {};
    }
};

/** Keeps only { "page.php": "view" | "manage" } entries. */
function cleanPermissions(input) {
    const out = {};
    if (!input || typeof input !== 'object') return out;
    Object.entries(input).forEach(([page, level]) => {
        if (/^[a-z_]+\.php$/.test(page) && (level === 'view' || level === 'manage')) out[page] = level;
    });
    return out;
}

// new passwords are bcrypt hashes; existing admin and school passwords are still plain text
const passwordMatches = (plain, stored) => (/^\$2[aby]\$/.test(stored || '') ? bcrypt.compare(plain, stored) : Promise.resolve(plain === stored));

function sign(claims) {
    return jwt.sign(claims, SECRET, { expiresIn: TOKEN_TTL });
}

const portalLogin = handle(async (req) => {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    if (!email || !password) throw new HttpError(200, 'Please enter email and password');

    const [admin] = await q('SELECT * FROM tbl_admin WHERE email = ?', [email]);
    if (admin) {
        if (!(await passwordMatches(password, admin.password))) throw new HttpError(200, 'Incorrect password');
        if (admin.status == 0) throw new HttpError(200, 'This account is disabled');
        const sub = admin.role === 'sub_admin';
        const permissions = sub ? parsePermissions(admin.permissions) : null;
        const token = sign(sub ? { userId: admin.id, role: 'subadmin', permissions } : { userId: admin.id, role: 'admin' });
        return {
            message: 'Successfully signed in',
            data: { role: sub ? 'sub_admin' : 'super_admin', name: admin.name, token, permissions },
        };
    }

    const [school] = await q('SELECT Id, franchiseName, password, status FROM tbl_franchise WHERE email = ?', [email]);
    if (!school) throw new HttpError(200, 'Incorrect email');
    if (!(await passwordMatches(password, school.password))) throw new HttpError(200, 'Incorrect password');
    if (school.status == 0) throw new HttpError(200, 'This school is not active at the moment');
    return {
        message: 'Successfully signed in',
        data: { role: 'school', name: school.franchiseName, token: sign({ userId: school.Id, role: 'franchise' }), permissions: null },
    };
});

const me = handle(async (req) => {
    const claims = claimsOf(req);
    if (claims.role === 'franchise') {
        const [school] = await q('SELECT Id, franchiseName, status FROM tbl_franchise WHERE Id = ?', [claims.userId]);
        if (!school || school.status == 0) throw new HttpError(401, 'Please sign in again.');
        return { data: { role: 'school', name: school.franchiseName, schoolId: school.Id } };
    }
    const [admin] = await q('SELECT id, name, email, role, permissions, status FROM tbl_admin WHERE id = ?', [claims.userId]);
    if (!admin || admin.status == 0) throw new HttpError(401, 'Please sign in again.');
    const sub = admin.role === 'sub_admin';
    return { data: { role: sub ? 'sub_admin' : 'super_admin', name: admin.name, email: admin.email, permissions: sub ? parsePermissions(admin.permissions) : null } };
});

/** Admins open the school tools (CSV import, skip data) for a chosen school with a school-scoped token. */
const schoolToken = handle(async (req) => {
    const claims = claimsOf(req);
    if (!isAdminRole(claims.role)) throw new HttpError(403, 'Not allowed');
    if (claims.role === 'subadmin' && !Object.keys(claims.permissions || {}).some((p) => p.startsWith('school_'))) {
        throw new HttpError(403, 'You do not have access to the school tools');
    }
    const id = Number(req.body.franchise_id);
    const [school] = await q('SELECT Id, franchiseName FROM tbl_franchise WHERE Id = ?', [id]);
    if (!school) throw new HttpError(404, 'School not found');
    return { data: { token: sign({ userId: school.Id, role: 'franchise', actingAs: claims.userId }), name: school.franchiseName, id: school.Id } };
});

/* ------------------------------------------------------------ sub admins */

function requireSuperAdmin(req) {
    const claims = claimsOf(req);
    if (claims.role !== 'admin') throw new HttpError(403, 'Only the super admin can manage sub admins');
    return claims;
}

const listSubAdmins = handle(async (req) => {
    requireSuperAdmin(req);
    const [rows, schools] = await Promise.all([
        q("SELECT id, name, email, status, permissions, created_at FROM tbl_admin WHERE role = 'sub_admin' ORDER BY name"),
        // each school's email + password is also a portal login, limited to the school's own pages
        q('SELECT Id AS id, franchiseName AS name, email, status, created_at FROM tbl_franchise ORDER BY franchiseName'),
    ]);
    return {
        data: [
            ...rows.map((r) => ({ ...r, type: 'sub_admin', permissions: parsePermissions(r.permissions) })),
            ...schools.map((s) => ({ ...s, type: 'school', permissions: null })),
        ],
    };
});

async function readSubAdmin(body, existingId) {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!name || !email) throw new HttpError(200, 'Please enter name and email');
    if (name.length > 50 || email.length > 100) throw new HttpError(200, 'Name or email is too long');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(200, 'Please enter a valid email address');
    if (!existingId && password.length < 6) throw new HttpError(200, 'Password must be at least 6 characters');
    if (existingId && password && password.length < 6) throw new HttpError(200, 'Password must be at least 6 characters');
    // one email signs in to one account across admins and schools
    const [taken] = await q('SELECT id FROM tbl_admin WHERE email = ? AND id <> ?', [email, existingId || 0]);
    const [school] = await q('SELECT Id FROM tbl_franchise WHERE email = ?', [email]);
    if (taken || school) throw new HttpError(200, 'This email is already used by another account');
    const row = { name, email, status: body.status == 0 ? 0 : 1, permissions: JSON.stringify(cleanPermissions(body.permissions)) };
    if (password) row.password = await bcrypt.hash(password, 10);
    return row;
}

const createSubAdmin = handle(async (req) => {
    requireSuperAdmin(req);
    const row = await readSubAdmin(req.body, null);
    const result = await q('INSERT INTO tbl_admin SET ?', [{ ...row, role: 'sub_admin' }]);
    return { message: 'Sub admin created', data: { id: result.insertId } };
});

const updateSubAdmin = handle(async (req) => {
    requireSuperAdmin(req);
    const id = Number(req.params.id);
    const [existing] = await q("SELECT id FROM tbl_admin WHERE id = ? AND role = 'sub_admin'", [id]);
    if (!existing) throw new HttpError(404, 'Sub admin not found');
    const row = await readSubAdmin(req.body, id);
    await q('UPDATE tbl_admin SET ? WHERE id = ?', [row, id]);
    return { message: 'Sub admin updated' };
});

const deleteSubAdmin = handle(async (req) => {
    requireSuperAdmin(req);
    const result = await q("DELETE FROM tbl_admin WHERE id = ? AND role = 'sub_admin'", [Number(req.params.id)]);
    if (!result.affectedRows) throw new HttpError(404, 'Sub admin not found');
    return { message: 'Sub admin deleted' };
});

module.exports = { portalLogin, me, schoolToken, listSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin, isAdminRole, claimsOf, HttpError, handle, q };
