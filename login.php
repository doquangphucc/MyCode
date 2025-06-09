<?php
// Bắt đầu session ở đầu mỗi file cần xác thực
session_start();

require_once 'db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Cần cấu hình chính xác cho production
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
// Cho phép trình duyệt gửi cookie (chứa session ID)
header('Access-Control-Allow-Credentials: true');

$response = ['status' => 'error', 'message' => 'Yêu cầu không hợp lệ.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->username) && !empty($data->password)) {
        $username = trim($data->username);
        $password = $data->password;

        $sql = "SELECT Id, Username, PasswordHash FROM Users WHERE Username = :username";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':username', $username);

        try {
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['PasswordHash'])) {
                // Đăng nhập thành công, lưu thông tin vào session
                $_SESSION['user_id'] = $user['Id'];
                $_SESSION['username'] = $user['Username'];

                $response['status'] = 'success';
                $response['message'] = 'Đăng nhập thành công.';
                $response['user'] = [
                    'id' => $user['Id'],
                    'username' => $user['Username']
                ];
                http_response_code(200);
            } else {
                $response['message'] = 'Tên đăng nhập hoặc mật khẩu không đúng.';
                http_response_code(401); // Unauthorized
            }
        } catch (PDOException $e) {
            $response['message'] = 'Lỗi server khi đăng nhập.';
            http_response_code(500);
        }
    } else {
        $response['message'] = 'Vui lòng cung cấp tên đăng nhập và mật khẩu.';
        http_response_code(400); // Bad Request
    }
} else {
    http_response_code(405); // Method Not Allowed
    $response['message'] = 'Phương thức không được phép.';
}

echo json_encode($response);
?>
