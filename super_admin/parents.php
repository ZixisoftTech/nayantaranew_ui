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
    const departmentId = document.getElementById("franchise_id");
    departmentId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    departmentId.innerHTML += getName.data.map((data, index) =>
        `<option value=${data.Id}>${data.franchiseName}</option>`
    )
};
getFranchise()
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
                                            <th>Name</th>
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

    <!-- <link href="https://code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css" rel="stylesheet">
    <script src="https://code.jquery.com/ui/1.10.4/jquery-ui.js"></script> -->
    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script>
    $('#datatable_parents').DataTable({
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