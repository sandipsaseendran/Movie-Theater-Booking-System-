<?php
/**
 * Email Test - Visit this page to test if email sending works
 * URL: http://localhost/MOVIE-THEATRE/public/api/test_email.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Email Test</h1>";

require_once "email_config.php";

echo "<h2>Configuration:</h2>";
echo "<pre>";
echo "SMTP Host: " . SMTP_HOST . "\n";
echo "SMTP Port: " . SMTP_PORT . "\n";
echo "SMTP Username: " . SMTP_USERNAME . "\n";
echo "SMTP Password: " . (empty(SMTP_PASSWORD) ? "NOT SET!" : "****" . substr(SMTP_PASSWORD, -4)) . "\n";
echo "From Email: " . SMTP_FROM_EMAIL . "\n";
echo "</pre>";

if (empty(SMTP_PASSWORD)) {
    echo "<p style='color:red;font-weight:bold;'>ERROR: SMTP Password is not configured!</p>";
    echo "<p>Please edit email_config.php and add your Gmail App Password.</p>";
    exit;
}

echo "<h2>Sending Test Email...</h2>";

require_once "smtp_mailer.php";

$testEmail = SMTP_USERNAME; // Send to yourself
$testOTP = "123456";

echo "<p>Sending to: $testEmail</p>";

$result = sendOTPEmail($testEmail, "Test User", $testOTP);

echo "<h2>Result:</h2>";
echo "<pre>";
print_r($result);
echo "</pre>";

if ($result['success']) {
    echo "<p style='color:green;font-weight:bold;'>✅ Email sent successfully! Check your inbox.</p>";
} else {
    echo "<p style='color:red;font-weight:bold;'>❌ Email failed: " . $result['message'] . "</p>";
    echo "<h3>Troubleshooting:</h3>";
    echo "<ol>";
    echo "<li>Make sure 2-Step Verification is enabled on your Gmail</li>";
    echo "<li>Make sure you created an App Password (not your regular password)</li>";
    echo "<li>Check the App Password is correct (16 characters, no spaces)</li>";
    echo "<li>Check your Gmail for any security alerts</li>";
    echo "</ol>";
}

echo "<h3>PHP Error Log:</h3>";
echo "<pre>";
$logFile = ini_get('error_log');
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -20);
    foreach ($lastLines as $line) {
        if (strpos($line, 'SMTP') !== false || strpos($line, 'Email') !== false) {
            echo htmlspecialchars($line);
        }
    }
}
echo "</pre>";
?>

