"""
用户数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=True, default="用户", comment="用户姓名")
    phone = Column(String(20), unique=True, nullable=False, index=True, comment="手机号")
    password_hash = Column(String(255), nullable=False, comment="密码哈希")
    avatar_url = Column(String(500), nullable=True, comment="头像URL")
    is_admin = Column(Integer, default=0, comment="是否为管理员")  # 0:普通用户, 1:管理员 (Using Integer for better compatibility)
    is_deleted = Column(Integer, default=0, comment="是否已删除")   # 0:正常, 1:已删除
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关联关系
    analyses = relationship("ArtworkAnalysis", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")
