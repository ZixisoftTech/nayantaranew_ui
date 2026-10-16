<?php include("../include/head.php") ?>
<?php include("../include/student_navbar.php") ?>
<?php include("../include/sidebar_student.php") ?>
<?php 

// $basePath = 'http://192.168.29.47/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
require_once __DIR__ . '/../include/config.php'; $basePath = nt_base('http://nayantarabyspacs.co.in'); 

// $path = "http://192.168.29.47:8085";
// $path = "http://65.0.164.127:8000"; 
$path = nt_api('http://nayantarabyspacs.co.in:8085');

?>

<script>
async function getName() {
    const post = await fetch("<?= $path ?>/api/get-studentname", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tokenStudent
            }),
        })
        .then(response => response.json())
        .then((data) => {
            var Name = document.getElementById('studentname').innerText = data.data[0].name;
            getCallHistory(data.data[0].id);
            getTimeSchedule(data.data[0].id)
        }).catch((error) => {
            console.log("error =>", error);
        })
}
getName();

async function getCallHistory(id) {
    var dataTable = $("#callhistory").DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        processing: true,
        serverSide: true,
        serverMethod: "get",
        ajax: {
            url: '<?= $path ?>/api/get-webcallhistory/' + id,
        },
        aaSorting: [],
        columns: [{
                data: "index"
            },
            {
                data: "date"
            },
            {
                data: "student_name"
            },
            {
                data: "parent_name"
            },
            {
                data: "minute"
            }
        ],
    });
}

async function getTimeSchedule(studentId) {
    var Id = studentId;
    const item = {
        id: Id,
    }
    $.ajax({
        url: '<?= $path ?>/api/get-timeschedule',
        type: 'POST',
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
                localStorage.removeItem("studentToken");
                window.location.href = '<?= $basePath ?>/student/login.php';
            } else {
                console.log("You are on time");
            }
        },
        error: function(xhr, desc, err) {}
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
                                    <h5>Call History</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <!-- <a href="javascript:void(0);" data-toggle="modal" data-target=".add"
                                        class="btn btn-primary">Create</a> -->
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table id="callhistory" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Date And Time</th>
                                            <th>Student Name</th>
                                            <th>Parent Name</th>
                                            <th>Minutes</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getCallHistory">
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