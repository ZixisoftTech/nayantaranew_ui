<?php include("include/head.php"); 

// $basePath = 'http://localhost/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
require_once __DIR__ . '/../include/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in'); 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000"; 
$path = nt_api('https://nayantarabyspacs.co.in');
?>

<script>
const admincheck = localStorage.getItem('admintoken')
if (admincheck != null) {
    window.location.href = '<?= $basePath ?>/super_admin/dashboard.php';
}
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
                <span class="nt-auth-badge"><i class="bx bx-shield-quarter"></i>Super Admin</span>
                <h1>Welcome back</h1>
                <p class="nt-auth-sub">Sign in to manage franchises, plans and reports.</p>
                <form class="form-horizontal" id="adminlogin" method="POST" action="<?= $path ?>/api/admin-login" novalidate>
                <div class="form-group">
                    <label>Email address</label>
                    <div class="nt-input-icon">
                        <i class="bx bx-envelope"></i>
                        <input type="email" class="form-control" id="email" name="email" placeholder="you@example.com" autocomplete="username">
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
                <button class="login-btn" id="submit" name="submit" type="submit">Sign in <i class="bx bx-right-arrow-alt"></i></button>
                </form>
                <div class="nt-auth-switch">Other portals: <a href="<?= $basePath ?>/franchise/login.php">Franchise login</a></div>
            </div>
        </main>
    </div>

    <?php include("include/foot.php") ?>

    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script type="text/javascript">
    jQuery(document).ready(function() {
        jQuery("#adminlogin").validate({
            rules: {
                email: {
                    required: true,
                    email: true,
                },
                password: {
                    required: true,
                    minlength: 6,
                    maxlength: 12,
                },
            },
            messages: {
                email: {
                    required: "Please enter email address",
                    email: "Please enter a valid email address",
                },
                password: {
                    required: "Please enter password",
                    minlength: "Please field accept min 6 digits",
                    maxlength: "Please field accept max 12 digits",
                },
            },
        });
    });

    $(document).on('submit', '#adminlogin', function(e) {
        e.preventDefault();
        const Email = document.getElementById("email");
        const Password = document.getElementById("password");
        const item = {
            email: Email.value.trim(),
            password: Password.value.trim()
        };
        $.ajax({
            url: $(this).attr("action"),
            type: $(this).attr("method"),
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
                } else {
                    Swal.fire(
                        'success!',
                        `${response.message}`,
                        'success',
                    );
                    setTimeout(() => {
                        document.location.reload();
                    }, 3000);
                    location = "super_admin/dashboard.php";
                    let admintoken = localStorage.setItem("admintoken", response.data.admintoken);
                }
            },
            error: function(xhr, desc, err) {}
        });
    });
    </script>