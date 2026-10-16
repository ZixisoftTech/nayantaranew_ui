<?php include("../include/head.php") ?>
<?php include("../include/franchise_navbar.php") ?>
<?php include("../include/sidebar_franchise.php") ?>
<?php
// $basePath = 'http://localhost/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
$basePath = 'https://nayantarabyspacs.co.in'; 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000"; 
$path = "https://nayantarabyspacs.co.in";
?>

<script type="text/javascript">
$(document).ready(function() {
    $("#departmentName").on("change", function() {
        var searchterm = $(this).val();
        $('#datatable_managestudent tbody tr').each(function() {
            var departmentCell = $(this).find(
                'td:eq(7)'); // Assuming the departmentName column is at index 7

            if (searchterm === 'all' || searchterm === departmentCell.text()) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
});



$(document).ready(function() {
    $.ajax({
        url: "<?= $path ?>/franchise/api/franchisename",
        type: "POST",
        dataType: "JSON",
        data: JSON.stringify({
            franchisetoken
        }),
        contentType: "application/json",
        success: function(response, status) {
            getStudents(response.data.Id);
            getDepartment(response.data.Id)
            getDepartmentName(response.data.Id);
            department(response.data.Id);
            // document.getElementById("franchise_id_form").value = response.data.Id;
            $("#franchise_id_form").val(response.data.Id)
            document.getElementById("franchis_id").value = response.data.Id;
            document.getElementById("franch_id").value = response.data.Id;
        },
        error: function(xhr, desc, err) {}
    });
});

async function getDepartment(id) {
    let getName = await fetch('<?= $path ?>/api/get-department/' + id);
    getName = await getName.json();
    const department_id = document.getElementById("department_id");
    department_id.innerHTML = "<option value='' selected disabled>--Select--</option>";
    department_id.innerHTML += getName.data.map((data, index) =>
        `<option value=${data.id}>${data.name}</option>`
    )
};

async function updateDepartmentName(franchise, department) {
    var id = franchise;
    let getName = await fetch('<?= $path ?>/api/get-department/' + id);
    getName = await getName.json();
    const departmentId = document.getElementById("updatedepartment_id");
    departmentId.innerHTML = "<option value='' >--Select--</option>";
    getName.data.forEach((data, index) => {
        var selected = "";
        if (department != 0) {
            if (data.id == department) {
                selected = "selected='selected'";
            }
        }
        departmentId.innerHTML += `<option ${selected} value=${data.id}>${data.name}</option>`
    })
}

async function getDepartmentName(id) {
    let getName = await fetch('<?= $path ?>/api/get-department/' + id);
    getName = await getName.json();
    const departmentId = document.getElementById("departmentName");
    departmentId.innerHTML = "<option value='all'>--Select--</option>";
    departmentId.innerHTML += getName.data.map((data, index) =>
        `<option value='${data.name}'>${data.name}</option>`
    )
};

async function department(id) {
    let getName = await fetch('<?= $path ?>/api/get-department/' + id);
    getName = await getName.json();
    const departmentId = document.getElementById("department");
    departmentId.innerHTML = "<option value='all'>--Select--</option>";
    departmentId.innerHTML += getName.data.map((data, index) =>
        `<option value=${data.id}>${data.name}</option>`
    )
};

async function getStudents(id) {
    var dataTable = $("#datatable_managestudent").DataTable({
        dom: 'Bfrtip',
        pageLength: 100,
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        searching: true,
        processing: true,
        serverSide: true,
        serverMethod: "get",
        ajax: {
            url: '<?= $path ?>/managestudents/get-studentsbyfranchise/' + id,
        },
        aaSorting: [],
        columns: [{
                data: "index"
            },
            {
                data: 'checkbox'
            },
            {
                data: "student_name"
            },
            {
                data: "student_roll_no"
            },
            {
                data: "contact"
            },
            {
                data: "email"
            },
            {
                data: 'password'
            },
            {
                data: "department_name"
            },
            {
                data: "status"
            },
            {
                data: "action"
            },
        ],
        "columnDefs": [{
            "targets": [1],
            "orderable": false
        }]
    });
};

var student_ids = [];
$(document).on('click', '.checkbox', function() {
    if ($(this).is(':checked')) {
        student_ids.push($(this).val());
    } else {
        student_ids.pop($(this).val());
    }
});

$(document).ready(function() {
    $('#select_all').on('click', function() {
        if (this.checked) {
            $('.checkbox').each(function() {
                this.checked = true;
                if ($(this).is(':checked')) {
                    student_ids.push($(this).val());
                }
            });
        } else {
            $('.checkbox').each(function() {
                this.checked = false;
                student_ids.pop($(this).val());
            });
        }
    });
})

$(document).on('click', '.bulkdelete', function() {
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
            $('#myModal').modal('show');
            // bulkDelete(student_ids);
            // Swal.fire("Deleted", "Your data has been deleted", "success");
        }
    });
});

async function statusDeactive(id, franchise_id) {
    const data = document.getElementById('active');
    const item = {
        status: data.value.trim(),
    }
    const put = await fetch('<?= $path ?>/managestudents/status-managestudents/' + id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then((item) => {
            $("#datatable_managestudent").DataTable().ajax.reload();
        })
        .catch(error => console.error('Unable to delete item.', error));
}

async function statusActive(id, franchise_id) {
    const data = document.getElementById('inactive');
    const item = {
        status: data.value.trim(),
    }
    const put = await fetch('<?= $path ?>/managestudents/status-managestudents/' + id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then((item) => {
            $("#datatable_managestudent").DataTable().ajax.reload();
        })
        .catch(error => console.error('Unable to delete item.', error));
}

async function getSubscriptionById(id) {
    let get = await fetch('<?= $path ?>/managestudents/get-studentparent/' + id)
    get = await get.json();
    $("#updateform")[0].reset();
    updateDepartmentName(get.data[0].franchise_id, get.data[0].department_id)
    document.getElementById("editid").value = id;
    document.getElementById("updatefranchise_id").value = get.data[0].franchise_id;
    document.getElementById("updatestudent_name").value = get.data[0].name;
    document.getElementById("updatecontact_number").value = get.data[0].contact;
    document.getElementById("updateemail").value = get.data[0].email;
    document.getElementById("update_password").value = get.data[0].password;

    document.getElementById("updateparent_name1").value = get.data[0].parent_name;
    document.getElementById("updatecontact_number1").value = get.data[0].number;
    document.getElementById("updateemail1").value = get.data[0].mail;
    document.getElementById("updatepassword1").value = get.data[0].pass;

    document.getElementById("updateparent_name2").value = get.data[1].parent_name;
    document.getElementById("updatecontact_number2").value = get.data[1].number;
    document.getElementById("updateemail2").value = get.data[1].mail;
    document.getElementById("updatepassword2").value = get.data[1].pass;

    document.getElementById("updateparent_name3").value = get.data[2].parent_name;
    document.getElementById("updatecontact_number3").value = get.data[2].number;
    document.getElementById("updateemail3").value = get.data[2].mail;
    document.getElementById("updatepassword3").value = get.data[2].pass;

    document.getElementById("updateparent_name4").value = get.data[3].parent_name;
    document.getElementById("updatecontact_number4").value = get.data[3].number;
    document.getElementById("updateemail4").value = get.data[3].mail;
    document.getElementById("updatepassword4").value = get.data[3].pass;

}

async function bulkDelete() {
    var password = document.getElementById('delete_password').value;
    if (password == 'Ibm@9799111897') {
        $.ajax({
            url: '<?= $path. '/managestudents/delete-bulkstudent' ?>',
            type: 'POST',
            data: {
                studentid: JSON.stringify(student_ids),
            },
            dataType: 'json',
            success: function(data, textStatus, jqXHR) {
                if (data.error == false) {
                    Swal.fire(
                        'success!',
                        `${data.message}`,
                        'success'
                    );
                    setTimeout(() => {
                        document.location.reload();
                    }, 1000);
                } else {
                    Swal.fire(
                        'error!',
                        "Data not deleted",
                        'error',
                    );
                };
            }
        });
    } else {
        Swal.fire(
            'error!',
            "Password not be correct",
            'error',
        );
    }
};

async function deleteSubscription() {
    var id = document.getElementById('deletes').value;
    var password = document.getElementById('delete_passworded').value;

    if (password == 'Ibm@9799111897') {
        let del = await fetch('<?= $path ?>/managestudents/delete-students/' + id, {
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
    } else {
        Swal.fire(
            'error!',
            "Password not be correct",
            'error',
        );
    }
}

async function bulkDepartmentUpdate(t) {
    var id = t.value;
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: false,
        closeOnCancel: false
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel || result.dismiss === Swal.DismissReason
            .backdrop) {
            Swal.fire("Cancelled", "Your department not update", "success");
            setTimeout(() => {
                document.location.reload();
            }, 1000);
        } else {
            DepartmentUpdate(id);
            Swal.fire("Success", "Your department has been update", "success");
        }
    });
};

async function DepartmentUpdate(id) {
    $.ajax({
        url: '<?= $path. '/managestudents/update-bulkdepartment' ?>',
        type: 'POST',
        data: {
            studentid: JSON.stringify(student_ids),
            departmentId: id
        },
        dataType: 'json',
        success: function(data, textStatus, jqXHR) {
            if (data.error == false) {
                Swal.fire(
                    'success!',
                    `${data.message}`,
                    'success'
                );
                setTimeout(() => {
                    document.location.reload();
                }, 1000);
            } else {
                Swal.fire(
                    'error!',
                    "Data not Update",
                    'error',
                );
            };
        },
        error: function(jqXHR, textStatus, errorThrown) {

        }
    })
}

async function bulkStatusUpdate(t) {
    var status = t.value;
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: false,
        closeOnCancel: false
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel || result.dismiss === Swal.DismissReason
            .backdrop) {
            Swal.fire("Cancelled", "Your status not update", "success");
            setTimeout(() => {
                document.location.reload();
            }, 1000);
        } else {
            statusBulkUpdate(status);
            Swal.fire("Success", "Your status has been update", "success");
        }
    });
};

async function statusBulkUpdate(status) {
    $.ajax({
        url: '<?= $path. '/managestudents/update-bulkstatus' ?>',
        type: 'POST',
        data: {
            studentid: JSON.stringify(student_ids),
            status: status
        },
        dataType: 'json',
        success: function(data, textStatus, jqXHR) {
            if (data.error == false) {
                Swal.fire(
                    'success!',
                    `${data.message}`,
                    'success'
                );
                setTimeout(() => {
                    document.location.reload();
                }, 1000);
            } else {
                Swal.fire(
                    'error!',
                    "Data not Update",
                    'error',
                );
            };
        },
        error: function(jqXHR, textStatus, errorThrown) {

        }
    })
}

$(document).on('click', '.close', function() {
    $('#myModal').modal('hide');
    $('#delete_password').val('');
});

$(document).on('click', '#close', function() {
    $('#myModals').modal('hide');
    $('#delete_passworded').val('');
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
                                    <h5>Manage Student</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".add"
                                        class="btn btn-primary create-btn">Create</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <h2>Bulk Upload Students<a href="<?= $basePath ?>/assets/student.csv"
                                            download="students.csv" class="btn btn-warning" target="_blank"
                                            style="margin: 0px 10px">Download Sample
                                            Excel</a>
                                    </h2>
                                </div>
                                <div class="col-md-12">
                                    <form action="<?= $path ?>/import-csv" id="uploadfile" enctype="multipart/form-data"
                                        method="post">
                                        <div class="row">
                                            <!-- <div class="col-md-4 form-group">
                                                <label>Select Department</lable>
                                                    <select class="form-control col-md-6" style="width: 44rem;"
                                                        id="department" name="department" required="">
                                                    </select>
                                            </div> -->
                                            <input type="hidden" id="franch_id" name="franch_id" class="form-control" />
                                            <div class="col-md-4 form-group">
                                                <label>Choose CSV file</lable>
                                                    <input type="file" id="import-csv" name="import-csv" accept=".csv"
                                                        required="" class="form-control" />
                                            </div>
                                            <div class="col-md-4 form-group">
                                                <button type="submit" class="btn btn-success" value="Store File"
                                                    id="submit" name="submit" class="form-control"
                                                    style="margin: 15px">Import
                                                    Students</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div class="col-md-12">
                                    <h2>Bulk Upload Parents <a href="<?= $basePath ?>/assets/parents.csv"
                                            download="parents.csv" class="btn btn-warning" target="_blank">
                                            Download Sample Excel</a>
                                    </h2>
                                    <form action="<?= $path ?>/imports-csv" id="uploadsfile"
                                        enctype="multipart/form-data" method="post">
                                        <div class="row">
                                            <input type="hidden" id="franchis_id" name="franchis_id" />
                                            <div class="col-md-4 form-group">
                                                <label>Choose CSV file</label>
                                                <input type="file" id="imports-csv" name="imports-csv" accept=".csv"
                                                    required="" class="form-control" />
                                            </div>
                                            <div class="col-md-4 form-group">
                                                <button type="submit" class="btn btn-success" value="Store File"
                                                    id="inport" name="import" style="margin: 25px">Import
                                                    Parents</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div class="d-flex flex-column" style="align-items: center">
                                <label>Department Filter</label>
                                <select class="form-control col-md-4 filter-handle" id="departmentName"
                                    name="departmentName"></select>
                            </div>
                            <div class="row">
                                <div class="col-md-4 form-group">
                                    <label>Bulk Department Update</lable>
                                        <select class="form-control col-md-6" style="width: 44rem;" id="department"
                                            name="department" onchange="bulkDepartmentUpdate(this)">
                                        </select>
                                </div>
                                <div class="col-md-4 form-group">
                                    <label>Bulk Delete</lable>
                                        <button type="submit" class="btn btn-danger bulkdelete" value="Store File"
                                            id="inport" name="import" style="margin: 25px">Delete</button>
                                </div>
                                <div class="col-md-4 form-group">
                                    <label>Bulk Status Update</lable>
                                        <select class="form-control col-md-6" style="width: 44rem;"
                                            id="bulk_statusupdate" name="bulk_statusupdate"
                                            onchange="bulkStatusUpdate(this)">
                                            <option value="">---select---</option>
                                            <option value="1">Active</option>
                                            <option value="0">Inactive</option>
                                        </select>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table id="datatable_managestudent"
                                    class="table table-bordered dt-responsive nowrap filter-table-data"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>
                                                <input type="checkbox" id="select_all" /> Select all
                                            </th>
                                            <th>Student Name</th>
                                            <th>Student Roll No</th>
                                            <th>Contact Number</th>
                                            <th>Email</th>
                                            <th>Password</th>
                                            <th>Department</th>
                                            <th>Status</th>
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
                <form action="<?= $path ?>/managestudents/add-students" method="POST" id="createform">
                    <div class="modal-body">
                        <div class="row">
                            <input type="hidden" name="franchise_id_form" id="franchise_id_form" class="form-control">
                            <div class="form-group col-md-6">
                                <label>Department Name</label>
                                <select id="department_id" name="department_id" class="form-control">
                                </select>
                            </div>

                            <div class="col-md-12 mb-3">
                                <mark>Students Details</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Student Name</label>
                                <input type="text" id="student_name" name="student_name" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Student Roll No.</label>
                                <input type="text" id="student_roll_no" name="student_roll_no" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" id="contact_number" name="contact_number" class="form-control"
                                    min="0">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" id="email" name="email" class="form-control">
                            </div>

                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="password" id="password" class="form-control">
                                <span class="toggle-password text-right" onclick="togglePasswordVisibility()"><i
                                        class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function togglePasswordVisibility() {
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

                            <div class="form-group col-md-3">
                                <label>Confirm Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="confirmpassword" id="confirmpassword" class="form-control">
                                <span class="toggle-confirmpassword text-right"
                                    onclick="toggleConfirmPasswordVisibility()"><i class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function toggleConfirmPasswordVisibility() {
                                var passwordInput = document.getElementById("confirmpassword");
                                var togglePassword = document.querySelector(".toggle-confirmpassword");

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
                                <input type="number" class="form-control" id="contact_number1" name="contact_number1"
                                    min="0">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" class="form-control" id="email1" name="email1">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="password1" id="password1" class="form-control">
                                <span class="toggle-password1 text-right" onclick="togglePassword1Visibility()"><i
                                        class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function togglePassword1Visibility() {
                                var passwordInput = document.getElementById("password1");
                                var togglePassword = document.querySelector(".toggle-password1");

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

                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 2</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" id="parent_name2" name="parent_name2" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" class="form-control" name="contact_number2" id="contact_number2"
                                    min="0">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" class="form-control" name="email2" id="email2">
                            </div>

                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="password2" id="password2" class="form-control">
                                <span class="toggle-password2 text-right" onclick="togglePassword2Visibility()"><i
                                        class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function togglePassword2Visibility() {
                                var passwordInput = document.getElementById("password2");
                                var togglePassword = document.querySelector(".toggle-password2");

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

                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 3</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" name="parent_name3" id="parent_name3" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" class="form-control" id="contact_number3" name="contact_number3"
                                    min="0">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" class="form-control" name="email3" id="email3">
                            </div>

                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="password3" id="password3" class="form-control">
                                <span class="toggle-password3 text-right" onclick="togglePassword3Visibility()"><i
                                        class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function togglePassword3Visibility() {
                                var passwordInput = document.getElementById("password3");
                                var togglePassword = document.querySelector(".toggle-password3");

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
                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 4</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" id="parent_name4" name="parent_name4" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" id="contact_number4" name="contact_number4" class="form-control"
                                    min="0">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" id="email4" name="email4" class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="password4" id="password4" class="form-control">
                                <span class="toggle-password4 text-right" onclick="togglePassword4Visibility()"><i
                                        class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function togglePassword4Visibility() {
                                var passwordInput = document.getElementById("password4");
                                var togglePassword = document.querySelector(".toggle-password4");

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
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" id="submit" class="btn btn-primary">Submit</button>
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
                <form action="<?= $path ?>/managestudents/update-students" method="POST" id="updateform">
                    <div class="modal-body">
                        <div class="row">
                            <input type="hidden" name="id" id="editid">

                            <input type="hidden" id="updatefranchise_id" name="updatefranchise_id" class="form-control">

                            <div class="form-group col-md-6">
                                <label>Department Name</label>
                                <select type="text" id="updatedepartment_id" name="updatedepartment_id"
                                    class="form-control"></select>
                            </div>

                            <div class="col-md-12 mb-3">
                                <mark>Students Details</mark>
                            </div>
                            <div class="form-group col-md-4">
                                <label>Student Name</label>
                                <input type="text" id="updatestudent_name" name="updatestudent_name"
                                    class="form-control">
                            </div>
                            <!-- <div class="form-group col-md-3">
                                <label>Student Roll No.</label>
                                <input type="number" id="updatestudent_roll_no" min="1" name="updatestudent_roll_no"
                                    class="form-control">
                            </div> -->
                            <div class="form-group col-md-4">
                                <label>Contact number</label>
                                <input type="number" id="updatecontact_number" name="updatecontact_number"
                                    class="form-control" min="0">
                            </div>
                            <div class="form-group col-md-4">
                                <label>Email</label>
                                <input type="email" id="updateemail" name="updateemail" class="form-control">
                            </div>
                            <div class="form-group col-md-4">
                                <label>Password</label>
                                <input type="password" id="update_password" name="update_password" class="form-control">
                                <span class="toggle-update_password text-right"
                                    onclick="toggleUpdatePasswordVisibility()"><i class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function toggleUpdatePasswordVisibility() {
                                var passwordInput = document.getElementById("update_password");
                                var togglePassword = document.querySelector(".toggle-update_password");

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
                            <div class="col-md-12 mb-3 d-flex">
                                <mark>Parents Details 1</mark>
                                <div class="text-warning">*</div>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" name="updateparent_name1" id="updateparent_name1"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" class="form-control" id="updatecontact_number1"
                                    name="updatecontact_number1" min="0">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Email</label>
                                <input type="email" class="form-control" id="updateemail1" name="updateemail1">
                            </div>

                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="updatepassword1" id="updatepassword1" class="form-control">
                                <span class="toggle-updatepassword1 text-right"
                                    onclick="toggleUpdatePassword1Visibility()"><i class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function toggleUpdatePassword1Visibility() {
                                var passwordInput = document.getElementById("updatepassword1");
                                var togglePassword = document.querySelector(".toggle-updatepassword1");

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
                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 2</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" id="updateparent_name2" name="updateparent_name2"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" class="form-control" min="0" name="updatecontact_number2"
                                    id="updatecontact_number2">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" class="form-control" name="updateemail2" id="updateemail2">
                            </div>

                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="updatepassword2" id="updatepassword2" class="form-control">
                                <span class="toggle-updatepassword2 text-right"
                                    onclick="toggleUpdatePassword2Visibility()"><i class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function toggleUpdatePassword2Visibility() {
                                var passwordInput = document.getElementById("updatepassword2");
                                var togglePassword = document.querySelector(".toggle-updatepassword2");

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
                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 3</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" name="updateparent_name3" id="updateparent_name3"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" class="form-control" id="updatecontact_number3"
                                    name="updatecontact_number3" min="0">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" class="form-control" name="updateemail3" id="updateemail3">
                            </div>

                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="updatepassword3" id="updatepassword3" class="form-control">
                                <span class="toggle-updatepassword3 text-right"
                                    onclick="toggleUpdatePassword3Visibility()"><i class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function toggleUpdatePassword3Visibility() {
                                var passwordInput = document.getElementById("updatepassword3");
                                var togglePassword = document.querySelector(".toggle-updatepassword3");

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
                            <div class="col-md-12 mb-3">
                                <mark>Parents Details 4</mark>
                            </div>
                            <div class="form-group col-md-3">
                                <label>Parent Name</label>
                                <input type="text" id="updateparent_name4" name="updateparent_name4"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-3">
                                <label>Contact number</label>
                                <input type="number" id="updatecontact_number4" name="updatecontact_number4"
                                    class="form-control" min="0">
                            </div>
                            <div class="form-group col-md-3">
                                <label> Email</label>
                                <input type="email" id="updateemail4" name="updateemail4" class="form-control">
                            </div>

                            <div class="form-group col-md-3">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="updatepassword4" id="updatepassword4" class="form-control">
                                <span class="toggle-updatepassword4 text-right"
                                    onclick="toggleUpdatePassword4Visibility()"><i class="fa fa-eye"
                                        style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                            </div>
                            <script type="text/javascript">
                            function toggleUpdatePassword4Visibility() {
                                var passwordInput = document.getElementById("updatepassword4");
                                var togglePassword = document.querySelector(".toggle-updatepassword4");

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
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" id="submit" class="btn btn-primary">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div class="modal" id="myModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirmation</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="">
                    <div class="modal-body">
                        <p>Please enter the password</p>
                        <div>
                            <label>password</label>
                            <input id="delete_password" name="delete_password" placeholder="enter password" required />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="deleteButton"
                            onclick="bulkDelete()">Delete</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div class="modal" id="myModals" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirmation</h5>
                    <button type="button" class="close" id="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="">
                    <div class="modal-body">
                        <p>Please enter the password</p>
                        <div>
                            <input type="hidden" id="deletes" name="deletes" />
                            <label>password</label>
                            <input id="delete_passworded" name="delete_passworded" placeholder="enter password"
                                required />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="deleteButton"
                            onclick="deleteSubscription()">Delete</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script type="text/javascript">
    jQuery(document).ready(function() {
        jQuery("#createform").validate({
            rules: {
                department_id: 'required',
                parent_name1: 'required',
                contact_number1: {
                    required: true,
                    minlength: 10,
                    maxlength: 10,
                },
                // email1: {
                //     required: true,
                //     email: true,
                // },
                password1: {
                    required: true,
                    minlength: 4,
                    maxlength: 12,
                },
                student_name: 'required',
                student_roll_no: 'required',
                // contact_number: {
                //     required: true,
                //     minlength: 10,
                //     maxlength: 10,
                // },
                // email: {
                //     required: false,
                //     email: true,
                // },
                password: {
                    required: true,
                    minlength: 4,
                    maxlength: 12,
                },
                confirmpassword: {
                    required: true,
                    minlength: 4,
                    maxlength: 12,
                    equalTo: "#password",
                },
            },
            messages: {
                department_id: {
                    required: "Please select department name",
                },
                parent_name1: {
                    required: "Please entered parent name",
                },
                contact_number1: {
                    required: "Please entered contact number",
                },
                // email1: {
                //     required: "Please entered email",
                //     email: "Please enter a valid email address",
                // },
                password1: {
                    required: "Please entered parent password",
                    minlength: "Please field accept min 4 digits",
                    maxlength: "Please field accept max 12 digits",
                },
                student_name: {
                    required: "Please entered student name",
                },
                student_roll_no: {
                    required: "Please entered student roll number",
                },
                // contact_number: {
                //     required: "Please entered student contact number",
                // },
                // email: {
                //     required: "Please entered student email",
                // },
                password: {
                    required: "Please entered student password",
                    minlength: "Please field accept min 4 digits",
                    maxlength: "Please field accept max 12 digits",
                },
                confirmpassword: {
                    required: "Please entered student confirmpassword",
                    minlength: "Please field accept min 4 digits",
                    maxlength: "Please field accept max 12 digits",
                },
            },
        });
    });

    jQuery(document).ready(function() {
        jQuery("#updateform").validate({
            rules: {
                updatedepartment_id: 'required',
                updateparent_name1: 'required',
                updatecontact_number1: {
                    required: true,
                    minlength: 10,
                    maxlength: 10,
                },
                updateemail1: {
                    required: true,
                    email: true,
                },
                updatepassword1: {
                    required: true,
                },
                updatestudent_name: 'required',
                updatestudent_roll_no: 'required',
                // updatecontact_number: {
                //     required: true,
                //     minlength: 10,
                //     maxlength: 10,
                // },
                // updateemail: {
                //     required: false,
                //     email: true,
                // },
                update_password: {
                    required: true,
                    minlength: 4,
                    maxlength: 12,
                },
            },
            messages: {
                updatedepartment_id: {
                    required: "Please select department name",
                },
                updateparent_name1: {
                    required: "Please entered parent name",
                },
                updatecontact_number1: {
                    required: "Please entered contact number",
                },
                updateemail1: {
                    required: "Please entered email",
                    email: "Please enter a valid email address",
                },
                updatepassword1: {
                    required: "PLease enteres parent password",
                },
                updatestudent_name: {
                    required: "Please entered student name",
                },
                updatestudent_roll_no: {
                    required: "Please entered student roll number",
                },
                // updatecontact_number: {
                //     required: "Please entered student contact number",
                // },
                // updateemail: {
                //     required: "Please entered student email",
                // },
                update_password: {
                    required: "Please entered student password",
                    minlength: "Please field accept min 4 digits",
                    maxlength: "Please field accept max 12 digits",
                },
            },
        });
    });

    jQuery(document).ready(function() {
        jQuery("#uploadfile").validate({
            rules: {
                department: 'required',
            },
            messages: {
                department: {
                    required: "Please select department",
                },
            },
        });
    });

    $(document).on('click', '.delete', function() {
        var id = $(this).data('id');
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
                $('#myModals').modal('show');
                document.getElementById('deletes').value = id;
            }
        });
    });

    $(document).on('submit', '#createform', function(e) {
        e.preventDefault();
        const item = {
            franchise_id: document.getElementById("franchise_id_form").value.trim(),
            department_id: document.getElementById("department_id").value.trim(),
            name: document.getElementById("student_name").value.trim(),
            student_roll_no: document.getElementById("student_roll_no").value.trim(),
            email: document.getElementById("email").value.trim(),
            contact: document.getElementById("contact_number").value.trim(),
            password: document.getElementById("password").value.trim(),
            confirmpassword: document.getElementById('confirmpassword').value.trim(),
            parent: [{
                    name: document.getElementById("parent_name1").value.trim(),
                    contact: document.getElementById("contact_number1").value.trim(),
                    email: document.getElementById("email1").value.trim(),
                    password: document.getElementById("password1").value.trim(),
                },
                {
                    name: document.getElementById("parent_name2").value.trim(),
                    contact: document.getElementById("contact_number2").value.trim(),
                    email: document.getElementById("email2").value.trim(),
                    password: document.getElementById("password2").value.trim(),
                },
                {
                    name: document.getElementById("parent_name3").value.trim(),
                    contact: document.getElementById("contact_number3").value.trim(),
                    email: document.getElementById("email3").value.trim(),
                    password: document.getElementById("password3").value.trim(),
                },
                {
                    name: document.getElementById("parent_name4").value.trim(),
                    contact: document.getElementById("contact_number4").value.trim(),
                    email: document.getElementById("email4").value.trim(),
                    password: document.getElementById("password4").value.trim(),
                },
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


    $(document).on('submit', '#updateform', function(e) {
        e.preventDefault();
        const item = {
            id: document.getElementById("editid").value.trim(),
            franchise_id: document.getElementById("updatefranchise_id").value.trim(),
            department_id: document.getElementById("updatedepartment_id").value.trim(),
            name: document.getElementById("updatestudent_name").value.trim(),
            email: document.getElementById("updateemail").value.trim(),
            contact: document.getElementById("updatecontact_number").value.trim(),
            password: document.getElementById("update_password").value.trim(),

            parent: [{
                    name: document.getElementById("updateparent_name1").value.trim(),
                    contact: document.getElementById("updatecontact_number1").value.trim(),
                    email: document.getElementById("updateemail1").value.trim(),
                    password: document.getElementById("updatepassword1").value.trim(),
                },
                {
                    name: document.getElementById("updateparent_name2").value.trim(),
                    contact: document.getElementById("updatecontact_number2").value.trim(),
                    email: document.getElementById("updateemail2").value.trim(),
                    password: document.getElementById("updatepassword2").value.trim(),
                },
                {
                    name: document.getElementById("updateparent_name3").value.trim(),
                    contact: document.getElementById("updatecontact_number3").value.trim(),
                    email: document.getElementById("updateemail3").value.trim(),
                    password: document.getElementById("updatepassword3").value.trim(),
                },
                {
                    name: document.getElementById("updateparent_name4").value.trim(),
                    contact: document.getElementById("updatecontact_number4").value.trim(),
                    email: document.getElementById("updateemail4").value.trim(),
                    password: document.getElementById("updatepassword4").value.trim(),
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