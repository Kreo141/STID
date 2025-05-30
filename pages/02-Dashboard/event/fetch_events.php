<?php
header('Content-Type: application/json');

$hostname = "sql201.infinityfree.com";
$username = "if0_38551847";
$password = "OGOHtUgot0YMZ";
$dbName = "if0_38551847_fnl_group3";

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $stmt = $pdo->query('SELECT * FROM events ORDER BY date');
    $events = $stmt->fetchAll();
    
    echo json_encode($events);
} catch (\PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>