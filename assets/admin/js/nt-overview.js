/*
 * Nayan Tara — super admin dashboard overview (include/dashboard_overview.php)
 * Data: GET {api}/api/overview with the admin token.
 */
(function () {
    'use strict';

    var root = document.getElementById('nt-overview');
    if (!root) return;
    var API = root.getAttribute('data-api') || '';

    var $ = function (name) { return root.querySelector('[data-ov="' + name + '"]'); };
    var esc = function (v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };
    var fmt = function (n) { return Number(n || 0).toLocaleString('en-IN'); };
    var rupees = function (n) { return '₹' + fmt(Math.round(n)); };
    var duration = function (seconds) {
        var m = Math.round(Number(seconds || 0) / 60);
        if (m < 60) return m + ' min';
        var h = Math.floor(m / 60);
        return fmt(h) + 'h ' + (m % 60) + 'm';
    };
    var plural = function (n, one, many) { return fmt(n) + ' ' + (n === 1 ? one : (many || one + 's')); };

    // "2026-10-14T15:59:42" (IST, from the database) → "3 days ago"
    function ago(iso, nowIso) {
        if (!iso) return 'Never';
        var then = new Date(iso.replace('T', ' ').replace(/-/g, '/'));
        var now = nowIso ? new Date(nowIso.replace('T', ' ').replace(/-/g, '/')) : new Date();
        var s = Math.max(0, (now - then) / 1000);
        if (s < 60) return 'Just now';
        if (s < 3600) return Math.floor(s / 60) + ' min ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        var d = Math.floor(s / 86400);
        if (d === 1) return 'Yesterday';
        if (d < 30) return d + ' days ago';
        return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function clock(mins) {
        var h = Math.floor(mins / 60) % 24, m = mins % 60;
        var ap = h < 12 ? 'am' : 'pm';
        var h12 = h % 12 === 0 ? 12 : h % 12;
        return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + ap;
    }
    var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    function empty(icon, text) {
        return '<li class="nt-ov-empty"><i class="bx ' + icon + '"></i><span>' + text + '</span></li>';
    }
    function fail(message) {
        ['today', 'attention', 'tickets', 'windows'].forEach(function (k) {
            var el = $(k);
            if (el) el.innerHTML = (el.tagName === 'UL' ? empty('bx-error-circle', esc(message)) : '<p class="nt-ov-error">' + esc(message) + '</p>');
        });
        var tb = $('franchises').querySelector('tbody');
        tb.innerHTML = '<tr><td colspan="8" class="nt-ov-error">' + esc(message) + '</td></tr>';
    }

    /* ------------------------------------------------------------------ today */
    function renderToday(d) {
        $('clock').textContent = new Date(d.now.replace('T', ' ').replace(/-/g, '/'))
            .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) + ' IST';
        var t = d.today, y = d.yesterday;
        var tiles = [
            ['Calls', fmt(t.calls), t.calls, y.calls, 'bx-phone-call', 'calls'],
            ['Talk time', duration(t.seconds), t.seconds, y.seconds, 'bx-time-five', null],
            ['Students calling', fmt(t.callers), t.callers, y.callers, 'bx-user-voice', null],
            ['Plans sold', fmt(t.plans), t.plans, y.plans, 'bx-receipt', null],
            ['Revenue', rupees(t.revenue), t.revenue, y.revenue, 'bx-rupee', null]
        ];
        $('today').innerHTML = tiles.map(function (r) {
            var cur = Number(r[2]), prev = Number(r[3]);
            var chip;
            if (!cur && !prev) chip = '<span class="nt-ov-delta is-flat">Same as yesterday</span>';
            else if (!prev) chip = '<span class="nt-ov-delta is-up"><i class="bx bx-up-arrow-alt"></i>None yesterday</span>';
            else {
                var pct = Math.round((cur - prev) / prev * 100);
                var cls = pct > 0 ? 'is-up' : (pct < 0 ? 'is-down' : 'is-flat');
                var icon = pct > 0 ? 'bx-up-arrow-alt' : (pct < 0 ? 'bx-down-arrow-alt' : 'bx-minus');
                chip = '<span class="nt-ov-delta ' + cls + '" title="Yesterday by now: ' + esc(r[0] === 'Talk time' ? duration(prev) : r[0] === 'Revenue' ? rupees(prev) : fmt(prev)) + '">' +
                    '<i class="bx ' + icon + '"></i>' + Math.abs(pct) + '%</span>';
            }
            return '<div class="nt-ov-tile"><span class="nt-ov-tile-label"><i class="bx ' + r[4] + '"></i>' + r[0] + '</span>' +
                '<span class="nt-ov-tile-value">' + r[1] + '</span>' + chip + '</div>';
        }).join('');
    }

    /* -------------------------------------------------------------- attention */
    function renderAttention(d) {
        var a = d.attention;
        var zb = document.getElementById('zero_balance');
        if (zb) zb.textContent = fmt(a.zero);

        var items = [];
        if (a.zero) items.push({
            tone: 'red', icon: 'bx-wallet', count: a.zero,
            title: plural(a.zero, 'student') + ' with no talk time',
            text: Math.round(a.zero / Math.max(a.students, 1) * 100) + '% of all students. They can’t call home until they get a plan.',
            links: [['View students', 'students.php?balance=zero'], ['Assign plan', 'assign_plan.php?open=1', true]]
        });
        if (a.low) items.push({
            tone: 'orange', icon: 'bx-battery', count: a.low,
            title: plural(a.low, 'student') + ' with under 5 minutes left',
            text: 'Likely to run out on their next call.',
            links: [['View students', 'students.php?balance=low'], ['Assign plan', 'assign_plan.php?open=1', true]]
        });
        if (a.inactive) items.push({
            tone: 'violet', icon: 'bx-volume-mute', count: a.inactive,
            title: plural(a.inactive, 'student') + ' haven’t called in ' + d.inactiveDays + ' days',
            text: Math.round(a.inactive / Math.max(a.logged_in, 1) * 100) + '% of logged-in students. Check whether the app works for them.',
            links: [['View students', 'students.php?inactive=' + d.inactiveDays]]
        });
        a.noPlan.forEach(function (f) {
            items.push({
                tone: 'red', icon: 'bx-package', count: null,
                title: esc(f.name) + ' has no active plan',
                text: plural(f.students, 'student') + ' can’t be given a plan until one is created.',
                links: [['Create plan', 'manage_subscriptions.php?franchise_id=' + f.id, true]]
            });
        });

        if (!items.length) {
            $('attention').innerHTML = empty('bx-check-circle', 'All clear. Nothing needs your attention right now.');
            return;
        }
        $('attention').innerHTML = items.map(function (it) {
            return '<li class="nt-ov-alert" data-tone="' + it.tone + '">' +
                '<span class="nt-ov-alert-icon"><i class="bx ' + it.icon + '"></i></span>' +
                '<div class="nt-ov-alert-text"><strong>' + it.title + '</strong><span>' + it.text + '</span></div>' +
                '<div class="nt-ov-alert-links">' + it.links.map(function (l) {
                    return '<a href="' + l[1] + '" class="' + (l[2] ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-light') + '">' + l[0] + '</a>';
                }).join('') + '</div></li>';
        }).join('');
    }

    /* ------------------------------------------------------------ leaderboard */
    var rows = [], sortKey = 'revenue', sortDir = -1, nowIso = null;

    function renderFranchises() {
        var sorted = rows.slice().sort(function (a, b) {
            var x = a[sortKey], y = b[sortKey];
            if (typeof x === 'string' || typeof y === 'string') return String(x || '').localeCompare(String(y || '')) * sortDir;
            return ((x || 0) - (y || 0)) * sortDir;
        });
        var tb = $('franchises').querySelector('tbody');
        if (!sorted.length) {
            tb.innerHTML = '<tr><td colspan="8" class="nt-ov-muted">No franchises with students yet.</td></tr>';
            return;
        }
        tb.innerHTML = sorted.map(function (f) {
            var pct = f.active_pct;
            return '<tr>' +
                '<td class="is-text"><a href="#" class="nt-ref" data-nt-type="franchise" data-nt-id="' + f.id + '">' + esc(f.name) + '</a>' +
                    (f.has_plan ? '' : ' <span class="nt-ov-tag">No plan</span>') + '</td>' +
                '<td>' + fmt(f.students) + '</td>' +
                '<td><span class="nt-ov-bar" title="' + fmt(f.callers) + ' of ' + fmt(f.logged_in) + ' logged-in students called">' +
                    '<span class="nt-ov-bar-track"><span style="width:' + pct + '%"></span></span>' + pct + '%</span></td>' +
                '<td>' + duration(f.minutes * 60) + '</td>' +
                '<td>' + fmt(f.purchases) + '</td>' +
                '<td class="is-strong">' + rupees(f.revenue) + '</td>' +
                '<td>' + (f.zero_balance ? '<a href="students.php?franchise_id=' + f.id + '&amp;balance=zero" class="nt-ov-warn">' + fmt(f.zero_balance) + '</a>' : '<span class="nt-ov-muted">0</span>') + '</td>' +
                '<td class="nt-ov-muted">' + ago(f.last_purchase, nowIso) + '</td>' +
                '</tr>';
        }).join('');
        $('franchises').querySelectorAll('th').forEach(function (th) {
            var on = th.getAttribute('data-sort') === sortKey;
            th.classList.toggle('is-sorted', on);
            th.classList.toggle('is-asc', on && sortDir === 1);
            if (on) th.setAttribute('aria-sort', sortDir === 1 ? 'ascending' : 'descending');
            else th.removeAttribute('aria-sort');
        });
    }

    $('franchises').querySelector('thead').addEventListener('click', function (e) {
        var th = e.target.closest('th[data-sort]');
        if (!th) return;
        var key = th.getAttribute('data-sort');
        if (key === sortKey) sortDir = -sortDir;
        else { sortKey = key; sortDir = key === 'name' ? 1 : -1; }
        renderFranchises();
    });

    /* ---------------------------------------------------------------- tickets */
    function renderTickets(d) {
        var c = d.ticketCounts;
        var week = c.student_week + c.parent_week;
        $('ticket-note').textContent = week
            ? plural(week, 'new ticket') + ' in the last 7 days (' + fmt(c.student_week) + ' student, ' + fmt(c.parent_week) + ' parent)'
            : 'No new tickets in the last 7 days';
        if (!d.tickets.length) {
            $('tickets').innerHTML = empty('bx-support', 'No tickets yet.');
            return;
        }
        $('tickets').innerHTML = d.tickets.map(function (t) {
            var page = t.kind === 'parent' ? 'parent_tickets.php' : 'student_tickets.php';
            var subject = String(t.subject || '').trim() || 'No subject';
            var message = String(t.message || '').trim();
            return '<li class="nt-ov-ticket">' +
                '<span class="nt-ov-ticket-kind" data-kind="' + t.kind + '">' + (t.kind === 'parent' ? 'Parent' : 'Student') + '</span>' +
                '<div class="nt-ov-ticket-text">' +
                    '<a href="' + page + '?q=' + encodeURIComponent(t.name || '') + '"><strong>' + esc(subject) + '</strong></a>' +
                    (message && message.toLowerCase() !== subject.toLowerCase() ? '<span class="nt-ov-ticket-msg">' + esc(message) + '</span>' : '') +
                    '<span class="nt-ov-ticket-meta">' +
                        (t.person_id ? '<a href="#" class="nt-ref" data-nt-type="' + t.kind + '" data-nt-id="' + esc(t.person_id) + '">' + esc(t.name || 'Unknown') + '</a>' : esc(t.name || 'Unknown')) +
                        ' · ' + ago(t.created_at, d.now) + '</span>' +
                '</div></li>';
        }).join('');
    }

    /* ---------------------------------------------------------------- windows */
    function renderWindows(d) {
        var list = d.windows.slice().sort(function (a, b) {
            var ra = a.open ? 0 : (a.next ? 1 : 2), rb = b.open ? 0 : (b.next ? 1 : 2);
            return ra - rb || b.students - a.students;
        });
        var openCount = list.filter(function (w) { return w.open; }).length;
        $('windows-note').textContent = list.length
            ? openCount + ' of ' + list.length + ' departments can call right now'
            : 'No departments with students yet';
        if (!list.length) {
            $('windows').innerHTML = empty('bx-time', 'No departments yet.');
            return;
        }
        var nowMin = (function () {
            var t = d.now.split('T')[1].split(':');
            return Number(t[0]) * 60 + Number(t[1]);
        })();
        $('windows').innerHTML = list.map(function (w) {
            var status, detail;
            if (w.open) {
                var allDay = w.open.start <= 1 && w.open.end >= 1438;
                status = '<span class="nt-ov-status is-open">Open</span>';
                detail = allDay ? 'Open all day' : 'Until ' + clock(w.open.end) + ' · closes in ' + duration((w.open.end - nowMin) * 60);
            } else if (w.next) {
                status = '<span class="nt-ov-status is-closed">Closed</span>';
                var when = w.next.inDays === 0 ? 'today' : (w.next.inDays === 1 ? 'tomorrow' : DAY_NAMES[w.next.day]);
                detail = 'Opens ' + when + ' at ' + clock(w.next.start);
            } else {
                status = '<span class="nt-ov-status is-none">Not set</span>';
                detail = 'No call times configured';
            }
            return '<li class="nt-ov-window">' +
                '<div class="nt-ov-window-text">' +
                    '<a href="#" class="nt-ref" data-nt-type="department" data-nt-id="' + w.id + '"><strong>' + esc(w.name) + '</strong></a>' +
                    '<span>' + esc(w.franchise || '') + ' · ' + plural(w.students, 'student') + '</span>' +
                '</div>' +
                '<div class="nt-ov-window-state">' + status + '<span>' + detail + '</span></div></li>';
        }).join('');
    }

    /* ------------------------------------------------------------------- load */
    function load() {
        var token = null;
        try { token = localStorage.getItem('admintoken'); } catch (e) { /* private mode */ }
        fetch(API + '/api/overview', { headers: { Authorization: 'Bearer ' + (token || '') } })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.error) return fail(res.message || 'Could not load the overview.');
                var d = res.data;
                nowIso = d.now;
                rows = d.franchises.map(function (f) {
                    f.active_pct = f.logged_in ? Math.round(f.callers / f.logged_in * 100) : 0;
                    return f;
                });
                renderToday(d);
                renderAttention(d);
                renderFranchises();
                renderTickets(d);
                renderWindows(d);
            })
            .catch(function () { fail('Could not reach the server. Refresh to try again.'); });
    }

    load();
    // keep "today" and call windows current while the dashboard stays open
    setInterval(function () { if (!document.hidden) load(); }, 5 * 60 * 1000);
})();
