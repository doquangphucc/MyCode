document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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

    // Game state
    let socket;
    let roomId;
    let currentUserId;
    let username;
    let myPlayerNumber;
    let choiceTimer;
    let playerMadeChoiceThisRound = false;

    // --- INITIALIZATION ---
    function initGame() {
        currentUserId = localStorage.getItem('userId');
        username = localStorage.getItem('username');
        if (!currentUserId) {
            alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            window.location.href = 'login.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        roomId = params.get('roomId');
        if (!roomId) {
            alert("Không tìm thấy ID phòng. Quay lại sảnh.");
            window.location.href = 'index.html';
            return;
        }

        connectWebSocket();
    }

    // --- WEBSOCKET CONNECTION ---
    function connectWebSocket() {
        // Thay 'ws://localhost:8080' bằng địa chỉ IP của máy chủ nếu cần
        socket = new WebSocket('ws://localhost:8080');

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
            handleServerMessage(data);
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
            messageArea.textContent = 'Mất kết nối tới server. Vui lòng tải lại trang hoặc quay về sảnh.';
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            messageArea.textContent = 'Lỗi kết nối WebSocket.';
        };
    }

    // --- MESSAGE HANDLING ---
    function handleServerMessage(data) {
        switch (data.type) {
            case 'room_full':
                alert('Phòng đã đầy hoặc có lỗi xảy ra. Quay lại sảnh.');
                window.location.href = 'index.html';
                break;
            case 'game_info':
                updatePlayerInfo(data.players);
                myPlayerNumber = data.yourPlayerNumber;
                if(data.players.length < 2) {
                    countdownArea.textContent = "Đang chờ người chơi thứ 2...";
                }
                break;
            case 'player_joined':
                updatePlayerInfo(data.players);
                 countdownArea.textContent = "Chuẩn bị bắt đầu!";
                break;
            case 'countdown':
                countdownArea.textContent = data.value;
                if (data.value === "Bắt đầu!") {
                    messageArea.textContent = 'Hãy chọn trong 5 giây!';
                    resetForNewRound();
                    startChoiceTimer(5);
                }
                break;
            case 'game_result':
                hideChoices();
                displayChoices(data.choices);
                displayResult(data.winnerId);
                messageArea.textContent = 'Ván đấu kết thúc. Sẽ quay về sảnh sau 5 giây.';
                setTimeout(() => window.location.href = 'index.html', 5000);
                break;
            case 'opponent_choice_made':
                if (messageArea.textContent.includes('Hãy chọn')) {
                    messageArea.textContent = 'Đối thủ đã chọn. Chờ bạn...';
                }
                break;
            case 'opponent_left':
                alert('Đối thủ đã rời phòng. Trận đấu kết thúc.');
                window.location.href = 'index.html';
                break;
            case 'error':
                alert(`Lỗi từ server: ${data.message}`);
                break;
        }
    }
    
    function updatePlayerInfo(players){
        const player1 = players.find(p => p.playerNumber === 1);
        const player2 = players.find(p => p.playerNumber === 2);
        
        player1NameDisplay.textContent = player1 ? player1.username : 'Người chơi 1';
        player2NameDisplay.textContent = player2 ? player2.username : 'Đang chờ...';
    }

    // --- UI & GAME FLOW ---
    function resetForNewRound() {
        choicesArea.style.display = 'block';
        Object.values(choiceButtons).forEach(btn => btn.disabled = false);
        player1ChoiceDisplay.textContent = '?';
        player2ChoiceDisplay.textContent = '?';
        resultArea.textContent = '';
        playerMadeChoiceThisRound = false;
    }
    
    function hideChoices() {
        choicesArea.style.display = 'none';
    }

    function disableChoiceButtons() {
        Object.values(choiceButtons).forEach(btn => btn.disabled = true);
    }

    function startChoiceTimer(seconds) {
        let timeLeft = seconds;
        messageArea.textContent = `Chọn trong: ${timeLeft}s`;
        clearInterval(choiceTimer);
        choiceTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) {
                messageArea.textContent = `Chọn trong: ${timeLeft}s`;
            }
            if (timeLeft < 0) {
                clearInterval(choiceTimer);
                if (!playerMadeChoiceThisRound) {
                    messageArea.textContent = 'Hết giờ chọn!';
                    disableChoiceButtons();
                    socket.send(JSON.stringify({ type: 'player_choice', choice: null, roomId: roomId, userId: currentUserId }));
                }
            }
        }, 1000);
    }

    Object.values(choiceButtons).forEach(button => {
        button.addEventListener('click', () => {
            if (socket && socket.readyState === WebSocket.OPEN && !playerMadeChoiceThisRound) {
                const choice = button.dataset.choice;
                socket.send(JSON.stringify({ type: 'player_choice', choice: choice, roomId: roomId, userId: currentUserId }));
                messageArea.textContent = `Bạn đã chọn ${translateChoice(choice)}. Chờ đối thủ...`;
                disableChoiceButtons();
                clearInterval(choiceTimer);
                playerMadeChoiceThisRound = true;
            }
        });
    });

    function displayChoices(choices) {
        if (choices) {
            player1ChoiceDisplay.textContent = translateChoice(choices.player1) || '?';
            player2ChoiceDisplay.textContent = translateChoice(choices.player2) || '?';
        }
    }

    function displayResult(winnerId) {
        if (winnerId === 'draw') {
            resultArea.textContent = `🤝 HÒA! 🤝`;
            resultArea.style.color = 'blue';
        } else if (winnerId === currentUserId) {
            resultArea.textContent = `🎉 BẠN THẮNG! 🎉`;
            resultArea.style.color = 'green';
        } else {
            resultArea.textContent = `😭 BẠN THUA! 😭`;
            resultArea.style.color = 'red';
        }
    }

    function translateChoice(choice) {
        const choiceMap = { 'rock': '✊ Búa', 'paper': '🖐️ Bao', 'scissors': '✌️ Kéo' };
        return choiceMap[choice] || choice;
    }

    leaveRoomBtn.addEventListener('click', () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
        window.location.href = 'index.html';
    });

    initGame();
});
