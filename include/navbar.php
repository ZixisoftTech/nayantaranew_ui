<?php 
// $basePath = 'http://localhost/nayantara/nayantarafrontend'; 
// $basePath = 'http://65.0.164.127/nayantarafrontend';
require_once __DIR__ . '/config.php'; $basePath = nt_base('https://nayantarabyspacs.co.in'); 

// $path = "http://localhost:8085";
// $path = "http://65.0.164.127:8000";
$path = nt_api('https://nayantarabyspacs.co.in');

?>


<script type="text/javascript">
const admincheck = localStorage.getItem('admintoken')
if (admincheck == null) {
    window.location.href = '<?= $basePath ?>';
}
const admintoken = localStorage.getItem("admintoken")
async function getName() {
    const post = await fetch("<?= $path ?>/api/admin-name", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admintoken
            }),

        })
        .then(response => response.json())
        .then((data) => {
            var adminName = document.getElementById('admin_nane').innerText = data.data.name;
        }).catch((error) => {
            console.log("error =>", error);
        })
}
getName();

async function Logout() {
    localStorage.removeItem("admintoken");
    window.location.href = '<?=$basePath?>';
}
</script>
<?php require_once __DIR__ . '/layout.php'; nt_render_topbar('super_admin', 'admin_nane'); ?>
