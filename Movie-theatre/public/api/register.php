<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once "db.php";
require_once "smtp_mailer.php";

function generateOTP() {
    return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = file_get_contents("php://input");
        error_log("Register Input: " . $input);
        
        $data = json_decode($input, true);
        
        if (empty($data["name"]) || empty($data["email"]) || empty($data["phone"]) || empty($data["password"])) {
            echo json_encode(["status" => "error", "message" => "All fields are required"]);
            exit;
        }

        $name = $conn->real_escape_string(trim($data["name"]));
        $email = $conn->real_escape_string(trim($data["email"]));
        $phone = $conn->real_escape_string(trim($data["phone"]));
        $password = password_hash($data["password"], PASSWORD_BCRYPT);
        
        $otp = generateOTP();
        $otp_expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));
        
        error_log("Generated OTP: $otp for $email");

        // Check if email exists
        $check = $conn->prepare("SELECT id, is_verified FROM users WHERE email = ?");
        $check->bind_param("s", $email);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            $existingUser = $result->fetch_assoc();
            
            if ($existingUser['is_verified'] == 0) {
                // Update existing unverified user
                $updateStmt = $conn->prepare("UPDATE users SET name = ?, phone = ?, password = ?, otp = ?, otp_expiry = ? WHERE email = ?");
                $updateStmt->bind_param("ssssss", $name, $phone, $password, $otp, $otp_expiry, $email);
                
                if ($updateStmt->execute()) {
                    // Send email
                    $emailResult = sendOTPEmail($email, $name, $otp);
                    error_log("Email result: " . json_encode($emailResult));
                    
                    echo json_encode([
                        "status" => "otp_sent",
                        "message" => "Verification code sent",
                        "email" => $email,
                        "email_sent" => $emailResult['success']
                    ]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Update failed: " . $conn->error]);
                }
                exit;
            }
            
            echo json_encode(["status" => "error", "message" => "Email already registered"]);
            exit;
        }

        // Insert new user
        $stmt = $conn->prepare("INSERT INTO users (name, email, phone, password, otp, otp_expiry, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0)");
        $stmt->bind_param("ssssss", $name, $email, $phone, $password, $otp, $otp_expiry);

        if ($stmt->execute()) {
            // Send email
            $emailResult = sendOTPEmail($email, $name, $otp);
            error_log("Email result: " . json_encode($emailResult));
            
            echo json_encode([
                "status" => "otp_sent",
                "message" => "Verification code sent to your email",
                "email" => $email,
                "email_sent" => $emailResult['success']
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Registration failed: " . $conn->error]);
        }
        
    } catch (Exception $e) {
        error_log("Register Exception: " . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Server error"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request"]);
}
?>
