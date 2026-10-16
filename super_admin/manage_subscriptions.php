<?php include("../include/head.php") ?>
<?php include("../include/navbar.php") ?>
<?php include("../include/sidebar_superadmin.php") ?>
<?php 
// $basePath = 'http://localhost/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
$basePath = 'https://nayantarabyspacs.co.in'; 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000"; 
$path = "https://nayantarabyspacs.co.in";

?>

<script type="text/javascript">
$(document).ready(function() {
    var dataTable = $("#subscriptions").DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        processing: true,
        serverSide: true,
        serverMethod: "get",
        ajax: {
            url: "<?= $path ?>/subscription/get-subscription",
        },
        aaSorting: [],
        columns: [{
                data: "index"
            },
            {
                data: "franchise_name"
            },
            {
                data: "plan_name"
            },
            {
                data: "price"
            },
            {
                data: "talk_time_min"
            },
            {
                data: "status"
            },
            {
                data: "action"
            },
        ],
    });
});

async function statusDeactive(id) {
    const data = document.getElementById('active');
    const item = {
        status: data.value.trim(),
    }
    const put = await fetch('<?= $path ?>/subscription/status-subscriptions/' + id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then((item) => {
            $("#subscriptions").DataTable().ajax.reload();
        })
        .catch(error => console.error('Unable to delete item.', error));
}

async function statusActive(id) {
    const data = document.getElementById('inactive');
    const item = {
        status: data.value.trim(),
    }
    const put = await fetch('<?= $path ?>/subscription/status-subscriptions/' + id, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then((item) => {
            $("#subscriptions").DataTable().ajax.reload();
        })
        .catch(error => console.error('Unable to delete item.', error));
}

async function getFranchiseName() {
    let getName = await fetch('<?= $path ?>/api/get-franchiseid');
    getName = await getName.json();
    const get = getName.data;
    const franchiseId = document.getElementById("franchise_id");
    franchiseId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    get.map((data, index) =>
        franchiseId.innerHTML += `<option value="${data.Id}">${data.franchiseName}</option>`
    )
}

async function updateFranchiseName(franchiseid = 0) {
    let getName = await fetch('<?= $path ?>/api/get-franchiseid');
    getName = await getName.json();
    const franchiseId = document.getElementById("updatefranchise_id");
    franchiseId.innerHTML = "<option value='' selected disabled>--Select--</option>";
    getName.data.forEach((data, index) => {
        var selected = "";
        if (franchiseid != 0) {
            if (data.Id == franchiseid) {
                selected = "selected='selected'";
            }
        }
        franchiseId.innerHTML += `<option ${selected} value="${data.Id}">${data.franchiseName}</option>`
    })
}

async function getUpdateValue(id) {
    let get = await fetch('<?= $path ?>/subscription/get-subscription/' + id);
    get = await get.json();
    updateFranchiseName(get[0].franchise_id);
    document.getElementById("editid").value = id;
    document.getElementById("updatefranchise_id").value = get[0].subscriptions_name;
    document.getElementById("updateplan_name").value = get[0].plan_name;
    document.getElementById("updateprice").value = get[0].price;
    document.getElementById("updatetalktime_minutes").value = get[0].talktime_minutes;
}

async function deleteSubscription(id) {
    let del = await fetch('<?= $path ?>/subscription/delete-subscription/' + id, {
            method: 'DELETE'
        })
        var data = await del.json();
    if (data.error == true) {
        Swal.fire(
            'error!',
            `${data.message}`,
            'error'
        );
    } else {
        Swal.fire(
            'success!',
            `${data.message}`,
            'success',
        );
        setTimeout(() => {
            document.location.reload();
        }, 1000);
    }
}
</script>

<body class="bg2" data-sidebar="dark">
    <div class="page-content">
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="header">
                            <div class="row mt-3 mr-2 ml-2">
                                <div class="col-md-6 text-left">
                                    <h5>Manage Subscription</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                    <a href="javascript:void(0);" data-toggle="modal" data-target=".add"
                                        onclick="getFranchiseName()" class="btn btn-primary create-btn">Create</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table id="subscriptions" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Franchise Name</th>
                                            <th>Plan Name</th>
                                            <th>Price</th>
                                            <th>Talk Time Minutes</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getSubscription">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <?php include("../include/foot.php") ?>
    <?php include("../include/footer.php") ?>

    <div class="modal fade add" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Create</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="<?= $path ?>/subscription/add-subscription" id="createform" method="POST">
                    <div class="modal-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label>Franchise Name</label>
                                <select name="franchise_id" id="franchise_id" class="form-control"></select>
                            </div>
                            <div class="form-group col-md-6">
                                <label>PLan Name</label>
                                <input name="plan_name" id="plan_name" type="text" class="form-control">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Price</label>
                                <input type="number" name="price" id="price" class="form-control" min="1">
                            </div>
                            <div class="form-group col-md-6">
                                <label>Talk Time Minutes</label>
                                <input type="number" min="1" name="talktime_minutes" id="talktime_minutes"
                                    class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" id="submit" class="btn btn-primary create-btn">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade edit" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="myLargeModalLabel">Edit</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="<?= $path ?>/subscription/update-subscription" method="POST" id="updateform">
                    <div class="modal-body">
                        <div class="row">
                            <input type="hidden" name="ediitid" id="editid">
                            <div class="form-group col-md-6">
                                <label>Franchise Name</label>
                                <select type="text" name="updatefranchise_id" id="updatefranchise_id"
                                    class="form-control"></select>
                            </div>

                            <div class="form-group col-md-6">
                                <label>Plan Name</label>
                                <input type="text" name="updateplan_name" id="updateplan_name" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Price</label>
                                <input type="number" min="1" name="updateprice" id="updateprice" class="form-control">
                            </div>

                            <div class="form-group col-md-6">
                                <label>Talk Time Minutes</label>
                                <input type="number" min="1" name="updatetalktime_minutes" id="updatetalktime_minutes"
                                    class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" id="submit" class="btn btn-primary create-btn">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/jquery.validation/1.16.0/jquery.validate.min.js"></script>
    <script type="text/javascript">
    jQuery(document).ready(function() {
        jQuery("#createform").validate({
            rules: {
                franchise_id: 'required',
                plan_name: 'required',
                price: 'required',
                talktime_minutes: 'required',
            },
            messages: {
                franchise_id: {
                    required: "Please select franchiser name",
                },
                plan_name: {
                    required: "Please entered plan name",
                },
                price: {
                    required: "Please entered price",
                    number: true,
                },
                talktime_minutes: {
                    required: "Please entered talktime minutes",
                },
            },
        });
    });
    </script>
    <script type="text/javascript">
    jQuery(document).ready(function() {
        jQuery("#updateform").validate({
            rules: {
                updatefranchise_id: 'required',
                updateplan_name: 'required',
                updateprice: 'required',
                updatetalktime_minutes: 'required',
            },
            messages: {
                updatefranchise_id: {
                    required: "Please select franchiser name",
                },
                updateplan_name: {
                    required: "Please entered plan name",
                },
                updateprice: {
                    required: "Please entered price",
                    number: true,
                },
                updatetalktime_minutes: {
                    required: "Please entered talktime minutes",
                },
            },
        });
    });
    </script>
    <script type="text/javascript">
    $(document).on('click', '.delete', function() {
        var id = $(this).data('id');
        console.log(id);
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: "No, cancel please!",
            closeOnConfirm: false,
            closeOnCancel: false
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel || result.dismiss === Swal.DismissReason
                .backdrop) {
                Swal.fire("Cancelled", "Your data is safe", "success");
            } else {
                deleteSubscription(id);
                Swal.fire("Deleted", "Your data has been deleted", "success");
            }
        });
    });

    $(document).on('submit', '#createform', function(e) {
        e.preventDefault();
        const item = {
            franchise_id: document.getElementById("franchise_id").value.trim(),
            plan_name: document.getElementById("plan_name").value.trim(),
            price: document.getElementById("price").value.trim(),
            talktime_minutes: document.getElementById("talktime_minutes").value.trim(),
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
                    }, 1000);
                }
            },
            error: function(xhr, desc, err) {}
        });
    });

    $(document).on('submit', '#updateform', function(e) {
        e.preventDefault();
        const item = {
            id: document.getElementById("editid").value.trim(),
            franchise_id: document.getElementById("updatefranchise_id").value.trim(),
            plan_name: document.getElementById("updateplan_name").value.trim(),
            price: document.getElementById("updateprice").value.trim(),
            talktime_minutes: document.getElementById("updatetalktime_minutes").value.trim(),
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
                    }, 1000);
                }
            },
            error: function(xhr, desc, err) {}
        });
    });
    </script>