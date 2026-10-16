<?php include("../include/head.php") ?>

<body class="bg1" data-sidebar="dark">
    <div class="account-pages my-3 pt-sm-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6 col-xl-5">
                    <div class="card overflow-hidden">
                        <div class="bg-color">
                            <div class="row">
                                <div class="col-7">
                                    <div class="text-primary p-4">
                                        <h5 style="color:white">Welcome Back !</h5>
                                        <p style="color:white">Forget Your Password.</p>
                                    </div>
                                </div>
                                <div class="col-5 align-self-end">
                                    <img src="../assets/admin/images/profile-img.png" alt="" class="img-fluid">
                                </div>
                            </div>
                        </div>
                        <div class="card-body pt-0">
                            <!-- <div>
                            <a href="javascript:void(0);">
                                <div class="avatar-md profile-user-wid mb-4">
                                    <span class="avatar-title rounded-circle bg-light">
                                        <img src="../assets/admin/images/logo.svg" alt="" class="rounded-circle"
                                            height="34">
                                    </span>
                                </div>
                            </a>
                        </div> -->
                            <div class="p-2 mt-2">
                                <form class="form-horizontal" action="">
                                    <div class="form-group">
                                        <label for="username">Email</label>
                                        <input type="Email" class="form-control" id="email" placeholder="Enter Email">
                                    </div>
                                    <div class="mt-3 text-center">
                                        <button class="login-btn" type="submit">Forget Password</button>
                                    </div>

                                    <div class="mt-4 text-center">
                                        <a href="dashboard.php" class="text-muted"><i class="mdi mdi-lock mr-1"></i>Back
                                            to
                                            Login</a>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php include("../include/foot.php") ?>