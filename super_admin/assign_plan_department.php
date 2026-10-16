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
    const departmentId = document.getElementById("plan_id");
    departmentId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    departmentId.innerHTML += getPlan.data.map((data, index) =>
        `<option value=${data.id}>${data.plan_name}</option>`
    )
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
                            </div>
                        </div>
                        <form method="POST" action="<?= $path ?>/api/planassign-departmentid" id="add_plan">
                            <div class="row">
                                <div class="form-group col-md-4">
                                    <label>Select Franchise</label>
                                    <select class="form-control" id="franchise_id" name="franchise_id"
                                        onchange="getDepartment(this)"></select>
                                </div>
                                <div class="form-group col-md-3">
                                    <label>Select Department</label>
                                    <select class="form-control" id="department_id" name="department_id"></select>
                                </div>
                                <div class="form-group col-md-3">
                                    <label>Select Plan</label>
                                    <select class="form-control" id="plan_id" name="plan_id"></select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <div style="align-self: center;">
                                     <button type="submit" id="add" class="btn btn-primary create-btn">Submit
                                          <div class="loader" id="loader"></div>
                                     </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <?php include("../include/foot.php") ?>
    <?php include("../include/footer.php") ?>

    <link href="https://code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css" rel="stylesheet">
    <script src="https://code.jquery.com/ui/1.10.4/jquery-ui.js"></script>
    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>

    <script type="text/javascript">

    jQuery(document).ready(function() {
        jQuery("#add_plan").validate({
            rules: {
                franchise_id: 'required',
                department_id: 'required',
                plan_id: 'required',
            },
            messages: {
                franchise_id: {
                    required: "Please Select Franchise",
                },
                department_id: {
                    required: "Please Select Department",
                },
                plan_id: {
                    required: 'Please Select Plan',
                },
            },
        });
    });

    $(document).on('submit', '#add_plan', function(e) {
        e.preventDefault();
        $('#add').prop('disabled', true);
        $('#loader').show();
        const item = {
            franchsie_id: document.getElementById("franchise_id").value.trim(),
            department_id: document.getElementById("department_id").value.trim(),
            plan_id: document.getElementById("plan_id").value.trim()
        };
        $.ajax({
            url: $(this).attr("action"),
            type: $(this).attr("method"),
            dataType: "JSON",
            data: JSON.stringify(item),
            contentType: "application/json",
            success: function(response, status) {
                $('#loader').hide();
                $('#add').prop('disabled', false);
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