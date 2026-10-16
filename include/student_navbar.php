<?php 

// $basePath = 'http://192.168.29.47/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
require_once __DIR__ . '/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in'); 

// $path = "http://192.168.29.47:8085";
// $path = "http://65.0.164.127:8000"; 
$path = nt_api('https://nayantarabyspacs.co.in');

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
<?php require_once __DIR__ . '/layout.php'; nt_render_topbar('student', 'studentname'); ?>
