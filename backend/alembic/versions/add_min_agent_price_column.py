"""add min_agent_price column

Revision ID: add_min_agent_price
Revises: 0e0aef822f66
Create Date: 2024-03-22 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_min_agent_price'
down_revision: Union[str, None] = '0e0aef822f66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 创建临时表
    op.execute('''
        CREATE TABLE product_inventory_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_no VARCHAR(50) NOT NULL,
            product_name VARCHAR(100) NOT NULL,
            proxy_type SMALLINT NOT NULL,
            use_type VARCHAR(20) NOT NULL,
            protocol VARCHAR(20) NOT NULL,
            use_limit SMALLINT NOT NULL,
            sell_limit SMALLINT NOT NULL,
            area_code VARCHAR(20),
            country_code VARCHAR(3) NOT NULL,
            state_code VARCHAR(6) NOT NULL,
            city_code VARCHAR(9) NOT NULL,
            detail TEXT,
            cost_price DECIMAL(10,4) NOT NULL,
            global_price DECIMAL(10,4),
            min_agent_price DECIMAL(10,4),
            inventory INTEGER NOT NULL DEFAULT 0,
            ip_type SMALLINT DEFAULT 1,
            isp_type SMALLINT DEFAULT 0,
            net_type SMALLINT DEFAULT 0,
            duration INTEGER NOT NULL,
            unit SMALLINT NOT NULL,
            band_width INTEGER,
            band_width_price DECIMAL(10,4),
            max_band_width INTEGER,
            flow INTEGER,
            cpu INTEGER,
            memory FLOAT,
            enable SMALLINT DEFAULT 1,
            supplier_code VARCHAR(20),
            ip_count INTEGER,
            ip_duration INTEGER,
            assign_ip SMALLINT DEFAULT -1,
            cidr_status SMALLINT DEFAULT -1,
            static_type VARCHAR(20),
            last_sync_time TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_start VARCHAR(15),
            ip_end VARCHAR(15)
        )
    ''')
    
    # 复制数据
    op.execute('''
        INSERT INTO product_inventory_new 
        SELECT *, NULL as min_agent_price
        FROM product_inventory
    ''')
    
    # 删除旧表
    op.execute('DROP TABLE product_inventory')
    
    # 重命名新表
    op.execute('ALTER TABLE product_inventory_new RENAME TO product_inventory')
    
    # 创建索引
    op.execute('CREATE INDEX ix_product_inventory_product_no ON product_inventory (product_no)')
    op.execute('CREATE INDEX ix_product_inventory_proxy_type ON product_inventory (proxy_type)')
    op.execute('CREATE INDEX ix_product_inventory_area_code ON product_inventory (area_code)')
    op.execute('CREATE INDEX ix_product_inventory_country_code ON product_inventory (country_code)')
    op.execute('CREATE INDEX ix_product_inventory_city_code ON product_inventory (city_code)')
    op.execute('CREATE INDEX ix_product_inventory_supplier_code ON product_inventory (supplier_code)')
    op.execute('CREATE INDEX ix_product_inventory_static_type ON product_inventory (static_type)')

def downgrade() -> None:
    # 删除 min_agent_price 列
    op.execute('''
        CREATE TABLE product_inventory_old (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_no VARCHAR(50) NOT NULL,
            product_name VARCHAR(100) NOT NULL,
            proxy_type SMALLINT NOT NULL,
            use_type VARCHAR(20) NOT NULL,
            protocol VARCHAR(20) NOT NULL,
            use_limit SMALLINT NOT NULL,
            sell_limit SMALLINT NOT NULL,
            area_code VARCHAR(20),
            country_code VARCHAR(3) NOT NULL,
            state_code VARCHAR(6) NOT NULL,
            city_code VARCHAR(9) NOT NULL,
            detail TEXT,
            cost_price DECIMAL(10,4) NOT NULL,
            global_price DECIMAL(10,4),
            inventory INTEGER NOT NULL DEFAULT 0,
            ip_type SMALLINT DEFAULT 1,
            isp_type SMALLINT DEFAULT 0,
            net_type SMALLINT DEFAULT 0,
            duration INTEGER NOT NULL,
            unit SMALLINT NOT NULL,
            band_width INTEGER,
            band_width_price DECIMAL(10,4),
            max_band_width INTEGER,
            flow INTEGER,
            cpu INTEGER,
            memory FLOAT,
            enable SMALLINT DEFAULT 1,
            supplier_code VARCHAR(20),
            ip_count INTEGER,
            ip_duration INTEGER,
            assign_ip SMALLINT DEFAULT -1,
            cidr_status SMALLINT DEFAULT -1,
            static_type VARCHAR(20),
            last_sync_time TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_start VARCHAR(15),
            ip_end VARCHAR(15)
        )
    ''')
    
    # 复制数据（不包括 min_agent_price 列）
    op.execute('''
        INSERT INTO product_inventory_old 
        SELECT id, product_no, product_name, proxy_type, use_type, protocol, 
               use_limit, sell_limit, area_code, country_code, state_code, 
               city_code, detail, cost_price, global_price, inventory, 
               ip_type, isp_type, net_type, duration, unit, band_width, 
               band_width_price, max_band_width, flow, cpu, memory, enable, 
               supplier_code, ip_count, ip_duration, assign_ip, cidr_status, 
               static_type, last_sync_time, created_at, updated_at, 
               ip_start, ip_end
        FROM product_inventory
    ''')
    
    # 删除旧表
    op.execute('DROP TABLE product_inventory')
    
    # 重命名新表
    op.execute('ALTER TABLE product_inventory_old RENAME TO product_inventory')
    
    # 重新创建索引
    op.execute('CREATE INDEX ix_product_inventory_product_no ON product_inventory (product_no)')
    op.execute('CREATE INDEX ix_product_inventory_proxy_type ON product_inventory (proxy_type)')
    op.execute('CREATE INDEX ix_product_inventory_area_code ON product_inventory (area_code)')
    op.execute('CREATE INDEX ix_product_inventory_country_code ON product_inventory (country_code)')
    op.execute('CREATE INDEX ix_product_inventory_city_code ON product_inventory (city_code)')
    op.execute('CREATE INDEX ix_product_inventory_supplier_code ON product_inventory (supplier_code)')
    op.execute('CREATE INDEX ix_product_inventory_static_type ON product_inventory (static_type)') 