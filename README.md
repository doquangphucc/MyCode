Game Kéo Búa Bao Online
Đây là một dự án game Kéo Búa Bao (Rock-Paper-Scissors) online nhiều người chơi, được xây dựng bằng PHP, JavaScript và WebSocket.

Tính năng
Đăng ký, đăng nhập tài khoản.

Sảnh chờ hiển thị danh sách phòng.

Tạo phòng chơi mới.

Tham gia phòng của người khác.

Chơi game Kéo Búa Bao trong thời gian thực.

Tự động cập nhật trạng thái phòng và người chơi.

Công nghệ sử dụng
Backend: PHP

Frontend: HTML, CSS, JavaScript (Vanilla JS)

Cơ sở dữ liệu: MySQL / MariaDB

Giao tiếp thời gian thực: WebSocket (sử dụng thư viện Ratchet cho PHP)

Quản lý gói PHP: Composer

Hướng dẫn cài đặt
Yêu cầu
PHP (phiên bản 7.4 trở lên)

Máy chủ web (Apache, Nginx, hoặc sử dụng máy chủ tích hợp của PHP)

MySQL hoặc MariaDB

Composer

Các bước cài đặt
Clone Repository

git clone https://github.com/new
cd [tên thư mục repository]

Cài đặt các gói PHP
Sử dụng Composer để cài đặt thư viện Ratchet cho WebSocket.

composer install

Thiết lập Cơ sở dữ liệu

Tạo một cơ sở dữ liệu mới (ví dụ: giaitrionline).

Import tệp database.sql vào cơ sở dữ liệu vừa tạo để tạo các bảng Users và Rooms.

Mở tệp api/db_connect.php và cập nhật thông tin kết nối ($host, $dbname, $username_db, $password_db) cho phù hợp với cấu hình của bạn.

Cấu hình Web Server

Trỏ thư mục gốc (document root) của web server vào thư mục chính của dự án.

Đảm bảo web server có quyền ghi/đọc cần thiết.

URL của các API endpoint sẽ có dạng http://your-domain.com/api/login.php.

Cách chạy dự án
Dự án này cần chạy 2 tiến trình song song: một là Web Server cho các file HTML/PHP, và hai là WebSocket Server cho game thời gian thực.

Chạy Web Server

Nếu bạn dùng XAMPP, WAMP, MAMP, chỉ cần khởi động Apache và đảm bảo các tệp dự án nằm trong thư mục htdocs hoặc www.

Hoặc bạn có thể dùng máy chủ tích hợp của PHP (chạy từ thư mục gốc của dự án):

php -S localhost:8000

Truy cập http://localhost:8000/register.html để bắt đầu.

Chạy WebSocket Server

Mở một cửa sổ terminal khác và chạy lệnh sau từ thư mục gốc của dự án:

php bin/server.php

Nếu thành công, bạn sẽ thấy thông báo: WebSocket Server started on port 8080.

Lưu ý: Tiến trình này phải luôn chạy để game có thể hoạt động.

Bây giờ bạn có thể mở 2 tab trình duyệt khác nhau, đăng ký 2 tài khoản, đăng nhập và bắt đầu chơi với nhau!