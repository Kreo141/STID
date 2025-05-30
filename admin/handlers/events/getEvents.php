<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'events'");
    if (!$stmt->fetch()) {
        throw new Exception('Events table does not exist');
    }

    $stmt = $pdo->query("
        SELECT event_id, title, description, date, days 
        FROM events 
        ORDER BY date DESC
    ");
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($events);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 