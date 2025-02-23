BEGIN TRANSACTION;

-- 创建新表
CREATE TABLE users_new (
    id INTEGER NOT NULL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    app_username VARCHAR(50) UNIQUE,
    platform_account VARCHAR(50) UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    status INTEGER NOT NULL DEFAULT 1,
    is_admin BOOLEAN,
    is_agent BOOLEAN,
    balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    remark TEXT,
    last_login_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    agent_id INTEGER REFERENCES users(id),
    ipipv_username VARCHAR(50) UNIQUE,
    ipipv_password VARCHAR(255),
    total_recharge NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_consumption NUMERIC(10, 2) NOT NULL DEFAULT 0,
    UNIQUE(username, agent_id)
);

-- 复制数据
INSERT INTO users_new SELECT * FROM users;

-- 删除旧表
DROP TABLE users;

-- 重命名新表
ALTER TABLE users_new RENAME TO users;

-- 创建索引
CREATE INDEX ix_users_username ON users(username);
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_agent_id ON users(agent_id);

COMMIT; 