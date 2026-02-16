from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class ExhibitionStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    ENDED = "ended"

class Exhibition(Base):
    __tablename__ = "exhibitions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False, comment="展览名称")
    cover_image = Column(Text, nullable=False, comment="封面图URL")
    venue = Column(String(255), nullable=False, comment="展馆")
    start_date = Column(DateTime, nullable=False, comment="开始时间")
    end_date = Column(DateTime, nullable=False, comment="结束时间")
    address = Column(String(500), nullable=True, comment="详细地址")
    city = Column(String(100), index=True, nullable=True, comment="城市")
    country = Column(String(100), nullable=True, comment="国家")
    continent = Column(String(50), nullable=True, comment="大洲")
    ticket_info = Column(Text, nullable=True, comment="门票信息")
    description = Column(Text, nullable=True, comment="详细介绍")
    official_link = Column(String(500), nullable=True, comment="官方链接")
    
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # Relationships
    favorited_by = relationship("UserExhibitionFavorite", back_populates="exhibition", cascade="all, delete-orphan")

    # NOTE: status 字段的计算已移除 @property，改由 Pydantic ExhibitionOut schema 的 model_validator 负责
    # 这样避免了 ORM model property 与 Pydantic schema 字段的冲突

class UserExhibitionFavorite(Base):
    __tablename__ = "user_exhibition_favorites"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    exhibition_id = Column(Integer, ForeignKey("exhibitions.id"), primary_key=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", backref="favorite_exhibitions")
    exhibition = relationship("Exhibition", back_populates="favorited_by")
