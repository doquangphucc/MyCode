document.addEventListener('DOMContentLoaded', () => {
    // Không cần API_BASE_URL nữa, vì các file đều nằm chung thư mục
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Hàm hiển thị lỗi
    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    // Xử lý form ĐĂNG NHẬP
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                // Gọi trực tiếp đến file login.php
                const response = await fetch(`login.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.status === 'success') {
                    localStorage.setItem('userId', data.user.id);
                    localStorage.setItem('username', data.user.username);
                    window.location.href = 'index.html';
                } else {
                    showError(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Không thể kết nối tới máy chủ.');
            }
        });
    }

    // Xử lý form ĐĂNG KÝ
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;

            if (password.length < 6) {
                showError('Mật khẩu phải có ít nhất 6 ký tự.');
                return;
            }

            try {
                // Gọi trực tiếp đến file register.php
                const response = await fetch(`register.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.status === 'success') {
                    alert('Đăng ký thành công! Vui lòng đăng nhập.');
                    window.location.href = 'login.html';
                } else {
                    showError(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
                }
            } catch (error) {
                console.error('Register error:', error);
                showError('Không thể kết nối tới máy chủ.');
            }
        });
    }
});
