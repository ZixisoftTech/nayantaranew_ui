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

<script arc="https://code.jquery.com/jquery-3.5.1.js"></script>
<script arc="https://cdn.datatables.net/1.13.3/js/jquery.dataTables.min.js"></script>
<script arc="https://cdn.datatables.net/buttons/2.3.5/js/dataTables.buttons.min.js"></script>
<script arc="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
<script arc="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js"></script>
<script arc="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js"></script>

<script>
$(document).ready(function() {
    var dataTable = $("#studenttickets").DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        processing: true,
        serverSide: true,
        serverMethod: "get",
        ajax: {
            url: "<?= $path ?>/api/get-studentissue",
        },
        aaSorting: [],
        columns: [{
                data: "index"
            },
            {
                data: "student_name"
            },
            {
                data: "roll_no"
            },
            {
                data: "subject"
            },
            {
                data: "message"
            },
        ],
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
                                    <h5>Student Tickets</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <!-- <a href="javascript:void(0);" data-toggle="modal" data-target=".add"
                                        class="btn btn-primary create-btn">Create</a> -->
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table id="studenttickets" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Student Name</th>
                                            <th>Student Roll No</th>
                                            <th>Subject</th>
                                            <th>Message</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getStudentIssue">
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
                <form action="">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label>Franchise Name</label>
                                <select name="" id="" class="form-control">
                                    <option value="">Select Franchise</option>
                                    <option value="">demo 1</option>
                                    <option value="">demo 2</option>
                                    <option value="">demo 3</option>
                                </select>
                            </div>
                            <div class="col-md-12 mb-3">
                                <mark>Parents Details</mark>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Parent Name</label>
                                <input type="text" placeholder="Enter ..." class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Contact number</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label> Email</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Password</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="col-md-12 mb-3">
                                <mark>Students Details</mark>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Student Name</label>
                                <input type="text" placeholder="Enter ..." class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Contact number</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label> Email</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Password</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Confirm Password</label>
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
        <div class="modal-dialog modal-lg">
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
                                <select name="" id="" class="form-control">
                                    <option value="">Select Franchise</option>
                                    <option value="">demo 1</option>
                                    <option value="">demo 2</option>
                                    <option value="">demo 3</option>
                                </select>
                            </div>
                            <div class="col-md-12 mb-3">
                                <mark>Parents Details</mark>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Parent Name</label>
                                <input type="text" placeholder="Enter ..." class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Contact number</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label> Email</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Password</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="col-md-12 mb-3">
                                <mark>Students Details</mark>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Student Name</label>
                                <input type="text" placeholder="Enter ..." class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Contact number</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label> Email</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Password</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Confirm Password</label>
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