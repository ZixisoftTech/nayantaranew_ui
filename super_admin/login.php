<?php include("include/head.php"); 

// $basePath = 'http://localhost/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
require_once __DIR__ . '/../include/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in'); 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000"; 
$path = nt_api('https://nayantarabyspacs.co.in');
require_once __DIR__ . '/../include/auth.php';
// already signed in: go to the first page this account can open
if (nt_role() && nt_home()) {
    nt_redirect_js($basePath . '/super_admin/' . nt_home());
}
?>

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
                <span class="nt-auth-badge"><i class="bx bx-shield-quarter"></i>Nayan Tara Portal</span>
                <h1>Welcome back</h1>
                <p class="nt-auth-sub">Admins, sub admins and schools sign in here.</p>
                <form class="form-horizontal" id="adminlogin" method="POST" action="<?= $path ?>/api/portal-login" novalidate>
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
                },
            },
            messages: {
                email: {
                    required: "Please enter email address",
                    email: "Please enter a valid email address",
                },
                password: {
                    required: "Please enter password",
                    minlength: "Password must be at least 6 characters",
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
                    const d = response.data;
                    // the portal pages read the token from this cookie (include/auth.php) and the API key the pages use
                    document.cookie = 'nt_token=' + d.token + '; path=/; max-age=' + 30 * 86400 + '; SameSite=Lax';
                    document.cookie = 'nt_school=; path=/; max-age=0';
                    localStorage.removeItem('admintoken');
                    localStorage.removeItem('franchisetoken');
                    localStorage.setItem(d.role === 'school' ? 'franchisetoken' : 'admintoken', d.token);
                    location = '<?= $basePath ?>/super_admin/' + (d.role === 'school' ? 'school_dashboard.php' : 'dashboard.php');
                }
            },
            error: function(xhr, desc, err) {}
        });
    });
    </script>