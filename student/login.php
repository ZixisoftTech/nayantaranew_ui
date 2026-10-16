<?php include("../include/head.php"); 

// $basePath = 'http://192.168.29.47/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
$basePath = 'http://nayantarabyspacs.co.in'; 

// $path = "http://192.168.29.47:8085";
// $path = "http://65.0.164.127:8000"; 
$path = "http://nayantarabyspacs.co.in:8085";
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
                                    <img src="<?= $basePath ?>/assets/admin/images/profile-img.png" alt=""
                                        class="img-fluid">
                                </div>
                            </div>
                        </div>
                        <div class="card-body pt-0">
                            <!-- <div>
                            <a href="index-2.html">
                                <div class="avatar-md profile-user-wid mb-4">
                                    <span class="avatar-title rounded-circle bg-light">
                                        <img src="../assets/admin/images/logo.svg" alt="" class="rounded-circle"
                                            height="34">
                                    </span>
                                </div>
                            </a>
                        </div> -->
                            <div class="p-2">
                                <form class="form-horizontal" id="studentlogin" method="POST"
                                    action="<?= $path ?>/api/student/login">

                                    <div class="form-group">
                                        <label>School Name</label>
                                        <select name="franchise_id" id="franchise_id" class="form-control">
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label for="username">Roll No</label>
                                        <input type="text" class="form-control" id="roll_no" name="roll_no"
                                            placeholder="Enter Roll No">
                                    </div>

                                    <div class="form-group">
                                        <label for="userpassword">Password</label>
                                        <input type="password" name="password" id="password" class="form-control"
                                            placeholder="Enter Password">
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