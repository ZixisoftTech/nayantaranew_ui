<?php 
// $basePath = 'http://192.168.29.47/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
require_once __DIR__ . '/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in'); 

?>

<!doctype html>
<html lang="en" class="nt">

<head>
    <meta charset="utf-8" />
    <title>Nayan Tara · Admin</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta content="Nayan Tara administration panel" name="description" />
    <link rel="icon" href="<?= $basePath ?>/assets/admin/images/favicon.ico">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="<?= $basePath ?>/assets/admin/libs/select2/css/select2.min.css" rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/libs/bootstrap-datepicker/css/bootstrap-datepicker.min.css"
        rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/libs/bootstrap-colorpicker/css/bootstrap-colorpicker.min.css"
        rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/libs/bootstrap-touchspin/jquery.bootstrap-touchspin.min.css"
        rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/libs/datatables.net-bs4/css/dataTables.bootstrap4.min.css"
        rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/libs/datatables.net-buttons-bs4/css/buttons.bootstrap4.min.css"
        rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/libs/datatables.net-responsive-bs4/css/responsive.bootstrap4.min.css"
        rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/css/bootstrap.min.css" id="bootstrap-style" rel="stylesheet"
        type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/css/icons.min.css" rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/css/app.min.css" id="app-style" rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/css/style.css" id="app-style" rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/libs/sweetalert2/sweetalert2.min.css" rel="stylesheet" type="text/css" />
    <link href="<?= $basePath ?>/assets/admin/css/theme.css?v=36" rel="stylesheet" type="text/css" />
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <!-- jQuery is needed here because page scripts run before foot.php. Bootstrap 4 + DataTables load in foot.php;
         a second Bootstrap (5.x) here took over $.fn.modal, so popups opened from code could not be closed. -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
</head>