<?php 

// $basePath = 'http://192.168.29.47/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
$basePath = 'https://nayantarabyspacs.co.in'; 

// $path = "http://192.168.29.47:8085";
// $path = "http://65.0.164.127:8000"; 
$path = "https://nayantarabyspacs.co.in";

?>
<script type="text/javascript">
const studentcheck = localStorage.getItem('studentToken')
if (studentcheck == null) {
    window.location.href = '<?= $basePath ?>/student/login.php';
}
const tokenStudent = localStorage.getItem("studentToken");

async function getName() {
    const post = await fetch("<?= $path ?>/api/get-studentname", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tokenStudent
            }),

        }).then(response => response.json())
        .then((data) => {
            var Name = document.getElementById('studentname').innerText = data.data[0].name;
        }).catch((error) => {
            console.log("error =>", error);
        })
}
getName();

async function Logout() {
    localStorage.removeItem("studentToken");
    window.location.href = '<?= $basePath ?>/student/login.php';
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
                        <span class="d-none d-xl-inline-block ml-1" id="studentname">${Name}</span>
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