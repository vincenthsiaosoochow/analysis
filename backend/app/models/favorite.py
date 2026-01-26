"""
用户收藏数据模型
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class UserFavorite(Base):
    """用户收藏表"""
    __tablename__ = "user_favorites"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    analysis_id = Column(Integer, ForeignKey("artwork_analyses.id"), nullable=False, comment="分析ID")
    created_at = Column(DateTime, server_default=func.now(), comment="收藏时间")
    
    # 关联关系
    user = relationship("User", back_populates="favorites")
    analysis = relationship("ArtworkAnalysis", back_populates="favorites")
    
    # 唯一约束
    __table_args__ = (
        UniqueConstraint('user_id', 'analysis_id', name='uq_user_analysis'),
    )
