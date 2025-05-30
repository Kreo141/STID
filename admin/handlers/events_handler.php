<?php
require_once '../config/config.php';

// container sa mga functions / methods
class EventsHandler {

    private $conn;

    public function __construct() {
        $config = require '../config/config.php';
        $this->conn = new mysqli(
            $config['DB_HOST'],
            $config['DB_USER'],
            $config['DB_PASS'],
            $config['DB_NAME']
        );

        if ($this->conn->connect_error) {
            die("Connection failed: " . $this->conn->connect_error);
        }
    }

    public function getAllEvents() {
        $sql = "SELECT * FROM events ORDER BY date DESC";
        $result = $this->conn->query($sql);
        $events = [];

        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $events[] = $row;
            }
        }

        return $events;
    }

    public function getEventById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM events WHERE event_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    public function createEvent($title, $description, $date, $days) {
        $stmt = $this->conn->prepare("INSERT INTO events (title, description, date, days) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $title, $description, $date, $days);
        return $stmt->execute();
    }

    public function updateEvent($id, $title, $description, $date, $days) {
        $stmt = $this->conn->prepare("UPDATE events SET title = ?, description = ?, date = ?, days = ? WHERE event_id = ?");
        $stmt->bind_param("sssii", $title, $description, $date, $days, $id);
        return $stmt->execute();
    }

    public function deleteEvent($id) {
        $stmt = $this->conn->prepare("DELETE FROM events WHERE event_id = ?");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    public function __destruct() {
        $this->conn->close();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $handler = new EventsHandler();
    
    if (isset($_GET['id'])) {
        // Get single event
        $event = $handler->getEventById($_GET['id']);
        header('Content-Type: application/json');
        echo json_encode($event);
    } else {
        // Get all events
        $events = $handler->getAllEvents();
        header('Content-Type: application/json');
        echo json_encode($events);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $handler = new EventsHandler();
    $response = ['success' => false, 'message' => ''];

    if (isset($_POST['action'])) {
        try {
            switch ($_POST['action']) {
                case 'create':
                    if (isset($_POST['title'], $_POST['description'], $_POST['date'], $_POST['days'])) {
                        $response['success'] = $handler->createEvent(
                            $_POST['title'],
                            $_POST['description'],
                            $_POST['date'],
                            $_POST['days']  
                        );
                        $response['message'] = $response['success'] ? 'Event created successfully' : 'Failed to create event';
                    }
                    break;

                case 'update':
                    if (isset($_POST['id'], $_POST['title'], $_POST['description'],$_POST['date'], $_POST['days'])) {
                        $response['success'] = $handler->updateEvent(
                            $_POST['id'],
                            $_POST['title'],
                            $_POST['description'],
                            $_POST['date'],
                            $_POST['days']
                        );
                        $response['message'] = $response['success'] ? 'Event updated successfully' : 'Failed to update event';
                    }
                    break;

                case 'delete':
                    if (isset($_POST['id'])) {
                        $response['success'] = $handler->deleteEvent($_POST['id']);
                        $response['message'] = $response['success'] ? 'Event deleted successfully' : 'Failed to delete event';
                    }
                    break;
            }
        } catch (Exception $e) {
            $response['message'] = 'Error: ' . $e->getMessage();
        }
    }

    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?> 