"""
数据库连接和会话管理
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# 创建数据库引擎
# NOTE: 显式限制连接池大小,避免容器内存被大量连接占用
engine = create_engine(
    settings.DATABASE_URL,
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
