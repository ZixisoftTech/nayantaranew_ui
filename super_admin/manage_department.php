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

// House settings shared by the add ($p = '') and edit ($p = 'update') modals.
function houseSettingsFields($p)
{
    ?>
    <div class="form-group col-md-12">
        <label>Max Call Duration Allowed (in Seconds)</label>
        <input type="number" min="0" step="1" name="<?= $p ?>max_call_duration_sec" id="<?= $p ?>max_call_duration_sec" value="120" class="form-control" placeholder="e.g. 300 (5 mins), leave blank or 0 for unlimited">
        <small class="text-muted">Automatically disconnects single calls when reached and displays a limit notification to student and parent.</small>
    </div>
    <div class="col-12">
        <hr>
        <h6 class="mb-3">🔄 Automatic Minute Allotment Schedule</h6>
    </div>
    <div class="form-group col-md-3">
        <label>Allotment Day</label>
        <select name="<?= $p ?>allotment_day" id="<?= $p ?>allotment_day" class="form-control" onchange="updateAllotmentHint('<?= $p ?>')">
            <?php foreach (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as $d): ?>
            <option value="<?= $d ?>">Every <?= $d ?></option>
            <?php endforeach; ?>
        </select>
    </div>
    <div class="form-group col-md-3">
        <label>Time (India IST)</label>
        <input type="time" name="<?= $p ?>allotment_time" id="<?= $p ?>allotment_time" value="07:00" class="form-control" onchange="updateAllotmentHint('<?= $p ?>')">
    </div>
    <div class="form-group col-md-3">
        <label>Weekly Video Mins</label>
        <input type="number" min="0" step="1" name="<?= $p ?>weekly_video_mins" id="<?= $p ?>weekly_video_mins" value="0" class="form-control">
    </div>
    <div class="form-group col-md-3">
        <label>Weekly Audio Mins</label>
        <input type="number" min="0" step="1" name="<?= $p ?>weekly_audio_mins" id="<?= $p ?>weekly_audio_mins" value="0" class="form-control">
    </div>
    <div class="col-12 mb-3">
        <small class="text-muted" id="<?= $p ?>allotmentHint"></small>
    </div>
    <?php if ($p === 'update'): ?>
    <div class="col-12 mb-3 d-flex align-items-center flex-wrap">
        <button type="button" class="btn btn-outline-primary btn-sm mr-2 nt-allot-now" id="allotNowBtn" onclick="allotNow()">🔄 Allot now</button>
        <small class="text-muted">Credits this house's saved weekly minutes to all its students immediately. The weekly schedule still runs as usual.</small>
    </div>
    <?php endif; ?>
    <div class="form-group col-md-6">
        <label class="d-flex justify-content-between">Parent Side Notice <small class="text-muted" id="<?= $p ?>parent_noticeCount">0 / 2000</small></label>
        <textarea rows="3" maxlength="2000" name="<?= $p ?>parent_notice" id="<?= $p ?>parent_notice" class="form-control" placeholder="Notice visible on Parent App dashboard for students of this house..." oninput="updateNoticeCount(this)"></textarea>
    </div>
    <div class="form-group col-md-6">
        <label class="d-flex justify-content-between">Student Side Notice <small class="text-muted" id="<?= $p ?>student_noticeCount">0 / 2000</small></label>
        <textarea rows="3" maxlength="2000" name="<?= $p ?>student_notice" id="<?= $p ?>student_notice" class="form-control" placeholder="Notice visible on Student App login screen for tablets assigned to this house..." oninput="updateNoticeCount(this)"></textarea>
    </div>
    <?php
}

?>

<script type="text/javascript">
$(document).ready(function() {
    var dataTable = $("#department").DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        processing: true,
        serverSide: true,
        serverMethod: "get",
        ajax: {
            url: "<?= $path ?>/api/get-department",
        },
        aaSorting: [],
        columns: [{
                data: "index"
            },
            {
                data: "id"
            },
            {
                data: "name"
            },
            {
                data: "device_name"
            },
            {
                data: "franchise_name"
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

async function getDays(id) {
    let get = await fetch('<?= $path ?>/api/get-days/' + id);
    get = await get.json();
    let day = get.data;
    if (day == null) {
        window.location.href = 'manage_department.php';
    }
    document.getElementById("getDays").innerHTML = day.map((data, index) =>
        `<tr>
                <td>${index + 1}</td>
                <td>${data.day}</td>
                <td>${data.start_time}</td>
                <td>${data.end_time}</td>
                </tr>`
    )
}

async function statusDeactive(id) {
    const data = document.getElementById('active');
    const item = {
        status: data.value.trim(),
    }
    const put = await fetch('<?= $path ?>/api/status-department/' + id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then((item) => {
            $("#department").DataTable().ajax.reload();
        })
        .catch(error => console.error('Unable to delete item.', error));
}

async function statusActive(id) {
    const data = document.getElementById('inactive');
    const item = {
        status: data.value.trim(),
    }
    const put = await fetch('<?= $path ?>/api/status-department/' + id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then((item) => {
            $("#department").DataTable().ajax.reload();
        })
        .catch(error => console.error('Unable to delete item.', error));
}


function generateDeviceId(p) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'DEV-';
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    document.getElementById(p + 'device_name').value = id;
}

function updateAllotmentHint(p) {
    const day = document.getElementById(p + 'allotment_day').value;
    const time = document.getElementById(p + 'allotment_time').value || '07:00';
    const [h, m] = time.split(':').map(Number);
    const label = `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    document.getElementById(p + 'allotmentHint').textContent =
        `Automatically converted to Spacs Coins and credited to students of this house every ${day.toLowerCase()} at ${label} IST.`;
}

// weekly minutes as last saved, so "Allot now" never credits unsaved edits
let savedWeeklyMins = null;

async function allotNow() {
    const id = document.getElementById('editid').value;
    const video = document.getElementById('updateweekly_video_mins').value.trim() || '0';
    const audio = document.getElementById('updateweekly_audio_mins').value.trim() || '0';
    if (!savedWeeklyMins || String(savedWeeklyMins.video) !== video || String(savedWeeklyMins.audio) !== audio) {
        Swal.fire('Save first', 'The weekly minutes were changed. Click Submit to save the house, then use Allot now.', 'info');
        return;
    }
    if (Number(video) <= 0 && Number(audio) <= 0) {
        Swal.fire('Nothing to allot', 'Set weekly video or audio minutes above 0 and save the house first.', 'info');
        return;
    }
    const confirm = await Swal.fire({
        title: 'Allot minutes now?',
        text: `${video} video min and ${audio} audio min will be credited to every student of this house (and their parents) right now, in addition to the weekly schedule.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, allot now',
        cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed && !confirm.value) return;

    const btn = document.getElementById('allotNowBtn');
    btn.disabled = true;
    try {
        const res = await fetch('<?= $path ?>/api/allot-now/' + id, {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + (window.NT_TOKEN || '') },
        });
        const data = await res.json();
        Swal.fire(data.error ? 'error!' : 'success!', data.message, data.error ? 'error' : 'success');
    } catch (e) {
        Swal.fire('error!', 'Could not reach the server. Please try again.', 'error');
    } finally {
        btn.disabled = false;
    }
}

function updateNoticeCount(el) {
    document.getElementById(el.id + 'Count').textContent = `${el.value.length} / 2000`;
}

function houseSettingsPayload(p) {
    return {
        max_call_duration_sec: document.getElementById(p + 'max_call_duration_sec').value.trim(),
        allotment_day: document.getElementById(p + 'allotment_day').value,
        allotment_time: document.getElementById(p + 'allotment_time').value,
        weekly_video_mins: document.getElementById(p + 'weekly_video_mins').value.trim(),
        weekly_audio_mins: document.getElementById(p + 'weekly_audio_mins').value.trim(),
        parent_notice: document.getElementById(p + 'parent_notice').value,
        student_notice: document.getElementById(p + 'student_notice').value,
    }
}

$(document).ready(function() {
    updateAllotmentHint('');
    updateAllotmentHint('update');
});

async function getFranchiseName() {
    let getName = await fetch('<?= $path ?>/api/get-franchiseid');
    getName = await getName.json();
    const get = getName.data;
    const franchiseId = document.getElementById("franchise_id");
    franchiseId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    get.map((data, index) =>
        franchiseId.innerHTML += `<option value="${data.Id}">${data.franchiseName}</option>`
    )
}


async function updateFranchiseName(franchiseid = 0) {
    let getName = await fetch('<?= $path ?>/api/get-franchiseid');
    getName = await getName.json();
    const franchiseId = document.getElementById("updatefranchise_id");
    franchiseId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    getName.data.forEach((data, index) => {
        var selected = "";
        if (franchiseid != 0) {
            if (data.Id == franchiseid) {
                selected = "selected='selected'";
            }
        }
        franchiseId.innerHTML += `<option ${selected} value="${data.Id}">${data.franchiseName}</option>`
    })
}

async function getUpdateValue(id) {
    let get = await fetch('<?= $path ?>/api/get-departmentbyid/' + id);
    get = await get.json();
    updateFranchiseName(get.data.department[0].franchise_id);
    document.getElementById("editid").value = id;
    // document.getElementById('updatedepartment_Id').value = get.data.department[0].id;
    document.getElementById("updatedepartment_Name").value = get.data.department[0].name;
    document.getElementById("updatedevice_name").value = get.data.department[0].device_name;
    const house = get.data.department[0];
    document.getElementById("updatemax_call_duration_sec").value = house.max_call_duration_sec ?? 120;
    document.getElementById("updateallotment_day").value = house.allotment_day || 'Sunday';
    document.getElementById("updateallotment_time").value = (house.allotment_time || '07:00').slice(0, 5);
    document.getElementById("updateweekly_video_mins").value = house.weekly_video_mins ?? 0;
    document.getElementById("updateweekly_audio_mins").value = house.weekly_audio_mins ?? 0;
    savedWeeklyMins = { video: house.weekly_video_mins ?? 0, audio: house.weekly_audio_mins ?? 0 };
    ['parent_notice', 'student_notice'].forEach((field) => {
        const el = document.getElementById("update" + field);
        el.value = house[field] || '';
        updateNoticeCount(el);
    });
    updateAllotmentHint('update');
    document.getElementById("updatefranchise_id").value = get.data.department[0].franchise_name;

    // 3 slots per day, Sunday..Saturday; a house saved without slots has none yet.
    const slots = get.data.timeslots || [];
    for (let day = 1; day <= 7; day++) {
        ['', '2', '3'].forEach((n, k) => {
            const slot = slots[(day - 1) * 3 + k] || {};
            document.getElementById("updateStart_time" + day + n).value = slot.start_time || '';
            document.getElementById("updateEnd_time" + day + n).value = slot.end_time || '';
        });
    }
}

async function deleteDepartment(id) {
    let del = await fetch('<?= $path ?>/api/delete-department/' + id, {
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

$(document).on('submit', '#addDepartment', function(e) {
    e.preventDefault();
    const item = {
        name: document.getElementById("department_Name").value.trim(),
        device_name: document.getElementById("device_name").value.trim(),
        franchise_id: document.getElementById("franchise_id").value.trim(),
        ...houseSettingsPayload(''),
        department: [{
                day: document.getElementById("day1").value.trim(),
                start_time: document.getElementById("start_time1").value.trim(),
                end_time: document.getElementById("end_time1").value.trim(),
            },
            {
                day: document.getElementById("day1").value.trim(),
                start_time: document.getElementById("start_time12").value.trim(),
                end_time: document.getElementById("end_time12").value.trim(),
            },
            {
                day: document.getElementById("day1").value.trim(),
                start_time: document.getElementById("start_time13").value.trim(),
                end_time: document.getElementById("end_time13").value.trim(),
            },
            {
                day: document.getElementById("day2").value.trim(),
                start_time: document.getElementById("start_time2").value.trim(),
                end_time: document.getElementById("end_time2").value.trim(),
            },
            {
                day: document.getElementById("day2").value.trim(),
                start_time: document.getElementById("start_time22").value.trim(),
                end_time: document.getElementById("end_time22").value.trim(),
            },
            {
                day: document.getElementById("day2").value.trim(),
                start_time: document.getElementById("start_time23").value.trim(),
                end_time: document.getElementById("end_time23").value.trim(),
            },
            {
                day: document.getElementById("day3").value.trim(),
                start_time: document.getElementById("start_time3").value.trim(),
                end_time: document.getElementById("end_time3").value.trim(),
            },
            {
                day: document.getElementById("day3").value.trim(),
                start_time: document.getElementById("start_time32").value.trim(),
                end_time: document.getElementById("end_time32").value.trim(),
            },
            {
                day: document.getElementById("day3").value.trim(),
                start_time: document.getElementById("start_time33").value.trim(),
                end_time: document.getElementById("end_time33").value.trim(),
            },
            {
                day: document.getElementById("day4").value.trim(),
                start_time: document.getElementById("start_time4").value.trim(),
                end_time: document.getElementById("end_time4").value.trim(),
            },
            {
                day: document.getElementById("day4").value.trim(),
                start_time: document.getElementById("start_time42").value.trim(),
                end_time: document.getElementById("end_time42").value.trim(),
            },
            {
                day: document.getElementById("day4").value.trim(),
                start_time: document.getElementById("start_time43").value.trim(),
                end_time: document.getElementById("end_time43").value.trim(),
            },
            {
                day: document.getElementById("day5").value.trim(),
                start_time: document.getElementById("start_time5").value.trim(),
                end_time: document.getElementById("end_time5").value.trim(),
            },
            {
                day: document.getElementById("day5").value.trim(),
                start_time: document.getElementById("start_time52").value.trim(),
                end_time: document.getElementById("end_time52").value.trim(),
            },
            {
                day: document.getElementById("day5").value.trim(),
                start_time: document.getElementById("start_time53").value.trim(),
                end_time: document.getElementById("end_time53").value.trim(),
            },
            {
                day: document.getElementById("day6").value.trim(),
                start_time: document.getElementById("start_time6").value.trim(),
                end_time: document.getElementById("end_time6").value.trim(),
            },
            {
                day: document.getElementById("day6").value.trim(),
                start_time: document.getElementById("start_time62").value.trim(),
                end_time: document.getElementById("end_time62").value.trim(),
            },
            {
                day: document.getElementById("day6").value.trim(),
                start_time: document.getElementById("start_time63").value.trim(),
                end_time: document.getElementById("end_time63").value.trim(),
            },
            {
                day: document.getElementById("day7").value.trim(),
                start_time: document.getElementById("start_time7").value.trim(),
                end_time: document.getElementById("end_time7").value.trim(),
            },
            {
                day: document.getElementById("day7").value.trim(),
                start_time: document.getElementById("start_time72").value.trim(),
                end_time: document.getElementById("end_time72").value.trim(),
            },
            {
                day: document.getElementById("day7").value.trim(),
                start_time: document.getElementById("start_time73").value.trim(),
                end_time: document.getElementById("end_time73").value.trim(),
            }
        ]
    };
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

$(document).on('submit', '#updateDepartment', function(e) {
    e.preventDefault();
    const item = {
        id: document.getElementById("editid").value.trim(),
        name: document.getElementById("updatedepartment_Name").value.trim(),
        device_name: document.getElementById("updatedevice_name").value.trim(),
        franchise_id: document.getElementById("updatefranchise_id").value.trim(),
        ...houseSettingsPayload('update'),
        department: [{
                day: document.getElementById("updateday1").value.trim(),
                start_time: document.getElementById("updateStart_time1").value.trim(),
                end_time: document.getElementById("updateEnd_time1").value.trim(),
            },
            {
                day: document.getElementById("updateday1").value.trim(),
                start_time: document.getElementById("updateStart_time12").value.trim(),
                end_time: document.getElementById("updateEnd_time12").value.trim(),
            },
            {
                day: document.getElementById("updateday1").value.trim(),
                start_time: document.getElementById("updateStart_time13").value.trim(),
                end_time: document.getElementById("updateEnd_time13").value.trim(),
            },
            {
                day: document.getElementById("updateday2").value.trim(),
                start_time: document.getElementById("updateStart_time2").value.trim(),
                end_time: document.getElementById("updateEnd_time2").value.trim(),
            },
            {
                day: document.getElementById("updateday2").value.trim(),
                start_time: document.getElementById("updateStart_time22").value.trim(),
                end_time: document.getElementById("updateEnd_time22").value.trim(),
            },
            {
                day: document.getElementById("updateday2").value.trim(),
                start_time: document.getElementById("updateStart_time23").value.trim(),
                end_time: document.getElementById("updateEnd_time23").value.trim(),
            },
            {
                day: document.getElementById("updateday3").value.trim(),
                start_time: document.getElementById("updateStart_time3").value.trim(),
                end_time: document.getElementById("updateEnd_time3").value.trim(),
            },
            {
                day: document.getElementById("updateday3").value.trim(),
                start_time: document.getElementById("updateStart_time32").value.trim(),
                end_time: document.getElementById("updateEnd_time32").value.trim(),
            },
            {
                day: document.getElementById("updateday3").value.trim(),
                start_time: document.getElementById("updateStart_time33").value.trim(),
                end_time: document.getElementById("updateEnd_time33").value.trim(),
            },
            {
                day: document.getElementById("updateday4").value.trim(),
                start_time: document.getElementById("updateStart_time4").value.trim(),
                end_time: document.getElementById("updateEnd_time4").value.trim(),
            },
            {
                day: document.getElementById("updateday4").value.trim(),
                start_time: document.getElementById("updateStart_time42").value.trim(),
                end_time: document.getElementById("updateEnd_time42").value.trim(),
            },
            {
                day: document.getElementById("updateday4").value.trim(),
                start_time: document.getElementById("updateStart_time43").value.trim(),
                end_time: document.getElementById("updateEnd_time43").value.trim(),
            },
            {
                day: document.getElementById("updateday5").value.trim(),
                start_time: document.getElementById("updateStart_time5").value.trim(),
                end_time: document.getElementById("updateEnd_time5").value.trim(),
            },
            {
                day: document.getElementById("updateday5").value.trim(),
                start_time: document.getElementById("updateStart_time52").value.trim(),
                end_time: document.getElementById("updateEnd_time52").value.trim(),
            },
            {
                day: document.getElementById("updateday5").value.trim(),
                start_time: document.getElementById("updateStart_time53").value.trim(),
                end_time: document.getElementById("updateEnd_time53").value.trim(),
            },
            {
                day: document.getElementById("updateday6").value.trim(),
                start_time: document.getElementById("updateStart_time6").value.trim(),
                end_time: document.getElementById("updateEnd_time6").value.trim(),
            },
            {
                day: document.getElementById("updateday6").value.trim(),
                start_time: document.getElementById("updateStart_time62").value.trim(),
                end_time: document.getElementById("updateEnd_time62").value.trim(),
            },
            {
                day: document.getElementById("updateday6").value.trim(),
                start_time: document.getElementById("updateStart_time63").value.trim(),
                end_time: document.getElementById("updateEnd_time63").value.trim(),
            },
            {
                day: document.getElementById("updateday7").value.trim(),
                start_time: document.getElementById("updateStart_time7").value.trim(),
                end_time: document.getElementById("updateEnd_time7").value.trim(),
            },
            {
                day: document.getElementById("updateday7").value.trim(),
                start_time: document.getElementById("updateStart_time72").value.trim(),
                end_time: document.getElementById("updateEnd_time72").value.trim(),
            },
            {
                day: document.getElementById("updateday7").value.trim(),
                start_time: document.getElementById("updateStart_time73").value.trim(),
                end_time: document.getElementById("updateEnd_time73").value.trim(),
            }
        ]
    };
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
                                    <h5>Manage Department</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".add"
                                        class="btn btn-primary create-btn" onclick="getFranchiseName()">Create</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table id="department" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>ID</th>
                                            <th>House Name</th>
                                            <th>Device ID</th>
                                            <th>School</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getDepartment">
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
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Add department</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="<?= $path ?>/api/add-department" id="addDepartment" method="POST">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label>House Tag / Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="department_Name" id="department_Name" maxlength="25" class="form-control" placeholder="e.g. Alpha House, Gryffindor">
                            </div>
                            <div class="form-group col-md-4">
                                <label>Hardware Device ID / House ID<span class="req" style="color:red">*</span></label>
                                <div class="input-group">
                                    <input type="text" name="device_name" id="device_name" maxlength="50" class="form-control">
                                    <div class="input-group-append">
                                        <button type="button" class="btn btn-outline-secondary" onclick="generateDeviceId('')">Generate</button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label>Franchise Name</label>
                                <select name="franchise_id" id="franchise_id" class="form-control">
                                </select>
                            </div>
                            <?php houseSettingsFields(''); ?>
                            <div class="col-12">
                                <hr>
                                <h6 class="mb-3">Calling Schedule</h6>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" value="Sunday" class="form-control" id="day1" name="day1" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" class="form-control" id="start_time1" name="start_time1">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" class="form-control" id="end_time1" name="end_time1">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" class="form-control" id="start_time12" name="start_time12">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" class="form-control" id="end_time12" name="end_time12">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" class="form-control" id="start_time13" name="start_time13">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" class="form-control" id="end_time13" name="end_time13">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" value="Monday" class="form-control" id="day2" name="day2" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" class="form-control" id="start_time2" name="start_time2">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" class="form-control" id="end_time2" name="end_time2">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" class="form-control" id="start_time22" name="start_time22">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" class="form-control" id="end_time22" name="end_time22">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" class="form-control" id="start_time23" name="start_time23">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" class="form-control" id="end_time23" name="end_time23">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" value="Tuesday" class="form-control" id="day3" name="day3" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" class="form-control" id="start_time3" name="start_time3">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" class="form-control" id="end_time3" name="end_time3">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" class="form-control" id="start_time32" name="start_time32">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" class="form-control" id="end_time32" name="end_time32">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" class="form-control" id="start_time33" name="start_time33">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" class="form-control" id="end_time33" name="end_time33">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" value="Wednesday" class="form-control" id="day4" name="day4"
                                    disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" class="form-control" id="start_time4" name="start_time4">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" class="form-control" id="end_time4" name="end_time4">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" class="form-control" id="start_time42" name="start_time42">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" class="form-control" id="end_time42" name="end_time42">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" class="form-control" id="start_time43" name="start_time43">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" class="form-control" id="end_time43" name="end_time43">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" value="Thursday" class="form-control" id="day5" name="day5" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" class="form-control" id="start_time5" name="start_time5">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" class="form-control" id="end_time5" name="end_time5">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" class="form-control" id="start_time52" name="start_time52">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" class="form-control" id="end_time52" name="end_time52">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" class="form-control" id="start_time53" name="start_time53">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" class="form-control" id="end_time53" name="end_time53">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" value="Friday" class="form-control" id="day6" name="day6" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" class="form-control" id="start_time6" name="start_time6">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" class="form-control" id="end_time6" name="end_time6">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" class="form-control" id="start_time62" name="start_time62">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" class="form-control" id="end_time62" name="end_time62">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" class="form-control" id="start_time63" name="start_time63">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" class="form-control" id="end_time63" name="end_time63">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" value="Satuarday" class="form-control" id="day7" name="day7"
                                    disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" class="form-control" id="start_time7" name="start_time7">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" class="form-control" id="end_time7" name="end_time7">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" class="form-control" id="start_time72" name="start_time72">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" class="form-control" id="end_time72" name="end_time72">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" class="form-control" id="start_time73" name="start_time73">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" class="form-control" id="end_time73" name="end_time73">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" id="submit" class="btn btn-primary create-btn">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade edit" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Edit department</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="<?= $path ?>/api/update-department" id="updateDepartment" method="POST">
                    <div class="modal-body">
                        <div class="row">
                            <input type="hidden" name="ediitid" id="editid">
                            <!-- <div class="form-group col-md-3">
                                <label>Department Id</label>
                                <input type="text" name="updatedepartment_Id" id="updatedepartment_Id"
                                    class="form-control" disabled>
                            </div> -->
                            <div class="form-group col-md-4">
                                <label>House Tag / Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="updatedepartment_Name" id="updatedepartment_Name" maxlength="25"
                                    class="form-control" placeholder="e.g. Alpha House, Gryffindor">
                            </div>

                            <div class="form-group col-md-4">
                                <label>Hardware Device ID / House ID<span class="req" style="color:red">*</span></label>
                                <div class="input-group">
                                    <input type="text" name="updatedevice_name" id="updatedevice_name" maxlength="50" class="form-control">
                                    <div class="input-group-append">
                                        <button type="button" class="btn btn-outline-secondary" onclick="generateDeviceId('update')">Generate</button>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group col-md-4">
                                <label>Franchise Name</label>
                                <select name="updatefranchise_id" id="updatefranchise_id" class="form-control">
                                </select>
                            </div>
                            <?php houseSettingsFields('update'); ?>
                            <div class="col-12">
                                <hr>
                                <h6 class="mb-3">Calling Schedule</h6>
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" name="updateday1" id="updateday1" class="form-control" value="Sunday"
                                    disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" name="updateStart_time1" id="updateStart_time1" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" name="updateEnd_time1" id="updateEnd_time1" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" name="updateStart_time12" id="updateStart_time12"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" name="updateEnd_time12" id="updateEnd_time12" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" name="updateStart_time13" id="updateStart_time13"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" name="updateEnd_time13" id="updateEnd_time13" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" name="updateday2" id="updateday2" class="form-control" value="Monday"
                                    disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" name="updateStart_time2" id="updateStart_time2" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" name="updateEnd_time2" id="updateEnd_time2" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" name="updateStart_time22" id="updateStart_time22"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" name="updateEnd_time22" id="updateEnd_time22" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" name="updateStart_time23" id="updateStart_time23"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" name="updateEnd_time23" id="updateEnd_time23" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" name="updateday3" id="updateday3" class="form-control"
                                    value="Tuesday" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" name="updateStart_time3" id="updateStart_time3" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" name="updateEnd_time3" id="updateEnd_time3" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" name="updateStart_time32" id="updateStart_time32"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" name="updateEnd_time32" id="updateEnd_time32" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" name="updateStart_time33" id="updateStart_time33"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" name="updateEnd_time33" id="updateEnd_time33" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" name="updateday4" id="updateday4" class="form-control"
                                    value="Wednesday" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" name="updateStart_time4" id="updateStart_time4" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" name="updateEnd_time4" id="updateEnd_time4" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" name="updateStart_time42" id="updateStart_time42"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" name="updateEnd_time42" id="updateEnd_time42" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" name="updateStart_time43" id="updateStart_time43"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" name="updateEnd_time43" id="updateEnd_time43" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" name="updateday5" id="updateday5" class="form-control"
                                    value="Thursday" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" name="updateStart_time5" id="updateStart_time5" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" name="updateEnd_time5" id="updateEnd_time5" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" name="updateStart_time52" id="updateStart_time52"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" name="updateEnd_time52" id="updateEnd_time52" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" name="updateStart_time53" id="updateStart_time53"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" name="updateEnd_time53" id="updateEnd_time53" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" name="updateday6" id="updateday6" class="form-control" value="Friday"
                                    disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" name="updateStart_time6" id="updateStart_time6" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" name="updateEnd_time6" id="updateEnd_time6" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" name="updateStart_time62" id="updateStart_time62"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" name="updateEnd_time62" id="updateEnd_time62" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" name="updateStart_time63" id="updateStart_time63"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" name="updateEnd_time63" id="updateEnd_time63" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Day</label>
                                <input type="text" name="updateday7" id="updateday7" class="form-control"
                                    value="Satuarday" disabled>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 1</label>
                                <input type="time" name="updateStart_time7" id="updateStart_time7" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 1</label>
                                <input type="time" name="updateEnd_time7" id="updateEnd_time7" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 2</label>
                                <input type="time" name="updateStart_time72" id="updateStart_time72"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 2</label>
                                <input type="time" name="updateEnd_time72" id="updateEnd_time72" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Start Time 3</label>
                                <input type="time" name="updateStart_time73" id="updateStart_time73"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>End Time 3</label>
                                <input type="time" name="updateEnd_time73" id="updateEnd_time73" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" id="submit" class="btn btn-primary create-btn">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade view" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Calling schedule</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered dt-responsive nowrap"
                            style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                            <thead>
                                <tr>
                                    <th>S. No</th>
                                    <th>Day</th>
                                    <th>Start time</th>
                                    <th>End time</th>
                                </tr>
                            </thead>
                            <tbody id="getDays">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script type="text/javascript">
    jQuery(document).ready(function() {
        jQuery("#addDepartment").validate({
            rules: {
                department_Name: 'required',
                franchise_id: 'required',
                device_name: 'required',
            },
            messages: {
                department_Name: {
                    required: "Please enter department name",
                },
                franchise_id: {
                    required: "Please select franchiser name",
                },
                device_name: {
                    required: "Please enter device name",
                },
            },
        });
    });

    jQuery(document).ready(function() {
        jQuery("#updateDepartment").validate({
            rules: {
                updatedepartment_Name: 'required',
                updatefranchise_id: 'required',
                updatedevice_name: 'required',
            },
            messages: {
                updatedepartment_Name: {
                    required: "Please enter department_Name name",
                },
                updatefranchise_id: {
                    required: "Please select franchiser name",
                },
                updatedevice_name: {
                    required: "Please enter device name",
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
                deleteDepartment(id);
                Swal.fire("Deleted", "Your data has been deleted", "success");
            }
        });
    });
    </script>