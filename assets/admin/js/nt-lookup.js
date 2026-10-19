/*
 * Nayan Tara — record quick view + global search (super admin & franchise portals)
 *
 *  - Names in tables (student, parent, franchise, department) become links when the
 *    API row carries `_ref` ids. Clicking one slides in a panel with the full record
 *    and everything related to it, so nobody has to copy an id into another page.
 *  - Inside the panel every related record is a link too (back button keeps history).
 *  - ⌘K / Ctrl+K (or the search box in the top bar) searches across records.
 *  - The open record is mirrored in the URL hash (#view=student:8) so links can be shared.
 *
 * Data: GET {NT_API}/api/lookup/... with the portal's own token (see nayantara/models/lookup.js).
 */
(function () {
    'use strict';

    var ROLE = document.documentElement.getAttribute('data-nt-role');
    if (ROLE !== 'super_admin' && ROLE !== 'franchise') return;

    var API = (window.NT_API || '').replace(/\/$/, '') + '/api/lookup';
    var TOKEN_KEY = ROLE === 'super_admin' ? 'admintoken' : 'franchisetoken';

    /* column data key -> record type ("name" depends on the table: row._ref.name) */
    var COLUMN_TYPES = {
        student_name: 'student', student_roll_no: 'student', roll_no: 'student',
        parent_name: 'parent',
        franchiseName: 'franchise', franchise_name: 'franchise',
        department_name: 'department'
    };

    var TYPE_META = {
        student: { label: 'Student', icon: 'bx-user' },
        parent: { label: 'Parent', icon: 'bx-group' },
        franchise: { label: 'Franchise', icon: 'bx-buildings' },
        department: { label: 'Department', icon: 'bx-sitemap' }
    };

    /* ------------------------------------------------------------- helpers */

    function esc(v) {
        return String(v === null || v === undefined ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function blank(v) { return v === null || v === undefined || String(v).trim() === '' || v === 'null'; }
    function show(v) { return blank(v) ? '<span class="nt-empty">—</span>' : esc(v); }

    function fmtDate(v, withTime) {
        if (blank(v)) return '<span class="nt-empty">—</span>';
        var d = new Date(String(v).replace(' ', 'T'));
        if (isNaN(d)) return esc(v);
        var opts = { day: 'numeric', month: 'short', year: 'numeric' };
        if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
        return esc(d.toLocaleString('en-IN', opts));
    }

    /* a "name" that is only digits (a phone or roll no typed into the name field) is not shown as a name */
    function realName(v) { return blank(v) || /^[0-9 +]+$/.test(String(v).trim()) ? '' : String(v).trim(); }

    function talkTime(seconds) {
        var s = Number(seconds) || 0, sign = s < 0 ? '-' : '';
        s = Math.abs(s);
        return sign + Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' sec';
    }
    function num(v) { return (Number(v) || 0).toLocaleString('en-IN'); }
    function initials(name) {
        return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase() || '?';
    }
    function money(v) { return blank(v) ? '<span class="nt-empty">—</span>' : '₹' + esc(Number(v).toLocaleString('en-IN')); }
    function statusBadge(active, onText, offText) {
        return active
            ? '<span class="nt-badge nt-badge-success">' + esc(onText || 'Active') + '</span>'
            : '<span class="nt-badge nt-badge-muted">' + esc(offText || 'Inactive') + '</span>';
    }
    function ref(type, id, text) {
        if (blank(id)) return show(text);
        return '<a href="#" class="nt-ref" data-nt-type="' + type + '" data-nt-id="' + esc(id) + '">' + show(text) + '</a>';
    }
    function copyBtn(value) {
        if (blank(value)) return '';
        return '<button type="button" class="nt-copy" data-copy="' + esc(value) + '" aria-label="Copy"><i class="bx bx-copy"></i></button>';
    }

    function request(path) {
        var token = null;
        try { token = localStorage.getItem(TOKEN_KEY); } catch (e) { /* storage blocked */ }
        return fetch(API + path, { headers: { Authorization: 'Bearer ' + (token || '') } })
            .then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (body) {
                    if (!res.ok || body.error) throw new Error(body.message || 'Could not load this record.');
                    return body.data;
                });
            });
    }

    /* --------------------------------------------------- table link decoration */

    function decorateTables() {
        var jq = window.jQuery;
        if (!jq || !jq.fn || !jq.fn.dataTable) return;
        Array.prototype.forEach.call(document.querySelectorAll('table.dataTable'), function (table) {
            if (!jq.fn.dataTable.isDataTable(table)) return;
            var api = jq(table).DataTable();
            var srcs = [];
            api.columns().every(function (i) { srcs[i] = this.dataSrc(); });

            api.rows({ page: 'current' }).every(function () {
                var data = this.data();
                var tr = this.node();
                if (!data || !data._ref || !tr) return;
                var r = data._ref;
                decorateRowActions(tr, data, r);
                if (tr.getAttribute('data-nt-linked') === '1') return;
                tr.setAttribute('data-nt-linked', '1');
                Array.prototype.forEach.call(tr.cells, function (td) {
                    var idx = api.cell(td).index();
                    if (!idx) return;
                    var key = srcs[idx.column];
                    var type = key === 'name' ? r.name : COLUMN_TYPES[key];
                    if (!type || blank(r[type]) || td.querySelector('a, button, input')) return;
                    if (blank(td.textContent) || td.querySelector('.nt-empty')) return;
                    td.innerHTML = '<a href="#" class="nt-ref" data-nt-type="' + type + '" data-nt-id="' + esc(r[type]) +
                        '" title="Open ' + TYPE_META[type].label.toLowerCase() + ' details">' + td.innerHTML + '</a>';
                });
            });
        });
    }


    /* main record of a table row: the "name" entity, otherwise the student, then parent */
    function mainRecord(data, r) {
        var type = r.name || (r.student ? 'student' : r.parent ? 'parent' : r.franchise ? 'franchise' : r.department ? 'department' : null);
        if (!type || blank(r[type])) return null;
        var name = data.name || data.student_name || data.parent_name || data.franchiseName || data.franchise_name || data.department_name || '';
        return { type: type, p: { id: r[type], name: String(name).replace(/<[^>]*>/g, ''), student_roll_no: data.student_roll_no || data.roll_no, contact: data.contact } };
    }

    function currentPage() { return location.pathname.split('/').pop(); }

    /* Adds "View details" + shortcuts to the row's ⋮ menu, or makes the whole row open the record. */
    function decorateRowActions(tr, data, r) {
        var main = mainRecord(data, r);
        if (!main) return;
        var menu = tr.querySelector('.nt-menu');
        if (menu) {
            if (menu.getAttribute('data-nt-goto') === '1') return;
            menu.setAttribute('data-nt-goto', '1');
            var here = currentPage();
            var extra = '<button type="button" class="nt-menu-item nt-open-record" role="menuitem" data-nt-type="' + main.type + '" data-nt-id="' + esc(main.p.id) + '">' +
                '<i class="bx bx-id-card"></i><span>View details</span></button>' +
                shortcuts(main.type, main.p).filter(function (l) { return l[2].split('?')[0] !== here; }).slice(0, 3).map(function (l) {
                    return '<a class="nt-menu-item" role="menuitem" href="' + esc(l[2]) + '"><i class="bx ' + l[1] + '"></i><span>' + esc(l[0]) + '</span></a>';
                }).join('') + '<div class="nt-menu-sep" role="separator"></div>';
            menu.insertAdjacentHTML('afterbegin', extra);
            if (main.type !== 'student') return;
        }
        var table = tr.closest('table');
        // student rows always open the full record on tap; clicks on links, buttons and the menu are ignored
        if (table && (main.type === 'student' || !table.querySelector('th.nt-col-action')) && !tr.classList.contains('nt-row-link')) {
            tr.classList.add('nt-row-link');
            tr.setAttribute('data-nt-open-type', main.type);
            tr.setAttribute('data-nt-open-id', main.p.id);
            tr.title = 'Open ' + TYPE_META[main.type].label.toLowerCase() + ' details';
        }
    }

    /* ------------------------------------------------- URL filters (?student_id=…) */

    var URL_FILTERS = { student_id: 'student', parent_id: 'parent', franchise_id: 'franchise', department_id: 'department' };
    var activeFilters = (function () {
        var params = new URLSearchParams(location.search);
        var out = [];
        Object.keys(URL_FILTERS).forEach(function (k) {
            var v = params.get(k);
            if (v && /^\d+$/.test(v)) out.push({ key: k, type: URL_FILTERS[k], id: v });
        });
        return out;
    })();

    // student state filters used by the dashboard's "Needs attention" links (students.php)
    var STATE_FILTERS = {
        balance: { zero: 'Balance: zero or below', low: 'Balance: under 5 min' },
        inactive: function (v) { return /^\d+$/.test(v) ? 'No calls in ' + v + ' days' : null; }
    };
    var stateFilters = (function () {
        var params = new URLSearchParams(location.search);
        var out = [];
        Object.keys(STATE_FILTERS).forEach(function (k) {
            var v = params.get(k);
            if (!v) return;
            var def = STATE_FILTERS[k];
            var label = typeof def === 'function' ? def(v) : def[v];
            if (label) out.push({ key: k, value: v, label: label });
        });
        return out;
    })();

    // inject into every table request before the pages initialise their DataTables
    if ((activeFilters.length || stateFilters.length) && window.jQuery) {
        window.jQuery(document).on('preXhr.dt', function (e, settings, data) {
            activeFilters.forEach(function (f) { if (!data[f.key]) data[f.key] = f.id; });
            stateFilters.forEach(function (f) { if (!data[f.key]) data[f.key] = f.value; });
        });
    }

    function filterBanner() {
        if (!activeFilters.length && !stateFilters.length) return;
        var table = document.querySelector('table.dataTable, table.table');
        var card = table && table.closest('.card');
        var host = card && (card.querySelector('.card-body') || card);
        if (!host || host.querySelector('.nt-filter-banner')) return;
        var bar = document.createElement('div');
        bar.className = 'nt-filter-banner';
        bar.innerHTML = '<i class="bx bx-filter-alt"></i><span>Showing results for</span>' + activeFilters.map(function (f) {
            return '<span class="nt-filter-chip" data-type="' + f.type + '" data-id="' + esc(f.id) + '">' + TYPE_META[f.type].label + ' #' + esc(f.id) + '</span>';
        }).join('') + stateFilters.map(function (f) {
            return '<span class="nt-filter-chip">' + esc(f.label) + '</span>';
        }).join('') + '<a class="nt-filter-clear" href="' + esc(location.pathname) + '"><i class="bx bx-x"></i>Clear filter</a>';
        host.insertBefore(bar, host.firstChild);
        // resolve ids to names
        bar.querySelectorAll('.nt-filter-chip[data-type]').forEach(function (chip) {
            request('/' + chip.getAttribute('data-type') + '/' + chip.getAttribute('data-id')).then(function (d) {
                var n = d.profile && d.profile.name;
                if (n) chip.innerHTML = TYPE_META[chip.getAttribute('data-type')].label + ': <a href="#" class="nt-ref" data-nt-type="' +
                    chip.getAttribute('data-type') + '" data-nt-id="' + esc(chip.getAttribute('data-id')) + '">' + esc(n) + '</a>';
            }).catch(function () { /* keep the id */ });
        });
    }

    var queued = false;
    function queueDecorate() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; decorateTables(); });
    }

    /* --------------------------------------------------------------- panel */

    var panel, panelBody, panelTitle, backBtn, stack = [];

    function buildPanel() {
        if (panel) return;
        panel = document.createElement('div');
        panel.className = 'nt-panel-root';
        panel.innerHTML =
            '<div class="nt-panel-backdrop" data-nt-close></div>' +
            '<aside class="nt-panel" role="dialog" aria-modal="true" aria-labelledby="nt-panel-title">' +
            '  <header class="nt-panel-head">' +
            '    <button type="button" class="nt-icon-btn nt-panel-back" aria-label="Back"><i class="bx bx-arrow-back"></i></button>' +
            '    <div class="nt-panel-kind" id="nt-panel-title">Details</div>' +
            '    <button type="button" class="nt-icon-btn nt-panel-export" aria-label="Export this record" title="Export (CSV)"><i class="bx bx-download"></i></button>' +
            '    <button type="button" class="nt-icon-btn nt-panel-share" aria-label="Copy link to this record" title="Copy link"><i class="bx bx-link"></i></button>' +
            '    <button type="button" class="nt-icon-btn" data-nt-close aria-label="Close"><i class="bx bx-x"></i></button>' +
            '  </header>' +
            '  <div class="nt-panel-body"></div>' +
            '</aside>';
        document.body.appendChild(panel);
        panelBody = panel.querySelector('.nt-panel-body');
        panelTitle = panel.querySelector('.nt-panel-kind');
        backBtn = panel.querySelector('.nt-panel-back');

        panel.addEventListener('click', function (e) {
            if (e.target.closest('[data-nt-close]')) { closePanel(); return; }
            if (e.target.closest('.nt-panel-back')) { stack.pop(); var prev = stack.pop(); if (prev) openRecord(prev.type, prev.id); return; }
            if (e.target.closest('.nt-panel-share')) { copyText(location.href, e.target.closest('button')); return; }
            if (e.target.closest('.nt-panel-export')) { exportRecord(e.target.closest('button')); return; }
            var tab = e.target.closest('.nt-tab');
            if (tab) {
                var box = tab.closest('.nt-tabs-box');
                box.querySelectorAll('.nt-tab').forEach(function (t) { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
                box.querySelectorAll('.nt-tab-pane').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== tab.getAttribute('data-pane'); });
            }
        });
    }

    function closePanel() {
        if (!panel) return;
        panel.classList.remove('open');
        document.documentElement.classList.remove('nt-panel-open');
        stack = [];
        if (/^#view=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    }

    function openRecord(type, id) {
        if (!TYPE_META[type] || blank(id)) return;
        buildPanel();
        stack.push({ type: type, id: id });
        backBtn.hidden = stack.length < 2;
        panelTitle.textContent = TYPE_META[type].label;
        panelBody.innerHTML = skeleton();
        panel.classList.add('open');
        document.documentElement.classList.add('nt-panel-open');
        history.replaceState(null, '', location.pathname + location.search + '#view=' + type + ':' + id);
        panel.querySelector('.nt-panel').focus({ preventScroll: true });

        var token = stack.length;
        request('/' + type + '/' + encodeURIComponent(id)).then(function (data) {
            if (token !== stack.length) return; // user navigated meanwhile
            panelBody.innerHTML = RENDER[type](data);
            panelBody.scrollTop = 0;
        }).catch(function (err) {
            if (token !== stack.length) return;
            panelBody.innerHTML = '<div class="nt-panel-state"><i class="bx bx-error-circle"></i><p>' + esc(err.message) + '</p></div>';
        });
    }

    /* ------------------------------------------------------------- export */

    var SECTION_TITLES = { parents: 'Parents', calls: 'Calls', plans: 'Plans', payments: 'Payments', tickets: 'Tickets', departments: 'Departments', students: 'Students' };

    function label(key) {
        return String(key).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    function csvCell(v) {
        if (v === null || v === undefined) return '';
        var text = String(v);
        // keep long numbers (phones, roll nos) as text in Excel and neutralise formula injection
        if (/^[=+\-@]/.test(text) || /^(\d{10,}|0\d+)$/.test(text)) text = '\t' + text;
        return /[",\n\r\t]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }

    function toCsv(type, d) {
        var lines = [[TYPE_META[type].label + ' export', new Date().toLocaleString('en-IN')], [], ['Details']];
        Object.keys(d.profile).forEach(function (k) { lines.push([label(k), d.profile[k]]); });
        if (d.stats) {
            lines.push([], ['Summary']);
            Object.keys(d.stats).forEach(function (k) { lines.push([label(k), d.stats[k]]); });
        }
        Object.keys(SECTION_TITLES).forEach(function (key) {
            var rows = d[key];
            if (!Array.isArray(rows)) return;
            lines.push([], [SECTION_TITLES[key] + ' (' + rows.length + ')']);
            if (!rows.length) return;
            var cols = [];
            rows.forEach(function (r) { Object.keys(r).forEach(function (c) { if (cols.indexOf(c) < 0) cols.push(c); }); });
            lines.push(cols.map(label));
            rows.forEach(function (r) { lines.push(cols.map(function (c) { return r[c]; })); });
        });
        return '\ufeff' + lines.map(function (l) { return l.map(csvCell).join(','); }).join('\r\n');
    }

    function exportRecord(btn) {
        var current = stack[stack.length - 1];
        if (!current || btn.disabled) return;
        btn.disabled = true;
        request('/' + current.type + '/' + encodeURIComponent(current.id) + '?full=1').then(function (d) {
            var name = String(d.profile.name || current.id).replace(/[^\w-]+/g, '_');
            var blob = new Blob([toCsv(current.type, d)], { type: 'text/csv;charset=utf-8' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = current.type + '_' + name + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        }).catch(function (err) {
            if (window.Swal) Swal.fire('error!', err.message, 'error');
        }).then(function () { btn.disabled = false; });
    }

    function skeleton() {
        return '<div class="nt-skel nt-skel-head"></div><div class="nt-skel-row"><div class="nt-skel"></div><div class="nt-skel"></div><div class="nt-skel"></div></div>' +
            '<div class="nt-skel nt-skel-block"></div><div class="nt-skel nt-skel-block"></div>';
    }

    /* ----------------------------------------------------------- renderers */

    function hero(type, name, sub, badge) {
        return '<section class="nt-hero">' +
            '<span class="nt-hero-avatar nt-type-' + type + '">' + esc(initials(name)) + '</span>' +
            '<div class="nt-hero-text"><h2>' + show(name) + '</h2>' + (sub ? '<div class="nt-hero-sub">' + sub + '</div>' : '') + '</div>' +
            (badge || '') + '</section>';
    }

    function stats(items) {
        return '<section class="nt-stats">' + items.map(function (s) {
            return '<div class="nt-stat"><span class="nt-stat-value">' + s[1] + '</span><span class="nt-stat-label">' + esc(s[0]) + '</span></div>';
        }).join('') + '</section>';
    }

    function details(rows) {
        return '<section class="nt-section"><h3>Details</h3><dl class="nt-details">' + rows.map(function (r) {
            return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>';
        }).join('') + '</dl></section>';
    }

    function contact(v) { return blank(v) ? show(v) : '<a href="tel:' + esc(v) + '">' + esc(v) + '</a>' + copyBtn(v); }
    function email(v) { return blank(v) ? show(v) : '<a href="mailto:' + esc(v) + '">' + esc(v) + '</a>' + copyBtn(v); }

    function tabs(list) {
        list = list.filter(Boolean);
        return '<section class="nt-tabs-box">' +
            '<div class="nt-tabs" role="tablist">' + list.map(function (t, i) {
                return '<button type="button" role="tab" class="nt-tab' + (i ? '' : ' active') + '" data-pane="' + i + '" aria-selected="' + !i + '">' +
                    esc(t.title) + '<span class="nt-tab-count">' + t.count + '</span></button>';
            }).join('') + '</div>' +
            list.map(function (t, i) {
                return '<div class="nt-tab-pane" data-pane="' + i + '"' + (i ? ' hidden' : '') + '>' +
                    (t.count ? t.html : '<div class="nt-list-empty"><i class="bx ' + t.icon + '"></i>' + esc(t.empty) + '</div>') + '</div>';
            }).join('') + '</section>';
    }

    function list(rows) { return '<ul class="nt-list">' + rows.join('') + '</ul>'; }
    function item(main, meta, side) {
        return '<li class="nt-list-item"><div class="nt-list-main">' + main + (meta ? '<div class="nt-list-meta">' + meta + '</div>' : '') +
            '</div>' + (side ? '<div class="nt-list-side">' + side + '</div>' : '') + '</li>';
    }

    /* Where each record can take you — every link opens that page already filtered to the record. */
    function shortcuts(type, p) {
        var A = ROLE === 'super_admin';
        var enc = encodeURIComponent;
        var key = p.student_roll_no || p.name || '';
        var map = {
            student: A ? [
                ['Call history', 'bx-phone-call', 'call_history.php?student_id=' + p.id],
                ['Transactions', 'bx-receipt', 'transaction_history.php?student_id=' + p.id],
                ['Parents', 'bx-group', 'parents.php?student_id=' + p.id]
            ] : [
                ['Call history', 'bx-phone-call', 'call_history.php?student_id=' + p.id],
                ['Transactions', 'bx-receipt', 'transaction_history.php?student_id=' + p.id],
                ['Parents', 'bx-group', 'manage_parents.php?q=' + enc(key)],
                ['Students', 'bx-user', 'manage_students.php?q=' + enc(key)]
            ],
            parent: A ? [
                ['Call history', 'bx-phone-call', 'call_history.php?parent_id=' + p.id],
                ['Transactions', 'bx-receipt', 'transaction_history.php?parent_id=' + p.id],
                ['Parent tickets', 'bx-shield-quarter', 'parent_tickets.php?q=' + enc(p.name || '')]
            ] : [
                ['Call history', 'bx-phone-call', 'call_history.php?parent_id=' + p.id],
                ['Transactions', 'bx-receipt', 'transaction_history.php?parent_id=' + p.id],
                ['Parents', 'bx-group', 'manage_parents.php?q=' + enc(p.contact || p.name || '')]
            ],
            franchise: [
                ['Students', 'bx-user', 'students.php?franchise_id=' + p.id],
                ['Parents', 'bx-group', 'parents.php?franchise_id=' + p.id],
                ['Call history', 'bx-phone-call', 'call_history.php?franchise_id=' + p.id],
                ['Transactions', 'bx-receipt', 'transaction_history.php?franchise_id=' + p.id],
                ['Departments', 'bx-sitemap', 'manage_department.php?franchise_id=' + p.id],
                ['Subscriptions', 'bx-package', 'manage_subscriptions.php?franchise_id=' + p.id]
            ],
            department: A ? [
                ['Students', 'bx-user', 'students.php?department_id=' + p.id],
                ['Call history', 'bx-phone-call', 'call_history.php?department_id=' + p.id],
                ['Transactions', 'bx-receipt', 'transaction_history.php?department_id=' + p.id]
            ] : [
                ['Call history', 'bx-phone-call', 'call_history.php?department_id=' + p.id],
                ['Transactions', 'bx-receipt', 'transaction_history.php?department_id=' + p.id]
            ]
        };
        return map[type] || [];
    }

    function gotoSection(type, p) {
        var links = shortcuts(type, p);
        if (!links.length) return '';
        return '<section class="nt-goto"><span class="nt-goto-label">Go to</span>' + links.map(function (l) {
            return '<a class="nt-goto-link" href="' + esc(l[2]) + '"><i class="bx ' + l[1] + '"></i>' + esc(l[0]) + '</a>';
        }).join('') + '</section>';
    }

    /* lists are capped by the API (latest 15); point to the full, filtered page when there is more */
    function more(shown, total, href) {
        if (!(total > shown)) return '';
        return '<p class="nt-list-more">Showing latest ' + shown + ' of ' + num(total) +
            (href ? '<a class="nt-list-more-link" href="' + esc(href) + '">View all<i class="bx bx-right-arrow-alt"></i></a>' : '') + '</p>';
    }

    function callsTab(calls, total, who, href) {
        return {
            title: 'Calls', count: total, icon: 'bx-phone-call', empty: 'No calls yet',
            html: list(calls.map(function (c) {
                var other = who === 'parent' ? ref('parent', c.parent_id, c.parent_name) : ref('student', c.student_id, c.student_name);
                return item(other, fmtDate(c.created_at, true), '<span class="nt-pill">' + num(c.minutes) + ' min</span>');
            })) + more(calls.length, total, href)
        };
    }

    function plansTab(plans, total, href) {
        if (total === undefined) total = plans.length;
        return {
            title: 'Plans', count: total, icon: 'bx-purchase-tag', empty: 'No plans purchased',
            html: list(plans.map(function (p) {
                return item('<strong>' + show(p.plan_name) + '</strong>',
                    'Bought ' + fmtDate(p.created_at) + (blank(p.plan_end_date) ? '' : ' · Ends ' + fmtDate(p.plan_end_date)),
                    money(p.plan_price) + '<span class="nt-list-meta">' + num(Math.floor((Number(p.plan_min) || 0) / 60)) + ' min</span>');
            })) + more(plans.length, total, href)
        };
    }

    function ticketsTab(tickets, total) {
        if (total === undefined) total = tickets.length;
        return {
            title: 'Tickets', count: total, icon: 'bx-support', empty: 'No support tickets',
            html: list(tickets.map(function (t) {
                return item('<strong>' + show(t.subject) + '</strong>', show(t.message) + ' · ' + fmtDate(t.created_at));
            })) + more(tickets.length, total)
        };
    }

    var RENDER = {
        student: function (d) {
            var p = d.profile, isAdmin = ROLE === 'super_admin';
            var sub = '<span class="nt-chip">Roll ' + show(p.student_roll_no) + copyBtn(p.student_roll_no) + '</span>' +
                (isAdmin ? ref('franchise', p.franchise_id, p.franchise_name) + '<i class="bx bx-chevron-right"></i>' : '') +
                ref('department', p.department_id, p.department_name);
            return hero('student', realName(p.name) || 'Name missing', sub, statusBadge(p.status == 1)) +
                stats([['Available min', num(d.stats.available_min)], ['Used min', num(d.stats.used_min)], ['Calls', num(d.stats.calls)], ['Parents', num(d.stats.parents)]]) +
                gotoSection('student', p) +
                details([
                    ['Name', realName(p.name) ? esc(realName(p.name)) : '<span class="nt-empty">—</span> (stored as ' + esc(p.name) + ')'],
                    ['Roll no', show(p.student_roll_no) + (blank(p.student_roll_no) ? '' : copyBtn(p.student_roll_no))],
                    ['Contact', contact(p.contact)],
                    ['Email', email(p.email)],
                    ['School', ref('franchise', p.franchise_id, p.franchise_name)],
                    ['House', ref('department', p.department_id, p.department_name)],
                    ['Device ID', show(p.device_name)],
                    ['Status', p.status == 1 ? 'Active' : 'Inactive'],
                    ['App login', p.login_status == 1 ? 'Logged in' : 'Logged out'],
                    ['Talk time left', talkTime(p.total_talktime)],
                    ['Validity', show(p.validity)],
                    ['Auto recharge', p.autorecharge == 1 ? 'On' : 'Off'],
                    ['Joined', fmtDate(p.created_at, true)],
                    ['Last updated', fmtDate(p.updated_at, true)]
                ]) +
                tabs([
                    { title: 'Parents', count: d.parents.length, icon: 'bx-group', empty: 'No parents linked',
                      html: list(d.parents.map(function (x) {
                          return item(ref('parent', x.id, x.name), contact(x.contact), statusBadge(x.status == 1, 'Logged in', 'Logged out'));
                      })) },
                    callsTab(d.calls, d.stats.calls, 'parent', 'call_history.php?student_id=' + p.id),
                    plansTab(d.plans, d.stats.plans, 'transaction_history.php?student_id=' + p.id),
                    { title: 'Payments', count: d.stats.payments === undefined ? d.payments.length : d.stats.payments, icon: 'bx-wallet', empty: 'No payments',
                      html: list(d.payments.map(function (x) {
                          return item(money(x.amount), fmtDate(x.created_at, true) + (blank(x.razorpay_payment_id) ? '' : ' · ' + esc(x.razorpay_payment_id)),
                              statusBadge(String(x.status).toUpperCase() === 'SUCCESS', x.status, x.status));
                      })) + more(d.payments.length, d.stats.payments) },
                    ticketsTab(d.tickets, d.stats.tickets)
                ]);
        },

        parent: function (d) {
            var p = d.profile, isAdmin = ROLE === 'super_admin';
            var sub = 'Parent of ' + ref('student', p.student_id, p.student_name) +
                (blank(p.student_roll_no) ? '' : ' <span class="nt-chip">Roll ' + esc(p.student_roll_no) + '</span>') +
                (isAdmin ? ' · ' + ref('franchise', p.franchise_id, p.franchise_name) : '');
            return hero('parent', p.name, sub, statusBadge(p.status == 1, 'Logged in', 'Logged out')) +
                stats([['Calls', num(d.stats.calls)], ['Minutes talked', num(d.stats.used_min)], ['Plans', num(d.stats.plans)]]) +
                gotoSection('parent', p) +
                details([['Contact', contact(p.contact)], ['Email', email(p.email)], ['Added', fmtDate(p.created_at)]]) +
                tabs([
                    callsTab(d.calls, d.stats.calls, 'student', 'call_history.php?parent_id=' + p.id),
                    plansTab(d.plans, d.stats.plans, 'transaction_history.php?parent_id=' + p.id),
                    ticketsTab(d.tickets, d.stats.tickets)
                ]);
        },

        franchise: function (d) {
            var p = d.profile;
            return hero('franchise', p.name, 'Owner ' + show(p.franchiserName), statusBadge(p.status == 1)) +
                stats([['Students', num(d.stats.students)], ['Active', num(d.stats.active_students)], ['Parents', num(d.stats.parents)], ['Available min', num(d.stats.available_min)]]) +
                gotoSection('franchise', p) +
                details([
                    ['Login email', email(p.email)],
                    ['School email', email(p.schoolemail)],
                    ['School contact', contact(p.schoolcontact1)],
                    ['Address', show(p.address) + (blank(p.pincode) ? '' : ' – ' + esc(p.pincode))],
                    ['Devices', show(p.totaldevices)],
                    ['Contract', fmtDate(p.startdate) + ' → ' + fmtDate(p.enddate)]
                ]) +
                tabs([
                    { title: 'Departments', count: d.departments.length, icon: 'bx-sitemap', empty: 'No departments',
                      html: list(d.departments.map(function (x) {
                          return item(ref('department', x.id, x.name), 'Device ' + show(x.device_name), '<span class="nt-pill">' + num(x.students) + ' students</span>');
                      })) },
                    { title: 'Plans', count: d.plans.length, icon: 'bx-package', empty: 'No subscription plans',
                      html: list(d.plans.map(function (x) {
                          return item('<strong>' + show(x.plan_name) + '</strong>', num(x.talktime_min) + ' min · ' + show(x.days) + ' days', money(x.price));
                      })) }
                ]);
        },

        department: function (d) {
            var p = d.profile;
            var sub = (ROLE === 'super_admin' ? ref('franchise', p.franchise_id, p.franchise_name) + ' · ' : '') + 'Device ' + show(p.device_name);
            return hero('department', p.name, sub, statusBadge(p.status == 1)) +
                stats([['Students', num(d.stats.students)], ['Active', num(d.stats.active_students)], ['Available min', num(d.stats.available_min)]]) +
                gotoSection('department', p) +
                details([
                    ['Emergency 1', contact(p.emergency_contact_1)],
                    ['Emergency 2', contact(p.emergency_contact_2)],
                    ['Emergency 3', contact(p.emergency_contact_3)],
                    ['Created', fmtDate(p.created_at)]
                ]) +
                tabs([{ title: 'Students', count: d.students.length, icon: 'bx-user', empty: 'No students in this department',
                    html: list(d.students.map(function (x) {
                        return item(ref('student', x.id, x.name), 'Roll ' + show(x.student_roll_no) + ' · ' + show(x.contact),
                            '<span class="nt-pill">' + num(x.available_min) + ' min</span>');
                    })) }]);
        }
    };

    /* -------------------------------------------------------------- search */

    var palette, input, results, activeIndex = -1, searchTimer, lastQuery = '';

    function buildPalette() {
        if (palette) return;
        palette = document.createElement('div');
        palette.className = 'nt-palette-root';
        palette.innerHTML =
            '<div class="nt-palette-backdrop" data-nt-close-search></div>' +
            '<div class="nt-palette" role="dialog" aria-modal="true" aria-label="Search">' +
            '  <div class="nt-palette-input"><i class="bx bx-search"></i>' +
            '    <input type="search" placeholder="Search by name, roll no, phone or email…" autocomplete="off" spellcheck="false" aria-label="Search">' +
            '    <kbd>Esc</kbd></div>' +
            '  <div class="nt-palette-results" role="listbox"></div>' +
            '</div>';
        document.body.appendChild(palette);
        input = palette.querySelector('input');
        results = palette.querySelector('.nt-palette-results');
        results.innerHTML = hint();

        palette.addEventListener('click', function (e) {
            if (e.target.closest('[data-nt-close-search]')) closeSearch();
            var hit = e.target.closest('.nt-hit');
            if (hit) { closeSearch(); openRecord(hit.getAttribute('data-nt-type'), hit.getAttribute('data-nt-id')); }
        });
        input.addEventListener('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(runSearch, 220);
        });
        input.addEventListener('keydown', function (e) {
            var hits = results.querySelectorAll('.nt-hit');
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!hits.length) return;
                activeIndex = (activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
                hits.forEach(function (h, i) { h.classList.toggle('active', i === activeIndex); });
                hits[activeIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                var target = hits[activeIndex] || hits[0];
                if (target) target.click();
            }
        });
    }

    function hint() {
        return '<div class="nt-palette-hint"><i class="bx bx-search-alt"></i><p>Find any ' +
            (ROLE === 'super_admin' ? 'student, parent, franchise or department' : 'student, parent or department') +
            '.</p><span>Type at least 2 characters · ↑↓ to move · Enter to open</span></div>';
    }

    function runSearch() {
        var term = input.value.trim();
        if (term === lastQuery) return;
        lastQuery = term;
        activeIndex = -1;
        if (term.length < 2) { results.innerHTML = hint(); return; }
        results.innerHTML = '<div class="nt-palette-hint"><span>Searching…</span></div>';
        request('/search?q=' + encodeURIComponent(term)).then(function (d) {
            if (term !== lastQuery) return;
            var groups = [
                ['student', d.students, function (x) { return ['Roll ' + show(x.student_roll_no), show(x.contact), ROLE === 'super_admin' ? show(x.franchise_name) : show(x.department_name)]; }],
                ['parent', d.parents, function (x) { return [show(x.contact), 'Parent of ' + show(x.student_name)]; }],
                ['franchise', d.franchises, function (x) { return [show(x.franchiserName), show(x.email)]; }],
                ['department', d.departments, function (x) { return ['Device ' + show(x.device_name), show(x.franchise_name)]; }]
            ];
            var html = groups.filter(function (g) { return g[1] && g[1].length; }).map(function (g) {
                return '<div class="nt-hit-group">' + TYPE_META[g[0]].label + 's</div>' + g[1].map(function (x) {
                    return '<button type="button" class="nt-hit" role="option" data-nt-type="' + g[0] + '" data-nt-id="' + esc(x.id) + '">' +
                        '<span class="nt-hit-icon nt-type-' + g[0] + '"><i class="bx ' + TYPE_META[g[0]].icon + '"></i></span>' +
                        '<span class="nt-hit-text"><strong>' + mark(x.name, term) + '</strong><span>' + g[2](x).join(' · ') + '</span></span>' +
                        '<i class="bx bx-chevron-right nt-hit-go"></i></button>';
                }).join('');
            }).join('');
            results.innerHTML = html || '<div class="nt-palette-hint"><i class="bx bx-ghost"></i><p>No matches for “' + esc(term) + '”</p></div>';
        }).catch(function (err) {
            results.innerHTML = '<div class="nt-palette-hint"><i class="bx bx-error-circle"></i><p>' + esc(err.message) + '</p></div>';
        });
    }

    function mark(text, term) {
        var safe = esc(text);
        var i = String(text || '').toLowerCase().indexOf(term.toLowerCase());
        if (i < 0) return safe;
        return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + term.length)) + '</mark>' + esc(text.slice(i + term.length));
    }

    function openSearch() {
        buildPalette();
        palette.classList.add('open');
        document.documentElement.classList.add('nt-palette-open');
        input.focus();
        input.select();
    }
    function closeSearch() {
        if (!palette) return;
        palette.classList.remove('open');
        document.documentElement.classList.remove('nt-palette-open');
    }

    /* -------------------------------------------------------------- wiring */

    function copyText(text, btn) {
        var done = function () {
            if (!btn) return;
            btn.classList.add('copied');
            var icon = btn.querySelector('i');
            var old = icon && icon.className;
            if (icon) icon.className = 'bx bx-check';
            setTimeout(function () { btn.classList.remove('copied'); if (icon) icon.className = old; }, 1200);
        };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () {});
        else {
            var ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
            ta.remove();
        }
    }

    document.addEventListener('click', function (e) {
        var link = e.target.closest && e.target.closest('a.nt-ref');
        if (link) {
            e.preventDefault();
            if (!panel || !panel.contains(link)) stack = [];
            openRecord(link.getAttribute('data-nt-type'), link.getAttribute('data-nt-id'));
            return;
        }
        var openBtn = e.target.closest && e.target.closest('.nt-open-record');
        if (openBtn) { stack = []; openRecord(openBtn.getAttribute('data-nt-type'), openBtn.getAttribute('data-nt-id')); return; }
        var row = e.target.closest && e.target.closest('tr.nt-row-link');
        if (row && !e.target.closest('a, button, input, select, textarea, label') && !String(window.getSelection() || '').trim()) {
            stack = [];
            openRecord(row.getAttribute('data-nt-open-type'), row.getAttribute('data-nt-open-id'));
            return;
        }
        var copy = e.target.closest && e.target.closest('.nt-copy');
        if (copy) { e.preventDefault(); copyText(copy.getAttribute('data-copy'), copy); }
    });

    document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openSearch(); return; }
        if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
            e.preventDefault(); openSearch(); return;
        }
        if (e.key === 'Escape') {
            if (palette && palette.classList.contains('open')) closeSearch();
            else if (panel && panel.classList.contains('open')) closePanel();
        }
    });

    /* The page's main table search and the URL's ?q= stay in sync:
       ?q=… pre-fills the search on load (used by the panel's links), and typing in or
       clearing the search box updates / removes ?q= in the address bar, so a refresh or a
       shared link always shows exactly what is on screen. */
    function syncSearchWithUrl() {
        var jq = window.jQuery;
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            var table = document.querySelector('table.dataTable');
            if (!(jq && table && jq.fn.dataTable.isDataTable(table))) {
                if (tries > 60) clearInterval(timer);
                return;
            }
            clearInterval(timer);
            var api = jq(table).DataTable();
            var q = new URLSearchParams(location.search).get('q');
            if (q && api.search() !== q) api.search(q).draw();

            jq(table).on('search.dt', function () {
                var value = String(api.search() || '').trim();
                var params = new URLSearchParams(location.search);
                if ((params.get('q') || '') === value) return;
                if (value) params.set('q', value); else params.delete('q');
                var qs = params.toString();
                history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
            });
        }, 250);
    }

    function start() {
        decorateTables();
        new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var t = mutations[i].target;
                if (t.closest && (t.closest('.nt-panel-root') || t.closest('.nt-palette-root') || t.closest('.nt-actions'))) continue;
                queueDecorate();
                return;
            }
        }).observe(document.body, { childList: true, subtree: true });

        var m = /^#view=(student|parent|franchise|department):(\d+)$/.exec(location.hash);
        if (m) openRecord(m[1], m[2]);
        syncSearchWithUrl();
        filterBanner();
        openCreateFromUrl();
    }

    // ?new=1 (dashboard quick actions) opens the page's "Create" form
    function openCreateFromUrl() {
        if (new URLSearchParams(location.search).get('new') !== '1') return;
        setTimeout(function () {
            var btn = document.querySelector('.card > .header [data-target=".add"]');
            if (btn) btn.click();
        }, 300);
    }

    window.NTLookup = { open: openRecord, openSearch: openSearch };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
