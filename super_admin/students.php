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

?>

<script type="text/javascript">
async function getDepartment(t) {
    var id = t.value;
    let getName = await fetch('<?= $path ?>/api/get-department/' + id);
    getName = await getName.json();
    const departmentId = document.getElementById("department_id");
    departmentId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    departmentId.innerHTML += getName.data.map((data, index) =>
        `<option value=${data.id}>${data.name}</option>`
    )
};

async function getFranchise() {
    let getName = await fetch('<?= $path ?>/api/get-franchiseid');
    getName = await getName.json();
    const options = "<option value='' selected disabled>--Select--</option>" + getName.data.map((data, index) =>
        `<option value=${data.Id}>${data.franchiseName}</option>`
    ).join('');
    // the filter above the table and the school picker in the add form
    document.getElementById("franchise_id").innerHTML = options;
    document.getElementById("add_franchise_id").innerHTML = options;
};
// this script runs before the page body (and the add form) exists, so wait for it
document.addEventListener('DOMContentLoaded', getFranchise);

// Add form: list the chosen school's houses.
async function getAddDepartment(t) {
    let getName = await fetch('<?= $path ?>/api/get-department/' + t.value);
    getName = await getName.json();
    const houses = getName.data || [];
    document.getElementById("add_department_id").innerHTML =
        `<option value='' selected disabled>${houses.length ? '--Select--' : 'No houses in this school'}</option>` +
        houses.map((data) => `<option value=${data.id}>${data.name}</option>`).join('');
}

async function getMin(id) {
    let getMin = await fetch('<?= $path ?>/managestudents/student-get/' + id);
    getMin = await getMin.json();
    document.getElementById("editid").value = id;
    document.getElementById("update_min").value = getMin.data.talk_time;
}

async function updateMin() {
    const id = document.getElementById("editid").value.trim();
    const addUpdate_min = document.getElementById("update_min");
    const item = {
        min: addUpdate_min.value.trim(),
    };
    const put = await fetch('<?= $path ?>/api/update-min/' + id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then(response => response.json())
        .then((item) => {
            if (item.error == true) {
                Swal.fire(
                    'error!',
                    `${item.message}`,
                    'error'
                )
            } else {
                Swal.fire(
                    'success!',
                    `${item.message}`,
                    'success'
                )
                // refresh the rows in place; reloading the page would also lose the school / house filter
                $('.modal.edit').modal('hide');
                $('#datatable_minupdate').DataTable().draw(false);
            }
        }).catch((error) => {
            console.log("Error =>", error);
        });
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
                                    <h5>Students</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".import" onclick="openStudentImport()"
                                        class="btn btn-primary create-btn"><i class="bx bx-upload"></i> Bulk import</a>
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".add" class="btn btn-primary create-btn">Create</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="form-group col-md-4">
                                    <label>Select Franchise</label>
                                    <select class="form-control" id="franchise_id" name="franchsie_id"
                                        onchange="getDepartment(this)"></select>
                                </div>
                                <div class="form-group col-md-3">
                                    <label>Select Department</label>
                                    <select class="form-control" id="department_id" name="department_id"></select>
                                </div>
                                <div class="col-md-2" style="display:flex">
                                    <div style="align-self: center;">
                                        <button type="submit" id="submit" name="submit"
                                            class="btn btn-primary create-btn">Submit</button>
                                    </div>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table id="datatable_minupdate" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Student Name</th>
                                            <th>Student Roll No</th>
                                            <th>Contact Number</th>
                                            <th>Email</th>
                                            <th>Available Minutes</th>
                                            <th>School</th>
                                            <th>House</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getStudents">
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

    <div class="modal fade import" tabindex="-1" role="dialog" aria-labelledby="importTitle" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="importTitle">Bulk import students</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="<?= $path ?>/import-csv" enctype="multipart/form-data" method="post" id="studentImportForm">
                    <div class="modal-body">
                        <input type="hidden" name="return_to" value="super_admin/students.php">
                        <p class="text-muted small">Each row's <strong>department_id</strong> is the house ID (the ID column on the Houses page). The school is picked automatically from the house.</p>
                        <div class="form-group">
                            <label class="d-flex justify-content-between">CSV file<span>
                                <a href="<?= $basePath ?>/assets/student.csv" download="students.csv" target="_blank"><i class="bx bx-download"></i> Sample CSV</a></span></label>
                            <input type="file" name="import-csv" accept=".csv" required class="form-control" aria-label="Students CSV file">
                            <small class="text-muted">Students already in the school (same roll no) go to Student Skip Data. Rows with a house ID that doesn't exist are not imported.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary create-btn">Import students</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
    function openStudentImport() {
        document.getElementById('studentImportForm').reset();
    }

    (function () {
        const params = new URLSearchParams(location.search);
        const status = params.get('import');
        if (!status) return;
        history.replaceState(null, '', location.pathname);
        $(function () {
            const n = (k) => Number(params.get(k)) || 0;
            if (status === 'done') {
                const lines = [`${n('added')} student${n('added') === 1 ? '' : 's'} added`];
                if (n('skipped')) lines.push(`${n('skipped')} already existed or had a house from another school (see Student Skip Data)`);
                if (n('unknown')) lines.push(`${n('unknown')} had a house ID that doesn't exist and were not imported`);
                if (n('failed')) lines.push(`${n('failed')} could not be saved`);
                Swal.fire('Import finished', lines.join('<br>'), n('unknown') || n('failed') ? 'warning' : 'success');
            } else {
                Swal.fire('error!', status === 'missing' ? 'Please choose a CSV file.' : 'The import failed. Please check the file and try again.', 'error');
            }
        });
    })();
    </script>

    <div class="modal fade add" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Add student</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="<?= $path ?>/managestudents/add-students" method="POST" id="createform">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label>Select School</label>
                                <select id="add_franchise_id" name="add_franchise_id" class="form-control"
                                    onchange="getAddDepartment(this)"></select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Select House</label>
                                <select id="add_department_id" name="add_department_id" class="form-control">
                                    <option value="" selected disabled>Select a school first</option>
                                </select>
                            </div>
                            <div class="col-md-12 mb-3">
                                <mark>Students Details</mark>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Full Name</label>
                                <input type="text" id="student_name" name="student_name" class="form-control" placeholder="e.g. John Doe">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Roll Number</label>
                                <input type="text" id="student_roll_no" name="student_roll_no" class="form-control" placeholder="e.g. 101">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Initial Tokens</label>
                                <input type="number" id="student_coins" name="student_coins" class="form-control" min="0" step="1" value="0">
                                <small class="text-muted">Spacs Coins, 1 coin = 1 minute. Shared with the student's parents.</small>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Login Password</label>
                                <input type="password" id="password" name="password" class="form-control" autocomplete="new-password">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Account Status</label>
                                <select id="student_login_status" name="student_login_status" class="form-control">
                                    <option value="1" selected>Active</option>
                                    <option value="0">Inactive (can't sign in)</option>
                                </select>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number (Optional)</label>
                                <input type="number" id="contact_number" name="contact_number" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Email (Optional)</label>
                                <input type="email" id="email" name="email" class="form-control">
                            </div>
                            <div class="col-md-12 mb-3 d-flex">
                                <mark>Parents Details 1</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" name="parent_name1" id="parent_name1" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" class="form-control" id="contact_number1" name="contact_number1">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" class="form-control" id="email1" name="email1">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Password</label>
                                <input type="password" class="form-control" id="password1" name="password1">
                            </div>

                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 2</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" id="parent_name2" name="parent_name2" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" class="form-control" name="contact_number2" id="contact_number2">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" class="form-control" name="email2" id="email2">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Password</label>
                                <input type="password" class="form-control" id="password2" name="password2">
                            </div>

                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 3</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" name="parent_name3" id="parent_name3" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" class="form-control" id="contact_number3" name="contact_number3">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" class="form-control" name="email3" id="email3">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Password</label>
                                <input type="password" class="form-control" id="password3" name="password3">
                            </div>

                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 4</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" id="parent_name4" name="parent_name4" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" id="contact_number4" name="contact_number4" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" id="email4" name="email4" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Password</label>
                                <input type="password" id="password4" name="password4" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade edit" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Update talk time</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="" method="POST" onsubmit="updateMin(); return false;" id="updateform">
                    <div class="modal-body">
                        <div class="row">
                            <input type="hidden" name="editid" id="editid">
                            <div class="form-group col-md-6">
                                <label>Student Available Min</label>
                                <input type="number" id="update_min" name="update_min" class="form-control" min="0">
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-primary">Submit</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- <link href="https://code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css" rel="stylesheet">
    <script src="https://code.jquery.com/ui/1.10.4/jquery-ui.js"></script> -->
    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script>
    $('#datatable_minupdate').DataTable({
        dom: 'Bfrtip',
        pageLength: 25,
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        searching: true,
        processing: true,
        serverSide: true,
        serverMethod: 'get',
        ajax: {
            url: `<?= $path ?>/managestudents/get-studentsbydepartmentid`,
            data: function(d) {
                d.franchise_id = $('#franchise_id').val()
                d.id = $('#department_id').val()
            },
            dataType: "JSON",
        },
        aaSorting: [],
        columns: [{
            data: 'index'
        },
        {
            data: 'name'
        },
        {
            data: 'roll_no'
        },
        {
            data: 'contact'
        },
        {
            data: 'email'
        },
        {
            data: 'minutes'
        },
        {
            data: 'franchise_name'
        },
        {
            data: 'department_name'
        },
        {
            data: 'action'
        }
     ],
    });

    var table = $('#datatable_minupdate').DataTable();

    $('#submit').on('click', function() {
        table
            .draw();
    });

    // Add student: same rules and payload as the school portal (school_students.php).
    jQuery("#createform").validate({
        rules: {
            add_franchise_id: 'required',
            add_department_id: 'required',
            student_name: 'required',
            student_roll_no: 'required',
            password: { required: true, minlength: 4, maxlength: 12 },
            student_coins: { number: true, min: 0 },
            student_login_status: 'required',
        },
        messages: {
            add_franchise_id: { required: "Please select school" },
            add_department_id: { required: "Please select house" },
            student_name: { required: "Please enter student name" },
            student_roll_no: { required: "Please enter student roll number" },
            password: { required: "Please enter student password" },
            student_coins: { min: "Can't be negative" },
        },
        submitHandler: function(form) {
            const val = (id) => document.getElementById(id).value.trim();
            // parents are optional, but a filled-in parent needs a name and a 10 digit contact
            for (const n of [1, 2, 3, 4]) {
                const filled = ["parent_name", "contact_number", "email", "password"].some((f) => val(f + n));
                if (filled && (!val("parent_name" + n) || !/^\d{10}$/.test(val("contact_number" + n)))) {
                    Swal.fire('error!', `Parent ${n}: enter a name and a 10 digit contact number, or leave all of it empty.`, 'error');
                    return false;
                }
            }
            const item = {
                franchise_id: val("add_franchise_id"),
                department_id: val("add_department_id"),
                name: val("student_name"),
                student_roll_no: val("student_roll_no"),
                email: val("email"),
                contact: val("contact_number"),
                password: val("password"),
                // the form has a single password field; the API still expects the confirmation
                confirmpassword: val("password"),
                coins: val("student_coins"),
                login_status: val("student_login_status"),
                parent: [1, 2, 3, 4].map((n) => ({
                    name: val("parent_name" + n),
                    contact: val("contact_number" + n),
                    email: val("email" + n),
                    password: val("password" + n),
                })),
            };
            $.ajax({
                url: $(form).attr("action"),
                type: "POST",
                dataType: "JSON",
                data: JSON.stringify(item),
                contentType: "application/json",
                success: function(response) {
                    if (response.error == true) {
                        Swal.fire('error!', `${response.message}`, 'error');
                    } else {
                        Swal.fire('success!', `${response.message}`, 'success');
                        $('.modal.add').modal('hide');
                        form.reset();
                        // the school is cleared, so drop the previous school's houses too
                        document.getElementById("add_department_id").innerHTML =
                            "<option value='' selected disabled>Select a school first</option>";
                        table.draw();
                    }
                },
                error: function() {
                    Swal.fire('error!', 'Could not add the student. Please try again.', 'error');
                }
            });
            return false;
        }
    });
    </script>