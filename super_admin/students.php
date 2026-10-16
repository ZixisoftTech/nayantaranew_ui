<?php include("../include/head.php") ?>
<?php include("../include/navbar.php") ?>
<?php include("../include/sidebar_superadmin.php") ?>
<?php 
// $basePath = 'http://localhost/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
$basePath = 'https://nayantarabyspacs.co.in'; 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000";
$path = "https://nayantarabyspacs.co.in";

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
    const departmentId = document.getElementById("franchise_id");
    departmentId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    departmentId.innerHTML += getName.data.map((data, index) =>
        `<option value=${data.Id}>${data.franchiseName}</option>`
    )
};
getFranchise()

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
                                <!-- <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".add" class="btn btn-primary create-btn">Create</a>
                                </div> -->
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
                                            <th>Avaibale Minutes</th>
                                            <th>Franchise</th>
                                            <th>Department</th>
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

    <div class="modal fade add" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Create</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="" method="POST" onsubmit="return addStudents()" id="createform">
                    <div class="modal-body">
                        <div class="row">
                            <input type="hidden" name="franchise_id_form" id="franchise_id_form" value="">
                            <div class="col-md-12 mb-3">
                                <mark>Students Details</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Student Name</label>
                                <input type="text" id="student_name" name="student_name" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Student Roll No.</label>
                                <input type="number" id="student_roll_no" min="1" name="student_roll_no"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" id="contact_number" name="contact_number" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" id="email" name="email" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Password</label>
                                <input type="password" id="password" name="password" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Confirm Password</label>
                                <input type="password" id="confirmpassword" name="confirmpassword" class="form-control">
                            </div>
                            <div class="col-md-12 mb-3 d-flex">
                                <mark>Parents Details 1</mark>
                                <div class="text-warning">*</div>
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
                                <input type="text" id="password4" name="password4" class="form-control">
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
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Edit</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="" method="POST" onsubmit="return updateMin()" id="updateform">
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
        pageLength: 100,
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
    </script>