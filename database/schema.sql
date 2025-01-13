-- IP Proxy System Database Schema

-- User Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    agent_id INT,
    status ENUM('active', 'disabled') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Agent Table
CREATE TABLE agents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'disabled') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dynamic Resource Details Table
CREATE TABLE dynamic_resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_name VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    status ENUM('available', 'assigned', 'unavailable') DEFAULT 'available',
    assigned_to INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Static Resource Details Table
CREATE TABLE static_resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_name VARCHAR(50) NOT NULL,
    country VARCHAR(50),
    region VARCHAR(50),
    city VARCHAR(50),
    ip_range VARCHAR(100) NOT NULL,
    total_count INT NOT NULL,
    available_count INT NOT NULL,
    used_count INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agent Resource Pricing Table
CREATE TABLE agent_resource_pricing (
    id INT PRIMARY KEY AUTO_INCREMENT,
    agent_id INT NOT NULL,
    resource_name VARCHAR(50) NOT NULL,
    resource_type ENUM('dynamic', 'static') NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Dynamic IP Orders Table
CREATE TABLE dynamic_ip_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    agent_id INT NOT NULL,
    duration INT NOT NULL,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Static IP Orders Table
CREATE TABLE static_ip_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    agent_id INT NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    resource_type VARCHAR(50) NOT NULL,
    status ENUM('active', 'expired') DEFAULT 'active',
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Static Resource Usage Log Table
CREATE TABLE static_resource_usage_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(50) NOT NULL,
    resource_name VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    agent_id INT NOT NULL,
    status ENUM('assigned', 'released') DEFAULT 'assigned',
    assigned_at DATETIME NOT NULL,
    released_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- System Resources Table
CREATE TABLE system_resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_name VARCHAR(50) NOT NULL,
    resource_type ENUM('dynamic', 'static') NOT NULL,
    total_capacity INT NOT NULL,
    available_count INT NOT NULL,
    used_count INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_user_agent ON users(agent_id);
CREATE INDEX idx_dynamic_resource_status ON dynamic_resources(status);
CREATE INDEX idx_static_resource_location ON static_resources(country, region, city);
CREATE INDEX idx_order_number_dynamic ON dynamic_ip_orders(order_number);
CREATE INDEX idx_order_number_static ON static_ip_orders(order_number);
CREATE INDEX idx_resource_usage_ip ON static_resource_usage_logs(ip_address);
CREATE INDEX idx_system_resource_type ON system_resources(resource_type);
