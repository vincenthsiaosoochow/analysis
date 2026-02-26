"""
数据库连接和会话管理
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# NOTE: Zeabur 注入的 DATABASE_URL 可能用 mysql:// 前缀（MySQLdb 驱动），
# 但我们只安装了 pymysql，需要自动修正为 mysql+pymysql://
_db_url = settings.DATABASE_URL
if _db_url.startswith("mysql://"):
    _db_url = _db_url.replace("mysql://", "mysql+pymysql://", 1)
elif _db_url.startswith("mysql+mysqldb://"):
    _db_url = _db_url.replace("mysql+mysqldb://", "mysql+pymysql://", 1)

# 创建数据库引擎
# NOTE: 显式限制连接池大小,避免容器内存被大量连接占用
engine = create_engine(
    _db_url,
    pool_pre_ping=True,   # 连接池预检查
    pool_recycle=3600,    # 连接回收时间(秒)
    pool_size=3,          # 常驻连接数(Zeabur小实例建议3-5)
    max_overflow=5,       # 允许额外创建的临时连接数
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()


def get_db():
    """
    获取数据库会话
    用于 FastAPI 依赖注入
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
