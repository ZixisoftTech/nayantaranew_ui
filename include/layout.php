<?php
/*
 * Shared admin layout: menu definitions + sidebar / topbar renderers.
 * Used by include/navbar.php, franchise_navbar.php, student_navbar.php
 * and the matching sidebar_*.php files.
 */

if (!function_exists('nt_menu')) {

    function nt_menu($role)
    {
        $menus = [
            'super_admin' => [
                'Overview' => [
                    ['dashboard.php', 'Dashboard', 'bx-grid-alt'],
                ],
                'Management' => [
                    ['manage_franchise.php', 'Franchises', 'bx-buildings'],
                    ['manage_department.php', 'Departments', 'bx-sitemap'],
                    ['manage_subscriptions.php', 'Subscriptions', 'bx-package'],
                    ['students.php', 'Students', 'bx-user'],
                    ['parents.php', 'Parents', 'bx-group'],
                ],
                'Plans' => [
                    ['assign_plan.php', 'Assign Plan', 'bx-purchase-tag'],
                    ['assign_plan_department.php', 'Assign by Department', 'bx-git-branch'],
                ],
                'Reports' => [
                    ['transaction_history.php', 'Transactions', 'bx-receipt'],
                    ['call_history.php', 'Call History', 'bx-phone-call'],
                    ['student_summary.php', 'Student Summary', 'bx-bar-chart-alt-2'],
                ],
                'Support' => [
                    ['student_tickets.php', 'Student Tickets', 'bx-support'],
                    ['parent_tickets.php', 'Parent Tickets', 'bx-shield-quarter'],
                    ['parent_login_message.php', 'Login Message', 'bx-bell'],
                ],
            ],
            'franchise' => [
                'Overview' => [
                    ['dashboard.php', 'Dashboard', 'bx-grid-alt'],
                ],
                'Management' => [
                    ['manage_students.php', 'Students', 'bx-user'],
                    ['manage_parents.php', 'Parents', 'bx-group'],
                ],
                'Reports' => [
                    ['transaction_history.php', 'Transactions', 'bx-receipt'],
                    ['call_history.php', 'Call History', 'bx-phone-call'],
                    ['student_skip.php', 'Student Skip Data', 'bx-skip-next'],
                    ['parent_skip.php', 'Parent Skip Data', 'bx-skip-next'],
                ],
            ],
            'student' => [
                'Overview' => [
                    ['dashboard.php', 'Dashboard', 'bx-grid-alt'],
                ],
                'Activity' => [
                    ['transaction_history.php', 'Transactions', 'bx-receipt'],
                    ['call_history.php', 'Call History', 'bx-phone-call'],
                ],
            ],
        ];
        return $menus[$role] ?? [];
    }

    function nt_role_label($role)
    {
        return [
            'super_admin' => 'Super Admin',
            'franchise'   => 'Franchise Portal',
            'student'     => 'Student Portal',
        ][$role] ?? '';
    }

    function nt_current_page()
    {
        return basename(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: ($_SERVER['SCRIPT_NAME'] ?? ''));
    }

    /** Returns [title, section] of the current page for the given role. */
    function nt_page_meta($role)
    {
        $current = nt_current_page();
        if (substr($current, -4) !== '.php') {
            $current .= '.php';
        }
        foreach (nt_menu($role) as $section => $items) {
            foreach ($items as $item) {
                if ($item[0] === $current) {
                    return [$item[1], $section];
                }
            }
        }
        $fallback = ucwords(str_replace(['_', '.php'], [' ', ''], $current));
        return [$fallback, ''];
    }

    function nt_render_sidebar($role)
    {
        global $basePath;
        list($activeTitle) = nt_page_meta($role);
        ?>
<div class="nt-backdrop" onclick="ntToggleSidebar(false)"></div>
<aside class="vertical-menu nt-sidebar">
    <div class="nt-brand">
        <a href="dashboard.php" class="nt-brand-link">
            <img src="<?= $basePath ?>/assets/admin/images/nayan_logo.png" alt="Nayan Tara" class="nt-brand-logo">
        </a>
        <span class="nt-brand-role"><?= nt_role_label($role) ?></span>
    </div>
    <nav class="nt-nav">
        <?php foreach (nt_menu($role) as $section => $items): ?>
        <div class="nt-nav-section"><?= htmlspecialchars($section) ?></div>
        <ul class="nt-nav-list">
            <?php foreach ($items as $item): $active = $item[1] === $activeTitle; ?>
            <li>
                <a href="<?= $item[0] ?>" class="nt-nav-link<?= $active ? ' active' : '' ?>"<?= $active ? ' aria-current="page"' : '' ?>>
                    <i class="bx <?= $item[2] ?>"></i>
                    <span><?= htmlspecialchars($item[1]) ?></span>
                </a>
            </li>
            <?php endforeach; ?>
        </ul>
        <?php endforeach; ?>
    </nav>
    <div class="nt-sidebar-foot">
        <button type="button" class="nt-nav-link nt-logout" onclick="Logout()">
            <i class="bx bx-log-out"></i><span>Sign out</span>
        </button>
    </div>
</aside>
<div class="main-content">
        <?php
    }

    /** $nameId is the element id the role's script fills with the user's name. */
    function nt_render_topbar($role, $nameId)
    {
        list($title, $section) = nt_page_meta($role);
        ?>
<div id="layout-wrapper">
    <header id="page-topbar" class="nt-topbar">
        <div class="nt-topbar-left">
            <button type="button" class="nt-icon-btn nt-menu-btn" onclick="ntToggleSidebar()" aria-label="Toggle menu">
                <i class="bx bx-menu"></i>
            </button>
            <div class="nt-page-heading">
                <div class="nt-crumbs">
                    <span><?= nt_role_label($role) ?></span>
                    <?php if ($section && $section !== 'Overview'): ?>
                    <i class="bx bx-chevron-right"></i><span><?= htmlspecialchars($section) ?></span>
                    <?php endif; ?>
                </div>
                <h1 class="nt-page-title"><?= htmlspecialchars($title) ?></h1>
            </div>
        </div>
        <?php if ($role !== 'student'): ?>
        <div class="nt-search" id="nt-search" role="search">
            <button type="button" class="nt-search-trigger" onclick="ntOpenSearch()" aria-label="Search students, parents and more">
                <i class="bx bx-search"></i>
                <span class="nt-search-placeholder">Search students, parents, roll no, phone…</span>
                <kbd class="nt-search-kbd">⌘K</kbd>
            </button>
        </div>
        <?php endif; ?>
        <div class="nt-topbar-right">
            <span class="nt-date d-none d-xl-inline-flex"><i class="bx bx-calendar"></i><span id="nt-today"></span></span>
            <div class="nt-user" id="nt-user">
                <button type="button" class="nt-user-btn" onclick="ntToggleUserMenu(event)" aria-haspopup="true" aria-expanded="false">
                    <span class="nt-avatar" id="nt-avatar">&middot;</span>
                    <span class="nt-user-meta d-none d-sm-flex">
                        <span class="nt-user-name" id="<?= $nameId ?>">Loading…</span>
                        <span class="nt-user-role"><?= nt_role_label($role) ?></span>
                    </span>
                    <i class="bx bx-chevron-down d-none d-sm-inline"></i>
                </button>
                <div class="nt-user-menu" role="menu">
                    <button type="button" class="nt-user-menu-item text-danger" onclick="Logout()" role="menuitem">
                        <i class="bx bx-log-out"></i> Sign out
                    </button>
                </div>
            </div>
        </div>
    </header>
    <script>
    document.documentElement.setAttribute('data-nt-role', <?= json_encode($role) ?>);
    window.NT_API = <?= json_encode($GLOBALS['path'] ?? '') ?>;
    window.NT_BASE = <?= json_encode($GLOBALS['basePath'] ?? '') ?>;
    function ntOpenSearch() { if (window.NTLookup) window.NTLookup.openSearch(); }
    (function () {
        var nameEl = document.getElementById('<?= $nameId ?>');
        var avatar = document.getElementById('nt-avatar');
        function syncAvatar() {
            var t = (nameEl.textContent || '').trim();
            if (t && t !== 'Loading…') {
                avatar.textContent = t.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
            }
        }
        new MutationObserver(syncAvatar).observe(nameEl, { childList: true, characterData: true, subtree: true });
        var today = document.getElementById('nt-today');
        if (today) {
            today.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        }
    })();
    function ntToggleSidebar(force) {
        var open = typeof force === 'boolean' ? force : !document.documentElement.classList.contains('nt-sidebar-open');
        document.documentElement.classList.toggle('nt-sidebar-open', open);
    }
    function ntToggleUserMenu(e) {
        e.stopPropagation();
        var box = document.getElementById('nt-user');
        var open = box.classList.toggle('open');
        box.querySelector('.nt-user-btn').setAttribute('aria-expanded', open);
    }
    document.addEventListener('click', function () {
        var box = document.getElementById('nt-user');
        if (box) box.classList.remove('open');
    });
    </script>
        <?php
    }
}
