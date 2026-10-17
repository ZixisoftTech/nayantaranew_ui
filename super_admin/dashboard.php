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

<script>
if (!localStorage.getItem("admintoken")) { //HERE IS NOT WORKING
    window.location.href = '<?= $basePath ?>/';
}
</script>

<body class="bg2" data-sidebar="dark">
    <div class="page-content">
        <div class="container-fluid">
            <div class="row">
                <div class="col-xl-12">
                    <div class="row">
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/super_admin/manage_franchise.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Franchises</p>
                                                <h4 class="mb-0" id="getFranchise"></h4>
                                            </div>

                                            <div
                                                class="mini-stat-icon avatar-sm rounded-circle bg-primary align-self-center">
                                                <span class="avatar-title">
                                                    <i class="bx bx-buildings font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/super_admin/student_summary.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Available Minutes</p>
                                                <h4 class="mb-0" id="available_min"></h4>
                                            </div>

                                            <div
                                                class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                                <span class="avatar-title rounded-circle bg-primary">
                                                    <i class="bx bx-timer font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/super_admin/student_summary.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Minutes Used</p>
                                                <h4 class="mb-0" id="usage_min"></h4>
                                            </div>

                                            <div
                                                class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                                <span class="avatar-title rounded-circle bg-primary">
                                                    <i class="bx bx-time-five font-size-24"></i>
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
                                            <p class="text-muted font-weight-medium">Active Users</p>
                                            <h4 class="mb-0" id="active_student"></h4>
                                        </div>

                                        <div
                                            class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                            <span class="avatar-title rounded-circle bg-primary">
                                                <i class="bx bx-user-check font-size-24"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/super_admin/manage_department.php">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Unique Devices</p>
                                                <h4 class="mb-0" id="unique_device"></h4>
                                            </div>

                                            <div
                                                class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                                <span class="avatar-title rounded-circle bg-primary">
                                                    <i class="bx bx-devices font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div class="col-sm-6 col-xl-3">
                            <div class="card mini-stats-wid">
                                <a href="<?= $basePath ?>/super_admin/students.php?balance=zero">
                                    <div class="card-body">
                                        <div class="media">
                                            <div class="media-body">
                                                <p class="text-muted font-weight-medium">Zero Balance Students</p>
                                                <h4 class="mb-0" id="zero_balance"></h4>
                                            </div>

                                            <div
                                                class="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                                                <span class="avatar-title rounded-circle bg-primary">
                                                    <i class="bx bx-error-circle font-size-24"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php include("../include/dashboard_overview.php"); ?>
            <?php $ntChartsPortal = 'admin'; include("../include/dashboard_charts.php"); ?>
        </div>
    </div>



    <?php include("../include/footer.php") ?>
    <?php include("../include/foot.php") ?>

    <script>
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '<?= $path ?>/api/franchise-count');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            // Process the response data
            $('#getFranchise').html(data.data[0].count ? data.data[0].count : "0");
        } else {
            console.error('Request failed. Status:', xhr.status);
        }
    };
    xhr.onerror = function() {
        console.error('Request failed');
    };
    xhr.send();

    var getTotalBalance = new XMLHttpRequest();
    getTotalBalance.open('GET', '<?= $path ?>/api/total-balance');
    getTotalBalance.onload = function() {
        if (getTotalBalance.status === 200) {
            var data = JSON.parse(getTotalBalance.responseText);
            // Process the response data
            $('#available_min').html(data.data[0].sum_balance ? data.data[0].sum_balance : "0");
        } else {
            console.error('Request failed. Status:', getTotalBalance.status);
        }
    };
    getTotalBalance.onerror = function() {
        console.error('Request failed');
    };
    getTotalBalance.send();

    var getUsageMin = new XMLHttpRequest();
    getUsageMin.open('GET', '<?= $path ?>/api/totalused-balance');
    getUsageMin.onload = function() {
        if (getUsageMin.status === 200) {
            var data = JSON.parse(getUsageMin.responseText);
            // Process the response data
            $('#usage_min').html(data.data[0].used_balance ? data.data[0].used_balance : "0");
        } else {
            console.error('Request failed. Status:', getUsageMin.status);
        }
    };
    getUsageMin.onerror = function() {
        console.error('Request failed');
    };
    getUsageMin.send();

    var getActiveUser = new XMLHttpRequest();
    getActiveUser.open('GET', '<?= $path ?>/api/totalstudent-active');
    getActiveUser.onload = function() {
        if (getActiveUser.status === 200) {
            var data = JSON.parse(getActiveUser.responseText);
            // Process the response data
            $('#active_student').html(data.data[0].count ? data.data[0].count : "0");
        } else {
            console.error('Request failed. Status:', getActiveUser.status);
        }
    };
    getActiveUser.onerror = function() {
        console.error('Request failed');
    };
    getActiveUser.send();

    var getUniqueDevice = new XMLHttpRequest();
    getUniqueDevice.open('GET', '<?= $path ?>/api/totalunique-devise');
    getUniqueDevice.onload = function() {
        if (getUniqueDevice.status === 200) {
            var data = JSON.parse(getUniqueDevice.responseText);
            // Process the response data
            $('#unique_device').html(data.data[0].total_unique_devices ? data.data[0].total_unique_devices : "0");
        } else {
            console.error('Request failed. Status:', getUniqueDevice.status);
        }
    };
    getUniqueDevice.onerror = function() {
        console.error('Request failed');
    };
    getUniqueDevice.send();
    </script>
    <script src="<?= $basePath ?>/assets/admin/js/nt-overview.js?v=1"></script>
