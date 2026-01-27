"""
数据库迁移说明

将 users 表的 name 字段从 NOT NULL 改为 NULLABLE
"""

# 如果你已经在 Zeabur 运行了 init_db.py，需要手动执行这个 SQL 来修改现有表结构

ALTER_SQL = """
-- 修改 users 表的 name 字段为可空
ALTER TABLE users MODIFY COLUMN name VARCHAR(100) NULL DEFAULT '用户' COMMENT '用户姓名';

-- 为已存在的空 name 字段设置默认值
UPDATE users SET name = CONCAT('用户', SUBSTRING(phone, -4)) WHERE name IS NULL OR name = '';
"""

print("数据库迁移 SQL:")
print(ALTER_SQL)
print("\n执行方法：")
print("1. 连接到 MySQL 数据库")
print("2. 复制上面的 SQL 语句执行")
print("3. 或者在 Zeabur MySQL 服务的 Terminal 中执行")
