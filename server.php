<?php
// File: bin/server.php
// Đây là file để khởi chạy server từ dòng lệnh: php bin/server.php

require dirname(__DIR__) . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use MyApp\GameServer;

// Đặt múi giờ
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Khởi tạo server
$port = 8080;
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
