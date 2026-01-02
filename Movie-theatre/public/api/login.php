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

        if (empty($data["email"]) || empty($data["password"])) {
            echo json_encode(["status" => "error", "message" => "Email and password are required"]);
            exit;
        }

        $email = $conn->real_escape_string(trim($data["email"]));
        $password = $data["password"];

        $stmt = $conn->prepare("SELECT id, name, email, phone, password, is_verified, profile_picture FROM users WHERE email = ?");
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database error"]);
            exit;
        }
        
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
            exit;
        }

        $user = $result->fetch_assoc();

        // Check if email is verified
        if ($user["is_verified"] == 0) {
            echo json_encode([
                "status" => "not_verified",
                "message" => "Please verify your email first.",
                "email" => $user["email"]
            ]);
            exit;
        }

        if (!password_verify($password, $user["password"])) {
            echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
            exit;
        }

        // Create session
        $_SESSION["user_id"] = $user["id"];
        $_SESSION["user_name"] = $user["name"];
        $_SESSION["user_email"] = $user["email"];

        echo json_encode([
            "status" => "success",
            "message" => "Login successful!",
            "user" => [
                "id" => $user["id"],
                "name" => $user["name"],
                "email" => $user["email"],
                "phone" => $user["phone"],
                "profile_picture" => $user["profile_picture"]
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Server error"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
?>
