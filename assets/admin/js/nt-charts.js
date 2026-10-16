/*
 * Nayan Tara — dashboard charts (include/dashboard_charts.php)
 *
 * Colours (validated with the data-viz palette checker, light surface):
 *   series 1 blue  #2a78d6, series 2 brand orange #e2761b. Orange sits just under 3:1
 *   against the surface, so every orange chart carries visible values (KPI + data labels).
 * Marks: thin bars with rounded ends, 2px lines, 2px surface gaps between stacked segments,
 * recessive grid, hover tooltips on every chart. One y-axis per chart, always.
 */
(function () {
    'use strict';

    var root = document.getElementById('nt-insights');
    if (!root || typeof window.ApexCharts !== 'function') return;

    var PORTAL = root.getAttribute('data-portal');
    var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
    var TOKEN_KEY = PORTAL === 'franchise' ? 'franchisetoken' : 'admintoken';

    var C = {
        blue: '#2a78d6',
        orange: '#e2761b',
        text: '#101828',
        muted: '#667085',
        grid: '#eef0f3',
        surface: '#ffffff',
        font: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    var charts = {};
    var current = 90;

    /* ----------------------------------------------------------- helpers */

    function fmt(n) { return (Number(n) || 0).toLocaleString('en-IN'); }
    function rupees(n) { return '₹' + fmt(n); }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /* Builds continuous buckets (days, or months for the 12-month view) so gaps show as zero. */
    function buckets(days) {
        var out = [];
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (days > 90) {
            for (var m = 11; m >= 0; m--) {
                var d = new Date(today.getFullYear(), today.getMonth() - m, 1);
                out.push({ ts: d.getTime(), key: d.getFullYear() + '-' + pad(d.getMonth() + 1), label: MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2), long: MONTHS[d.getMonth()] + ' ' + d.getFullYear() });
            }
        } else {
            for (var i = days - 1; i >= 0; i--) {
                var day = new Date(today);
                day.setDate(today.getDate() - i);
                out.push({ ts: day.getTime(), key: iso(day), label: day.getDate() + ' ' + MONTHS[day.getMonth()], long: day.getDate() + ' ' + MONTHS[day.getMonth()] + ' ' + day.getFullYear() });
            }
        }
        return out;
    }

    function fill(rows, days, fields) {
        var b = buckets(days);
        var monthly = days > 90;
        var index = {};
        b.forEach(function (x, i) { index[x.key] = i; fields.forEach(function (f) { x[f] = 0; }); });
        rows.forEach(function (r) {
            var key = monthly ? r.day.slice(0, 7) : r.day;
            if (index[key] === undefined) return;
            fields.forEach(function (f) { b[index[key]][f] += Number(r[f]) || 0; });
        });
        return b;
    }

    function base(type, height) {
        return {
            chart: {
                type: type,
                height: height || 280,
                fontFamily: C.font,
                foreColor: C.muted,
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: { enabled: true, speed: 350, animateGradually: { enabled: false } },
                parentHeightOffset: 0
            },
            grid: {
                borderColor: C.grid,
                strokeDashArray: 0,
                padding: { left: 8, right: 8, top: -8, bottom: 0 },
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } }
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            states: { hover: { filter: { type: 'darken', value: 0.9 } }, active: { filter: { type: 'none' } } },
            tooltip: { theme: 'light', style: { fontSize: '13px', fontFamily: C.font } }
        };
    }

    // time series use a real date axis so ApexCharts spaces the labels itself
    function timeAxis() {
        return {
            type: 'datetime',
            labels: {
                datetimeUTC: false,
                style: { fontSize: '12px' },
                datetimeFormatter: { year: 'yyyy', month: current > 90 ? "MMM 'yy" : 'MMM', day: 'd MMM', hour: '' }
            },
            axisBorder: { color: C.grid },
            axisTicks: { show: false },
            tooltip: { enabled: false }
        };
    }

    function tooltipBox(title, rows) {
        return '<div class="nt-tip"><div class="nt-tip-title">' + title + '</div>' + rows.map(function (r) {
            return '<div class="nt-tip-row"><span class="nt-tip-key"><i style="background:' + r[2] + '"></i>' + r[0] + '</span><strong>' + r[1] + '</strong></div>';
        }).join('') + '</div>';
    }

    function setKpi(name, value, label) {
        var el = root.querySelector('[data-kpi="' + name + '"]');
        if (!el) return;
        el.querySelector('.nt-kpi-value').textContent = value;
        el.querySelector('.nt-kpi-label').textContent = label;
    }

    function render(id, options, hasData, emptyText) {
        var host = document.getElementById(id);
        if (charts[id]) { charts[id].destroy(); delete charts[id]; }
        host.innerHTML = '';
        host.classList.remove('is-loading');
        if (!hasData) {
            host.innerHTML = '<div class="nt-chart-empty"><i class="bx bx-bar-chart-alt-2"></i><p>' + emptyText + '</p></div>';
            return;
        }
        charts[id] = new ApexCharts(host, options);
        charts[id].render();
    }

    function periodText() {
        return current > 90 ? 'last 12 months' : 'last ' + current + ' days';
    }

    /* ------------------------------------------------------------ charts */

    function purchasesChart(rows) {
        var b = fill(rows, current, ['count', 'value']);
        var total = b.reduce(function (s, x) { return s + x.count; }, 0);
        var value = b.reduce(function (s, x) { return s + x.value; }, 0);
        setKpi('purchases', fmt(total), rupees(value) + ' · ' + periodText());
        root.querySelector('[data-note="purchases"]').textContent = current > 90 ? 'Plans bought per month' : 'Plans bought per day';

        var o = base('bar');
        o.series = [{ name: 'Purchases', data: b.map(function (x) { return [x.ts, x.count]; }) }];
        o.colors = [C.orange];
        o.plotOptions = { bar: { columnWidth: b.length > 40 ? '80%' : '55%', endingShape: 'rounded' } };
        o.xaxis = timeAxis();
        o.yaxis = { min: 0, forceNiceScale: true, tickAmount: 4, labels: { formatter: function (v) { return fmt(Math.round(v)); } } };
        o.tooltip.custom = function (ctx) {
            var x = b[ctx.dataPointIndex];
            return tooltipBox(x.long, [['Purchases', fmt(x.count), C.orange], ['Plan value', rupees(x.value), 'transparent']]);
        };
        render('nt-chart-purchases', o, total > 0, 'No plan purchases in the ' + periodText() + '.');
    }

    function callsChart(rows) {
        var b = fill(rows, current, ['calls', 'minutes']);
        var mins = b.reduce(function (s, x) { return s + x.minutes; }, 0);
        var calls = b.reduce(function (s, x) { return s + x.calls; }, 0);
        setKpi('calls', fmt(mins) + ' min', fmt(calls) + ' calls · ' + periodText());
        root.querySelector('[data-note="calls"]').textContent = current > 90 ? 'Minutes talked per month' : 'Minutes talked per day';

        var o = base('area');
        o.series = [{ name: 'Minutes', data: b.map(function (x) { return [x.ts, x.minutes]; }) }];
        o.colors = [C.blue];
        o.stroke = { width: 2, curve: 'straight' };
        o.fill = { type: 'gradient', gradient: { shadeIntensity: 0, opacityFrom: 0.22, opacityTo: 0, stops: [0, 100] } };
        o.markers = { size: 0, strokeColors: C.surface, strokeWidth: 2, hover: { size: 5 } };
        o.xaxis = timeAxis();
        o.xaxis.crosshairs = { stroke: { color: '#d4d8de', width: 1, dashArray: 0 } };
        o.yaxis = { min: 0, forceNiceScale: true, tickAmount: 4, labels: { formatter: function (v) { return fmt(Math.round(v)); } } };
        o.tooltip.custom = function (ctx) {
            var x = b[ctx.dataPointIndex];
            return tooltipBox(x.long, [['Minutes', fmt(x.minutes), C.blue], ['Calls', fmt(x.calls), 'transparent']]);
        };
        render('nt-chart-calls', o, calls > 0, 'No calls in the ' + periodText() + '. Try “12 months”.');
    }

    function studentsChart(rows) {
        var active = rows.reduce(function (s, r) { return s + r.active; }, 0);
        var inactive = rows.reduce(function (s, r) { return s + r.inactive; }, 0);
        var total = active + inactive;
        var maxTotal = rows.reduce(function (m, r) { return Math.max(m, r.active + r.inactive); }, 0);
        setKpi('students', fmt(total), total ? Math.round((active / total) * 100) + '% active' : '');

        var o = base('bar', Math.max(200, rows.length * 46 + 90));
        o.chart.stacked = true;
        o.series = [
            { name: 'Active', data: rows.map(function (r) { return r.active; }) },
            { name: 'Inactive', data: rows.map(function (r) { return r.inactive; }) }
        ];
        o.colors = [C.blue, C.orange];
        o.stroke = { width: 2, colors: [C.surface] }; // 2px surface gap between segments
        o.plotOptions = { bar: { horizontal: true, barHeight: '58%' } };
        o.dataLabels = { enabled: true, style: { fontSize: '12px', fontWeight: 600, colors: ['#ffffff', C.text] },
                         formatter: function (v) { return v > 0 && v >= maxTotal * 0.08 ? fmt(v) : ''; }, dropShadow: { enabled: false } };
        o.legend = { show: true, position: 'top', horizontalAlign: 'left', fontSize: '13px', markers: { width: 10, height: 10, radius: 3 },
                     itemMargin: { horizontal: 10 }, labels: { colors: C.text } };
        o.grid.xaxis = { lines: { show: true } };
        o.grid.yaxis = { lines: { show: false } };
        o.xaxis = { categories: rows.map(function (r) { return r.label; }), labels: { formatter: function (v) { return fmt(Math.round(v)); } },
                    axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: 4 };
        o.yaxis = { labels: { maxWidth: 160, style: { fontSize: '13px', colors: [C.text] } } };
        o.tooltip.shared = true;
        o.tooltip.intersect = false;
        o.tooltip.custom = function (ctx) {
            var r = rows[ctx.dataPointIndex];
            return tooltipBox(r.label, [['Active', fmt(r.active), C.blue], ['Inactive', fmt(r.inactive), C.orange]]);
        };
        render('nt-chart-students', o, total > 0, 'No students yet.');
    }

    function plansChart(rows) {
        var total = rows.reduce(function (s, r) { return s + r.count; }, 0);
        var maxCount = rows.reduce(function (m, r) { return Math.max(m, r.count); }, 0);
        setKpi('plans', rows.length ? fmt(rows.length) : '0', rows.length === 1 ? 'plan sold' : 'plans sold · ' + periodText());

        var o = base('bar', Math.max(200, rows.length * 44 + 60));
        o.series = [{ name: 'Purchases', data: rows.map(function (r) { return r.count; }) }];
        o.colors = [C.orange];
        o.plotOptions = { bar: { horizontal: true, barHeight: '56%', endingShape: 'rounded' } };
        o.dataLabels = { enabled: true, style: { fontSize: '12px', fontWeight: 600, colors: [C.text] },
                         formatter: function (v) { return v >= maxCount * 0.08 ? fmt(v) : ''; }, dropShadow: { enabled: false } };
        o.grid.xaxis = { lines: { show: true } };
        o.grid.yaxis = { lines: { show: false } };
        o.xaxis = { categories: rows.map(function (r) { return r.label; }), labels: { formatter: function (v) { return fmt(Math.round(v)); } },
                    axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: 4 };
        o.yaxis = { labels: { maxWidth: 170, style: { fontSize: '13px', colors: [C.text] } } };
        o.tooltip.custom = function (ctx) {
            var r = rows[ctx.dataPointIndex];
            return tooltipBox(r.label, [['Purchases', fmt(r.count), C.orange], ['Plan value', rupees(r.value), 'transparent']]);
        };
        render('nt-chart-plans', o, total > 0, 'No plans purchased in the ' + periodText() + '.');
    }

    /* ---------------------------------------------------------- loading */

    function setLoading() {
        ['nt-chart-purchases', 'nt-chart-calls', 'nt-chart-students', 'nt-chart-plans'].forEach(function (id) {
            var host = document.getElementById(id);
            if (!charts[id]) host.classList.add('is-loading');
        });
    }

    function showError(message) {
        ['nt-chart-purchases', 'nt-chart-calls', 'nt-chart-students', 'nt-chart-plans'].forEach(function (id) {
            if (charts[id]) { charts[id].destroy(); delete charts[id]; }
            var host = document.getElementById(id);
            host.classList.remove('is-loading');
            host.innerHTML = '<div class="nt-chart-empty"><i class="bx bx-error-circle"></i><p>' + message + '</p></div>';
        });
    }

    function load() {
        setLoading();
        var token = null;
        try { token = localStorage.getItem(TOKEN_KEY); } catch (e) { /* storage blocked */ }
        fetch(API + '/api/insights?days=' + current + '&portal=' + PORTAL, { headers: { Authorization: 'Bearer ' + (token || '') } })
            .then(function (res) { return res.json().then(function (body) { if (!res.ok || body.error) throw new Error(body.message || 'Could not load charts.'); return body.data; }); })
            .then(function (d) {
                purchasesChart(d.purchases);
                callsChart(d.calls);
                studentsChart(d.students);
                plansChart(d.topPlans);
            })
            .catch(function (err) { showError(String(err.message).replace(/</g, '&lt;')); });
    }

    root.querySelector('.nt-segmented').addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-days]');
        if (!btn || Number(btn.getAttribute('data-days')) === current) return;
        current = Number(btn.getAttribute('data-days'));
        this.querySelectorAll('button').forEach(function (b) {
            var on = b === btn;
            b.classList.toggle('active', on);
            if (on) b.setAttribute('aria-pressed', 'true'); else b.removeAttribute('aria-pressed');
        });
        load();
    });

    load();
})();
