/*
 * Nayan Tara — summary cards above every table.
 *
 * Two sources, same card shape ({ label, value, fmt, icon, tone, hint }):
 *  1. Server-side tables (nayantara/models/lists.js) return `nt_metrics` with their first page.
 *     Those cards follow the table's filters and search, and refresh whenever they change.
 *  2. Every other screen asks GET /api/screen-metrics?screen=<name> once on load (models/screen_metrics.js).
 */
(function () {
    'use strict';

    var $ = window.jQuery;
    var ROLE = document.documentElement.getAttribute('data-nt-role') || '';
    var API = String(window.NT_API || '').replace(/\/$/, '');

    /* ---------------------------------------------------------- formatting */

    function n(v, digits) {
        return (Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: digits || 0 });
    }
    function pad(v) { return v < 10 ? '0' + v : '' + v; }

    function duration(value) {
        var secs = Math.round(Math.abs(Number(value) || 0));
        var sign = Number(value) < 0 ? '−' : '';
        if (secs < 60) return sign + secs + 's';
        if (secs < 3600) return sign + Math.floor(secs / 60) + 'm ' + pad(secs % 60) + 's';
        var h = Math.floor(secs / 3600);
        return sign + (h >= 100 ? n(h) + 'h' : h + 'h ' + pad(Math.floor((secs % 3600) / 60)) + 'm');
    }

    function ago(ts) {
        ts = Number(ts) || 0;
        if (!ts) return '—';
        var s = Math.max(0, Date.now() / 1000 - ts);
        if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago';
        if (s < 86400) return Math.round(s / 3600) + 'h ago';
        if (s < 86400 * 45) return Math.round(s / 86400) + ' days ago';
        return new Date(ts * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function format(value, fmt) {
        switch (fmt) {
            case 'money': return '₹' + n(value);
            case 'duration': return duration(value);
            case 'pct': return n(value) + '%';
            case 'ago': return ago(value);
            default: return n(value);
        }
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    }

    /* ------------------------------------------------------------- render */

    function cardHtml(c) {
        var text = c.hint && c.hint.text;
        if (Array.isArray(text)) text = Number(c.hint.value) === 1 ? text[0] : text[1]; // [singular, plural]
        var hint = text ? text.replace('{v}', format(c.hint.value, c.hint.fmt)) : '';
        return '<div class="nt-metric" data-tone="' + esc(c.tone || 'blue') + '">' +
            '<div class="nt-metric-body">' +
                '<span class="nt-metric-label">' + esc(c.label) + '</span>' +
                '<span class="nt-metric-value">' + esc(format(c.value, c.fmt)) + '</span>' +
                (hint ? '<span class="nt-metric-hint">' + esc(hint) + '</span>' : '') +
            '</div>' +
            '<span class="nt-metric-icon"><i class="bx ' + esc(c.icon || 'bx-bar-chart-alt-2') + '"></i></span>' +
        '</div>';
    }

    function strip(anchor, key) {
        var el = document.querySelector('.nt-metrics[data-for="' + key + '"]');
        if (el) return el;
        el = document.createElement('section');
        el.className = 'nt-metrics';
        el.setAttribute('data-for', key);
        el.setAttribute('aria-label', 'Summary');
        el.innerHTML = '<div class="nt-metrics-grid"></div>';
        anchor.parentNode.insertBefore(el, anchor);
        return el;
    }

    function paint(el, data, scopeText) {
        var cards = (data && data.cards) || [];
        if (!cards.length) { el.remove(); return; }
        el.classList.remove('is-loading');
        el.querySelector('.nt-metrics-grid').innerHTML = cards.map(cardHtml).join('');
        el.style.setProperty('--nt-metric-cols', String(Math.min(cards.length, 4)));
        var tag = el.querySelector('.nt-metrics-scope');
        if (scopeText) {
            if (!tag) {
                tag = document.createElement('div');
                tag.className = 'nt-metrics-scope';
                el.insertBefore(tag, el.firstChild);
            }
            tag.innerHTML = '<i class="bx bx-filter-alt"></i> ' + esc(scopeText);
        } else if (tag) {
            tag.remove();
        }
    }

    // place cards above the card that holds the table (filters stay with their table)
    function anchorFor(node) {
        return (node && (node.closest('.card') || node.closest('.dataTables_wrapper'))) || node;
    }

    /* ------------------------------------------- 1. server-side tables */

    var FILTER_KEYS = ['id', 'franchise_id', 'department_id', 'student_id', 'parent_id', 'start_date', 'end_date'];

    if ($ && $.fn && $.fn.dataTable) {
        $(document).on('preXhr.dt', function (e, settings, data) {
            if (!data || typeof data !== 'object') return;
            var filtered = !!(data.search && String(data.search.value || '').trim());
            FILTER_KEYS.forEach(function (k) { if (data[k] !== undefined && data[k] !== null && String(data[k]).trim() !== '') filtered = true; });
            settings._ntFiltered = filtered;
            var el = document.querySelector('.nt-metrics[data-for="' + settings.sTableId + '"]');
            if (el && Number(data.start) === 0) el.classList.add('is-loading');
        });

        $(document).on('xhr.dt', function (e, settings, json) {
            var el = document.querySelector('.nt-metrics[data-for="' + settings.sTableId + '"]');
            if (!json || !json.nt_metrics) {
                if (el) el.classList.remove('is-loading'); // paging: keep the cards as they are
                return;
            }
            el = el || strip(anchorFor(settings.nTable), settings.sTableId);
            paint(el, json.nt_metrics, settings._ntFiltered ? 'Totals for the current filters and search' : '');
        });
    }

    /* --------------------------------------------- 2. other screens */

    var SCREENS = {
        super_admin: {
            'manage_franchise.php': 'admin.franchises',
            'student_tickets.php': 'admin.student_tickets',
            'parent_tickets.php': 'admin.parent_tickets',
            'assign_plan_department.php': 'admin.assign_plan_department',
            // school pages (school accounts, or admins after picking a school)
            'school_students.php': 'franchise.manage_students',
            'school_parents.php': 'franchise.manage_parents',
            'school_student_skip.php': 'franchise.student_skip',
            'school_parent_skip.php': 'franchise.parent_skip'
        }
    };

    function portal() {
        var m = /\/(super_admin)\/([^/?#]+)/.exec(location.pathname);
        return m ? { portal: m[1], page: m[2] } : null;
    }

    function loadScreen() {
        var where = portal();
        var screen = where && SCREENS[where.portal] && SCREENS[where.portal][where.page];
        if (!screen || !API) return;
        var content = document.querySelector('.page-content .container-fluid') || document.querySelector('.page-content');
        if (!content) return;
        var table = content.querySelector('table');
        var anchor = table ? anchorFor(table) : content.querySelector('.card');
        if (!anchor) return;

        var el = strip(anchor, 'screen');
        el.classList.add('is-loading');
        el.querySelector('.nt-metrics-grid').innerHTML = new Array(5).join('<div class="nt-metric nt-metric-skeleton"></div>');

        var token = null;
        try { token = localStorage.getItem(screen.indexOf('franchise.') === 0 ? 'franchisetoken' : 'admintoken'); } catch (e) { /* storage blocked */ }
        fetch(API + '/api/screen-metrics?screen=' + encodeURIComponent(screen), { headers: { Authorization: 'Bearer ' + (token || '') } })
            .then(function (res) { return res.json(); })
            .then(function (body) { if (body && !body.error) paint(el, body.data, ''); else el.remove(); })
            .catch(function () { el.remove(); });
    }

    if (ROLE !== '' || portal()) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadScreen);
        else loadScreen();
    }
})();
