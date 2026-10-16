<?php $isLoginPage = true; ?>
<?php include("../include/head.php") ?>
<?php
// $basePath = 'http://localhost/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
$basePath = 'https://nayantarabyspacs.co.in'; 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000";
$path = "https://nayantarabyspacs.co.in";
?>

<script>
const franchisecheck = localStorage.getItem('franchisetoken')
if (franchisecheck != null) {
    window.location.href = '<?= $basePath ?>/franchise/dashboard.php';
}
</script>
<body class="bg1" data-sidebar="dark">
    <div class="account-pages my-4">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6 col-xl-5">
                    <div class="card overflow-hidden">
                        <div class="bg-color">
                            <div class="row">
                                <div class="col-7">
                                    <div class="p-4">
                                        <h5 style="color:white">Welcome Back !</h5>
                                        <p style="color:white">Sign in to continue to Nayan tara.</p>
                                    </div>
                                </div>
                                <div class="col-5 align-self-end">
                                    <img src="../assets/admin/images/profile-img.png" alt="" class="img-fluid">
                                </div>
                            </div>
                        </div>
                        <div class="card-body pt-0">
                            <div class="p-2">
                                <form class="form-horizontal" id="franchiselogin" method="POST"
                                    action="<?= $path ?>/franchise/api/login-franchise">
                                    <div class="form-group">
                                        <label for="username">Email</label>
                                        <input type="email" class="form-control" id="email" name="email"
                                            placeholder="Enter Email">
                                    </div>

                                    <div class="form-group">
                                        <label for="userpassword">Password</label>
                                        <input type="password" name="password" id="password" class="form-control"  placeholder="Enter Password">
                                        <span class="toggle-password text-right"
                                            onclick="togglePasswordVisibilitys()"><i class="fa fa-eye"
                                                style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i></span>
                                    </div>
                                    <script type="text/javascript">
                                    function togglePasswordVisibilitys() {
                                        var passwordInput = document.getElementById("password");
                                        var togglePassword = document.querySelector(".toggle-password");

                                        if (passwordInput.type === "password") {
                                            passwordInput.type = "text";
                                            togglePassword.innerHTML =
                                                '<i class="fa fa-eye-slash" style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i>';
                                        } else {
                                            passwordInput.type = "password";
                                            togglePassword.innerHTML =
                                                '<i class="fa fa-eye" style="position: absolute;right: 20px;margin-top: -25px;cursor: pointer;color: black;font-size: 10px;"></i>';
                                        }
                                    }
                                    </script>

                                    <div class="mt-3 text-center">
                                        <button class="login-btn" id="Save" type="submit">Login</button>
                                    </div>
                                    <!-- <div class="mt-4 text-center">
                                        <a href="forget.php" class="text-muted"><i class="mdi mdi-lock mr-1"></i> Forgot
                                            your password?</a>
                                    </div> -->
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include("../include/foot.php") ?>

    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script type="text/javascript">
    jQuery(document).ready(function() {
        jQuery("#franchiselogin").validate({
            rules: {
                email: {
                    required: true,
                    email: true, //add an email rule that will ensure the value entered is valid email id.
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

    $(document).on('submit', '#franchiselogin', function(e) {
        e.preventDefault();
        const item = {
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value.trim(),
        };
        $.ajax({
            url: $(this).attr("action"),
            type: $(this).attr("method"),
            dataType: "JSON",
            data: JSON.stringify(item),
            contentType: "application/json",
            success: function(response, status) {
                if (response.error) {
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
                    location = "<?= $basePath ?>/franchise/dashboard.php";
                    let franchisetoken = localStorage.setItem("franchisetoken", response.data[0]
                    .franchisetoken);
                }
            },
            error: function(xhr, desc, err) {}
        });
    });
    </script>