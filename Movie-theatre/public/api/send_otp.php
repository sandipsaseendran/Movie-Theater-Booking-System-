<?php
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "db.php";
require_once "smtp_mailer.php";

function generateOTP() {
    return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['email'])) {
            echo json_encode(["status" => "error", "message" => "Email is required"]);
            exit;
        }
        
        $email = $conn->real_escape_string(trim($data['email']));
        $name = isset($data['name']) ? $conn->real_escape_string(trim($data['name'])) : "User";
        
        // Check if user exists
        $check = $conn->prepare("SELECT id, name, is_verified FROM users WHERE email = ?");
        $check->bind_param("s", $email);
        $check->execute();
        $result = $check->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(["status" => "error", "message" => "Email not found"]);
            exit;
        }
        
        $user = $result->fetch_assoc();
        $userName = $user['name'] ?: $name;
        
        if ($user['is_verified'] == 1) {
            echo json_encode(["status" => "error", "message" => "Email already verified"]);
            exit;
        }
        
        $otp = generateOTP();
        $otp_expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));
        
        $stmt = $conn->prepare("UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?");
        $stmt->bind_param("sss", $otp, $otp_expiry, $email);
        
        if ($stmt->execute()) {
            $emailResult = sendOTPEmail($email, $userName, $otp);
            
            echo json_encode([
                "status" => "success",
                "message" => "Verification code sent to your email",
                "email_sent" => $emailResult['success']
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to generate code"]);
        }
        
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Server error"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request"]);
}
?>
