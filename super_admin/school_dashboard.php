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
if (!localStorage.getItem("franchisetoken")) {
    window.location.href = '<?= $basePath ?>/';
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
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/super_admin/school_students.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Active Students</p>
                                                <h4 class="mb-0" id="active"></h4>
                                            </div>

                                            <div
                                                class="mini-stat-icon avatar-sm rounded-circle bg-primary align-self-center">
                                                <span class="avatar-title">
                                                    <i class="bx bx-user-check font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/super_admin/school_students.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Inactive Students</p>
                                                <h4 class="mb-0" id="inactive"></h4>
                                            </div>

                                            <div
                                                class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                                <span class="avatar-title rounded-circle bg-primary">
                                                    <i class="bx bx-user-x font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/super_admin/school_call_history.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Calls Made</p>
                                                <h4 class="mb-0" id="call_made"></h4>
                                            </div>

                                            <div
                                                class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                                <span class="avatar-title rounded-circle bg-primary">
                                                    <i class="bx bx-phone-call font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <div class="card-body">
                                    <div class="media">
                                        <div class="media-body">
                                            <p class="text-muted font-weight-medium">Used Balance</p>
                                            <h4 class="mb-0" id="used_balance"></h4>
                                        </div>

                                        <div
                                            class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                            <span class="avatar-title rounded-circle bg-primary">
                                                <i class="bx bx-time-five font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <div class="card-body">
                                    <div class="media">
                                        <div class="media-body">
                                            <p class="text-muted font-weight-medium">Available Balance</p>
                                            <h4 class="mb-0" id="available_balance"></h4>
                                        </div>

                                        <div
                                            class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                            <span class="avatar-title rounded-circle bg-primary">
                                                <i class="bx bx-wallet font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <div class="card-body">
                                    <div class="media">
                                        <div class="media-body">
                                            <p class="text-muted font-weight-medium">Departments</p>
                                            <h4 class="mb-0" id="department"></h4>
                                        </div>

                                        <div
                                            class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                            <span class="avatar-title rounded-circle bg-primary">
                                                <i class="bx bx-sitemap font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php $ntChartsPortal = 'franchise'; include("../include/dashboard_charts.php"); ?>
        </div>
    </div>



    <?php include("../include/footer.php") ?>
    <?php include("../include/foot.php") ?>