<?php
require_once 'db_connect.php'; // Đảm bảo file này thiết lập biến $pdo

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // CHỈ DÙNG CHO DEVELOPMENT
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Trong thực tế, bạn cần xác thực người dùng ở đây (ví dụ: qua JWT token)
// $currentUserId = authenticate_and_get_user_id();

$response = ['status' => 'error', 'message' => 'Không thể lấy danh sách phòng.'];

try {
    // Lấy danh sách phòng cùng thông tin người chơi (nếu có)
    $stmt = $pdo->query("
        SELECT
            r.RoomID,
            r.RoomName,
            r.Player1ID,
            u1.Username AS Player1Username,
            r.Player2ID,
            u2.Username AS Player2Username,
            r.CreatedAt
        FROM Rooms r
        LEFT JOIN Users u1 ON r.Player1ID = u1.Id
        LEFT JOIN Users u2 ON r.Player2ID = u2.Id
        ORDER BY r.CreatedAt DESC
    ");

    $roomsData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $rooms = [];
    foreach($roomsData as $room) {
        $playerCount = 0;
        if ($room['Player1ID']) $playerCount++;
        if ($room['Player2ID']) $playerCount++;
        $room['PlayerCount'] = $playerCount;

        if ($playerCount == 2) {
            $room['StatusColor'] = 'red'; // Đầy
        } elseif ($playerCount == 1) {
            $room['StatusColor'] = 'green'; // Còn 1 chỗ
        } else {
            $room['StatusColor'] = 'blue'; // Trống (có thể không hiển thị hoặc cho phép vào)
        }
        $rooms[] = $room;
    }

    $response['status'] = 'success';
    $response['rooms'] = $rooms;
    http_response_code(200);
} catch (PDOException $e) {
    // Nên log lỗi $e->getMessage() vào file thay vì echo ra
    $response['message'] = 'Lỗi cơ sở dữ liệu khi lấy danh sách phòng.';
    http_response_code(500);
}

echo json_encode($response);
?>