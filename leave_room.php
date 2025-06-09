<?php
session_start(); // Bắt đầu session để truy cập thông tin người dùng
require_once 'db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Cần cấu hình chính xác cho production
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Lấy ID người dùng từ SESSION
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['status' => 'error', 'message' => 'Bạn cần đăng nhập để thực hiện hành động này.']);
    exit;
}
$leavingUserId = $_SESSION['user_id'];

$response = ['status' => 'error', 'message' => 'Yêu cầu không hợp lệ.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // Lấy roomId từ client
    if (empty($data->roomId)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Thiếu thông tin người dùng hoặc phòng.']);
        exit;
    }
    $roomId = filter_var($data->roomId, FILTER_VALIDATE_INT);

    if ($leavingUserId && $roomId) {
        $pdo->beginTransaction();
        try {
            $stmt_check = $pdo->prepare("SELECT Player1ID, Player2ID FROM Rooms WHERE RoomID = :roomId FOR UPDATE");
            $stmt_check->bindParam(':roomId', $roomId, PDO::PARAM_INT);
            $stmt_check->execute();
            $room = $stmt_check->fetch(PDO::FETCH_ASSOC);

            if (!$room) {
                $response['message'] = 'Phòng không tồn tại.';
                http_response_code(404);
            } elseif ($room['Player1ID'] == $leavingUserId) {
                // Nếu Player1 rời, Player2 (nếu có) sẽ được đôn lên làm Player1
                $sql_update = "UPDATE Rooms SET Player1ID = Player2ID, Player2ID = NULL WHERE RoomID = :roomId";
            } elseif ($room['Player2ID'] == $leavingUserId) {
                // Nếu Player2 rời, chỉ cần xóa Player2
                $sql_update = "UPDATE Rooms SET Player2ID = NULL WHERE RoomID = :roomId";
            } else {
                $response['message'] = 'Người dùng không ở trong phòng này.';
                http_response_code(403);
            }

            if (isset($sql_update)) {
                $stmt_update = $pdo->prepare($sql_update);
                $stmt_update->bindParam(':roomId', $roomId, PDO::PARAM_INT);
                if ($stmt_update->execute()) {
                    $response['status'] = 'success';
                    $response['message'] = 'Đã rời phòng thành công.';
                    http_response_code(200);
                } else {
                    $response['message'] = 'Không thể cập nhật trạng thái phòng.';
                    http_response_code(500);
                }
            }
            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            $response['message'] = 'Lỗi cơ sở dữ liệu.';
            http_response_code(500);
        }
    } else {
        $response['message'] = 'Dữ liệu không hợp lệ.';
        http_response_code(400);
    }
} else {
    http_response_code(405);
    $response['message'] = 'Phương thức không được phép.';
}
echo json_encode($response);
?>
