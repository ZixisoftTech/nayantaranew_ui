<?php
/*
 * Single portal: who is signed in and which pages they may open.
 *
 * The login page stores the API token in the "nt_token" cookie. It is an HS256 JWT signed by the
 * Node API (nayantara/models/auth.js); it is verified here so menus and page access are decided on
 * the server. Roles: super_admin (everything), sub_admin (pages from their permissions, each
 * "view" or "manage"), school (their own school's pages).
 */

if (!function_exists('nt_claims')) {

    define('NT_JWT_SECRET', 'helloiamabhisheklodhi');

    function nt_b64url_decode($s)
    {
        return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4));
    }

    /** Verified token claims, or null. */
    function nt_claims()
    {
        static $claims = false;
        if ($claims !== false) {
            return $claims;
        }
        $claims = null;
        $parts = explode('.', $_COOKIE['nt_token'] ?? '');
        if (count($parts) !== 3) {
            return null;
        }
        $header = json_decode(nt_b64url_decode($parts[0]), true);
        if (($header['alg'] ?? '') !== 'HS256') {
            return null;
        }
        $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $parts[0] . '.' . $parts[1], NT_JWT_SECRET, true)), '+/', '-_'), '=');
        if (!hash_equals($expected, $parts[2])) {
            return null;
        }
        $data = json_decode(nt_b64url_decode($parts[1]), true);
        if (!is_array($data) || (isset($data['exp']) && $data['exp'] < time())) {
            return null;
        }
        return $claims = $data;
    }

    /** super_admin | sub_admin | school | null */
    function nt_role()
    {
        $c = nt_claims();
        $map = ['admin' => 'super_admin', 'subadmin' => 'sub_admin', 'franchise' => 'school'];
        return $c ? ($map[$c['role'] ?? ''] ?? null) : null;
    }

    function nt_permissions()
    {
        $c = nt_claims();
        return is_array($c['permissions'] ?? null) ? $c['permissions'] : [];
    }

    function nt_is_admin()
    {
        return in_array(nt_role(), ['super_admin', 'sub_admin'], true);
    }

    /*
     * Every portal page. "for": admin = super admin + sub admins given the page,
     * school = school accounts, super = super admin only.
     * The same file can be listed for admins and schools (the school tools).
     */
    function nt_pages()
    {
        return [
            'Overview' => [
                ['dashboard.php', 'Dashboard', 'bx-grid-alt', 'admin'],
                ['school_dashboard.php', 'Dashboard', 'bx-grid-alt', 'school'],
            ],
            'Management' => [
                ['manage_franchise.php', 'Schools', 'bx-buildings', 'admin'],
                ['manage_department.php', 'Houses', 'bx-sitemap', 'admin'],
                ['manage_subscriptions.php', 'Subscriptions', 'bx-package', 'admin'],
                ['students.php', 'Students', 'bx-user', 'admin'],
                ['parents.php', 'Parents', 'bx-group', 'admin'],
                ['school_students.php', 'Students', 'bx-user', 'school'],
                ['school_parents.php', 'Parents', 'bx-group', 'school'],
            ],
            'Plans' => [
                ['assign_plan.php', 'Assign Plan', 'bx-purchase-tag', 'admin'],
                ['assign_plan_department.php', 'Assign by House', 'bx-git-branch', 'admin'],
            ],
            'Reports' => [
                ['transaction_history.php', 'Transactions', 'bx-receipt', 'admin'],
                ['call_history.php', 'Call History', 'bx-phone-call', 'admin'],
                ['school_transactions.php', 'Transactions', 'bx-receipt', 'school'],
                ['school_call_history.php', 'Call History', 'bx-phone-call', 'school'],
                ['school_student_skip.php', 'Student Skip Data', 'bx-skip-next', 'school'],
                ['school_parent_skip.php', 'Parent Skip Data', 'bx-skip-next', 'school'],
            ],
            'Support' => [
                ['student_tickets.php', 'Student Tickets', 'bx-support', 'admin'],
                ['parent_tickets.php', 'Parent Tickets', 'bx-shield-quarter', 'admin'],
                ['parent_login_message.php', 'Login Message', 'bx-bell', 'admin'],
            ],
            'School Tools' => [
                ['school_students.php', 'School Students & Import', 'bx-upload', 'admin'],
                ['school_parents.php', 'School Parents', 'bx-group', 'admin'],
                ['school_student_skip.php', 'Student Skip Data', 'bx-skip-next', 'admin'],
                ['school_parent_skip.php', 'Parent Skip Data', 'bx-skip-next', 'admin'],
            ],
            'Administration' => [
                ['sub_admins.php', 'Sub Admins', 'bx-shield-alt-2', 'super'],
            ],
        ];
    }

    /** Pages a sub admin can be given, as [file => label]. */
    function nt_assignable_pages()
    {
        $out = [];
        foreach (nt_pages() as $section => $items) {
            foreach ($items as $item) {
                if ($item[3] === 'admin' && !isset($out[$item[0]])) {
                    $out[$item[0]] = ['label' => $item[1], 'section' => $section];
                }
            }
        }
        return $out;
    }

    function nt_item_visible($item, $role, $perms)
    {
        if ($role === 'super_admin') {
            return $item[3] !== 'school';
        }
        if ($role === 'sub_admin') {
            return $item[3] === 'admin' && isset($perms[$item[0]]);
        }
        return $role === 'school' && $item[3] === 'school';
    }

    /** Menu for the signed-in user: [section => items]. */
    function nt_menu_for()
    {
        $role = nt_role();
        $perms = nt_permissions();
        $menu = [];
        foreach (nt_pages() as $section => $items) {
            $visible = array_values(array_filter($items, function ($item) use ($role, $perms) {
                return nt_item_visible($item, $role, $perms);
            }));
            if ($visible) {
                $menu[$section] = $visible;
            }
        }
        return $menu;
    }

    /** "manage", "view" or null for the given page. */
    function nt_access($page)
    {
        $role = nt_role();
        if (!$role) {
            return null;
        }
        if ($role === 'sub_admin') {
            $level = nt_permissions()[$page] ?? null;
            return in_array($level, ['view', 'manage'], true) ? $level : null;
        }
        // super admin also opens the school-only report pages after picking a school
        foreach (nt_pages() as $items) {
            foreach ($items as $item) {
                if ($item[0] === $page && ($role === 'super_admin' || nt_item_visible($item, $role, []))) {
                    return 'manage';
                }
            }
        }
        return null;
    }

    function nt_home()
    {
        foreach (nt_menu_for() as $items) {
            return $items[0][0];
        }
        return null;
    }

    function nt_current_file()
    {
        $file = basename(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: ($_SERVER['SCRIPT_NAME'] ?? ''));
        return substr($file, -4) === '.php' ? $file : $file . '.php';
    }

    /** Signs out (clears the cookie and stored tokens) and goes to the login page. Output-safe after HTML started. */
    function nt_redirect_js($url, $signOut = false)
    {
        $clear = $signOut
            ? "document.cookie='nt_token=; path=/; max-age=0'; document.cookie='nt_school=; path=/; max-age=0';" .
              "['admintoken','franchisetoken','nt_token'].forEach(function(k){try{localStorage.removeItem(k)}catch(e){}});"
            : '';
        echo '<script>' . $clear . 'location.replace(' . json_encode($url) . ');</script></head><body></body></html>';
        exit;
    }

    /** Stops the page unless the signed-in user may open it. */
    function nt_guard_page()
    {
        global $basePath;
        if (!nt_role()) {
            nt_redirect_js($basePath . '/', true);
        }
        if (!nt_access(nt_current_file())) {
            $home = nt_home();
            if (!$home) {
                nt_redirect_js($basePath . '/', true);
            }
            nt_redirect_js($basePath . '/super_admin/' . $home);
        }
    }
}
