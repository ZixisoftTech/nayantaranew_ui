<?php include("../include/head.php") ?>
<?php include("../include/navbar.php") ?>
<?php include("../include/sidebar_superadmin.php") ?>
<?php
require_once __DIR__ . '/../include/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in');
$path = nt_api('https://nayantarabyspacs.co.in');
$assignable = nt_assignable_pages();
?>

<script>
const SUB_ADMIN_PAGES = <?= json_encode($assignable) ?>;
let subAdmins = [];

function escapeHtml(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function api(method, url, body) {
    const res = await fetch('<?= $path ?>/api' + url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + window.NT_TOKEN },
        body: body ? JSON.stringify(body) : undefined
    }).then((r) => r.json()).catch(() => ({ error: true, message: 'Could not reach the server' }));
    return res;
}

function accessSummary(perms) {
    const pages = Object.keys(perms || {});
    if (!pages.length) return '<span class="nt-empty">No pages</span>';
    const manage = pages.filter((p) => perms[p] === 'manage').length;
    return `${pages.length} page${pages.length === 1 ? '' : 's'}` + (manage ? ` · ${manage} can manage` : ' · view only');
}

async function loadSubAdmins() {
    const res = await api('GET', '/sub-admins');
    const body = document.getElementById('subAdminRows');
    if (res.error) {
        body.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${escapeHtml(res.message)}</td></tr>`;
        return;
    }
    subAdmins = res.data.filter((s) => s.type === 'sub_admin');
    body.innerHTML = res.data.length ? res.data.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${s.type === 'school' ? 'School' : 'Sub Admin'}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${s.type === 'school' ? 'Old franchise pages · own school only' : accessSummary(s.permissions)}</td>
            <td>${s.status == 1 ? '<span class="nt-badge nt-badge-success">Active</span>' : '<span class="nt-badge nt-badge-muted">Disabled</span>'}</td>
            <td class="text-nowrap">${s.type === 'school'
                // a school's login (email, password, active) is edited with the school itself
                ? `<a href="manage_franchise.php?q=${encodeURIComponent(s.email)}" class="btn-sm" title="Edit in Schools"><i class="bx bx-buildings"></i> Edit in Schools</a>`
                : `<a href="javascript:void(0);" class="btn-sm" onclick="openSubAdmin(${s.id})" title="Edit"><i class="bx bx-edit-alt"></i></a>
                   <a href="javascript:void(0);" class="btn-sm" onclick="deleteSubAdmin(${s.id})" title="Delete"><i class="bx bx-trash-alt"></i></a>`}
            </td>
        </tr>`).join('') : '<tr><td colspan="7" class="text-center text-muted">No logins yet</td></tr>';
}

function renderPermissionRows(perms) {
    let section = '';
    document.getElementById('permissionRows').innerHTML = Object.entries(SUB_ADMIN_PAGES).map(([page, meta]) => {
        const head = meta.section !== section ? `<tr class="nt-perm-section"><td colspan="4">${escapeHtml(section = meta.section)}</td></tr>` : '';
        const level = perms[page] || '';
        const radio = (value) => `<td class="text-center"><input type="radio" name="perm_${page}" value="${value}" ${level === value ? 'checked' : ''}></td>`;
        return head + `<tr><td>${escapeHtml(meta.label)}</td>${radio('')}${radio('view')}${radio('manage')}</tr>`;
    }).join('');
}

function setAllPermissions(value) {
    document.querySelectorAll('#permissionRows input[type=radio]').forEach((r) => { r.checked = r.value === value; });
}

function readPermissions() {
    const perms = {};
    Object.keys(SUB_ADMIN_PAGES).forEach((page) => {
        const picked = document.querySelector(`input[name="perm_${page}"]:checked`);
        if (picked && picked.value) perms[page] = picked.value;
    });
    return perms;
}

function openSubAdmin(id) {
    const s = subAdmins.find((x) => x.id === id) || { id: '', name: '', email: '', status: 1, permissions: {} };
    document.getElementById('subAdminTitle').textContent = s.id ? 'Edit sub admin' : 'Add sub admin';
    document.getElementById('subAdminId').value = s.id;
    document.getElementById('subAdminName').value = s.name;
    document.getElementById('subAdminEmail').value = s.email;
    document.getElementById('subAdminPassword').value = '';
    document.getElementById('subAdminPassword').placeholder = s.id ? 'Leave blank to keep the current password' : 'At least 6 characters';
    document.getElementById('subAdminStatus').value = s.status == 0 ? '0' : '1';
    renderPermissionRows(s.permissions || {});
    $('#subAdminModal').modal('show');
}

async function saveSubAdmin(e) {
    e.preventDefault();
    const id = document.getElementById('subAdminId').value;
    const item = {
        name: document.getElementById('subAdminName').value.trim(),
        email: document.getElementById('subAdminEmail').value.trim(),
        password: document.getElementById('subAdminPassword').value,
        status: document.getElementById('subAdminStatus').value,
        permissions: readPermissions(),
    };
    const res = await api(id ? 'PUT' : 'POST', '/sub-admins' + (id ? '/' + id : ''), item);
    if (res.error) {
        Swal.fire('error!', res.message, 'error');
        return;
    }
    $('#subAdminModal').modal('hide');
    Swal.fire('success!', res.message + (id ? '. Changes apply the next time they sign in.' : ''), 'success');
    loadSubAdmins();
}

function deleteSubAdmin(id) {
    Swal.fire({
        title: 'Delete this sub admin?',
        text: "They won't be able to sign in any more.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete',
    }).then(async (result) => {
        if (!result.isConfirmed && !result.value) return;
        const res = await api('DELETE', '/sub-admins/' + id);
        Swal.fire(res.error ? 'error!' : 'Deleted', res.message, res.error ? 'error' : 'success');
        loadSubAdmins();
    });
}

$(document).ready(loadSubAdmins);
</script>

<body class="bg2" data-sidebar="dark">
    <div class="page-content">
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="header">
                            <div class="row mt-3 mr-2 ml-2">
                                <div class="col-md-6 text-left">
                                    <h5>Sub Admins</h5>
                                    <small class="text-muted">Sub admins see the pages you give them. Each school also signs in with the email and password set on the school, and sees only its own school's pages.</small>
                                </div>
                                <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" onclick="openSubAdmin(0)" class="btn btn-primary create-btn">Create</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered nowrap" style="width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Email</th>
                                            <th>Access</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="subAdminRows">
                                        <tr><td colspan="7" class="text-center text-muted">Loading…</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include("../include/foot.php") ?>
    <?php include("../include/footer.php") ?>

    <div class="modal fade" id="subAdminModal" tabindex="-1" role="dialog" aria-labelledby="subAdminTitle" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="subAdminTitle">Add sub admin</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="subAdminForm" onsubmit="saveSubAdmin(event)">
                    <div class="modal-body">
                        <input type="hidden" id="subAdminId">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label>Name<span class="req" style="color:red">*</span></label>
                                <input type="text" id="subAdminName" class="form-control" required>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Email<span class="req" style="color:red">*</span></label>
                                <input type="email" id="subAdminEmail" class="form-control" required>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Password</label>
                                <input type="password" id="subAdminPassword" class="form-control" autocomplete="new-password">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Status</label>
                                <select id="subAdminStatus" class="form-control">
                                    <option value="1">Active</option>
                                    <option value="0">Disabled</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="mb-0">Page access</h6>
                                    <div>
                                        <button type="button" class="btn btn-sm btn-light" onclick="setAllPermissions('view')">All view</button>
                                        <button type="button" class="btn btn-sm btn-light" onclick="setAllPermissions('manage')">All manage</button>
                                        <button type="button" class="btn btn-sm btn-light" onclick="setAllPermissions('')">Clear</button>
                                    </div>
                                </div>
                                <small class="text-muted d-block mb-2">View: can open the page and export. Manage: can also add, edit and delete.</small>
                                <table class="table table-sm table-bordered nt-perm-table">
                                    <thead>
                                        <tr>
                                            <th>Page</th>
                                            <th class="text-center">No access</th>
                                            <th class="text-center">View</th>
                                            <th class="text-center">Manage</th>
                                        </tr>
                                    </thead>
                                    <tbody id="permissionRows"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary create-btn">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
