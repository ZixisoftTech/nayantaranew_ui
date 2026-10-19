<?php
require_once __DIR__ . '/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in');
$path = nt_api('https://nayantarabyspacs.co.in');
require_once __DIR__ . '/auth.php';

nt_guard_page();

$ntRole = nt_role();
$ntPage = nt_current_file();
$ntAccess = nt_access($ntPage);
// admins open the school tools (school_*.php) for one school at a time, picked below
$ntNeedsSchool = nt_is_admin() && strpos($ntPage, 'school_') === 0;
$ntSchoolId = $ntNeedsSchool ? (int) ($_COOKIE['nt_school'] ?? 0) : 0;
?>
<script type="text/javascript">
(function () {
    var token = <?= json_encode($_COOKIE['nt_token'] ?? '') ?>;
    // page scripts read these keys: admin pages use "admintoken", school pages use "franchisetoken"
    try {
        if (<?= json_encode($ntRole === 'school') ?>) {
            localStorage.setItem('franchisetoken', token);
            localStorage.removeItem('admintoken');
        } else {
            localStorage.setItem('admintoken', token);
        }
    } catch (e) { /* storage blocked */ }
    window.NT_TOKEN = token;
    window.NT_PORTAL_ROLE = <?= json_encode($ntRole) ?>;
    window.NT_ACCESS = <?= json_encode($ntAccess) ?>;
    if (window.NT_ACCESS === 'view') document.documentElement.classList.add('nt-readonly');
})();
// globals the page scripts send to the API
var admintoken = localStorage.getItem('admintoken');
var franchisetoken = localStorage.getItem('franchisetoken');

function ntTokenSchool(t) {
    try { return JSON.parse(atob(String(t).split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).userId; } catch (e) { return null; }
}

async function ntPickSchool(id) {
    if (!id) return;
    const res = await fetch('<?= $path ?>/api/school-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + window.NT_TOKEN },
        body: JSON.stringify({ franchise_id: id })
    }).then((r) => r.json()).catch(() => ({ error: true, message: 'Could not reach the server' }));
    if (res.error) {
        if (window.Swal) Swal.fire('error!', res.message, 'error'); else alert(res.message);
        return;
    }
    localStorage.setItem('franchisetoken', res.data.token);
    document.cookie = 'nt_school=' + res.data.id + '; path=/; max-age=' + 30 * 86400 + '; SameSite=Lax';
    location.reload();
}

async function ntLoadSchools(select, current) {
    const res = await fetch('<?= $path ?>/api/get-franchiseid').then((r) => r.json()).catch(() => ({ data: [] }));
    select.innerHTML = '<option value="">Select a school…</option>' + (res.data || []).map((s) =>
        `<option value="${s.Id}"${s.Id == current ? ' selected' : ''}>${String(s.franchiseName).replace(/</g, '&lt;')}</option>`).join('');
}

<?php if ($ntNeedsSchool && $ntSchoolId): ?>
// keep the school token in step with the picked school before the page's own scripts use it
if (ntTokenSchool(localStorage.getItem('franchisetoken')) != <?= $ntSchoolId ?>) {
    document.documentElement.style.visibility = 'hidden';
    ntPickSchool(<?= $ntSchoolId ?>);
}
<?php endif; ?>

async function getName() {
    const res = await fetch('<?= $path ?>/api/me', { headers: { Authorization: 'Bearer ' + window.NT_TOKEN } })
        .then((r) => r.json()).catch(() => null);
    if (res && res.error && /sign in/i.test(res.message)) return Logout();
    if (res && !res.error) document.getElementById('admin_nane').innerText = res.data.name;
}
getName();

function Logout() {
    document.cookie = 'nt_token=; path=/; max-age=0';
    document.cookie = 'nt_school=; path=/; max-age=0';
    ['admintoken', 'franchisetoken', 'nt_token'].forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} });
    window.location.href = '<?= $basePath ?>/';
}

<?php if ($ntAccess === 'view'): ?>
// view-only access: block create / edit / delete / status actions (the buttons are also hidden by .nt-readonly css)
document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('.create-btn, [data-target=".add"], [data-target=".edit"], .delete, .nt-menu-item, ' +
        'a[onclick*="getUpdateValue"], button[onclick*="status"], button[onclick*="Status"], [onclick*="delete"], [onclick*="Delete"]');
    if (!el || el.classList.contains('nt-open-record') || el.matches('[data-target=".view"]') || (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href') !== '#' && !/^javascript/i.test(el.getAttribute('href')))) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (window.Swal) Swal.fire('View only', 'You can view this page but not change anything.', 'info');
}, true);
document.addEventListener('submit', function (e) {
    if (e.target.closest('.modal') || e.target.getAttribute('method')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (window.Swal) Swal.fire('View only', 'You can view this page but not change anything.', 'info');
    }
}, true);
<?php endif; ?>
</script>
<?php require_once __DIR__ . '/layout.php'; nt_render_topbar($ntRole === 'school' ? 'franchise' : 'super_admin', 'admin_nane'); ?>
<?php
if ($ntNeedsSchool) {
    if (!$ntSchoolId) {
        // nothing to show until a school is picked
        nt_render_sidebar();
        ?>
        <div class="page-content">
            <div class="container-fluid">
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="bx bx-buildings" style="font-size:40px"></i>
                        <h5 class="mt-3">Choose a school</h5>
                        <p class="text-muted">School tools work on one school at a time.</p>
                        <select id="nt-school-picker" class="form-control mx-auto" style="max-width:360px" onchange="ntPickSchool(this.value)"></select>
                    </div>
                </div>
            </div>
        </div>
        </div></div>
        <script>ntLoadSchools(document.getElementById('nt-school-picker'), 0);</script>
        </body></html>
        <?php
        exit;
    }
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function () {
        var host = document.querySelector('.page-content .container-fluid') || document.querySelector('.page-content');
        if (!host) return;
        host.insertAdjacentHTML('afterbegin',
            '<div class="nt-school-bar"><i class="bx bx-buildings"></i><span>School</span>' +
            '<select class="form-control form-control-sm" onchange="ntPickSchool(this.value)"></select></div>');
        ntLoadSchools(host.querySelector('.nt-school-bar select'), <?= $ntSchoolId ?>);
    });
    </script>
    <?php
}
