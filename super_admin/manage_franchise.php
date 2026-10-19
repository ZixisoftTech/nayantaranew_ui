<?php include("../include/head.php") ?>
<?php include("../include/navbar.php") ?>
<?php include("../include/sidebar_superadmin.php") ?>
<?php 
// $basePath = 'http://localhost/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
require_once __DIR__ . '/../include/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in'); 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000";
$path = nt_api('https://nayantarabyspacs.co.in');

// School settings fields shared by the add ($p = '') and edit ($p = 'edit') modals.
function franchiseSettingsFields($p)
{
    ?>
    <div class="col-12">
        <hr>
        <h6 class="mb-3">School Settings</h6>
    </div>
    <div class="form-group col-md-12">
        <label>School Icon / Logo (JPG or PNG)</label>
        <div class="d-flex align-items-center">
            <img id="<?= $p ?>logoPreview" src="" alt="" style="width:64px;height:64px;object-fit:contain;border:1px solid #ddd;border-radius:6px;margin-right:12px;display:none;">
            <input type="file" id="<?= $p ?>logo" accept="image/png,image/jpeg" class="form-control-file" onchange="previewLogo(this, '<?= $p ?>')">
        </div>
        <input type="hidden" id="<?= $p ?>logoPath">
        <small class="text-muted">Recommended: 512×512 px square PNG (1:1 ratio, transparent background, max 512 KB)</small>
    </div>
    <div class="form-group col-md-6">
        <div class="custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="<?= $p ?>allow_parental_recharge" checked onchange="updateSettingsHints('<?= $p ?>')">
            <label class="custom-control-label" for="<?= $p ?>allow_parental_recharge">Allow Parental Recharge</label>
        </div>
        <small class="text-muted" id="<?= $p ?>rechargeHint"></small>
    </div>
    <div class="form-group col-md-6">
        <div class="custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="<?= $p ?>allow_audio_calls" checked onchange="updateSettingsHints('<?= $p ?>')">
            <label class="custom-control-label" for="<?= $p ?>allow_audio_calls">Allow Audio / Voice Calls</label>
        </div>
        <small class="text-muted" id="<?= $p ?>audioHint"></small>
    </div>
    <div class="form-group col-md-6">
        <label>Video Rate (Coins/min)</label>
        <input type="number" step="0.01" min="0" name="<?= $p ?>video_rate" id="<?= $p ?>video_rate" value="1" class="form-control">
    </div>
    <div class="form-group col-md-6">
        <label>Audio Rate (Coins/min)</label>
        <input type="number" step="0.01" min="0" name="<?= $p ?>audio_rate" id="<?= $p ?>audio_rate" value="1" class="form-control">
    </div>
    <div class="form-group col-md-6">
        <label>Parent Account Activation Fee (Coins / Tokens)</label>
        <input type="number" step="0.01" min="0" name="<?= $p ?>activation_fee" id="<?= $p ?>activation_fee" value="0" class="form-control">
        <small class="text-muted">One-time token fee deducted from student balance when a parent activates their account.</small>
    </div>
    <div class="form-group col-md-6">
        <label>Max Calls per Day</label>
        <input type="number" step="1" min="0" name="<?= $p ?>max_calls_per_day" id="<?= $p ?>max_calls_per_day" value="0" class="form-control" oninput="updateSettingsHints('<?= $p ?>')">
        <small class="text-muted">e.g. 5 calls/day, 0 for unlimited</small>
    </div>
    <div class="form-group col-md-6">
        <label>Daily Duration Allowance (Min)</label>
        <input type="number" step="1" min="0" name="<?= $p ?>daily_duration_min" id="<?= $p ?>daily_duration_min" value="0" class="form-control" oninput="updateSettingsHints('<?= $p ?>')">
        <small class="text-muted">e.g. 10 mins total pool, 0 for unlimited</small>
    </div>
    <div class="form-group col-md-6">
        <label>Min Call Duration to Count Towards Limit (Seconds)</label>
        <input type="number" step="1" min="0" name="<?= $p ?>min_call_duration_sec" id="<?= $p ?>min_call_duration_sec" value="30" class="form-control">
        <small class="text-muted">Calls shorter than this threshold (e.g. quick drops or glitches) will not count against the daily limit. (Default: 30 seconds)</small>
    </div>
    <div class="col-12">
        <div class="alert alert-info mb-0" id="<?= $p ?>limitSummary"></div>
    </div>
    <?php
}

?>

<script>
$(document).ready(function() {
    var dataTable = $("#datatable_franchise").DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        processing: true,
        serverSide: true,
        serverMethod: "get",
        ajax: {
            url: "<?= $path ?>/api/get-franchise",
        },
        aaSorting: [],
        columns: [{
                data: "index"
            },
            {
                data: "logo",
                orderable: false,
                render: function(logo) {
                    return logo ? `<img src="<?= $path ?>/${logo}" alt="" style="width:36px;height:36px;object-fit:contain;">` : '';
                }
            },
            {
                data: "franchiseName"
            },
            {
                data: "franchiserName"
            },
            {
                data: "email"
            },
            {
                data: "password"
            },
            {
                data: "address"
            },
            {
                data: "state_name"
            },
            {
                data: "cities_name"
            },
            {
                data: "pincode"
            },
            {
                data: "plan_permision"
            },
            {
                data: "remark"
            },
            {
                data: "status"
            },
            {
                data: "action"
            },
        ],
    });
});

function previewLogo(input, p) {
    const img = document.getElementById(p + 'logoPreview');
    const file = input.files[0];
    if (!file) return;
    img.src = URL.createObjectURL(file);
    img.style.display = '';
}

function updateSettingsHints(p) {
    const recharge = document.getElementById(p + 'allow_parental_recharge').checked;
    const audio = document.getElementById(p + 'allow_audio_calls').checked;
    document.getElementById(p + 'rechargeHint').textContent = recharge ?
        'Enabled: Parents can buy Spacs Coins / call tokens for students in this school.' :
        'Disabled: Parents cannot buy Spacs Coins / call tokens for students in this school.';
    document.getElementById(p + 'audioHint').textContent = audio ?
        'Enabled: Students can make voice/audio calls to parents.' :
        'Disabled: Students can only make video calls to parents.';
    const calls = Number(document.getElementById(p + 'max_calls_per_day').value) || 0;
    const mins = Number(document.getElementById(p + 'daily_duration_min').value) || 0;
    document.getElementById(p + 'limitSummary').textContent =
        `ℹ️ Students can make ${calls ? 'up to ' + calls : 'unlimited'} calls totaling ${mins ? 'up to ' + mins + ' mins' : 'unlimited time'} daily. Individual call length is controlled by each House.`;
}

// Uploads the chosen logo (if any) and resolves with the stored path, or the current one.
async function uploadLogo(p) {
    const file = document.getElementById(p + 'logo').files[0];
    const current = document.getElementById(p + 'logoPath').value;
    if (!file) return current;
    const form = new FormData();
    form.append('logo', file);
    let res = await fetch('<?= $path ?>/api/franchise-logo', {
        method: 'POST',
        body: form
    });
    res = await res.json();
    if (res.error == true) throw new Error(res.message);
    return res.data.logo;
}

function settingsPayload(p, logo) {
    return {
        logo: logo,
        allow_parental_recharge: document.getElementById(p + 'allow_parental_recharge').checked ? 1 : 0,
        allow_audio_calls: document.getElementById(p + 'allow_audio_calls').checked ? 1 : 0,
        video_rate: document.getElementById(p + 'video_rate').value.trim(),
        audio_rate: document.getElementById(p + 'audio_rate').value.trim(),
        activation_fee: document.getElementById(p + 'activation_fee').value.trim(),
        max_calls_per_day: document.getElementById(p + 'max_calls_per_day').value.trim(),
        daily_duration_min: document.getElementById(p + 'daily_duration_min').value.trim(),
        min_call_duration_sec: document.getElementById(p + 'min_call_duration_sec').value.trim(),
    }
}

$(document).ready(function() {
    updateSettingsHints('');
    updateSettingsHints('edit');
});

$(document).on('submit', '#addfranchise', async function(e) {
    e.preventDefault();
    if (!$(this).valid()) return;
    let logo;
    try {
        logo = await uploadLogo('');
    } catch (err) {
        Swal.fire('error!', err.message, 'error');
        return;
    }
    const item = {
        franchiseName: document.getElementById("franchiseName").value.trim(),
        franchiserName: document.getElementById("franchiserName").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById('password').value.trim(),
        address: document.getElementById("address").value.trim(),
        state: document.getElementById("state").value.trim(),
        city: document.getElementById("city").value.trim(),
        pincode: document.getElementById("pincode").value.trim(),
        by_plan_permision: document.getElementById('by_plan_permision').value.trim(),
        remark: document.getElementById("remark").value.trim(),
        ...settingsPayload('', logo),
    }
    $.ajax({
        url: $(this).attr("action"),
        type: $(this).attr("method"),
        dataType: "JSON",
        data: JSON.stringify(item),
        contentType: "application/json",
        success: function(response, status) {
            if (response.error == true) {
                Swal.fire(
                    'error!',
                    `${response.message}`,
                    'error'
                );
            } else {
                Swal.fire(
                    'success!',
                    `${response.message}`,
                    'success',
                );
                setTimeout(() => {
                    document.location.reload();
                }, 1000);
            }
        },
        error: function(xhr, desc, err) {}
    });
});

async function getUpdateValue(Id) {
    let get = await fetch('<?= $path ?>/api/get-franchise/' + Id);
    get = await get.json();
    updateStateName(get.data[0].state);
    updateCityName(get.data[0].state, get.data[0].city);
    document.getElementById("editId").value = Id;
    document.getElementById("editfranchiseName").value = get.data[0].franchiseName;
    document.getElementById("editfranchiserName").value = get.data[0].franchiserName;
    document.getElementById("editemail").value = get.data[0].email;
    document.getElementById("editpassword").value = get.data[0].password;
    document.getElementById("editaddress").value = get.data[0].address;
    document.getElementById("editpincode").value = get.data[0].pincode;
    document.getElementById("editby_plan_permision").value = get.data[0].by_plan_permision;
    document.getElementById("editremark").value = get.data[0].remark;

    const row = get.data[0];
    const preview = document.getElementById("editlogoPreview");
    document.getElementById("editlogo").value = "";
    document.getElementById("editlogoPath").value = row.logo || "";
    preview.src = row.logo ? '<?= $path ?>/' + row.logo : "";
    preview.style.display = row.logo ? "" : "none";
    document.getElementById("editallow_parental_recharge").checked = row.allow_parental_recharge != 0;
    document.getElementById("editallow_audio_calls").checked = row.allow_audio_calls != 0;
    ['video_rate', 'audio_rate', 'activation_fee', 'max_calls_per_day', 'daily_duration_min', 'min_call_duration_sec']
    .forEach((field) => {
        if (row[field] != null) document.getElementById("edit" + field).value = Number(row[field]);
    });
    updateSettingsHints('edit');
}

$(document).on('submit', '#editfranchise', async function(e) {
    e.preventDefault();
    if (!$(this).valid()) return;
    let logo;
    try {
        logo = await uploadLogo('edit');
    } catch (err) {
        Swal.fire('error!', err.message, 'error');
        return;
    }
    const item = {
        id: document.getElementById("editId").value.trim(),
        franchiseName: document.getElementById("editfranchiseName").value.trim(),
        franchiserName: document.getElementById("editfranchiserName").value.trim(),
        email: document.getElementById("editemail").value.trim(),
        password: document.getElementById('editpassword').value.trim(),
        address: document.getElementById("editaddress").value.trim(),
        state: document.getElementById("editstate").value.trim(),
        city: document.getElementById("editcity").value.trim(),
        pincode: document.getElementById("editpincode").value.trim(),
        by_plan_permision: document.getElementById('editby_plan_permision').value.trim(),
        remark: document.getElementById("editremark").value.trim(),
        ...settingsPayload('edit', logo),
    }
    $.ajax({
        url: $(this).attr("action"),
        type: $(this).attr("method"),
        dataType: "JSON",
        data: JSON.stringify(item),
        contentType: "application/json",
        success: function(response, status) {
            if (response.error == true) {
                Swal.fire(
                    'error!',
                    `${response.message}`,
                    'error'
                );
            } else {
                Swal.fire(
                    'success!',
                    `${response.message}`,
                    'success',
                );
                setTimeout(() => {
                    document.location.reload();
                }, 1000);
            }
        },
        error: function(xhr, desc, err) {}
    });
});

async function statusChange(Id) {
    const data = document.getElementById('active');
    const item = {
        status: data.value.trim(),
    }
    const put = await fetch('<?= $path ?>/api/status-franchise/' + Id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then((item) => {
            $("#datatable_franchise").DataTable().ajax.reload();
        })
        .catch(error => console.error('Unable to delete item.', error));
}

async function statuschange(Id) {
    const data = document.getElementById('inactive');
    const item = {
        status: data.value.trim(),
    }
    const put = await fetch('<?= $path ?>/api/status-franchise/' + Id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then((item) => {
            $("#datatable_franchise").DataTable().ajax.reload();
        })
        .catch(error => console.error('Unable to delete item.', error));
}

async function deleteFranchise(Id) {
    let del = await fetch('<?= $path ?>/api/delete-franchise/' + Id, {
        method: 'DELETE'
    })
    var data = await del.json();
    if (data.error == true) {
        Swal.fire(
            'error!',
            `${data.message}`,
            'error'
        );
    } else {
        Swal.fire(
            'success!',
            `${data.message}`,
            'success',
        );
        setTimeout(() => {
            document.location.reload();
        }, 1000);
    }
}

async function getStateName() {
    let getState = await fetch('<?= $path ?>/api/get-state');
    getState = await getState.json();
    var state = document.getElementById("state")
    state.innerHTML = "<option value='' selected disabled>---select---</option>"
    state.innerHTML += getState.data.map((data, index) =>
        `<option value="${data.id}">${data.name}</option>`
    )
}


async function updateStateName(stateid = 0) {
    let getState = await fetch('<?= $path ?>/api/get-state');
    getState = await getState.json();
    var state = document.getElementById("editstate")
    state.innerHTML = "<option value='' selected disabled>---select---</option>"
    getState.data.forEach((data, index) => {
        var selected = "";
        if (stateid != 0) {
            if (data.id == stateid) {
                selected = "selected='selected'";
            }
        }
        state.innerHTML += `<option ${selected} value="${data.id}">${data.name}</option>`
    })
}

async function getCityName(t) {
    var id = t.value;
    let getState = await fetch('<?= $path ?>/api/get-cityByStateId/' + id);
    getState = await getState.json();
    var state = document.getElementById("city")
    state.innerHTML = "<option value='' selected disabled>---select---</option>"
    document.getElementById("pincode").value = "";
    state.innerHTML += getState.map((data, index) =>
        `<option value="${data.id}">${data.name}</option>`
    )
}

async function updateCityName(t, cityid) {
    var id = t
    let getState = await fetch('<?= $path ?>/api/get-cityByStateId/' + id);
    getState = await getState.json();
    var city = document.getElementById("editcity")
    city.innerHTML = "<option value='' selected disabled>---select---</option>"
    getState.forEach((data, index) => {
        var selected = "";
        if (cityid != 0) {
            if (data.id == cityid) {
                selected = "selected='selected'";
            }
        }
        city.innerHTML += `<option ${selected} value="${data.id}">${data.name}</option>`
    })
}


async function updateCity(t) {
    var id = t.value;
    let getState = await fetch('<?= $path ?>/api/get-cityByStateId/' + id);
    getState = await getState.json();
    var city = document.getElementById("editcity")
    city.innerHTML = "<option value='' selected disabled>---select---</option>"
    document.getElementById("editpincode").value = "";
    city.innerHTML += getState.map((data, index) =>
        `<option value="${data.id}">${data.name}</option>`
    )
}
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
                                    <h5>Manage Franchise</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".add"
                                        onclick="getStateName()" class="btn btn-primary create-btn">Create</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table id="datatable_franchise" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Logo</th>
                                            <th>School Name</th>
                                            <th>Franchiser Name</th>
                                            <th>Email</th>
                                            <th>Password</th>
                                            <th>Address</th>
                                            <th>State</th>
                                            <th>City</th>
                                            <th>Pin Code</th>
                                            <th>By Plan Permission</th>
                                            <th>Remark</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getFranchise">
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

    <div class="modal fade add" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Add franchise</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form method="POST" action="<?= $path ?>/api/add-franchise" id="addfranchise">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label>Franchise Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="franchiseName" id="franchiseName" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Franchiser Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="franchiserName" id="franchiserName" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Email<span class="req" style="color:red">*</span></label>
                                <input type="email" name="email" id="email" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="password" id="password" class="form-control">
                                <span class="toggle-password text-right" onclick="togglePasswordVisibilitys()"><i
                                        class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function togglePasswordVisibilitys() {
                                var passwordInput = document.getElementById("password");
                                var togglePassword = document.querySelector(".toggle-password");

                                if (passwordInput.type === "password") {
                                    passwordInput.type = "text";
                                    togglePassword.innerHTML =
                                        '<i class="fa fa-eye-slash" style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i>';
                                } else {
                                    passwordInput.type = "password";
                                    togglePassword.innerHTML =
                                        '<i class="fa fa-eye" style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i>';
                                }
                            }
                            </script>
                            <div class="form-group col-md-6">
                                <label>Address<span class="req" style="color:red">*</span></label>
                                <input type="text" name="address" id="address" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>State<span class="req" style="color:red">*</span></label>
                                <select name="state" id="state" class="form-control" onchange="getCityName(this)">
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>City<span class="req" style="color:red">*</span></label>
                                <select name="city" id="city" class="form-control">
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Pincode<span class="req" style="color:red">*</span></label>
                                <input type="number" min="1" name="pincode" id="pincode" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>By Plan Permission<span class="req" style="color:red">*</span></label>
                                <select name="by_plan_permision" id="by_plan_permision" class="form-control">
                                    <option value='' selected disabled>---Select---</option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Remark(optional)</label>
                                <input type="text" name="remark" id="remark" class="form-control">
                            </div>
                            <?php franchiseSettingsFields(''); ?>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" name="submit" id="submit" class="btn btn-primary create-btn"
                            value="add">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade edit" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Edit franchise</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form method="POST" action="<?= $path ?>/api/edit-franchise" id="editfranchise">
                    <div class="modal-body">
                        <div class="row">
                            <input type="hidden" name="Id" id="editId">
                            <div class="form-group col-md-6">
                                <label>Franchise Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="editfranchiseName" id="editfranchiseName" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Franchiser Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="editfranchiserName" id="editfranchiserName"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Email<span class="req" style="color:red">*</span></label>
                                <input type="email" name="editemail" id="editemail" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="editpassword" id="editpassword" class="form-control">
                                <span class="toggle-editpassword text-right" onclick="togglePasswordVisibility()"><i
                                        class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function togglePasswordVisibility() {
                                var passwordInput = document.getElementById("editpassword");
                                var togglePassword = document.querySelector(".toggle-editpassword");

                                if (passwordInput.type === "password") {
                                    passwordInput.type = "text";
                                    togglePassword.innerHTML =
                                        '<i class="fa fa-eye-slash" style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i>';
                                } else {
                                    passwordInput.type = "password";
                                    togglePassword.innerHTML =
                                        '<i class="fa fa-eye" style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i>';
                                }
                            }
                            </script>
                            <div class="form-group col-md-6">
                                <label>Address<span class="req" style="color:red">*</span></label>
                                <input type="text" name="editaddress" id="editaddress" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>State<span class="req" style="color:red">*</span></label>
                                <select name="editstate" id="editstate" class="form-control"
                                    onchange="updateCity(this)"></select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>City<span class="req" style="color:red">*</span></label>
                                <select name="editcity" id="editcity" class="form-control"></select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Pincode<span class="req" style="color:red">*</span></label>
                                <input type="number" name="editpincode" min="1" id="editpincode" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>By Plan Permission<span class="req" style="color:red">*</span></label>
                                <select name="editby_plan_permision" id="editby_plan_permision" class="form-control">
                                    <option value='' selected disabled>---Select---</option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Remark(optional)</label>
                                <input type="text" name="editremark" id="editremark" class="form-control">
                            </div>
                            <?php franchiseSettingsFields('edit'); ?>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" name="submit" class="btn btn-primary create-btn"
                            value="add">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script type="text/javascript">
    jQuery(document).ready(function() {
        jQuery("#addfranchise").validate({
            rules: {
                franchiseName: 'required',
                franchiserName: 'required',
                email: {
                    required: true,
                    email: true,
                },
                password: {
                    required: true,
                    minlength: 6,
                    maxlength: 12,
                },
                address: 'required',
                state: 'required',
                city: 'required',
                pincode: {
                    required: true,
                    minlength: 6,
                    maxlength: 6,
                },
                by_plan_permision: 'required',
            },
            messages: {
                franchiseName: {
                    required: "Please enter franchise name",
                },
                franchiserName: {
                    required: "Please enter franchiser name",
                },
                email: {
                    required: "Please enter email address",
                    email: "Please enter a valid email address",
                },
                password: {
                    required: "Please enter password",
                    minlength: "Please field accept min 6 digits",
                    maxlength: "Please field accept max 12 digits",
                },
                address: {
                    required: "Please enter address",
                },
                state: {
                    required: "Please enter state",
                },
                city: {
                    required: "Please enter city",
                },
                pincode: {
                    required: "Please enter pincode",
                    minlength: "Please field accept min 6 digits",
                    maxlength: "Please field accept max 6 digits",
                },
                by_plan_permision: {
                    required: "Please select any option",
                }
            },
        });
    });

    jQuery(document).ready(function() {
        jQuery("#editfranchise").validate({
            rules: {
                editfranchiseName: 'required',
                editfranchiserName: 'required',
                editemail: {
                    required: true,
                    email: true,
                },
                editpassword: {
                    required: true,
                    minlength: 6,
                    maxlength: 12,
                },
                editaddress: 'required',
                editstate: 'required',
                editcity: 'required',
                editpincode: {
                    required: true,
                    minlength: 6,
                    maxlength: 6,
                },
                editby_plan_permision: 'required',
            },
            messages: {
                editfranchiseName: {
                    required: "Please enter franchise name",
                },
                editfranchiserName: {
                    required: "Please enter franchiser name",
                },
                editemail: {
                    required: "Please enter email address",
                    email: "Please enter a valid email address",
                },
                eidtpassword: {
                    required: "Please enter password",
                    minlength: "Please field accept min 6 digits",
                    maxlength: "Please field accept max 12 digits",
                },
                editaddress: {
                    required: "Please enter address",
                },
                editstate: {
                    required: "Please select state",
                },
                editcity: {
                    required: "Please enter city",
                },
                editpincode: {
                    required: "Please enter pincode",
                    minlength: "Please field accept min 6 digits",
                    maxlength: "Please field accept max 6 digits",
                },
                editby_plan_permision: {
                    required: "Please select any option",
                },
            },
        });
    });

    $(document).on('click', '.delete', function() {
        var id = $(this).data('id');
        console.log(id);
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: "No, cancel please!",
            closeOnConfirm: false,
            closeOnCancel: false
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel || result.dismiss === Swal.DismissReason
                .backdrop) {
                Swal.fire("Cancelled", "Your data is safe", "success");
            } else {
                deleteFranchise(id);
                Swal.fire("Deleted", "Your data has been deleted", "success");
            }
        });
    });
    </script>