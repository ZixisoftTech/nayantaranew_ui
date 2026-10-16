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
async function getName() {
    const post = await fetch("<?= $path ?>/franchise/api/franchisename", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                franchisetoken
            }),

        })
        .then(response => response.json())
        .then((response) => {
            getDepartment(response.data.Id);
        }).catch((error) => {
            console.log("error =>", error);
        })
}
getName();

async function getDepartment(t) {
    var id = t;
    let getName = await fetch('<?= $path ?>/api/get-department/' + id);
    getName = await getName.json();
    const departmentId = document.getElementById("department_id");
    departmentId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    departmentId.innerHTML += getName.data.map((data, index) =>
        `<option value=${data.id}>${data.name}</option>`
    )
};

async function getStudentName(t) {
    var id = t.value;
    let getName = await fetch('<?= $path ?>/api/get-studentnames/' + id);
    getName = await getName.json();
    const studentId = document.getElementById("student_id");
    studentId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    studentId.innerHTML += getName.data.map((data, index) =>
        `<option value=${data.id}>${data.name}</option>`
    )
};
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
                                    <h5>Transaction History</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <!-- <a href="javascript:void(0);" data-toggle="modal" data-target=".add"
                                        class="btn btn-primary">Create</a> -->
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4 form-group">
                                    <label for="cars">Select Department</label>
                                    <select id="department_id" name="department_id" class="form-control"
                                        onchange="getStudentName(this)"></select>
                                    </select>
                                </div>
                                <div class="col-md-4 form-group">
                                    <label for="cars">Select Student</label>
                                    <select id="student_id" name="student_id" class="form-control"></select>
                                    </select>
                                </div>
                                <div class="form-group col-md-3">
                                    <label>Select Date From</label>
                                    <input type="text" id="start_date" placeholder="yyyy-mm-dd" class="form-control">
                                </div>
                                <div class="form-group col-md-3">
                                    <label>To</label>
                                    <input type="text" id="end_date" placeholder="yyyy-mm-dd" class="form-control">
                                </div>
                                <div class="col-md-2" style="display:flex">
                                    <div style="align-self: center;">
                                        <button type="submit" id="submit" name="submit"
                                            class="btn btn-primary create-btn">Submit</button>
                                    </div>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table id="datatable_transaction" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Purchse Date</th>
                                            <th>Student Name</th>
                                            <th>Plan name</th>
                                            <th>Price</th>
                                            <th>Minutes</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getplans">
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
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Create</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label>Franchise Name</label>
                                <input type="text" placeholder="Enter ..." class="form-control">
                            </div>
                            <div class="form-group col-md-12">
                                <label>Credit Usage</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-12">
                                <label>Last Credited</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-12">
                                <label>Last credited minutes</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-12">
                                <label> Credit Tab</label>
                                <input type="text" class="form-control">
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
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Edit</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label>Franchise Name</label>
                                <input type="text" placeholder="Enter ..." class="form-control">
                            </div>
                            <div class="form-group col-md-12">
                                <label>Credit Usage</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-12">
                                <label>Last Credited</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-12">
                                <label>Last credited minutes</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-12">
                                <label> Credit Tab</label>
                                <input type="text" class="form-control">
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

    <link href="https://code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css" rel="stylesheet">
    <script src="https://code.jquery.com/ui/1.10.4/jquery-ui.js"></script>
    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    
    <script>
    $('#datatable_transaction').DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        searching: true,
        paging: true,
        processing: true,
        serverSide: true,
        serverMethod: 'get',
        ajax: {
            url: `<?= $path ?>/managestudents/get-transactionbystudentid`,
            data: function(d) {
                d.id = $('#student_id').val()
                d.start_date = $('#start_date').val()
                d.end_date = $('#end_date').val()
            },
            dataType: "JSON",
        },
        aaSorting: [],
        columns: [{
                data: 'index'
            },
            {
                data: 'purchase_date'
            },
            {
                data: 'name'
            },
            {
                data: 'plan_name'
            },
            {
                data: 'price'
            },
            {
                data: 'minute'
            }
        ],
    });

    var table = $('#datatable_transaction').DataTable();

    $('#submit').on('click', function() {
        table
            .draw();
    });

    $(document).ready(function() {
        $("#start_date").datepicker({
            dateFormat: "yy-mm-dd",
        });
    });

    $(document).ready(function() {
        $("#end_date").datepicker({
            dateFormat: "yy-mm-dd",
            minDate: 0,
        });
    });
    </script>