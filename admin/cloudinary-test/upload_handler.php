<?php
require 'vendor/autoload.php';

use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;

// Config
Configuration::instance([
    'cloud' => [
        'cloud_name' => '',
        'api_key'    => '',
        'api_secret' => '',
    ],
    'url' => ['secure' => true]
]);

$uploadedFiles = $_FILES['images'];
$total = count($uploadedFiles['name']);

$uploadedUrls = [];

for ($i = 0; $i < $total; $i++) {
    if ($uploadedFiles['error'][$i] === UPLOAD_ERR_OK) {
        $tmpName = $uploadedFiles['tmp_name'][$i];
        $originalName = $uploadedFiles['name'][$i];

        // Upload to Cloudinary
        $result = (new UploadApi())->upload($tmpName, [
            'public_id' => pathinfo($originalName, PATHINFO_FILENAME)
        ]);

        $uploadedUrls[] = $result['secure_url'];
    }
}

// Display uploaded images
foreach ($uploadedUrls as $url) {
    echo '<img src="' . $url . '" style="width:200px;margin:10px;">';
}
?>