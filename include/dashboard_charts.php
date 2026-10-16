<?php
/*
 * Dashboard charts (super admin & franchise dashboards).
 * Set $ntChartsPortal = 'admin' | 'franchise' before including. Data: GET {$path}/api/insights
 * Rendering: assets/admin/js/nt-charts.js (ApexCharts from assets/admin/libs).
 */
$ntPortal = (isset($ntChartsPortal) && $ntChartsPortal === 'franchise') ? 'franchise' : 'admin';
?>
<section class="nt-insights" id="nt-insights" data-portal="<?= $ntPortal ?>" data-api="<?= htmlspecialchars($path) ?>">
    <div class="nt-insights-bar">
        <div>
            <h2 class="nt-insights-title">Activity</h2>
            <p class="nt-insights-sub">Plan purchases, calls and students<?= $ntPortal === 'franchise' ? ' in your franchise' : ' across all franchises' ?></p>
        </div>
        <div class="nt-segmented" role="group" aria-label="Date range">
            <button type="button" data-days="7">7 days</button>
            <button type="button" data-days="30">30 days</button>
            <button type="button" data-days="90" class="active" aria-pressed="true">90 days</button>
            <button type="button" data-days="365">12 months</button>
        </div>
    </div>
    <div class="row">
        <div class="col-xl-6">
            <div class="card nt-chart-card">
                <div class="nt-chart-head">
                    <div>
                        <h3>Plan purchases</h3>
                        <p class="nt-chart-note" data-note="purchases">Plans bought per day</p>
                    </div>
                    <div class="nt-chart-kpi" data-kpi="purchases"><span class="nt-kpi-value">—</span><span class="nt-kpi-label">&nbsp;</span></div>
                </div>
                <div class="nt-chart" id="nt-chart-purchases" role="img" aria-label="Plan purchases over time"></div>
            </div>
        </div>
        <div class="col-xl-6">
            <div class="card nt-chart-card">
                <div class="nt-chart-head">
                    <div>
                        <h3>Call minutes</h3>
                        <p class="nt-chart-note" data-note="calls">Minutes talked per day</p>
                    </div>
                    <div class="nt-chart-kpi" data-kpi="calls"><span class="nt-kpi-value">—</span><span class="nt-kpi-label">&nbsp;</span></div>
                </div>
                <div class="nt-chart" id="nt-chart-calls" role="img" aria-label="Call minutes over time"></div>
            </div>
        </div>
        <div class="col-xl-6">
            <div class="card nt-chart-card">
                <div class="nt-chart-head">
                    <div>
                        <h3>Students by <?= $ntPortal === 'franchise' ? 'department' : 'franchise' ?></h3>
                        <p class="nt-chart-note">Active and inactive · all time</p>
                    </div>
                    <div class="nt-chart-kpi" data-kpi="students"><span class="nt-kpi-value">—</span><span class="nt-kpi-label">&nbsp;</span></div>
                </div>
                <div class="nt-chart" id="nt-chart-students" role="img" aria-label="Active and inactive students"></div>
            </div>
        </div>
        <div class="col-xl-6">
            <div class="card nt-chart-card">
                <div class="nt-chart-head">
                    <div>
                        <h3>Top plans</h3>
                        <p class="nt-chart-note" data-note="plans">Most purchased in this period</p>
                    </div>
                    <div class="nt-chart-kpi" data-kpi="plans"><span class="nt-kpi-value">—</span><span class="nt-kpi-label">&nbsp;</span></div>
                </div>
                <div class="nt-chart" id="nt-chart-plans" role="img" aria-label="Most purchased plans"></div>
            </div>
        </div>
    </div>
</section>
<script src="<?= $basePath ?>/assets/admin/libs/apexcharts/apexcharts.min.js"></script>
<script src="<?= $basePath ?>/assets/admin/js/nt-charts.js?v=4"></script>
