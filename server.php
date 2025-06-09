<?php
// File: server.php
// Đặt file này ở thư mục gốc của dự án

// *** THAY ĐỔI ĐƯỜNG DẪN ***
// require_once __DIR__ để trỏ đến thư mục hiện tại
require_once __DIR__ . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use MyApp\GameServer;

// Đặt múi giờ
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Khởi tạo server
$port = 8090;
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new GameServer()
        )
    ),
    $port
);

echo "WebSocket Server started on port {$port}\n";
$server->run();
