<?php
require_once '../../config/config.php';

/*
    THIS IS JUST INSANITY
        THIS IS JUST INSANITY
            THIS IS JUST INSANITY
                THIS IS JUST INSANITY
                    THIS IS JUST INSANITY
                        THIS IS JUST INSANITY
                            THIS IS JUST INSANITY
                                THIS IS JUST INSANITY
                                    THIS IS JUST INSANITY
                                        THIS IS JUST INSANITY
                                            THIS IS JUST INSANITY
                                                THIS IS JUST INSANITY
                                                    THIS IS JUST INSANITY
                                                        THIS IS JUST INSANITY
                                                    THIS IS JUST INSANITY
                                                THIS IS JUST INSANITY
                                            THIS IS JUST INSANITY
                                        THIS IS JUST INSANITY
                                    THIS IS JUST INSANITY
                                THIS IS JUST INSANITY
                            THIS IS JUST INSANITY
                        THIS IS JUST INSANITY
                    THIS IS JUST INSANITY
                THIS IS JUST INSANITY
            THIS IS JUST INSANITY
        THIS IS JUST INSANITY
    THIS IS JUST INSANITY
        THIS IS JUST INSANITY
            THIS IS JUST INSANITY
                THIS IS JUST INSANITY
                    THIS IS JUST INSANITY
                        THIS IS JUST INSANITY
                            THIS IS JUST INSANITY
                                THIS IS JUST INSANITY
                                    THIS IS JUST INSANITY
                                        THIS IS JUST INSANITY
                                            THIS IS JUST INSANITY
                                                THIS IS JUST INSANITY
                                                    THIS IS JUST INSANITY
                                                        THIS IS JUST INSANITY
                                                            THIS IS JUST INSANITY
                                                        THIS IS JUST INSANITY
                                                    THIS IS JUST INSANITY
                                                THIS IS JUST INSANITY
                                            THIS IS JUST INSANITY
                                        THIS IS JUST INSANITY
                                    THIS IS JUST INSANITY
                                THIS IS JUST INSANITY
                            THIS IS JUST INSANITY
                        THIS IS JUST INSANITY
                    THIS IS JUST INSANITY
                THIS IS JUST INSANITY
            THIS IS JUST INSANITY
        THIS IS JUST INSANITY
    THIS IS JUST INSANITY
        THIS IS JUST INSANITY
            THIS IS JUST INSANITY
                THIS IS JUST INSANITY
                    THIS IS JUST INSANITY
                        THIS IS JUST INSANITY
                            THIS IS JUST INSANITY
                                THIS IS JUST INSANITY
                                    THIS IS JUST INSANITY
                                        THIS IS JUST INSANITY
                                            THIS IS JUST INSANITY
                                                THIS IS JUST INSANITY
                                                    THIS IS JUST INSANITY
                                                        THIS IS JUST INSANITY
                                                    THIS IS JUST INSANITY
                                                THIS IS JUST INSANITY
                                            THIS IS JUST INSANITY
                                        THIS IS JUST INSANITY
                                    THIS IS JUST INSANITY
                                THIS IS JUST INSANITY
                            THIS IS JUST INSANITY
                        THIS IS JUST INSANITY
                    THIS IS JUST INSANITY
                THIS IS JUST INSANITY
            THIS IS JUST INSANITY
        THIS IS JUST INSANITY
    THIS IS JUST INSANITY
        THIS IS JUST INSANITY
            THIS IS JUST INSANITY
                THIS IS JUST INSANITY
                    THIS IS JUST INSANITY
                        THIS IS JUST INSANITY
                            THIS IS JUST INSANITY
                                THIS IS JUST INSANITY
                                    THIS IS JUST INSANITY
                                        THIS IS JUST INSANITY
                                            THIS IS JUST INSANITY
                                                THIS IS JUST INSANITY
                                                    THIS IS JUST INSANITY
                                                        THIS IS JUST INSANITY
                                                            THIS IS JUST INSANITY
                                                        THIS IS JUST INSANITY
                                                    THIS IS JUST INSANITY
                                                THIS IS JUST INSANITY
                                            THIS IS JUST INSANITY
                                        THIS IS JUST INSANITY
                                    THIS IS JUST INSANITY
                                THIS IS JUST INSANITY
                            THIS IS JUST INSANITY
                        THIS IS JUST INSANITY
                    THIS IS JUST INSANITY
                THIS IS JUST INSANITY
            THIS IS JUST INSANITY
        THIS IS JUST INSANITY
    THIS IS JUST INSANITY
*/

class Gallery {
    private $conn;

    public function __construct() {
        $config = require '../../config/config.php';
        $this->conn = new mysqli($config['DB_HOST'], $config['DB_USER'], $config['DB_PASS'], $config['DB_NAME']);
        
        if ($this->conn->connect_error) {
            die("Connection failed: " . $this->conn->connect_error);
        }
    }

    public function createAlbum($title, $imageUrl) {
        $stmt = $this->conn->prepare("INSERT INTO albums (album_title, album_image_url) VALUES (?, ?)");
        $stmt->bind_param("ss", $title, $imageUrl);
        return $stmt->execute();
    }

    public function getAlbums() {
        $result = $this->conn->query("SELECT * FROM albums ORDER BY album_id DESC");
        $albums = [];
        while ($row = $result->fetch_assoc()) {
            $albums[] = $row;
        }
        return $albums;
    }

    public function updateAlbum($id, $title, $imageUrl) {
        $stmt = $this->conn->prepare("UPDATE albums SET album_title = ?, album_image_url = ? WHERE album_id = ?");
        $stmt->bind_param("ssi", $title, $imageUrl, $id);
        return $stmt->execute();
    }

    public function deleteAlbum($albumId) {
        try {
            $this->conn->begin_transaction();
            
            $stmt = $this->conn->prepare("SELECT album_image_url FROM albums WHERE album_id = ?");
            $stmt->bind_param("i", $albumId);
            $stmt->execute();
            $result = $stmt->get_result();
            $album = $result->fetch_assoc();
            
            if (!$album) {
                throw new Exception("Album not found");
            }
            
            $stmt = $this->conn->prepare("SELECT photo_url FROM photos WHERE gallery_id = ?");
            $stmt->bind_param("i", $albumId);
            $stmt->execute();
            $result = $stmt->get_result();
            $photos = $result->fetch_all(MYSQLI_ASSOC);
            
            $stmt = $this->conn->prepare("DELETE FROM photos WHERE gallery_id = ?");
            $stmt->bind_param("i", $albumId);
            $stmt->execute();
            
            $stmt = $this->conn->prepare("DELETE FROM albums WHERE album_id = ?");
            $stmt->bind_param("i", $albumId);
            $stmt->execute();
            
            $this->conn->commit();
            
            $coverPath = str_replace('../../resources/', '../../../resources/', $album['album_image_url']);
            if (file_exists($coverPath)) {
                unlink($coverPath);
            }
            
            foreach ($photos as $photo) {
                $photoPath = str_replace('../../resources/', '../../../resources/', $photo['photo_url']);
                if (file_exists($photoPath)) {
                    unlink($photoPath);
                }
            }
            
            return ['success' => true, 'message' => 'Album and all its photos deleted successfully'];
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => 'Error deleting album: ' . $e->getMessage()];
        }
    }

    public function addPhoto($albumId, $photoUrl) {
        $stmt = $this->conn->prepare("INSERT INTO photos (gallery_id, photo_url) VALUES (?, ?)");
        $stmt->bind_param("is", $albumId, $photoUrl);
        return $stmt->execute();
    }

    public function getPhotos($albumId) {
        $stmt = $this->conn->prepare("SELECT * FROM photos WHERE gallery_id = ? ORDER BY photo_id DESC");
        $stmt->bind_param("i", $albumId);
        $stmt->execute();
        $result = $stmt->get_result();
        $photos = [];
        while ($row = $result->fetch_assoc()) {
            $photos[] = $row;
        }
        return $photos;
    }

    public function updatePhoto($photoId, $photoUrl) {
        $stmt = $this->conn->prepare("UPDATE photos SET photo_url = ? WHERE photo_id = ?");
        $stmt->bind_param("si", $photoUrl, $photoId);
        return $stmt->execute();
    }

    public function deletePhoto($photoId) {
        $stmt = $this->conn->prepare("SELECT photo_url FROM photos WHERE photo_id = ?");
        $stmt->bind_param("i", $photoId);
        $stmt->execute();
        $result = $stmt->get_result();
    
        if ($result && $row = $result->fetch_assoc()) {
            $imageUrl = "../" . $row['photo_url'];
    
            if (file_exists($imageUrl)) {
                unlink($imageUrl); 
            }
    
            $stmt = $this->conn->prepare("DELETE FROM photos WHERE photo_id = ?");
            $stmt->bind_param("i", $photoId);
            return $stmt->execute();
        }
    
        return true;
    }

    private function deleteAlbumPhotos($albumId) {
        $stmt = $this->conn->prepare("DELETE FROM photos WHERE gallery_id = ?");
        $stmt->bind_param("i", $albumId);
        return $stmt->execute();
    }

    public function __destruct() {
        $this->conn->close();
    }
}

$gallery = new Gallery();
$response = ['success' => false, 'message' => ''];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'create':
                $title = $_POST['title'] ?? '';
                $imageUrl = $_POST['imageUrl'] ?? '';
                if ($gallery->createAlbum($title, $imageUrl)) {
                    $response['success'] = true;
                    $response['message'] = 'Album created successfully';
                }
                break;
                
            case 'update':
                $id = $_POST['id'] ?? 0;
                $title = $_POST['title'] ?? '';
                $imageUrl = $_POST['imageUrl'] ?? '';
                if ($gallery->updateAlbum($id, $title, $imageUrl)) {
                    $response['success'] = true;
                    $response['message'] = 'Album updated successfully';
                }
                break;
                
            case 'delete':
                $id = $_POST['id'] ?? 0;
                $result = $gallery->deleteAlbum($id);
                $response = $result;
                break;

            case 'add_photo':
                $albumId = $_POST['albumId'] ?? 0;
                $photoUrl = $_POST['photoUrl'] ?? '';
                if ($gallery->addPhoto($albumId, $photoUrl)) {
                    $response['success'] = true;
                    $response['message'] = 'Photo added successfully';
                }
                break;

            case 'update_photo':
                $photoId = $_POST['photoId'] ?? 0;
                $photoUrl = $_POST['photoUrl'] ?? '';
                if ($gallery->updatePhoto($photoId, $photoUrl)) {
                    $response['success'] = true;
                    $response['message'] = 'Photo updated successfully';
                }
                break;

            case 'delete_photo':
                $photoId = $_POST['photoId'] ?? 0;
                if ($gallery->deletePhoto($photoId)) {
                    $response['success'] = true;
                    $response['message'] = 'Photo deleted successfully';
                }
                break;

            case 'get_photos':
                $albumId = $_POST['albumId'] ?? 0;
                $response['success'] = true;
                $response['data'] = $gallery->getPhotos($albumId);
                break;
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $response['success'] = true;
        $response['data'] = $gallery->getAlbums();
    }
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ];
}

header('Content-Type: application/json');
echo json_encode($response);
?> 