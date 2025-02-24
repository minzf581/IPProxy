-- 删除旧表
DROP TABLE IF EXISTS resource_usage_statistics;

-- 创建新表
CREATE TABLE resource_usage_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_no VARCHAR(50) NOT NULL,
    resource_type VARCHAR(20) NOT NULL,
    total_amount FLOAT DEFAULT 0,
    used_amount FLOAT DEFAULT 0,
    today_usage FLOAT DEFAULT 0,
    month_usage FLOAT DEFAULT 0,
    last_month_usage FLOAT DEFAULT 0,
    last_sync_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 添加索引
CREATE INDEX idx_resource_usage_user ON resource_usage_statistics(user_id);
CREATE INDEX idx_resource_usage_product ON resource_usage_statistics(product_no);
CREATE INDEX idx_resource_usage_type ON resource_usage_statistics(resource_type);
CREATE INDEX idx_resource_usage_sync ON resource_usage_statistics(last_sync_time); 