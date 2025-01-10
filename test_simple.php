<?php

$app_id = 'AK20241120145620';
$app_key = 'bf3ffghlt0hpc4omnvc2583jt0fag6a4';
$timestamp = time();

// 构造请求参数
$params = [
    'timestamp' => (string)$timestamp
];

// 将参数转换为JSON字符串
$json_params = json_encode($params);

// AES-256-CBC加密
$key = $app_key;
$iv = substr($key, 0, 16);
$encrypted = openssl_encrypt($json_params, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

// Base64编码
$params_base64 = base64_encode($encrypted);

// 构造最终请求
$request_data = [
    'version' => 'v2',
    'encrypt' => 'AES',
    'appKey' => $app_id,
    'params' => $params_base64
];

// 生成curl命令
echo "curl -X POST 'https://sandbox.ipipv.com/api/open/app/product/query/v2' \\\n";
echo "-H 'Content-Type: application/json' \\\n";
echo "-d '" . json_encode($request_data) . "'\n";
