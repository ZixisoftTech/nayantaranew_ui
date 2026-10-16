<?php 
// $basePath = 'http://localhost/nayantara/nayantarafrontend';
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
$basePath = 'https://nayantarabyspacs.co.in'; 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000"; 
$path = "https://nayantarabyspacs.co.in";

?>

<script type="text/javascript">
const franchisecheck = localStorage.getItem('franchisetoken');
if (franchisecheck == null) {
    window.location.href = '<?= $basePath ?>/franchise/login.php';
}
const franchisetoken = localStorage.getItem("franchisetoken")

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
        .then((data) => {
            var franchiseName = document.getElementById('franchisename').innerText = data.data.franchiseName;
        }).catch((error) => {
            console.log("error =>", error);
        })
}
getName();

async function Logout() {
    localStorage.removeItem("franchisetoken");
    window.location.href = '<?= $basePath ?>/franchise/login.php';
}
</script>
<div id="layout-wrapper">
    <header id="page-topbar">
        <div class="navbar-header">
            <div class="d-flex">
                <div class="navbar-brand-box">
                    <!-- <a href="javascript:void(0);" class="logo logo-light">
                        <span class="logo-sm">
                            <img src="assets/admin/images/logo.png" alt="" width="185px">
                        </span>
                        <span class="logo-lg">
                            <img src="assets/admin/images/logo.png" alt="" width="185px">
                        </span>
                    </a> -->
                    <h5 class="logo--hd">NAYAN TARA</h5>
                </div>
            </div>

            <div class="d-flex">
                <div class="dropdown d-inline-block">
                    <button type="button" class="btn header-item waves-effect" id="page-header-user-dropdown"
                        data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <img class="rounded-circle header-profile-user"
                            src="<?= $basePath ?>/assets/admin/images/user.png" alt="user">
                        <span class="d-none d-xl-inline-block ml-1" id="franchisename">${franchiseName}</span>
                        <i class="mdi mdi-chevron-down d-none d-xl-inline-block"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-right">
                        <!-- <a class="dropdown-item" href="profile.php">
                            <i class="bx bx-user font-size-16 align-middle mr-1"></i> Profile</a>
                        <div class="dropdown-divider"></div> -->
                        <a class="dropdown-item text-danger" style="cursor:pointer;" onclick="Logout()"><i
                                class="bx bx-power-off font-size-16 align-middle mr-1 text-danger"></i> Logout</a>
                    </div>
                </div>
            </div>
        </div>
    </header>