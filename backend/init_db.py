"""
数据库初始化脚本
创建所有必要的表
"""
from app.database import engine, Base
from app.models import User, ArtworkAnalysis, UserFavorite

def init_db():
    """
    初始化数据库
    创建所有表
    """
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成！")

if __name__ == "__main__":
    init_db()
