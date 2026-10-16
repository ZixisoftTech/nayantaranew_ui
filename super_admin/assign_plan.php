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
    getPlan(id);
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

async function getPlan(id) {
    let getPlan = await fetch('<?= $path ?>/api/get-plans/' + id);
    getPlan = await getPlan.json();
    let get = getPlan.data;
    if (get) {
        document.getElementById('getPlan').innerHTML = get.map((data, index) =>
            `<tr class="content">
                                                <td>${index + 1}</td>
                                                <td>${data.plan_name}</td>
                                                <td>${data.price}</td>
                                                <td>${data.talk_time}</td>
                                                <td><button class="btn btn-success plan_assign" data-id="${data.id}" style="padding:2px;">Select</button>
                                                </td>
                     </tr>`
        ).join('');
    } else {
        document.getElementById('getPlan').innerHTML =
            "<tr><td colspan='5'>No data available in table</td></tr>";
    }
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
                                    <h5>Assign Plan</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".assign"
                                        class="btn btn-primary assign-btn">Assign Plan</a>
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
                                <table id="datatable_student"
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
                                            <th>Franchise</th>
                                            <th>Department</th>
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


    <div class="modal fade assign" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Assign Plan</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table id="datatable_assign" class="table table-bordered dt-responsive nowrap"
                            style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                            <thead>
                                <tr>
                                    <th>S. No</th>
                                    <th>Plan Name</th>
                                    <th>Price</th>
                                    <th>Talk Time </th>
                                    <th>Assign</th>
                                </tr>
                            </thead>
                            <tbody id="getPlan">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <link href="https://code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css" rel="stylesheet">
    <script src="https://code.jquery.com/ui/1.10.4/jquery-ui.js"></script>
    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>

    <script type="text/javascript">
    $('#datatable_student').DataTable({
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
            url: `<?= $path ?>/api/get-studentbyfranchise`,
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
                data: 'checkbox'
            },
            {
                data: 'name'
            },
            {
                data: 'student_roll_no'
            },
            {
                data: 'contact'
            },
            {
                data: 'email'
            },
            {
                data: 'department_name'
            },
            {
                data: 'franchise_name'
            },
        ],
        "columnDefs": [{
            "targets": [1],
            "orderable": false
        }]
    });

    var table = $('#datatable_student').DataTable();

    $('#submit').on('click', function() {
        table
            .draw();
    });

    var student_ids = [];
    $(document).on('click', '.checkbox', function() {
        if ($(this).is(':checked')) {
            student_ids.push($(this).val());
            console.log(student_ids);
        } else {
            student_ids.pop($(this).val());
        }
    });

    $(document).on('click', '.plan_assign', function() {
        var plan_id = $(this).data('id');
        $.ajax({
            url: '<?= $path. '/api/plan-purchase' ?>',
            type: 'POST',
            data: {
                studentid: JSON.stringify(student_ids),
                planid: plan_id
            },
            dataType: 'json',
            success: function(data, textStatus, jqXHR) {
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
            },
            error: function(jqXHR, textStatus, errorThrown) {}
        })
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
    </script>