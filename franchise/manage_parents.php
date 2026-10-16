<?php include("../include/head.php") ?>
<?php include("../include/franchise_navbar.php") ?>
<?php include("../include/sidebar_franchise.php") ?>
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
    $.ajax({
        url: "<?= $path ?>/franchise/api/franchisename",
        type: "POST",
        dataType: "JSON",
        data: JSON.stringify({
            franchisetoken
        }),
        contentType: "application/json",
        success: function(response, status) {
            getParents(response.data.Id);
        },
        error: function(xhr, desc, err) {}
    });
});

async function getParents(id) {
    var dataTable = $("#datatable_manageparents").DataTable({
        dom: 'Bfrtip',
        pageLength: 25,
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        searching: true,
        processing: true,
        serverSide: true,
        serverMethod: "get",
        ajax: {
            url: '<?= $path ?>/managestudents/get-parentsbyfranchise/' + id,
        },
        aaSorting: [],
        columns: [{
                data: "index"
            },
            {
                data: "student_roll_no"
            },
            {
                data: "student_name"
            },
            {
                data: "name"
            },
            {
                data: "contact"
            },
            {
                data: 'email'
            },
            {
                data: "password"
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
                                    <h5>Manage Parents</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <!-- <a href="javascript:void(0);" data-toggle="modal" data-target=".add"
                                        onclick="getStateName()" class="btn btn-primary create-btn">Create</a> -->
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table id="datatable_manageparents" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Student Roll No</th>
                                            <th>Student Name</th>
                                            <th>Parent Name</th>
                                            <th>Contact</th>
                                            <th>Email</th>
                                            <th>Password</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getparents">
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
                <form method="POST" action="<?= $path ?>/api/add-franchise" id="createform">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label>Franchise Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="franchiseName" id="franchiseName" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Franchiser Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="franchiserName" id="franchiserName" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Email<span class="req" style="color:red">*</span></label>
                                <input type="email" name="email" id="email" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="password" id="password" class="form-control">
                            </div>
                            <!-- <script type="text/javascript">
                                var state= false;
                                function toggle(){
                                    if(state){
                                        document.getElementById("password").setAttribute("type","password");
                                        state= false;
                                    }else{
                                        document.getElementById("password").setAttribute("type","text");
                                        state= true;
                                    }
                                }
                            </script> -->
                            <div class="form-group col-md-6">
                                <label>Address<span class="req" style="color:red">*</span></label>
                                <input type="text" name="address" id="address" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>State<span class="req" style="color:red">*</span></label>
                                <select name="state" id="state" class="form-control" onchange="getCityName(this)">
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>City<span class="req" style="color:red">*</span></label>
                                <select name="city" id="city" class="form-control">
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Pincode<span class="req" style="color:red">*</span></label>
                                <input type="number" min="1" name="pincode" id="pincode" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Jitsi Room URL</label>
                                <input type="text" name="room_id" id="room_id" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>By Plan Permission</label>
                                <select name="by_plan_permision" id="by_plan_permision" class="form-control">
                                    <option value='' selected disabled>---Select---</option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Remark(optional)</label>
                                <input type="text" name="remark" id="remark" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" name="submit" id="submit" class="btn btn-primary create-btn"
                            value="add">Submit</button>
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
                <form method="POST" action="" id="editform" onsubmit="return updateFranchise()">
                    <div class="modal-body">
                        <div class="row">
                            <input type="hidden" name="Id" id="editId">
                            <div class="form-group col-md-6">
                                <label>Franchise Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="editfranchiseName" id="editfranchiseName" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Franchiser Name<span class="req" style="color:red">*</span></label>
                                <input type="text" name="editfranchiserName" id="editfranchiserName"
                                    class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Email<span class="req" style="color:red">*</span></label>
                                <input type="email" name="editemail" id="editemail" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Password<span class="req" style="color:red">*</span></label>
                                <input type="password" name="editpassword" id="editpassword" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Address<span class="req" style="color:red">*</span></label>
                                <input type="text" name="editaddress" id="editaddress" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>State<span class="req" style="color:red">*</span></label>
                                <select name="editstate" id="editstate" class="form-control"
                                    onchange="updateCity(this)"></select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>City<span class="req" style="color:red">*</span></label>
                                <select name="editcity" id="editcity" class="form-control"></select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Pincode<span class="req" style="color:red">*</span></label>
                                <input type="number" name="editpincode" min="1" id="editpincode" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Jitsi Room URL</label>
                                <input type="text" name="editjitsi_url" id="editjitsi_url" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>By Plan Permission</label>
                                <select name="editby_plan_permision" id="editby_plan_permision" class="form-control">
                                    <option value='' selected disabled>---Select---</option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>Remark(optional)</label>
                                <input type="text" name="editremark" id="editremark" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" name="submit" class="btn btn-primary create-btn"
                            value="add">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>