<?php
/*
 * Super admin dashboard: today strip, needs attention, quick actions, franchise leaderboard,
 * recent tickets and call windows. Data: GET {$path}/api/overview
 * Rendering: assets/admin/js/nt-overview.js
 */
?>
<section class="nt-ov" id="nt-overview" data-api="<?= htmlspecialchars($path) ?>">

    <!-- today -->
    <div class="card nt-ov-today">
        <div class="nt-ov-head">
            <div>
                <h3>Today so far</h3>
                <p>Compared with yesterday at this time · <span data-ov="clock">—</span></p>
            </div>
        </div>
        <div class="nt-ov-today-grid" data-ov="today">
            <div class="nt-ov-skeleton"></div><div class="nt-ov-skeleton"></div><div class="nt-ov-skeleton"></div>
            <div class="nt-ov-skeleton"></div><div class="nt-ov-skeleton"></div>
        </div>
    </div>

    <div class="row">
        <!-- needs attention -->
        <div class="col-xl-8">
            <div class="card nt-ov-card">
                <div class="nt-ov-head">
                    <div>
                        <h3>Needs attention</h3>
                        <p>Students and franchises that need an action from you</p>
                    </div>
                </div>
                <ul class="nt-ov-attention" data-ov="attention">
                    <li class="nt-ov-skeleton"></li><li class="nt-ov-skeleton"></li><li class="nt-ov-skeleton"></li>
                </ul>
            </div>
        </div>

        <!-- quick actions -->
        <div class="col-xl-4">
            <div class="card nt-ov-card">
                <div class="nt-ov-head">
                    <div>
                        <h3>Quick actions</h3>
                        <p>Jump straight into common tasks</p>
                    </div>
                </div>
                <div class="nt-ov-actions">
                    <a class="nt-ov-action is-primary" href="assign_plan.php?open=1">
                        <i class="bx bx-purchase-tag"></i><span>Assign plan</span>
                    </a>
                    <a class="nt-ov-action" href="students.php?new=1">
                        <i class="bx bx-user-plus"></i><span>Add student</span>
                    </a>
                    <a class="nt-ov-action" href="manage_franchise.php?new=1">
                        <i class="bx bx-buildings"></i><span>Add franchise</span>
                    </a>
                    <a class="nt-ov-action" href="manage_subscriptions.php?new=1">
                        <i class="bx bx-package"></i><span>Create plan</span>
                    </a>
                    <a class="nt-ov-action" href="student_tickets.php">
                        <i class="bx bx-support"></i><span>Student tickets</span>
                    </a>
                    <a class="nt-ov-action" href="parent_tickets.php">
                        <i class="bx bx-shield-quarter"></i><span>Parent tickets</span>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- franchise leaderboard -->
    <div class="card nt-ov-card">
        <div class="nt-ov-head">
            <div>
                <h3>Franchises</h3>
                <p>Last 30 days · click a column to sort, a name for details</p>
            </div>
        </div>
        <div class="nt-ov-table-wrap">
            <table class="nt-ov-table" data-ov="franchises">
                <thead>
                    <tr>
                        <th data-sort="name" class="is-text">Franchise</th>
                        <th data-sort="students">Students</th>
                        <th data-sort="active_pct">Calling</th>
                        <th data-sort="minutes">Talk time</th>
                        <th data-sort="purchases">Plans sold</th>
                        <th data-sort="revenue" class="is-sorted" aria-sort="descending">Revenue</th>
                        <th data-sort="zero_balance">Zero balance</th>
                        <th data-sort="last_purchase">Last purchase</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="8"><div class="nt-ov-skeleton"></div></td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="row">
        <!-- recent tickets -->
        <div class="col-xl-7">
            <div class="card nt-ov-card">
                <div class="nt-ov-head">
                    <div>
                        <h3>Recent support tickets</h3>
                        <p data-ov="ticket-note">Latest from students and parents</p>
                    </div>
                    <div class="nt-ov-head-links">
                        <a href="student_tickets.php">Students</a>
                        <a href="parent_tickets.php">Parents</a>
                    </div>
                </div>
                <ul class="nt-ov-tickets" data-ov="tickets">
                    <li class="nt-ov-skeleton"></li><li class="nt-ov-skeleton"></li><li class="nt-ov-skeleton"></li>
                </ul>
            </div>
        </div>

        <!-- call windows -->
        <div class="col-xl-5">
            <div class="card nt-ov-card">
                <div class="nt-ov-head">
                    <div>
                        <h3>Call windows</h3>
                        <p data-ov="windows-note">When each department can call right now</p>
                    </div>
                </div>
                <ul class="nt-ov-windows" data-ov="windows">
                    <li class="nt-ov-skeleton"></li><li class="nt-ov-skeleton"></li><li class="nt-ov-skeleton"></li>
                </ul>
            </div>
        </div>
    </div>
</section>
