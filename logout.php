<?php
session_start();

// Hủy tất cả các biến session
$_SESSION = array();

// Nếu muốn hủy session hoàn toàn, hãy xóa cả cookie session.
// Lưu ý: Điều này sẽ phá hủy session, và không chỉ dữ liệu session!
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Cuối cùng, hủy session.
session_destroy();

header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'message' => 'Đã đăng xuất thành công.']);
?>
