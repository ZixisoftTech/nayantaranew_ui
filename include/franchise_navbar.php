<?php 
// $basePath = 'http://localhost/nayantara/nayantarafrontend';
// $basePath = 'http://65.0.164.127/nayantarafrontend'; 
require_once __DIR__ . '/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in'); 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000"; 
$path = nt_api('https://nayantarabyspacs.co.in');

?>

<script type="text/javascript">
const franchisecheck = localStorage.getItem('franchisetoken');
if (franchisecheck == null) {
    window.location.href = '<?= $basePath ?>/franchise/login.php';
}
const franchisetoken = localStorage.getItem("franchisetoken")

async function getName() {
    const post = await fetch("<?= $path ?>/franchise/api/franchisename", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                franchisetoken
            }),

        })
        .then(response => response.json())
        .then((data) => {
            var franchiseName = document.getElementById('franchisename').innerText = data.data.franchiseName;
        }).catch((error) => {
            console.log("error =>", error);
        })
}
getName();

async function Logout() {
    localStorage.removeItem("franchisetoken");
    window.location.href = '<?= $basePath ?>/franchise/login.php';
}
</script>
<?php require_once __DIR__ . '/layout.php'; nt_render_topbar('franchise', 'franchisename'); ?>
