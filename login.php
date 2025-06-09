<?php
require_once 'db_connect.php'; // Điều chỉnh đường dẫn nếu cần

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

// Bắt đầu session nếu bạn muốn sử dụng session PHP (tùy chọn, JWT phổ biến hơn cho API)
// session_start();

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
                // Đăng nhập thành công
                // Ở đây bạn có thể tạo JWT token hoặc thiết lập session
                // Ví dụ đơn giản:
                $response['status'] = 'success';
                $response['message'] = 'Đăng nhập thành công.';
                $response['user'] = [
                    'id' => $user['Id'],
                    'username' => $user['Username']
                    // Không bao giờ trả về PasswordHash
                ];
                // Nếu dùng JWT, bạn sẽ tạo token ở đây và gửi về
                // $response['token'] = generate_jwt_token($user['Id']);
                http_response_code(200);
            } else {
                $response['message'] = 'Tên đăng nhập hoặc mật khẩu không đúng.';
                http_response_code(401); // Unauthorized
            }
        } catch (PDOException $e) {
            // Log lỗi $e->getMessage()
            $response['message'] = 'Đã xảy ra lỗi phía máy chủ khi đăng nhập.';
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
