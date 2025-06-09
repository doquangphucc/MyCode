<?php
require_once 'db_connect.php'; // Điều chỉnh đường dẫn nếu cần

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Cho phép truy cập từ mọi nguồn (thay đổi '*' thành domain của bạn trong production)
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

$response = ['status' => 'error', 'message' => 'Yêu cầu không hợp lệ.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->username) && !empty($data->password)) {
        $username = trim($data->username);
        $password = $data->password;

        // Kiểm tra username đã tồn tại chưa
        $sql_check = "SELECT Id FROM Users WHERE Username = :username";
        $stmt_check = $pdo->prepare($sql_check);
        $stmt_check->bindParam(':username', $username);
        $stmt_check->execute();

        if ($stmt_check->rowCount() > 0) {
            $response['message'] = 'Tên đăng nhập đã tồn tại.';
        } else {
            // Băm mật khẩu
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);

            $sql_insert = "INSERT INTO Users (Username, PasswordHash) VALUES (:username, :passwordHash)";
            $stmt_insert = $pdo->prepare($sql_insert);
            $stmt_insert->bindParam(':username', $username);
            $stmt_insert->bindParam(':passwordHash', $passwordHash);

            try {
                if ($stmt_insert->execute()) {
                    $response['status'] = 'success';
                    $response['message'] = 'Đăng ký thành công.';
                    http_response_code(201); // Created
                } else {
                    $response['message'] = 'Đăng ký thất bại. Vui lòng thử lại.';
                    http_response_code(500); // Internal Server Error
                }
            } catch (PDOException $e) {
                // Log lỗi $e->getMessage()
                $response['message'] = 'Đã xảy ra lỗi phía máy chủ.';
                http_response_code(500);
            }
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
