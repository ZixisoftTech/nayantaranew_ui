/*
 * Column detection so the newer endpoints (lookup, insights) work on every database
 * version: older installs lack columns such as isdeleted, validity, schoolemail, plan_end_date.
 * Columns are read once per table and cached for the life of the process.
 */
const dataBase = require('../config/db');

const cache = {};

function load(table) {
    if (!cache[table]) {
        cache[table] = new Promise((resolve) => {
            dataBase.query('SHOW COLUMNS FROM ??', [table], (error, rows) => {
                resolve(error ? new Set() : new Set(rows.map((r) => r.Field)));
            });
        });
    }
    return cache[table];
}

const TABLES = ['tbl_student', 'tbl_parents', 'tbl_franchise', 'tbl_department', 'tbl_callhistory',
    'tbl_plan_purchase', 'tbl_subscriptions'];
const known = {};

/** Loads every table's columns (cached). Call before using col()/live(). */
async function ready() {
    const sets = await Promise.all(TABLES.map(load));
    TABLES.forEach((t, i) => { known[t] = sets[i]; });
}

const ref = (alias, column) => (alias ? `${alias}.${column}` : column);

/** "alias.column [AS name]" when the column exists, otherwise "NULL AS name". */
function col(table, alias, column, as) {
    const has = known[table] && known[table].has(column);
    return has ? `${ref(alias, column)}${as ? ` AS ${as}` : ''}` : `NULL AS ${as || column}`;
}

/** "alias.isdeleted = 0" when the table supports soft deletes, otherwise an always-true condition. */
function live(table, alias) {
    return known[table] && known[table].has('isdeleted') ? `${ref(alias, 'isdeleted')} = 0` : '1 = 1';
}

/** Adds any of the given { column: definition } pairs that the table is missing; onAdded(column) runs after each add. */
function ensureColumns(table, columns, onAdded) {
    dataBase.query('SHOW COLUMNS FROM ??', [table], (error, rows) => {
        if (error) return console.log(`${table} column check failed`, error.message);
        const existing = new Set(rows.map((r) => r.Field));
        Object.entries(columns).forEach(([column, definition]) => {
            if (existing.has(column)) return;
            dataBase.query(`ALTER TABLE ?? ADD COLUMN ?? ${definition}`, [table, column], (err) => {
                if (err) console.log(`Unable to add ${table}.${column}`, err.message);
                else if (onAdded) onAdded(column);
            });
        });
    });
}

module.exports = { ready, col, live, ensureColumns };
