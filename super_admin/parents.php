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
async function findStudent(t) {
    var id = t.value;
    let getName = await fetch('<?= $path ?>/api/getstudent-franchiseid/' + id);
    getName = await getName.json();
    const departmentId = document.getElementById("student_id");
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

// Add form: list the chosen school's students.
async function getAddStudents(t) {
    let getName = await fetch('<?= $path ?>/api/getstudent-franchiseid/' + t.value);
    getName = await getName.json();
    const students = getName.data || [];
    const escape = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    document.getElementById("add_student_id").innerHTML =
        `<option value='' selected disabled>${students.length ? '--Select--' : 'No students in this school'}</option>` +
        students.map((data) => `<option value=${data.id}>${escape(data.name)} (Roll ${escape(data.student_roll_no)})</option>`).join('');
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
                                    <h5>Parents</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".add" class="btn btn-primary create-btn">Create</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="form-group col-md-4">
                                    <label>Select Franchise</label>
                                    <select class="form-control" id="franchise_id" name="franchsie_id"
                                        onchange="findStudent(this)"></select>
                                </div>
                                <div class="form-group col-md-3">
                                    <label>Select Student</label>
                                    <select class="form-control" id="student_id" name="student_id"></select>
                                </div>
                                <div class="col-md-2" style="display:flex">
                                    <div style="align-self: center;">
                                        <button type="submit" id="submit" name="submit"
                                            class="btn btn-primary create-btn">Submit</button>
                                    </div>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table id="datatable_parents" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>Student Roll No</th>
                                            <th>Student Name</th>
                                            <th>Parent Name</th>
                                            <th>Contact</th>
                                            <th>Email</th>
                                            <th>Password</th>
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

    <div class="modal fade add" tabindex="-1" role="dialog" aria-labelledby="addParentTitle" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="addParentTitle">Add parent</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="<?= $path ?>/parent/add-parent" method="POST" id="createform">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label>School</label>
                                <select id="add_franchise_id" name="add_franchise_id" class="form-control"
                                    onchange="getAddStudents(this)"></select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Student</label>
                                <select id="add_student_id" name="add_student_id" class="form-control">
                                    <option value="" selected disabled>Select a school first</option>
                                </select>
                            </div>
                            <div class="col-md-12 mb-3">
                                <mark>Parent Details</mark>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Full Name</label>
                                <input type="text" id="parent_name" name="parent_name" class="form-control" placeholder="e.g. Jane Doe">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Phone Number</label>
                                <input type="tel" id="parent_contact" name="parent_contact" class="form-control" placeholder="+1234567890" autocomplete="off">
                                <small class="text-muted">India: 10 digits or +91… · Other countries: + and country code. The parent signs in with this number.</small>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Password</label>
                                <input type="password" id="parent_password" name="parent_password" class="form-control" placeholder="Account Password" autocomplete="new-password">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Login OTP (Optional)</label>
                                <input type="text" inputmode="numeric" id="parent_otp" name="parent_otp" class="form-control" placeholder="1234" autocomplete="off">
                                <small class="text-muted">Fixed OTP for international numbers, which don't get an SMS. Indian numbers get the usual SMS OTP.</small>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Initial Balance (coins)</label>
                                <input type="number" id="parent_coins" name="parent_coins" class="form-control" min="0" step="1" placeholder="0">
                                <small class="text-muted">1 coin = 1 minute. Added to the student's balance, shared with all of its parents.</small>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Email (Optional)</label>
                                <input type="email" id="parent_email" name="parent_email" class="form-control" placeholder="name@example.com">
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

    <!-- <link href="https://code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css" rel="stylesheet">
    <script src="https://code.jquery.com/ui/1.10.4/jquery-ui.js"></script> -->
    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script>
    $('#datatable_parents').DataTable({
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
            url: `<?= $path ?>/parent/getparent-studentid`,
            data: function(d) {
                d.franchise_id = $('#franchise_id').val()
                d.id = $('#student_id').val()
            },
            dataType: "JSON",
        },
        aaSorting: [],
        columns: [{
            data: 'index'
        },
        {
            data: 'student_roll_no'
        },
        {
            data: 'student_name'
        },
        {
            data: 'name'
        },
        {
            data: 'contact'
        },
        {
            data: 'email'
        },
        {
            data: 'password'
        },
        {
            data: 'action'
        },
     ],
    });

    var table = $('#datatable_parents').DataTable();

    $('#submit').on('click', function() {
        table
            .draw();
    });

    // Indian: 10 digits or +91 and 10 digits; elsewhere: + country code and number (the API checks the same)
    jQuery.validator.addMethod('ntPhone', function(value) {
        const v = value.replace(/[\s\-().]/g, '').replace(/^00/, '+');
        return /^\d{10}$/.test(v) || /^\+91\d{10}$/.test(v) || (/^\+[1-9]\d{6,14}$/.test(v) && !v.startsWith('+91'));
    }, 'Enter 10 digits, or + and the country code, e.g. +14155550123');

    // Add parent to an existing student.
    jQuery("#createform").validate({
        rules: {
            add_franchise_id: 'required',
            add_student_id: 'required',
            parent_name: 'required',
            parent_contact: { required: true, ntPhone: true },
            parent_email: { email: true },
            parent_password: { required: true, minlength: 4, maxlength: 12 },
            parent_otp: { digits: true, minlength: 4, maxlength: 6 },
            parent_coins: { number: true, min: 0 },
        },
        messages: {
            add_franchise_id: { required: "Please select school" },
            add_student_id: { required: "Please select student" },
            parent_name: { required: "Please enter parent name" },
            parent_contact: { required: "Please enter phone number" },
            parent_otp: { digits: "Digits only", minlength: "Use 4 to 6 digits", maxlength: "Use 4 to 6 digits" },
            parent_coins: { min: "Can't be negative" },
            parent_password: { required: "Please enter password", minlength: "Use 4 to 12 characters", maxlength: "Use 4 to 12 characters" },
        },
        submitHandler: function(form) {
            const val = (id) => document.getElementById(id).value.trim();
            fetch($(form).attr("action"), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + window.NT_TOKEN },
                body: JSON.stringify({
                    student_id: val("add_student_id"),
                    name: val("parent_name"),
                    contact: val("parent_contact"),
                    email: val("parent_email"),
                    password: val("parent_password"),
                    otp: val("parent_otp"),
                    coins: val("parent_coins"),
                })
            }).then((r) => r.json()).then((response) => {
                if (response.error == true) {
                    Swal.fire('error!', `${response.message}`, 'error');
                } else {
                    Swal.fire('success!', `${response.message}`, 'success');
                    $('.modal.add').modal('hide');
                    form.reset();
                    document.getElementById("add_student_id").innerHTML =
                        "<option value='' selected disabled>Select a school first</option>";
                    table.draw();
                }
            }).catch(() => Swal.fire('error!', 'Could not add the parent. Please try again.', 'error'));
            return false;
        }
    });

    async function parentLogout(id) {
    const item = {
        id: id,
    };
    const put = await fetch('<?= $path ?>/parent/logout', {
            method: 'POST',
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
                window.stop();
            } else {
                Swal.fire(
                    'success!',
                    `${item.message}`,
                    'success'
                )
                setTimeout(() => {
                    document.location.reload();
                }, 2000);
            }
        }).catch((error) => {
            console.log("Error =>", error);
        });
}
    </script>