<?php
/**
 * Gmail SMTP Mailer - Supports OTP and Ticket Emails
 */

require_once 'email_config.php';

/**
 * Send a generic HTML email
 */
function sendEmail($toEmail, $subject, $body) {
    if (!defined('SMTP_PASSWORD') || empty(SMTP_PASSWORD)) {
        error_log("SMTP Password not configured");
        return false;
    }
    
    try {
        $socket = @fsockopen(SMTP_HOST, SMTP_PORT, $errno, $errstr, 30);
        
        if (!$socket) {
            error_log("SMTP Connection failed: $errstr ($errno)");
            return false;
        }
        
        // Read greeting
        fgets($socket, 512);
        
        // EHLO
        fputs($socket, "EHLO " . SMTP_HOST . "\r\n");
        while ($line = fgets($socket, 512)) {
            if (substr($line, 3, 1) == ' ') break;
        }
        
        // STARTTLS
        fputs($socket, "STARTTLS\r\n");
        fgets($socket, 512);
        
        // Enable TLS
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT)) {
            fclose($socket);
            return false;
        }
        
        // EHLO again after TLS
        fputs($socket, "EHLO " . SMTP_HOST . "\r\n");
        while ($line = fgets($socket, 512)) {
            if (substr($line, 3, 1) == ' ') break;
        }
        
        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        fgets($socket, 512);
        
        // Username
        fputs($socket, base64_encode(SMTP_USERNAME) . "\r\n");
        fgets($socket, 512);
        
        // Password
        fputs($socket, base64_encode(SMTP_PASSWORD) . "\r\n");
        $response = fgets($socket, 512);
        
        if (strpos($response, '235') === false && strpos($response, '250') === false) {
            fclose($socket);
            return false;
        }
        
        // MAIL FROM
        fputs($socket, "MAIL FROM:<" . SMTP_FROM_EMAIL . ">\r\n");
        fgets($socket, 512);
        
        // RCPT TO
        fputs($socket, "RCPT TO:<$toEmail>\r\n");
        fgets($socket, 512);
        
        // DATA
        fputs($socket, "DATA\r\n");
        fgets($socket, 512);
        
        // Message headers
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM_EMAIL . ">\r\n";
        $headers .= "To: <$toEmail>\r\n";
        $headers .= "Subject: $subject\r\n";
        
        $message = $headers . "\r\n" . $body . "\r\n.\r\n";
        fputs($socket, $message);
        $response = fgets($socket, 512);
        
        // QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        if (strpos($response, '250') !== false) {
            error_log("Email sent successfully to $toEmail");
            return true;
        }
        
        return false;
        
    } catch (Exception $e) {
        error_log("SMTP Exception: " . $e->getMessage());
        return false;
    }
}

/**
 * Send OTP verification email
 */
function sendOTPEmail($toEmail, $toName, $otp) {
    $subject = "Nilambur Films - Your Verification Code: $otp";
    
    $body = "
    <html>
    <body style='margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;'>
        <div style='max-width:500px;margin:0 auto;padding:40px 20px;'>
            <div style='background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;padding:40px;text-align:center;'>
                <div style='font-size:50px;margin-bottom:20px;'>🎬</div>
                <h1 style='color:#fff;margin:0 0 10px;'>Nilambur Films</h1>
                <p style='color:#888;margin:0 0 30px;'>Email Verification</p>
                
                <p style='color:#fff;font-size:16px;margin-bottom:20px;'>Hello $toName,</p>
                <p style='color:#aaa;margin-bottom:30px;'>Your verification code is:</p>
                
                <div style='background:rgba(0,255,136,0.1);border:2px solid #00ff88;border-radius:15px;padding:25px;margin:20px 0;'>
                    <div style='font-size:36px;font-weight:bold;color:#00ff88;letter-spacing:10px;'>$otp</div>
                </div>
                
                <p style='color:#ffaa00;font-size:14px;margin-top:20px;'>⏰ This code expires in 10 minutes</p>
                
                <div style='margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);'>
                    <p style='color:#666;font-size:12px;'>© 2024 Nilambur Films</p>
                </div>
            </div>
        </div>
    </body>
    </html>";
    
    $result = sendEmail($toEmail, $subject, $body);
    
    return [
        'success' => $result,
        'message' => $result ? 'Email sent' : 'Email failed'
    ];
}

/**
 * Send Ticket confirmation email
 */
function sendTicketEmail($booking) {
    $toEmail = $booking['user_email'] ?? '';
    if (empty($toEmail)) {
        return false;
    }
    
    $movieTitle = htmlspecialchars($booking['movie_title'] ?? 'Movie');
    $screenName = htmlspecialchars($booking['screen_name'] ?? 'Screen');
    $bookingId = htmlspecialchars($booking['booking_id'] ?? '');
    $seats = is_array($booking['seats']) ? implode(', ', $booking['seats']) : ($booking['seats'] ?? '');
    $amount = number_format(floatval($booking['total_amount'] ?? 0), 2);
    $userName = htmlspecialchars($booking['user_name'] ?? 'Guest');
    $bookingDate = date('d M Y, h:i A', strtotime($booking['created_at'] ?? 'now'));
    
    // Generate QR Code
    $qrData = urlencode("NILAMBUR|$bookingId|$movieTitle|$seats");
    $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$qrData&bgcolor=ffffff&color=000000";
    
    $subject = "🎬 Your Nilambur Films Ticket - $movieTitle";
    
    $body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
    </head>
    <body style='margin:0;padding:0;background:#0a0a0f;font-family:Arial,Helvetica,sans-serif;'>
        <div style='max-width:600px;margin:0 auto;padding:20px;'>
            
            <!-- Header -->
            <div style='background:linear-gradient(135deg,#8a50ff,#6a30dd);border-radius:20px 20px 0 0;padding:30px;text-align:center;'>
                <h1 style='color:#fff;margin:0;font-size:28px;'>🎬 NILAMBUR FILMS</h1>
                <p style='color:rgba(255,255,255,0.8);margin:10px 0 0;'>Your E-Ticket</p>
            </div>
            
            <!-- Ticket Body -->
            <div style='background:linear-gradient(180deg,#1a1a2e,#16213e);padding:30px;'>
                
                <!-- Movie Title -->
                <div style='text-align:center;margin-bottom:25px;'>
                    <h2 style='color:#fff;margin:0;font-size:24px;'>$movieTitle</h2>
                    <p style='color:#8a50ff;margin:5px 0 0;'>$screenName</p>
                </div>
                
                <!-- Details Grid -->
                <div style='background:rgba(0,0,0,0.3);border-radius:15px;padding:20px;margin-bottom:20px;'>
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr>
                            <td style='padding:10px 0;color:rgba(255,255,255,0.5);font-size:14px;'>Booking ID</td>
                            <td style='padding:10px 0;color:#8a50ff;font-weight:bold;text-align:right;font-family:monospace;'>$bookingId</td>
                        </tr>
                        <tr>
                            <td style='padding:10px 0;color:rgba(255,255,255,0.5);font-size:14px;border-top:1px solid rgba(255,255,255,0.1);'>Guest Name</td>
                            <td style='padding:10px 0;color:#fff;text-align:right;border-top:1px solid rgba(255,255,255,0.1);'>$userName</td>
                        </tr>
                        <tr>
                            <td style='padding:10px 0;color:rgba(255,255,255,0.5);font-size:14px;border-top:1px solid rgba(255,255,255,0.1);'>Date & Time</td>
                            <td style='padding:10px 0;color:#fff;text-align:right;border-top:1px solid rgba(255,255,255,0.1);'>$bookingDate</td>
                        </tr>
                        <tr>
                            <td style='padding:10px 0;color:rgba(255,255,255,0.5);font-size:14px;border-top:1px solid rgba(255,255,255,0.1);'>Seats</td>
                            <td style='padding:10px 0;color:#4caf50;font-weight:bold;text-align:right;border-top:1px solid rgba(255,255,255,0.1);'>$seats</td>
                        </tr>
                        <tr>
                            <td style='padding:15px 0 10px;color:rgba(255,255,255,0.5);font-size:14px;border-top:2px dashed rgba(255,255,255,0.1);'>Total Paid</td>
                            <td style='padding:15px 0 10px;color:#4caf50;font-size:24px;font-weight:bold;text-align:right;border-top:2px dashed rgba(255,255,255,0.1);'>₹$amount</td>
                        </tr>
                    </table>
                </div>
                
                <!-- QR Code -->
                <div style='text-align:center;background:#fff;border-radius:15px;padding:20px;margin-bottom:20px;'>
                    <p style='color:#333;margin:0 0 15px;font-size:12px;text-transform:uppercase;letter-spacing:1px;'>Scan QR Code at Entrance</p>
                    <img src='$qrUrl' alt='QR Code' style='width:150px;height:150px;'>
                </div>
                
                <!-- Instructions -->
                <div style='background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.3);border-radius:10px;padding:15px;'>
                    <p style='color:#ffc107;margin:0;font-size:13px;'>
                        ⚠️ <strong>Important:</strong> Please arrive 15 minutes before showtime. Carry a valid ID proof.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style='background:rgba(0,0,0,0.5);border-radius:0 0 20px 20px;padding:20px;text-align:center;'>
                <p style='color:rgba(255,255,255,0.4);margin:0;font-size:12px;'>
                    Thank you for choosing Nilambur Films! 🎬<br>
                    Questions? Contact us at support@nilamburfilms.com
                </p>
            </div>
            
        </div>
    </body>
    </html>";
    
    return sendEmail($toEmail, $subject, $body);
}
?>
