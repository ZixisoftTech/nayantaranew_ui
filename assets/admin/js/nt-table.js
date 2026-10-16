/*
 * Nayan Tara — table enhancements (loaded on every admin page from include/foot.php)
 *
 *  1. Wraps each DataTable in its own horizontal scroller so the toolbar,
 *     search and pagination stay put while wide tables scroll.
 *  2. Finds the "Action" column, pins it to the right edge (sticky) and
 *     collapses each row's actions into a ⋮ menu that floats above the table.
 *
 * The original action links/buttons are MOVED (not cloned) into the menu, so
 * their inline onclick, data-* attributes, Bootstrap modal triggers and the
 * page's delegated handlers (e.g. $(document).on('click', '.delete')) keep working.
 * Works off DOM mutations so it doesn't depend on which jQuery copy drew the table.
 */
(function () {
    'use strict';

    var ACTION_HEADER = /^actions?$/i;

    /* DataTables defaults: a missing or null field renders a muted dash instead of
       raising "Requested unknown parameter 'x' for row n" (DataTables tn/4). */
    var DT = window.jQuery && window.jQuery.fn && window.jQuery.fn.dataTable;
    if (DT && DT.defaults && DT.defaults.column) {
        DT.defaults.column.sDefaultContent = '<span class="nt-empty">—</span>';
    }
    // default page size (pages that set their own pageLength keep it)
    if (DT && DT.defaults) {
        DT.defaults.iDisplayLength = 25;
        DT.defaults.aLengthMenu = [25, 50, 100];
    }
    var PAGE_SIZES = [25, 50, 100];

    /* ------------------------------------------------- export every matching row */
    // Tables load one page at a time from the server, so Buttons would only export the visible
    // page. These wrappers fetch all rows matching the current filters/search, export them,
    // then put the table back on the page the user was viewing.
    var BTN = DT && DT.ext && DT.ext.buttons;
    if (BTN && BTN.csvHtml5) {
        var pageTitle = function () {
            var h = document.querySelector('.nt-page-title');
            var date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return (h ? h.textContent.trim() : 'Export') + ' – ' + date;
        };
        // leave out the ⋮ action column, checkbox columns and header-less columns
        var exportColumns = function (idx, data, node) {
            if (!node) return true;
            if (node.classList.contains('nt-col-action')) return false;
            if (node.querySelector('input[type="checkbox"]')) return false;
            var text = node.textContent.replace(/\s+/g, ' ').trim();
            return text !== '' && !/^(action|actions|select all)$/i.test(text);
        };

        var setBusy = function (button, busy) {
            var el = button && button[0] ? button[0] : button;
            if (!el) return;
            el.classList.toggle('nt-busy', busy);
            el.disabled = busy;
        };

        var confirmLarge = function (rows, heavy, go) {
            var limit = heavy ? 2000 : 20000;
            if (rows <= limit || !window.Swal) return go();
            Swal.fire({
                title: 'Export ' + rows.toLocaleString('en-IN') + ' rows?',
                text: heavy ? 'PDF and print get very slow with this many rows. CSV or Excel is recommended.'
                            : 'This can take a few seconds.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Export',
                cancelButtonText: 'Cancel'
            }).then(function (r) { if (r && (r.isConfirmed || r.value)) go(); });
        };

        var exportAll = function (original, heavy) {
            return function (e, dt, button, config) {
                var self = this;
                var info = dt.page.info();
                var run = function () { original.call(self, e, dt, button, config); };
                // everything already on screen (client-side table or one page holds all rows)
                if (!info.serverSide || info.length === -1 || info.recordsDisplay <= info.end - info.start) {
                    return confirmLarge(info.recordsDisplay, heavy, run);
                }
                confirmLarge(info.recordsDisplay, heavy, function () {
                    var oldStart = info.start;
                    setBusy(button, true);
                    dt.one('preXhr', function (ev, settings, data) {
                        data.start = 0;
                        data.length = 2147483647;
                        dt.one('preDraw', function (ev2, s2) {
                            try { run(); } finally {
                                // restore the page the user was on
                                dt.one('preXhr', function (ev3, s3, d3) { s2._iDisplayStart = oldStart; d3.start = oldStart; });
                                setTimeout(function () { dt.ajax.reload(null, false); setBusy(button, false); }, 0);
                            }
                            return false; // don't render thousands of rows
                        });
                    });
                    dt.ajax.reload();
                });
            };
        };

        [['copyHtml5', false], ['csvHtml5', false], ['excelHtml5', false], ['pdfHtml5', true], ['print', true]].forEach(function (b) {
            var def = BTN[b[0]];
            if (!def || def._ntAll) return;
            def.action = exportAll(def.action, b[1]);
            def._ntAll = true;
            def.title = pageTitle;
            def.filename = function () { return pageTitle().replace(/[\\/:*?"<>|]/g, '-'); };
            def.exportOptions = window.jQuery.extend({}, def.exportOptions, { columns: exportColumns });
        });
        if (BTN.pdfHtml5) { BTN.pdfHtml5.orientation = 'landscape'; BTN.pdfHtml5.pageSize = 'A4'; }
    }

    var KNOWN_ACTIONS = [
        { test: /bx-edit|bx-pencil|(^|\s)edit(\s|$)|\.edit\b/, label: 'Edit', icon: 'bx-edit-alt' },
        { test: /bx-trash|(^|\s)delete(\s|$)/, label: 'Delete', icon: 'bx-trash-alt', danger: true },
        { test: /bx-show|bx-detail|(^|\s)view(\s|$)|\.view\b/, label: 'View', icon: 'bx-show' },
        { test: /bx-log-out|logout/i, label: 'Logout', icon: 'bx-log-out', danger: true }
    ];

    function describe(el) {
        var hay = [
            el.className,
            el.getAttribute('data-target') || '',
            el.getAttribute('onclick') || '',
            Array.prototype.map.call(el.querySelectorAll('i'), function (i) { return i.className; }).join(' '),
            el.textContent
        ].join(' ');
        for (var i = 0; i < KNOWN_ACTIONS.length; i++) {
            if (KNOWN_ACTIONS[i].test.test(hay)) return KNOWN_ACTIONS[i];
        }
        return null;
    }

    /* ---------------------------------------------------------------- menu */

    var openBox = null;

    function closeMenu() {
        if (!openBox) return;
        openBox.classList.remove('open');
        openBox.querySelector('.nt-kebab').setAttribute('aria-expanded', 'false');
        var cell = openBox.closest('td');
        if (cell) cell.classList.remove('nt-menu-open');
        openBox = null;
    }

    function openMenu(box) {
        closeMenu();
        openBox = box;
        var btn = box.querySelector('.nt-kebab');
        var menu = box.querySelector('.nt-menu');
        var cell = box.closest('td');
        if (cell) cell.classList.add('nt-menu-open');
        box.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');

        // float next to the button, flipping up / clamping to the viewport
        var r = btn.getBoundingClientRect();
        var w = menu.offsetWidth, h = menu.offsetHeight;
        var left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
        var top = r.bottom + 6;
        if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        var first = menu.querySelector('.nt-menu-item');
        if (first) first.focus({ preventScroll: true });
    }

    document.addEventListener('click', function (e) {
        var kebab = e.target.closest && e.target.closest('.nt-kebab');
        if (kebab) {
            e.preventDefault();
            var box = kebab.closest('.nt-actions');
            if (box === openBox) closeMenu(); else openMenu(box);
            return;
        }
        if (openBox && e.target.closest && e.target.closest('.nt-menu-item')) {
            // let the item's own handlers run first, then close
            setTimeout(closeMenu, 0);
            return;
        }
        if (openBox && !openBox.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
        if (!openBox) return;
        var items = Array.prototype.slice.call(openBox.querySelectorAll('.nt-menu-item'));
        var i = items.indexOf(document.activeElement);
        if (e.key === 'Escape') {
            var btn = openBox.querySelector('.nt-kebab');
            closeMenu();
            btn.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            items[(i + 1) % items.length].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            items[(i - 1 + items.length) % items.length].focus();
        } else if (e.key === 'Tab') {
            closeMenu();
        }
    });

    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);

    /* ------------------------------------------------------- cell builder */

    function buildActions(td) {
        if (td.getAttribute('data-nt-actions') === '1') return;
        var controls = Array.prototype.filter.call(td.querySelectorAll('a, button'), function (el) {
            return !el.closest('.nt-actions');
        });
        if (!controls.length) return;
        td.setAttribute('data-nt-actions', '1');

        var box = document.createElement('div');
        box.className = 'nt-actions';

        var kebab = document.createElement('button');
        kebab.type = 'button';
        kebab.className = 'nt-kebab';
        kebab.setAttribute('aria-haspopup', 'menu');
        kebab.setAttribute('aria-expanded', 'false');
        kebab.setAttribute('aria-label', 'Row actions');
        kebab.innerHTML = '<i class="bx bx-dots-vertical-rounded"></i>';

        var menu = document.createElement('div');
        menu.className = 'nt-menu';
        menu.setAttribute('role', 'menu');

        controls.forEach(function (el) {
            var kind = describe(el);
            var text = el.textContent.replace(/\s+/g, ' ').trim();

            el.classList.remove('btn-sm');
            el.classList.add('nt-menu-item');
            el.setAttribute('role', 'menuitem');
            if (el.tagName === 'BUTTON' && !el.getAttribute('type')) el.type = 'button';
            if (kind && kind.danger) el.classList.add('nt-danger');

            if (!el.querySelector('i')) {
                var icon = document.createElement('i');
                icon.className = 'bx ' + (kind ? kind.icon : 'bx-chevron-right');
                el.insertBefore(icon, el.firstChild);
            }
            if (!text) {
                var label = document.createElement('span');
                label.textContent = kind ? kind.label : (el.getAttribute('title') || 'Action');
                el.appendChild(label);
            }
            menu.appendChild(el);
        });

        td.textContent = '';
        box.appendChild(kebab);
        box.appendChild(menu);
        td.appendChild(box);
    }

    /* ------------------------------------------------------ table scanner */

    function actionIndex(table) {
        var head = table.tHead;
        if (!head || !head.rows.length) return -1;
        var cells = head.rows[head.rows.length - 1].cells;
        for (var i = 0; i < cells.length; i++) {
            if (ACTION_HEADER.test(cells[i].textContent.replace(/\s+/g, ' ').trim())) return i;
        }
        return -1;
    }

    function wrapScroller(table) {
        if (!table.classList.contains('dataTable')) return;
        var parent = table.parentNode;
        if (parent.classList.contains('nt-table-scroll')) return;
        var scroller = document.createElement('div');
        scroller.className = 'nt-table-scroll';
        parent.insertBefore(scroller, table);
        scroller.appendChild(table);
        scroller.addEventListener('scroll', function () { updateEdges(scroller); }, { passive: true });
    }

    function updateEdges(scroller) {
        var overflow = scroller.scrollWidth > scroller.clientWidth + 1;
        scroller.classList.toggle('nt-overflowing', overflow);
        scroller.classList.toggle('nt-at-end', !overflow || scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1);
    }

    /* One footer row per DataTable: "Showing x to y of z" · rows-per-page · pagination */
    function buildFooter(table) {
        var jq = window.jQuery;
        var wrapper = table.closest('.dataTables_wrapper');
        if (!wrapper || wrapper.querySelector('.nt-dt-footer')) return;
        if (!jq || !jq.fn.dataTable || !jq.fn.dataTable.isDataTable(table)) return;
        var api = jq(table).DataTable();

        var footer = document.createElement('div');
        footer.className = 'nt-dt-footer';
        var info = wrapper.querySelector('.dataTables_info');
        var paginate = wrapper.querySelector('.dataTables_paginate');

        var current = api.page.len();
        var sizes = PAGE_SIZES.slice();
        if (current > 0 && sizes.indexOf(current) < 0) { sizes.push(current); sizes.sort(function (a, b) { return a - b; }); }
        var length = document.createElement('label');
        length.className = 'nt-dt-length';
        length.innerHTML = '<span>Rows per page</span><select aria-label="Rows per page">' + sizes.map(function (n) {
            return '<option value="' + n + '"' + (n === current ? ' selected' : '') + '>' + n + '</option>';
        }).join('') + '</select>';
        length.querySelector('select').addEventListener('change', function () {
            api.page.len(Number(this.value)).draw();
        });
        // a page that already shows DataTables' own length control: replace it with ours
        var builtIn = wrapper.querySelector('.dataTables_length');
        if (builtIn) builtIn.style.display = 'none';

        var left = document.createElement('div');
        left.className = 'nt-dt-footer-left';
        if (info) left.appendChild(info);
        left.appendChild(length);
        footer.appendChild(left);
        var right = document.createElement('div');
        right.className = 'nt-dt-footer-right';
        if (paginate) right.appendChild(paginate);
        footer.appendChild(right);

        var scroller = table.closest('.nt-table-scroll') || table;
        scroller.parentNode.insertBefore(footer, scroller.nextSibling);
        // drop the empty bootstrap row DataTables leaves behind
        Array.prototype.forEach.call(wrapper.querySelectorAll(':scope > .row'), function (row) {
            if (!row.textContent.trim() && !row.querySelector('table, select, input, button')) row.remove();
        });
    }

    function enhanceTable(table) {
        wrapScroller(table);
        buildFooter(table);

        var idx = actionIndex(table);
        if (idx >= 0) {
            table.classList.add('nt-has-actions');
            var headRow = table.tHead.rows[table.tHead.rows.length - 1];
            var th = headRow.cells[idx];
            th.classList.add('nt-col-action');
            if (!th.querySelector('.nt-sr-only')) {
                // keep the label for screen readers but don't let it widen the column
                th.innerHTML = '<span class="nt-sr-only">' + th.textContent.trim() + '</span>';
            }
            Array.prototype.forEach.call(table.tBodies, function (body) {
                Array.prototype.forEach.call(body.rows, function (tr) {
                    if (tr.cells.length !== headRow.cells.length) return; // "No data" / colspan rows
                    var td = tr.cells[idx];
                    td.classList.add('nt-col-action');
                    buildActions(td);
                });
            });
        }

        var scroller = table.closest('.nt-table-scroll, .table-responsive');
        if (scroller) updateEdges(scroller);
    }

    function scan() {
        Array.prototype.forEach.call(document.querySelectorAll('table.table, table.dataTable'), enhanceTable);
    }

    var queued = false;
    function queueScan() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
            queued = false;
            scan();
        });
    }

    /* ---------------------------------------------- auto-apply list filters */
    // Filter rows above a table (selects/date inputs + a Submit button) reload the table
    // as soon as a value changes; the Submit button is hidden. Bound through jQuery so the
    // datepicker's jQuery-triggered "change" events are caught too.
    function markAutoFilters() {
        if (!document.querySelector('table.dataTable, table[id]')) return;
        Array.prototype.forEach.call(document.querySelectorAll('.card-body > .row'), function (row) {
            if (row.classList.contains('nt-auto-filter') || row.closest('form')) return;
            var btn = row.querySelector('#submit');
            // only filter bars: never rows holding real forms (e.g. CSV upload uses id="submit" too)
            if (!btn || btn.closest('form') || row.querySelector('form, input[type="file"]')) return;
            if (!row.querySelector('select, input')) return;
            var card = row.closest('.card');
            if (!card || !card.querySelector('table')) return;
            row.classList.add('nt-auto-filter');
            var col = btn.closest('[class*="col-"]');
            if (col && col !== row) col.classList.add('nt-auto-submit-col');
        });
    }

    var filterTimer;
    if (window.jQuery) {
        window.jQuery(document).on('change changeDate', '.nt-auto-filter select, .nt-auto-filter input', function () {
            var btn = this.closest('.nt-auto-filter').querySelector('#submit');
            clearTimeout(filterTimer);
            filterTimer = setTimeout(function () { if (btn) btn.click(); }, 150);
        });
    }

    function start() {
        markAutoFilters();
        scan();
        new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var t = mutations[i].target;
                // ignore our own menu toggling / moves inside action cells
                if (t.closest && t.closest('.nt-actions')) continue;
                queueScan();
                return;
            }
        }).observe(document.body, { childList: true, subtree: true });
        window.addEventListener('resize', function () {
            Array.prototype.forEach.call(document.querySelectorAll('.nt-table-scroll, .table-responsive'), updateEdges);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
