"""
艺术品分析数据模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import LONGTEXT

from app.database import Base


class ArtworkAnalysis(Base):
    """艺术品分析表"""
    __tablename__ = "artwork_analyses"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    
    # 基础信息
    title = Column(String(200), nullable=False, comment="作品标题")
    artist = Column(String(100), nullable=False, comment="艺术家")
    artist_gender = Column(String(20), nullable=True, comment="艺术家性别")
    style = Column(String(100), nullable=True, comment="艺术风格")
    period = Column(String(100), nullable=True, comment="创作时期")
    origin = Column(String(100), nullable=True, comment="起源地")
    
    # 详细分析（JSON 格式）
    palette = Column(JSON, nullable=True, comment="色彩调色板")
    composition = Column(Text, nullable=True, comment="构图描述")
    interpretation = Column(Text, nullable=True, comment="作品解读")
    core_analysis = Column(JSON, nullable=True, comment="核心艺术分析")
    artist_info = Column(JSON, nullable=True, comment="艺术家信息")
    investment_analysis = Column(JSON, nullable=True, comment="投资价值分析")
    
    # 图片和统计
    image_url = Column(LONGTEXT, nullable=False, comment="作品图片URL")
    likes = Column(Integer, default=0, comment="点赞数")
    is_deleted = Column(Integer, default=0, comment="是否已删除")  # 0:正常, 1:已删除
    
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    
    # 关联关系
    user = relationship("User", back_populates="analyses")
    favorites = relationship("UserFavorite", back_populates="analysis", cascade="all, delete-orphan")
