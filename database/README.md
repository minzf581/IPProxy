# IP Proxy System Database Setup

This directory contains the database schema and configuration for the IP Proxy System.

## Database Structure

The system uses MySQL/MariaDB with the following main tables:

1. `users` - Stores user information
2. `agents` - Stores agent (reseller) information
3. `dynamic_resources` - Manages dynamic IP pool resources
4. `static_resources` - Manages static IP resources
5. `agent_resource_pricing` - Stores pricing for different resources
6. `dynamic_ip_orders` - Tracks dynamic IP orders
7. `static_ip_orders` - Tracks static IP orders
8. `static_resource_usage_logs` - Logs static IP resource usage
9. `system_resources` - Tracks overall resource availability

## Setup Instructions

1. Install MySQL/MariaDB on your system
2. Create a new database:
   ```sql
   CREATE DATABASE ipproxy_db;
   ```
3. Import the schema:
   ```bash
   mysql -u your_username -p ipproxy_db < schema.sql
   ```
4. Set up environment variables:
   ```bash
   export DB_HOST=localhost
   export DB_USER=your_username
   export DB_PASSWORD=your_password
   export DB_NAME=ipproxy_db
   ```

## Environment Variables

- `DB_HOST` - Database host (default: localhost)
- `DB_USER` - Database username (default: root)
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: ipproxy_db)
- `NODE_ENV` - Environment (development/production)

## Database Migrations

When making changes to the database schema:

1. Create a new migration file in the `migrations` directory
2. Update the schema.sql file
3. Document the changes in this README

## Indexes

The schema includes indexes for optimizing common queries:

- User-agent relationships
- Resource status lookups
- Location-based queries
- Order number searches
- Resource usage tracking

## Backup and Maintenance

Regular backups should be configured using:

```bash
mysqldump -u your_username -p ipproxy_db > backup_$(date +%Y%m%d).sql
```
