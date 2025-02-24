-- 删除旧表
DROP TABLE IF EXISTS resource_usage_statistics;

-- 创建新表
CREATE TABLE resource_usage_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_no VARCHAR(50) NOT NULL,
    resource_type VARCHAR(20) NOT NULL,
    total_amount FLOAT DEFAULT 0,
    used_amount FLOAT DEFAULT 0,
    today_usage FLOAT DEFAULT 0,
    month_usage FLOAT DEFAULT 0,
    last_month_usage FLOAT DEFAULT 0,
    last_sync_time DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_no) REFERENCES product_inventory(product_no)
);

-- 创建索引
CREATE INDEX ix_resource_usage_statistics_user_id ON resource_usage_statistics(user_id);
CREATE INDEX ix_resource_usage_statistics_product_no ON resource_usage_statistics(product_no);
CREATE INDEX ix_resource_usage_statistics_resource_type ON resource_usage_statistics(resource_type); 