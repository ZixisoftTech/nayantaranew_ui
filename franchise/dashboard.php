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
if (!localStorage.getItem("franchisetoken")) {
    window.location.href = '<?= $basePath ?>/franchise/login.php';
}

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
            getTotalActive(response.data.Id);
            getTotalInactive(response.data.Id);
            getTotalCallMade(response.data.Id);
            getTotalUsedBalance(response.data.Id);
            getTotalAvailableBalance(response.data.Id);
            getTotalDepartment(response.data.Id);
        },
        error: function(xhr, desc, err) {}
    });
});

async function getTotalActive(id) {
    let result = await fetch('<?= $path ?>/api/active-student/' + id);
    result = await result.json();
    $('#active').html(result.data[0].active_student ? result.data[0].active_student : "0");
};

async function getTotalInactive(id) {
    let result = await fetch('<?= $path ?>/api/inactive-student/' + id);
    result = await result.json();
    $('#inactive').html(result.data[0].inactive_student ? result.data[0].inactive_student : "0");
};

async function getTotalCallMade(id) {
    let result = await fetch('<?= $path ?>/api/totalcall-made/' + id);
    result = await result.json();
    $('#call_made').html(result.data[0].call_made ? result.data[0].call_made : "0");
};

async function getTotalUsedBalance(id) {
    let result = await fetch('<?= $path ?>/api/totaluse-balance/' + id);
    result = await result.json();
    $('#used_balance').html(result.data[0].used_balance ? result.data[0].used_balance : "0");
};

async function getTotalAvailableBalance(id) {
    let result = await fetch('<?= $path ?>/api/totalavailable-min/' + id);
    result = await result.json();
    $('#available_balance').html(result.data[0].available_balance ? result.data[0].available_balance : "0");
};

async function getTotalDepartment(id) {
    let result = await fetch('<?= $path ?>/api/total_department/' + id);
    result = await result.json();
    $('#department').html(result.data[0].total_department ? result.data[0].total_department : "0");
};
</script>

<body class="bg2" data-sidebar="dark">
    <div class="page-content">
        <div class="container-fluid">
            <div class="row">
                <div class="col-xl-12">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/franchise/manage_students.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Total Active</p>
                                                <h4 class="mb-0" id="active"></h4>
                                            </div>

                                            <div
                                                class="mini-stat-icon avatar-sm rounded-circle bg-primary align-self-center">
                                                <span class="avatar-title">
                                                    <i class="bx bx-copy-alt font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/franchise/manage_students.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="credit-min font-weight-medium">Total Inactive</p>
                                                <h4 class="mb-0" id="inactive"></h4>
                                            </div>

                                            <div
                                                class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                                <span class="avatar-title rounded-circle bg-primary">
                                                    <i class="bx bx-archive-in font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/franchise/call_history.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Total Call Made</p>
                                                <h4 class="mb-0" id="call_made"></h4>
                                            </div>

                                            <div
                                                class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                                <span class="avatar-title rounded-circle bg-primary">
                                                    <i class="bx bx-purchase-tag-alt font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card mini-stats-wid">
                                <div class="card-body">
                                    <div class="media">
                                        <div class="media-body">
                                            <p class="text-muted font-weight-medium">Total Used Balance</p>
                                            <h4 class="mb-0" id="used_balance"></h4>
                                        </div>

                                        <div
                                            class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                            <span class="avatar-title rounded-circle bg-primary">
                                                <i class="bx bx-purchase-tag-alt font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card mini-stats-wid">
                                <div class="card-body">
                                    <div class="media">
                                        <div class="media-body">
                                            <p class="text-muted font-weight-medium">Total Available Balance</p>
                                            <h4 class="mb-0" id="available_balance"></h4>
                                        </div>

                                        <div
                                            class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                            <span class="avatar-title rounded-circle bg-primary">
                                                <i class="bx bx-purchase-tag-alt font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card mini-stats-wid">
                                <div class="card-body">
                                    <div class="media">
                                        <div class="media-body">
                                            <p class="text-muted font-weight-medium">Total Department</p>
                                            <h4 class="mb-0" id="department"></h4>
                                        </div>

                                        <div
                                            class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                            <span class="avatar-title rounded-circle bg-primary">
                                                <i class="bx bx-purchase-tag-alt font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>



    <?php include("../include/footer.php") ?>
    <?php include("../include/foot.php") ?>