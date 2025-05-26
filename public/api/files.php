<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$basePath = '/opt/data/hls';
$requestPath = $_GET['path'] ?? '/data/hls';

// Normalize the path
$requestPath = str_replace('/data/hls', '', $requestPath);
$fullPath = $basePath . $requestPath;

// Security check - ensure we don't go outside the base directory
$realBasePath = realpath($basePath);
$realFullPath = realpath($fullPath);

if (!$realFullPath || strpos($realFullPath, $realBasePath) !== 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

if (isset($_GET['download']) && $_GET['download'] === 'true') {
    // Handle file download
    if (is_file($fullPath)) {
        $filename = basename($fullPath);
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit;
    }
}

// List directory contents
if (!is_dir($fullPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Directory not found']);
    exit;
}

$files = [];
$items = scandir($fullPath);

foreach ($items as $item) {
    if ($item === '.' || $item === '..') {
        continue;
    }
    
    $itemPath = $fullPath . '/' . $item;
    $isDir = is_dir($itemPath);
    
    $files[] = [
        'name' => $item,
        'type' => $isDir ? 'folder' : 'file',
        'size' => $isDir ? 0 : filesize($itemPath),
        'modified' => date('Y-m-d H:i:s', filemtime($itemPath))
    ];
}

// Sort: folders first, then files, both alphabetically
usort($files, function($a, $b) {
    if ($a['type'] !== $b['type']) {
        return $a['type'] === 'folder' ? -1 : 1;
    }
    return strcasecmp($a['name'], $b['name']);
});

echo json_encode(['files' => $files]);
?> 