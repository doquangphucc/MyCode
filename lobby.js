document.addEventListener('DOMContentLoaded', () => {
    // Giả sử sau khi đăng nhập, bạn lưu userId vào localStorage
    // Trong ứng dụng thực tế, bạn sẽ dùng token và xác thực phía server
    const currentUserId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!currentUserId) {
        // Chuyển hướng về trang đăng nhập nếu chưa có userId
        // window.location.href = 'login.html';
        console.log("Người dùng chưa đăng nhập. Vui lòng đăng nhập để vào sảnh.");
        document.body.innerHTML = "<p>Vui lòng <a href='login.html'>đăng nhập</a> để vào sảnh.</p>";
        return;
    }

    const API_BASE_URL = 'api'; // Hoặc URL đầy đủ nếu khác domain
    const roomsListDiv = document.getElementById('roomsList');
    const createRoomBtn = document.getElementById('createRoomBtn');

    async function fetchRooms() {
        try {
            const response = await fetch(`${API_BASE_URL}/get_rooms.php`);
            if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
            const data = await response.json();

            if (data.status === 'success') {
                displayRooms(data.rooms);
            } else {
                roomsListDiv.innerHTML = `<p>Lỗi tải danh sách phòng: ${data.message}</p>`;
            }
        } catch (error) {
            console.error('Lỗi fetchRooms:', error);
            roomsListDiv.innerHTML = `<p>Không thể kết nối tới máy chủ để lấy danh sách phòng.</p>`;
        }
    }

    function displayRooms(rooms) {
        roomsListDiv.innerHTML = ''; // Xóa danh sách cũ
        if (!rooms || rooms.length === 0) {
            roomsListDiv.innerHTML = '<p>Hiện không có phòng nào. Hãy tạo phòng mới!</p>';
            return;
        }

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.classList.add('room-item');
            roomElement.classList.add(`room-${room.StatusColor}`); // 'room-green', 'room-red'

            let playersInfo = "Trống";
            if (room.PlayerCount === 1) playersInfo = `${room.Player1Username || 'Người chơi 1'}`;
            if (room.PlayerCount === 2) playersInfo = `${room.Player1Username || 'Người chơi 1'} vs ${room.Player2Username || 'Người chơi 2'}`;

            roomElement.innerHTML = `
                <span class="room-name">${room.RoomName} (${room.PlayerCount}/2)</span>
                <span class="room-players">${playersInfo}</span>
            `;

            if (room.PlayerCount < 2) {
                const joinBtn = document.createElement('button');
                joinBtn.textContent = 'Vào phòng';
                joinBtn.onclick = () => joinRoom(room.RoomID);
                roomElement.appendChild(joinBtn);
            } else {
                 const fullText = document.createElement('span');
                 fullText.textContent = " (Đầy)";
                 fullText.style.color = "grey";
                 roomElement.appendChild(fullText);
            }
            roomsListDiv.appendChild(roomElement);
        });
    }

    async function createRoom() {
        const roomName = prompt("Nhập tên phòng (để trống sẽ tự tạo):", `Phòng của ${username || 'người chơi'}`);
        // Nếu người dùng hủy prompt, roomName sẽ là null
        // if (roomName === null) return; // Không làm gì nếu hủy

        try {
            const response = await fetch(`${API_BASE_URL}/create_room.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, roomName: roomName })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert(`Phòng "${data.roomName}" đã được tạo!`);
                fetchRooms(); // Tải lại danh sách phòng
                // Tự động vào phòng vừa tạo: joinRoom(data.roomId);
            } else {
                alert(`Lỗi tạo phòng: ${data.message}`);
            }
        } catch (error) {
            console.error('Lỗi createRoom:', error);
            alert('Không thể kết nối tới máy chủ để tạo phòng.');
        }
    }

    async function joinRoom(roomId) {
        try {
            const response = await fetch(`${API_BASE_URL}/join_room.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, roomId: roomId })
            });
            const data = await response.json();
            alert(data.message); // Thông báo kết quả
            if (data.status === 'success' || data.status === 'info') {
                // Chuyển hướng tới trang game với roomId
                // window.location.href = `game.html?roomId=${roomId}`;
                console.log(`Đã vào phòng ${roomId}. Chuyển tới màn hình game...`);
            }
            fetchRooms(); // Tải lại danh sách phòng
        } catch (error) {
            console.error('Lỗi joinRoom:', error);
            alert('Không thể kết nối tới máy chủ để vào phòng.');
        }
    }

    if (createRoomBtn) createRoomBtn.addEventListener('click', createRoom);
    fetchRooms(); // Tải danh sách phòng khi vào sảnh
    setInterval(fetchRooms, 15000); // Tự động cập nhật danh sách phòng mỗi 15 giây
});