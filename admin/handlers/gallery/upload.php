<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require '../../cloudinary-test/vendor/autoload.php';
require_once '../../config/config.php';
use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;

$response = ['success' => false, 'message' => '', 'url' => '', 'urls' => [], 'debug' => []];

Configuration::instance([
    'cloud' => [
        'cloud_name' => '',
        'api_key'    => '',
        'api_secret' => '',
    ],
    'url' => ['secure' => true]
]);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $uploadType = $_POST['type'] ?? 'photo';
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $maxSize = 100 * 1024 * 1024;

    $response['debug']['post'] = $_POST;
    $response['debug']['files'] = $_FILES;

    function generateUniqueFilename($originalName, $prefix = '') {
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $timestamp = time();
        $randomString = bin2hex(random_bytes(4));
        return $prefix . $timestamp . '_' . $randomString . '.' . $extension;
    }

    if ($uploadType === 'album') {
        if (isset($_FILES['image'])) {
            $file = $_FILES['image'];
            $response['debug']['album_file'] = $file;

            if (!in_array($file['type'], $allowedTypes)) {
                $response['message'] = 'Invalid file type. Only JPG, PNG, and GIF are allowed.';
                $response['debug']['file_type'] = $file['type'];
                echo json_encode($response);
                exit;
            }

            if ($file['size'] > $maxSize) {
                $response['message'] = 'File is too large. Maximum size is 100MB.';
                $response['debug']['file_size'] = $file['size'];
                echo json_encode($response);
                exit;
            }

            try {
                $result = (new UploadApi())->upload($file['tmp_name'], [
                    'public_id' => 'album_' . pathinfo($file['name'], PATHINFO_FILENAME),
                    'folder' => 'gallery/cover'
                ]);
                $response['success'] = true;
                $response['url'] = $result['secure_url'];
                $response['debug']['cloudinary_result'] = $result;
            } catch (Exception $e) {
                $response['message'] = 'Cloudinary upload failed: ' . $e->getMessage();
                $response['debug']['cloudinary_error'] = $e->getMessage();
            }
        } else {
            $response['message'] = 'No album image received';
        }
    } else {
        if (isset($_FILES['image'])) {
            $files = $_FILES['image'];
            $response['debug']['received_files'] = $files;

            $fileCount = is_array($files['name']) ? count($files['name']) : 1;
            $successCount = 0;
            $response['debug']['file_count'] = $fileCount;

            for ($i = 0; $i < $fileCount; $i++) {
                $file = [
                    'name' => is_array($files['name']) ? $files['name'][$i] : $files['name'],
                    'type' => is_array($files['type']) ? $files['type'][$i] : $files['type'],
                    'tmp_name' => is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'],
                    'error' => is_array($files['error']) ? $files['error'][$i] : $files['error'],
                    'size' => is_array($files['size']) ? $files['size'][$i] : $files['size']
                ];
                $response['debug']['processing_file_' . $i] = $file;

                if ($file['error'] !== UPLOAD_ERR_OK) {
                    $response['debug']['error_' . $i] = 'Upload error code: ' . $file['error'];
                    continue;
                }

                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $file['tmp_name']);
                finfo_close($finfo);
                $response['debug']['mime_type_' . $i] = $mimeType;

                if (!in_array($mimeType, $allowedTypes)) {
                    $response['debug']['invalid_type_' . $i] = $mimeType;
                    continue;
                }

                if ($file['size'] > $maxSize) {
                    $response['debug']['invalid_size_' . $i] = $file['size'];
                    continue;
                }

                try {
                    $result = (new UploadApi())->upload($file['tmp_name'], [
                        'public_id' => 'photo_' . pathinfo($file['name'], PATHINFO_FILENAME),
                        'folder' => 'gallery/photos' // optional
                    ]);
                    $response['urls'][] = $result['secure_url'];
                    $response['debug']['cloudinary_result_' . $i] = $result;
                    $successCount++;
                } catch (Exception $e) {
                    $response['debug']['cloudinary_error_' . $i] = $e->getMessage();
                }
            }

            if ($successCount > 0) {
                $response['success'] = true;
                $response['message'] = "Successfully uploaded $successCount photo(s)";
                if ($successCount === 1) {
                    $response['url'] = $response['urls'][0];
                }
            } else {
                $response['message'] = 'No photos were uploaded successfully';
            }
        } else {
            $response['message'] = 'No files received';
            $response['debug']['files_global'] = $_FILES;
        }
    }
}

header('Content-Type: application/json');
echo json_encode($response);
?> 