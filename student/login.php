<?php include("../include/head.php"); 

// $basePath = 'http://192.168.29.47/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
require_once __DIR__ . '/../include/config.php'; $basePath = nt_base('http://nayantarabyspacs.co.in'); 

// $path = "http://192.168.29.47:8085";
// $path = "http://65.0.164.127:8000"; 
$path = nt_api('http://nayantarabyspacs.co.in:8085');
?>

<script>
async function getFranchise() {
    let getName = await fetch('<?= $path ?>/api/get-franchiseid');
    getName = await getName.json();
    const get = getName.data;
    const franchiseId = document.getElementById("franchise_id");
    franchiseId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    get.map((data, index) =>
        franchiseId.innerHTML += `<option value="${data.Id}">${data.franchiseName}</option>`
    )
}
getFranchise()
</script>

<body class="nt-auth-body">
    <div class="nt-auth">
        <aside class="nt-auth-aside">
            <img src="<?= $basePath ?>/assets/admin/images/nayan_logo.png" alt="Nayan Tara by SPACS" class="nt-auth-logo">
            <div class="nt-auth-pitch">
                <h2>One place to run every Nayan Tara centre.</h2>
                <p>Manage franchises, students, plans and calls with real-time reports, all from a single dashboard.</p>
                <ul class="nt-auth-points">
                    <li><i class="bx bx-check-circle"></i> Live call and usage tracking</li>
                    <li><i class="bx bx-check-circle"></i> Plans, subscriptions and transactions</li>
                    <li><i class="bx bx-check-circle"></i> Export-ready reports</li>
                </ul>
            </div>
            <div class="nt-auth-copy">&copy; <?= date('Y') ?> Nayan Tara by SPACS</div>
        </aside>
        <main class="nt-auth-main">
            <div class="nt-auth-card">
                <span class="nt-auth-badge"><i class="bx bx-user"></i>Student Portal</span>
                <h1>Welcome back</h1>
                <p class="nt-auth-sub">Sign in with your school and roll number.</p>
                <form class="form-horizontal" id="studentlogin" method="POST" action="<?= $path ?>/api/student/login" novalidate>
                <div class="form-group">
                    <label>School name</label>
                    <div class="nt-input-icon">
                        <i class="bx bx-buildings"></i>
                        <select name="franchise_id" id="franchise_id" class="form-control"></select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Roll number</label>
                    <div class="nt-input-icon">
                        <i class="bx bx-id-card"></i>
                        <input type="text" class="form-control" id="roll_no" name="roll_no" placeholder="Enter your roll number">
                    </div>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="nt-input-icon">
                        <i class="bx bx-lock-alt"></i>
                        <input type="password" name="password" id="password" class="form-control" placeholder="Enter your password" autocomplete="current-password">
                        <button type="button" class="nt-pass-toggle toggle-password" onclick="togglePasswordVisibilitys()" aria-label="Show password"><i class="bx bx-show"></i></button>
                    </div>
                </div>
                <script type="text/javascript">
                function togglePasswordVisibilitys() {
                    var passwordInput = document.getElementById("password");
                    var toggle = document.querySelector(".toggle-password");
                    var show = passwordInput.type === "password";
                    passwordInput.type = show ? "text" : "password";
                    toggle.innerHTML = show ? '<i class="bx bx-hide"></i>' : '<i class="bx bx-show"></i>';
                    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
                }
                </script>
                <button class="login-btn" id="Save" type="submit">Sign in <i class="bx bx-right-arrow-alt"></i></button>
                </form>
                <div class="nt-auth-switch">Other portals: <a href="<?= $basePath ?>/">Admin login</a><a href="<?= $basePath ?>/franchise/login.php">Franchise login</a></div>
            </div>
        </main>
    </div>

    <?php include("../include/foot.php") ?>

    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script type="text/javascript">
    jQuery(document).ready(function() {
        jQuery("#studentlogin").validate({
            rules: {
                franchise_id: {
                    required: true,
                },
                roll_no: {
                    required: true,
                },
                password: {
                    required: true,
                },
            },
            messages: {
                franchise_id:{
                    required: "Please select the Franchise",
                },
                roll_no: {
                    required: "Please enter roll no",
                },
                password: {
                    required: "Please enter password",
                },
            },
        });
    });

    $(document).on('submit', '#studentlogin', function(e) {
        e.preventDefault();
        $.ajax({
            url: $(this).attr("action"),
            type: $(this).attr("method"),
            dataType: "JSON",
            data: new FormData(this),
            processData: false,
            contentType: false,
            success: function(response, status) {
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
                    )
                    setTimeout(() => {
                        document.location.reload();
                    }, 3000);
                    location = "<?= $basePath ?>/student/dashboard.php";
                    let studentToken = localStorage.setItem("studentToken", response.data[0]
                        .studentToken);
                }
            },
            error: function(xhr, desc, err) {}
        });
    });
    </script>