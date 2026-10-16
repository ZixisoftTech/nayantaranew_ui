<?php include("../include/head.php") ?>
<?php include("../include/student_navbar.php") ?>
<?php include("../include/sidebar_student.php") ?>
<?php 
// $basePath = 'http://192.168.29.47/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
$basePath = 'http://nayantarabyspacs.co.in'; 

// $path = "http://192.168.29.47:8085";
// $path = "http://65.0.164.127:8000";
$path = "http://nayantarabyspacs.co.in:8085";

?>

<script type="text/javascript">
async function getName() {
    const post = await fetch("<?= $path ?>/api/get-studentname", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tokenStudent
            }),
        })
        .then(response => response.json())
        .then((data) => {
            var Name = document.getElementById('studentname').innerText = data.data[0].name;
            getCallSchedule(data.data[0].id);
            getParentStatus(data.data[0].id);
            getAvailablemin(data.data[0].id);
            getTimeSchedule(data.data[0].id);
        }).catch((error) => {
            console.log("error =>", error);
        })
}
getName();

async function getCallSchedule(id) {
    var dataTable = $("#department_time").DataTable({
        dom: 'Bfrtip',
        pageLength: 50,
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        processing: true,
        serverSide: true,
        serverMethod: "get",
        ajax: {
            url: '<?= $path ?>/api/get-webschedule/' + id,
        },
        aaSorting: [],
        columns: [{
                data: "index"
            },
            {
                data: "day"
            },
            {
                data: "start_time"
            },
            {
                data: "end_time"
            },
        ],
    })
}

async function getParentStatus(id) {
    let get = await fetch('<?= $path ?>/api/get-parentwebloginstatus/' + id)
    get = await get.json();
    let status = get.data;
    if (status) {
        document.getElementById('getparentstatus').innerHTML = status.map((data, index) =>
            `<tr class="content">
            <td>${index + 1}</td>
            <td>${data.name}</td>
            <td>${data.status == 1 ? ('<button id="active" class="btn-success" value="0" onclick="fcmNotification('+data.id+')">on call</button>') : ('<button class="btn-danger" id="inactive" value="1">busy</button>')}</td>
            </td>
            </tr>`
        ).join('');
    } else {
        document.getElementById('getparentstatus').innerHTML =
            "<tr><td colspan='6'>No data available in table</td></tr>";
    }
}

async function fcmNotification(id) {
    let get = await fetch('<?= $path ?>/api/get-webNotification/' + id);
    get = await get.json();
    if (get.error == false) {
        // location.href = `${get.data}`;
        window.location.href = '<?= $basePath ?>/student/video.php'
    } else {
        Swal.fire(
            'error!',
            `${get.message}`,
            'error'
        )
        setTimeout(() => {
            Logout();
        }, 2000);
    }
}

async function Logout() {
    localStorage.removeItem("studentToken");
    window.location.href = '<?= $basePath ?>/student/login.php';
}

async function getAvailablemin(id) {
    let get = await fetch('<?= $path ?>/api/get-webavailablemin/' + id);
    get = await get.json();
    var availableMin = document.getElementById('availablemin').innerText = get.data.time;
}

async function getTimeSchedule(studentId) {
    var Id = studentId;
    const item = {
        id: Id,
    }
    $.ajax({
        url: '<?= $path ?>/api/get-timeschedule',
        type: 'post',
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
                localStorage.removeItem("studentToken");
                window.location.href = '<?= $basePath ?>/student/login.php';
            } else {
                console.log("You are on time");
            }
        },
        error: function(xhr, desc, err) {}
    });
}
</script>

<body class="bg2" data-sidebar="dark">
    <div class="page-content">
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="d-flex" style="justify-content: space-around;
    border-radius: 50px;
    width: 80%;
    align-items: center;
    margin: 20px 65px;
    background-color: gold;">
                            <h4>Available min</h4>
                            <span id="availablemin" style="    background-color: black;
    color: white;
    height: 20px;">${availableMin}</span>
                        </div>
                        <table class="text-center">
                            <thead>
                                <tr>
                                    <th>S. No</th>
                                    <th>Parent Name</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="getparentstatus">
                            </tbody>
                        </table>
                        <div class="header">
                            <div class="row mt-3 mr-2 ml-2">
                                <div class="col-md-6 text-left">
                                    <h5>Call Schedule</h5>
                                </div>
                                <div class="col-md-6 text-right">
                                </div>
                            </div>
                        </div>
                        <div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table id="department_time" class="table table-bordered dt-responsive nowrap"
                                    style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>S. No</th>
                                            <th>Day</th>
                                            <th>Start Time</th>
                                            <th>End Time</th>
                                        </tr>
                                    </thead>
                                    <tbody id="getSchedule">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <video id="videoElement" autoplay playsinline></video>

    <?php include("../include/footer.php") ?>
    <?php include("../include/foot.php") ?>

    <script>
    navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        .then(function(stream) {
            // Create audio and video tracks
            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            // Do something with the tracks, e.g., attach them to a video element
            const videoElement = document.getElementById('videoElement');
            videoElement.srcObject = stream;
        })
        .catch(function(error) {
            // Handle permission denied or other errors
            console.error('Error accessing audio/video:', error);
        });
    </script>