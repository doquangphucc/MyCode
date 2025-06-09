document.addEventListener('DOMContentLoaded', () => {
    const currentUserId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!currentUserId) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('lobbyUsername').textContent = username;

    const roomsListDiv = document.getElementById('roomsList');
    const createRoomBtn = document.getElementById('createRoomBtn');

    async function fetchRooms() {
        try {
            const response = await fetch(`get_rooms.php`);
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
        roomsListDiv.innerHTML = '';
        if (!rooms || rooms.length === 0) {
            roomsListDiv.innerHTML = '<p>Hiện không có phòng nào. Hãy tạo phòng mới!</p>';
            return;
        }

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.classList.add('room-item');
            roomElement.classList.add(`room-${room.StatusColor}`);

            let playersInfo = "Trống";
            if (room.PlayerCount === 1) playersInfo = `${room.Player1Username || 'Người chơi 1'}`;
            if (room.PlayerCount === 2) playersInfo = `${room.Player1Username || 'Người chơi 1'} vs ${room.Player2Username || 'Người chơi 2'}`;

            roomElement.innerHTML = `
                <span class="room-name">${room.RoomName} (${room.PlayerCount}/2)</span>
                <span class="room-players">${playersInfo}</span>
            `;

            if (room.PlayerCount < 2 && room.Player1ID != currentUserId) {
                const joinBtn = document.createElement('button');
                joinBtn.textContent = 'Vào phòng';
                joinBtn.onclick = () => joinRoom(room.RoomID);
                roomElement.appendChild(joinBtn);
            } else if (room.PlayerCount >= 2) {
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
        if (roomName === null) return;

        try {
            const response = await fetch(`create_room.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName: roomName })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert(`Phòng "${data.roomName}" đã được tạo!`);
                joinRoom(data.roomId);
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
            const response = await fetch(`join_room.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: roomId })
            });
            const data = await response.json();
            if (data.status === 'success' || data.status === 'info') {
                window.location.href = `game.html?roomId=${roomId}`;
            } else {
                alert(data.message);
                fetchRooms();
            }
        } catch (error) {
            console.error('Lỗi joinRoom:', error);
            alert('Không thể kết nối tới máy chủ để vào phòng.');
        }
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch(`logout.php`);
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            alert('Bạn đã đăng xuất.');
            window.location.href = 'login.html';
        });
    }

    if (createRoomBtn) createRoomBtn.addEventListener('click', createRoom);
    fetchRooms();
    setInterval(fetchRooms, 15000);
});
