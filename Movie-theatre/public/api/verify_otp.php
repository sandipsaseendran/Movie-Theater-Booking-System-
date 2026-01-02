<?php
// Suppress PHP HTML error output
error_reporting(0);
ini_set('display_errors', 0);

session_start();

// Set headers FIRST
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "db.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['email']) || empty($data['otp'])) {
            echo json_encode(["status" => "error", "message" => "Email and OTP are required"]);
            exit;
        }
        
        $email = $conn->real_escape_string(trim($data['email']));
        $otp = $conn->real_escape_string(trim($data['otp']));
        
        // Check OTP
        $stmt = $conn->prepare("SELECT id, name, email, otp, otp_expiry, is_verified FROM users WHERE email = ?");
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database error"]);
            exit;
        }
        
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(["status" => "error", "message" => "User not found. Please register first."]);
            exit;
        }
        
        $user = $result->fetch_assoc();
        
        // Check if already verified
        if ($user['is_verified'] == 1) {
            echo json_encode(["status" => "error", "message" => "Email already verified. Please login."]);
            exit;
        }
        
        // Verify OTP
        if ($user['otp'] !== $otp) {
            echo json_encode(["status" => "error", "message" => "Invalid OTP. Please try again."]);
            exit;
        }
        
        // Check OTP expiry
        if (strtotime($user['otp_expiry']) < time()) {
            echo json_encode(["status" => "error", "message" => "OTP has expired. Please request a new one."]);
            exit;
        }
        
        // Mark user as verified
        $updateStmt = $conn->prepare("UPDATE users SET is_verified = 1, otp = NULL, otp_expiry = NULL WHERE email = ?");
        $updateStmt->bind_param("s", $email);
        
        if ($updateStmt->execute()) {
            // Create session
            $_SESSION["user_id"] = $user["id"];
            $_SESSION["user_name"] = $user["name"];
            
            echo json_encode([
                "status" => "success",
                "message" => "Email verified successfully! Welcome to Nilambur Films!",
                "user" => [
                    "id" => $user["id"],
                    "name" => $user["name"],
                    "email" => $user["email"]
                ]
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Verification failed. Please try again."]);
        }
        
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Server error"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
?>
