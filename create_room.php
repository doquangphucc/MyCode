<?php
session_start();
require_once 'db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// *** PHẦN QUAN TRỌNG: Lấy user ID từ SESSION, không phải từ client ***
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['status' => 'error', 'message' => 'Bạn cần đăng nhập để thực hiện hành động này.']);
    exit;
}
$creatorUserId = $_SESSION['user_id'];
$creatorUsername = $_SESSION['username'];

$response = ['status' => 'error', 'message' => 'Yêu cầu không hợp lệ.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $roomName = !empty($data->roomName) ? htmlspecialchars(trim($data->roomName)) : "Phòng của " . $creatorUsername;

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
        $response['message'] = 'Lỗi cơ sở dữ liệu.';
        http_response_code(500);
    }
} else {
    http_response_code(405);
    $response['message'] = 'Phương thức không được phép.';
}
echo json_encode($response);
?>
