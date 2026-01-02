<?php
/**
 * Configuration file - Store sensitive credentials
 * IMPORTANT: Add this file to .gitignore in production
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'nilambur_films');

// Razorpay Configuration - REPLACE WITH YOUR OWN IN PRODUCTION
define('RAZORPAY_KEY_ID', 'rzp_test_Re7Ks1Il3ik9Ci');
define('RAZORPAY_KEY_SECRET', '7Hfjeor4UI0GJD8Bn0HXcZnj');

// GST Rate
define('GST_RATE', 0.18); // 18% GST

// Seat Lock Duration (in minutes)
define('SEAT_LOCK_DURATION', 10); // 10 minutes to complete payment

// Real-time Polling Interval (in milliseconds)
define('POLLING_INTERVAL', 3000); // 3 seconds

// CORS Configuration
define('ALLOWED_ORIGINS', [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:8080',
    // Add your production domain here
]);

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS

?>
