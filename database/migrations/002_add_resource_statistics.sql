-- 资源使用统计表
CREATE TABLE resource_usage_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_type_id INT NOT NULL,
    total_opened INT NOT NULL DEFAULT 0,
    last_month_opened INT NOT NULL DEFAULT 0,
    this_month_opened INT NOT NULL DEFAULT 0,
    available_count INT NOT NULL DEFAULT 0,
    expired_count INT NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(id)
);

-- 资源使用历史记录表
CREATE TABLE resource_usage_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_type_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('opened', 'expired') NOT NULL,
    opened_at DATETIME NOT NULL,
    expired_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 添加索引以提高查询性能
CREATE INDEX idx_resource_usage_type ON resource_usage_statistics(resource_type_id);
CREATE INDEX idx_resource_history_type ON resource_usage_history(resource_type_id);
CREATE INDEX idx_resource_history_user ON resource_usage_history(user_id);
CREATE INDEX idx_resource_history_status ON resource_usage_history(status);
CREATE INDEX idx_resource_history_dates ON resource_usage_history(opened_at, expired_at); 