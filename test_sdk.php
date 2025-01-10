<?php

require_once __DIR__ . '/ipv-php-sdk/vendor/autoload.php';

use Cl\OpenAPISDK\Model\IpvConfig;
use Cl\OpenAPISDK\Api\IpvApi;
use Cl\OpenAPISDK\Api\AppProductSyncReq;

// 创建配置
$config = new IpvConfig();
$config->setAppId('AK20241120145620');
$config->setAppKey('bf3ffghlt0hpc4omnvc2583jt0fag6a4');
$config->setEndPont('https://sandbox.ipipv.com');

// 创建API实例
$api = new IpvApi($config);

// 创建请求参数
$params = new AppProductSyncReq();
$params->setTimestamp(time());

// 发送请求
try {
    $result = $api->getProductStock($params);
    var_dump($result);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
