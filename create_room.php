<?php
require_once 'db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$response = ['status' => 'error', 'message' => 'Yêu cầu không hợp lệ.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // QUAN TRỌNG: $userId phải được lấy từ session/token đã xác thực, không phải từ input trực tiếp
    if (empty($data->userId)) {
        http_response_code(401); // Unauthorized
        echo json_encode(['status' => 'error', 'message' => 'Người dùng chưa được xác thực.']);
        exit;
    }
    $creatorUserId = filter_var($data->userId, FILTER_VALIDATE_INT);
    $roomName = !empty($data->roomName) ? htmlspecialchars(trim($data->roomName)) : "Phòng của User " . $creatorUserId;

    if ($creatorUserId) {
        try {
            // Người tạo phòng sẽ tự động là Player1
            $sql = "INSERT INTO Rooms (RoomName, Player1ID) VALUES (:roomName, :player1ID)";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':roomName', $roomName);
            $stmt->bindParam(':player1ID', $creatorUserId, PDO::PARAM_INT);

            if ($stmt->execute()) {
                $newRoomId = $pdo->lastInsertId();
                $response['status'] = 'success';
                $response['message'] = 'Phòng đã được tạo thành công.';
                $response['roomId'] = $newRoomId;
                $response['roomName'] = $roomName;
                http_response_code(201); // Created
            } else {
                $response['message'] = 'Không thể tạo phòng.';
                http_response_code(500);
            }
        } catch (PDOException $e) {
            $response['message'] = 'Lỗi cơ sở dữ liệu: ' . $e->getMessage(); // Chỉ cho dev, không cho production
            http_response_code(500);
        }
    } else {
        $response['message'] = 'Dữ liệu không hợp lệ hoặc người dùng không xác thực.';
        http_response_code(400); // Bad Request
    }
} else {
    http_response_code(405); // Method Not Allowed
    $response['message'] = 'Phương thức không được phép.';
}
echo json_encode($response);
?>