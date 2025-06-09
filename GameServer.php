<?php
// File: src/GameServer.php
namespace MyApp;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class GameServer implements MessageComponentInterface {
    protected $clients;
    protected $rooms; // ['roomId' => ['players' => [conn1, conn2], 'choices' => [], 'player_info' => []]]

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->rooms = [];
        echo "GameServer initialized.\n";
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg);
        if (!$data || !isset($data->type)) return;

        switch ($data->type) {
            case 'join_game':
                $this->handleJoinGame($from, $data);
                break;
            case 'player_choice':
                $this->handlePlayerChoice($from, $data);
                break;
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->handleLeaveGame($conn);
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
    
    // --- LOGIC XỬ LÝ GAME ---

    private function handleJoinGame(ConnectionInterface $conn, $data) {
        $roomId = $data->roomId;
        $userId = $data->userId;
        $username = $data->username;

        // Khởi tạo phòng nếu chưa có
        if (!isset($this->rooms[$roomId])) {
            $this->rooms[$roomId] = [
                'players' => new \SplObjectStorage,
                'choices' => [],
                'player_info' => []
            ];
        }

        // Kiểm tra phòng có đầy không
        if (count($this->rooms[$roomId]['players']) >= 2) {
            $conn->send(json_encode(['type' => 'room_full']));
            return;
        }

        // Thêm người chơi vào phòng
        $this->rooms[$roomId]['players']->attach($conn);
        $playerNumber = count($this->rooms[$roomId]['players']);
        $this->rooms[$roomId]['player_info'][$conn->resourceId] = [
            'userId' => $userId,
            'username' => $username,
            'playerNumber' => $playerNumber
        ];
        
        // Gửi thông tin game cho người vừa vào
        $conn->send(json_encode([
            'type' => 'game_info',
            'yourPlayerNumber' => $playerNumber,
            'players' => array_values($this->rooms[$roomId]['player_info'])
        ]));

        // Thông báo cho người chơi khác trong phòng
        foreach ($this->rooms[$roomId]['players'] as $client) {
            if ($from !== $client) {
                $client->send(json_encode([
                    'type' => 'player_joined',
                    'playerNumber' => $playerNumber,
                    'username' => $username
                ]));
            }
        }
        
        // Nếu đủ 2 người, bắt đầu game
        if (count($this->rooms[$roomId]['players']) == 2) {
            $this->startGame($roomId);
        }
    }

    private function handlePlayerChoice(ConnectionInterface $from, $data) {
        $roomId = $data->roomId;
        $choice = $data->choice;
        $userId = $data->userId;

        if (!isset($this->rooms[$roomId])) return;

        // Lưu lựa chọn của người chơi
        $this->rooms[$roomId]['choices'][$userId] = $choice;
        
        // Thông báo cho đối thủ là mình đã chọn
         foreach ($this->rooms[$roomId]['players'] as $client) {
            if ($from !== $client) {
                $info = $this->rooms[$roomId]['player_info'][$from->resourceId];
                $client->send(json_encode(['type' => 'opponent_choice_made', 'playerNumber' => $info['playerNumber']]));
            }
        }


        // Nếu cả 2 người đã chọn, phân định kết quả
        if (count($this->rooms[$roomId]['choices']) == 2) {
            $this->calculateResult($roomId);
        }
    }

    private function handleLeaveGame(ConnectionInterface $conn) {
        foreach ($this->rooms as $roomId => &$room) {
            if ($room['players']->contains($conn)) {
                $room['players']->detach($conn);
                $info = $room['player_info'][$conn->resourceId];
                unset($room['player_info'][$conn->resourceId]);
                
                // Thông báo cho người còn lại
                foreach ($room['players'] as $client) {
                    $client->send(json_encode([
                        'type' => 'opponent_left',
                        'message' => "{$info['username']} đã rời phòng."
                    ]));
                }
                
                // Nếu không còn ai, xóa phòng
                if(count($room['players']) == 0) {
                    unset($this->rooms[$roomId]);
                }
                break;
            }
        }
    }
    
    private function startGame($roomId) {
        // Reset trạng thái
        $this->rooms[$roomId]['choices'] = [];

        $message = json_encode(['type' => 'countdown', 'value' => 'Bắt đầu!']);
        foreach ($this->rooms[$roomId]['players'] as $client) {
            $client->send($message);
        }
    }
    
    private function calculateResult($roomId) {
        $choices = $this->rooms[$roomId]['choices'];
        $players = array_values($this->rooms[$roomId]['player_info']);
        
        $p1_userId = $players[0]['userId'];
        $p2_userId = $players[1]['userId'];
        
        $p1_choice = $choices[$p1_userId] ?? null;
        $p2_choice = $choices[$p2_userId] ?? null;

        $winnerId = null;

        if ($p1_choice === $p2_choice) {
            $winnerId = 'draw';
        } elseif (
            ($p1_choice == 'rock' && $p2_choice == 'scissors') ||
            ($p1_choice == 'paper' && $p2_choice == 'rock') ||
            ($p1_choice == 'scissors' && $p2_choice == 'paper')
        ) {
            $winnerId = $p1_userId;
        } else {
            $winnerId = $p2_userId;
        }
        
        $resultData = [
            'type' => 'game_result',
            'choices' => [
                'player1' => $p1_choice,
                'player2' => $p2_choice
            ],
            'winnerId' => $winnerId
        ];
        
        // Gửi kết quả cho cả 2 người chơi
        foreach($this->rooms[$roomId]['players'] as $client) {
            $client->send(json_encode($resultData));
        }

        // Reset phòng cho ván mới hoặc xóa phòng
        // Tạm thời chỉ reset
        unset($this->rooms[$roomId]);
    }
}
