<?php
require_once 'db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$response = ['status' => 'error', 'message' => 'Yêu cầu không hợp lệ.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // QUAN TRỌNG: $joiningUserId phải được lấy từ session/token đã xác thực
    if (empty($data->userId) || empty($data->roomId)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Thiếu thông tin người dùng hoặc phòng.']);
        exit;
    }
    $joiningUserId = filter_var($data->userId, FILTER_VALIDATE_INT);
    $roomId = filter_var($data->roomId, FILTER_VALIDATE_INT);

    if ($joiningUserId && $roomId) {
        $pdo->beginTransaction();
        try {
            // Kiểm tra phòng và khóa dòng để tránh race condition
            $stmt_check = $pdo->prepare("SELECT Player1ID, Player2ID FROM Rooms WHERE RoomID = :roomId FOR UPDATE");
            $stmt_check->bindParam(':roomId', $roomId, PDO::PARAM_INT);
            $stmt_check->execute();
            $room = $stmt_check->fetch(PDO::FETCH_ASSOC);

            if (!$room) {
                $response['message'] = 'Phòng không tồn tại.';
                http_response_code(404);
            } elseif ($room['Player1ID'] == $joiningUserId || $room['Player2ID'] == $joiningUserId) {
                $response['status'] = 'info';
                $response['message'] = 'Bạn đã ở trong phòng này rồi.';
                http_response_code(200);
            } elseif ($room['Player1ID'] && $room['Player2ID']) {
                $response['message'] = 'Phòng đã đầy.';
                http_response_code(403); // Forbidden
            } elseif (!$room['Player1ID']) { // Phòng trống, người chơi vào làm Player1
                $sql_update = "UPDATE Rooms SET Player1ID = :joiningUserId WHERE RoomID = :roomId";
                $stmt_update = $pdo->prepare($sql_update);
            } elseif (!$room['Player2ID']) { // Phòng có 1 người, người chơi vào làm Player2
                $sql_update = "UPDATE Rooms SET Player2ID = :joiningUserId WHERE RoomID = :roomId";
                $stmt_update = $pdo->prepare($sql_update);
            }

            if (isset($sql_update)) {
                $stmt_update->bindParam(':joiningUserId', $joiningUserId, PDO::PARAM_INT);
                $stmt_update->bindParam(':roomId', $roomId, PDO::PARAM_INT);
                if ($stmt_update->execute() && $stmt_update->rowCount() > 0) {
                    $response['status'] = 'success';
                    $response['message'] = 'Đã tham gia phòng thành công.';
                    http_response_code(200);
                    // Nếu Player2 vừa vào, phòng đủ người -> có thể gửi tín hiệu bắt đầu game (qua WebSockets)
                } else {
                    $response['message'] = 'Không thể tham gia phòng (có thể đã có người khác tham gia nhanh hơn).';
                    http_response_code(409); // Conflict
                }
            }
            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            $response['message'] = 'Lỗi cơ sở dữ liệu: ' . $e->getMessage();
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