<?php
$host = 'localhost'; // Hoặc IP server database của bạn
$dbname = 'giaitrionline';
$username_db = 'giaitrionline';
$password_db = 'quangphuc2003..';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $username_db, $password_db, $options);
} catch (\PDOException $e) {
    // Trong thực tế, bạn nên log lỗi này thay vì echo ra
    // và trả về một thông báo lỗi chung cho client
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Không thể kết nối đến cơ sở dữ liệu.']);
    exit;
}
?>
