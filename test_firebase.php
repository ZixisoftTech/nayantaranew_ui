<?php
echo "<h3>Testing Outbound Connection to fcm.googleapis.com</h3>1111111";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://fcm.googleapis.com/");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 seconds timeout
curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); // Force IPv4

$start = microtime(true);
$result = curl_exec($ch);
$end = microtime(true);
$time_taken = round($end - $start, 2);

if (curl_errno($ch)) {
    echo "<p style='color:red;'><b>Connection Failed!</b> Error: " . curl_error($ch) . "</p>";
    echo "<p>Time taken: $time_taken seconds</p>";
    echo "<p><strong>Conclusion:</strong> Your Live Server's network or firewall is actively blocking outbound connections to Google's servers. You need to contact your hosting provider to open port 443 (HTTPS) for outbound traffic.</p>";
} else {
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    echo "<p style='color:green;'><b>Connection Successful!</b> HTTP Code: $http_code</p>";
    echo "<p>Time taken: $time_taken seconds</p>";
    echo "<p><strong>Conclusion:</strong> Outbound connection is working fine in PHP. The issue in Node.js might be due to IPv6 routing. Please upload the updated Node.js code.</p>";
}
curl_close($ch);
?>
