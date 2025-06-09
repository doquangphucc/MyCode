document.addEventListener('DOMContentLoaded', () => {
    const countdownArea = document.getElementById('countdownArea');
    const messageArea = document.getElementById('messageArea');
    const choicesArea = document.getElementById('choicesArea');
    const resultArea = document.getElementById('resultArea');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    const player1NameDisplay = document.getElementById('player1Name');
    const player1ChoiceDisplay = document.getElementById('player1ChoiceDisplay');
    const player2NameDisplay = document.getElementById('player2Name');
    const player2ChoiceDisplay = document.getElementById('player2ChoiceDisplay');

    const choiceButtons = {
        rock: document.getElementById('rock'),
        paper: document.getElementById('paper'),
        scissors: document.getElementById('scissors')
    };

    let socket;
    let roomId;
    let currentUserId; // Sẽ lấy từ localStorage
    let myPlayerNumber; // 1 hoặc 2

    function initGame() {
        currentUserId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        if (!currentUserId) {
            alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            window.location.href = 'login.html'; // Hoặc trang sảnh
            return;
        }

        const params = new URLSearchParams(window.location.search);
        roomId = params.get('roomId');
        if (!roomId) {
            alert("Không tìm thấy ID phòng. Quay lại sảnh.");
            window.location.href = 'lobby.html';
            return;
        }

        // Thay 'ws://localhost:8080' bằng URL WebSocket server của bạn
        // Ví dụ: nếu bạn dùng Ratchet, nó thường chạy trên một port khác.
        socket = new WebSocket('ws://localhost:8080'); // ĐỊA CHỈ WEBSOCKET SERVER

        socket.onopen = () => {
            console.log('WebSocket Connected');
            messageArea.textContent = 'Đã kết nối tới phòng game...';
            // Gửi thông tin tham gia phòng lên server
            socket.send(JSON.stringify({
                type: 'join_game',
                roomId: roomId,
                userId: currentUserId,
                username: username
            }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Message from server:', data);

            switch (data.type) {
                case 'room_full':
                    alert('Phòng đã đầy hoặc có lỗi xảy ra. Quay lại sảnh.');
                    window.location.href = 'lobby.html';
                    break;
                case 'game_info': // Server gửi thông tin ban đầu về phòng và người chơi
                    myPlayerNumber = data.yourPlayerNumber;
                    player1NameDisplay.textContent = data.player1.username || 'Người chơi 1';
                    if (data.player2) {
                        player2NameDisplay.textContent = data.player2.username || 'Người chơi 2';
                    } else {
                        player2NameDisplay.textContent = 'Đang chờ...';
                    }
                    if (data.player1 && data.player2) {
                        countdownArea.textContent = "Chuẩn bị bắt đầu!";
                    } else {
                        countdownArea.textContent = "Đang chờ người chơi thứ 2...";
                    }
                    break;
                case 'player_joined':
                    if (data.playerNumber === 1) {
                        player1NameDisplay.textContent = data.username;
                    } else if (data.playerNumber === 2) {
                        player2NameDisplay.textContent = data.username;
                    }
                    countdownArea.textContent = "Chuẩn bị bắt đầu!";
                    break;
                case 'countdown':
                    countdownArea.textContent = data.value;
                    if (data.value === "Bắt đầu!") {
                        messageArea.textContent = 'Hãy chọn trong 5 giây!';
                        showChoices();
                        startChoiceTimer(5); // Bắt đầu đếm ngược 5s để chọn
                    }
                    break;
                case 'game_result':
                    hideChoices();
                    displayChoices(data.choices);
                    displayResult(data.winner, data.choices);
                    messageArea.textContent = 'Ván đấu kết thúc. Bạn sẽ được đưa về sảnh sau giây lát.';
                    setTimeout(() => {
                        // Tự động rời phòng sau khi xem kết quả
                        // Hoặc server có thể tự động kick
                        window.location.href = 'lobby.html';
                    }, 5000); // 5 giây
                    break;
                case 'opponent_choice_made': // Thông báo đối thủ đã chọn (không tiết lộ lựa chọn)
                    if (myPlayerNumber === 1 && data.playerNumber === 2 || myPlayerNumber === 2 && data.playerNumber === 1) {
                         messageArea.textContent = 'Đối thủ đã chọn. Chờ bạn...';
                    }
                    break;
                case 'opponent_left':
                    alert('Đối thủ đã rời phòng. Trận đấu kết thúc.');
                    window.location.href = 'lobby.html';
                    break;
                case 'error':
                    alert(`Lỗi từ server: ${data.message}`);
                    break;
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
            messageArea.textContent = 'Mất kết nối tới server. Vui lòng thử lại.';
            // Có thể thử kết nối lại hoặc điều hướng người dùng
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            messageArea.textContent = 'Lỗi kết nối WebSocket.';
        };
    }

    function showChoices() {
        choicesArea.style.display = 'block';
        Object.values(choiceButtons).forEach(btn => btn.disabled = false);
        player1ChoiceDisplay.textContent = '?';
        player2ChoiceDisplay.textContent = '?';
        resultArea.textContent = '';
    }

    function hideChoices() {
        choicesArea.style.display = 'none';
    }

    function disableChoiceButtons() {
        Object.values(choiceButtons).forEach(btn => btn.disabled = true);
    }

    let choiceTimer;
    function startChoiceTimer(seconds) {
        let timeLeft = seconds;
        messageArea.textContent = `Chọn trong: ${timeLeft}s`;
        clearInterval(choiceTimer); // Xóa interval cũ nếu có
        choiceTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) {
                messageArea.textContent = `Chọn trong: ${timeLeft}s`;
            }
            if (timeLeft < 0) {
                clearInterval(choiceTimer);
                messageArea.textContent = 'Hết giờ chọn!';
                disableChoiceButtons();
                // Gửi lựa chọn mặc định hoặc không chọn lên server nếu người chơi chưa chọn
                // Server sẽ xử lý việc này
                if (!playerMadeChoiceThisRound) {
                     socket.send(JSON.stringify({ type: 'player_choice', choice: null, roomId: roomId, userId: currentUserId }));
                }
            }
        }, 1000);
    }
    let playerMadeChoiceThisRound = false;

    Object.values(choiceButtons).forEach(button => {
        button.addEventListener('click', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                const choice = button.dataset.choice;
                socket.send(JSON.stringify({ type: 'player_choice', choice: choice, roomId: roomId, userId: currentUserId }));
                messageArea.textContent = `Bạn đã chọn ${translateChoice(choice)}. Chờ đối thủ...`;
                disableChoiceButtons();
                clearInterval(choiceTimer); // Dừng timer khi đã chọn
                playerMadeChoiceThisRound = true;
            }
        });
    });

    function displayChoices(choices) { // choices = { player1: 'rock', player2: 'paper' }
        if (choices) {
            player1ChoiceDisplay.textContent = translateChoice(choices.player1) || '?';
            player2ChoiceDisplay.textContent = translateChoice(choices.player2) || '?';
        }
    }

    function displayResult(winnerData, choices) { // winnerData = { winnerId: 'userId', text: 'Bạn thắng!' } hoặc null nếu hòa
        if (winnerData) {
            if (winnerData.winnerId === currentUserId) {
                resultArea.textContent = `🎉 BẠN THẮNG! 🎉`;
                resultArea.style.color = 'green';
            } else if (winnerData.winnerId === 'draw') {
                resultArea.textContent = `🤝 HÒA! 🤝`;
                resultArea.style.color = 'blue';
            } else {
                resultArea.textContent = `😭 BẠN THUA! 😭`;
                resultArea.style.color = 'red';
            }
        } else { // Trường hợp không có winnerData rõ ràng, có thể là hòa hoặc lỗi
             if (choices && choices.player1 && choices.player2 && choices.player1 === choices.player2) {
                resultArea.textContent = `🤝 HÒA! 🤝`;
                resultArea.style.color = 'blue';
            } else {
                resultArea.textContent = "Chờ kết quả...";
                resultArea.style.color = 'black';
            }
        }
    }


    function translateChoice(choice) {
        switch (choice) {
            case 'rock': return '✊ Búa';
            case 'paper': return '🖐️ Bao';
            case 'scissors': return '✌️ Kéo';
            default: return choice; // Hoặc '?' nếu không xác định
        }
    }

    leaveRoomBtn.addEventListener('click', () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'leave_game', roomId: roomId, userId: currentUserId }));
        }
        window.location.href = 'index.html'; // Điều hướng ngay cả khi socket không mở
    });

    // Khởi tạo game khi trang được tải
    initGame();
});
