from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime
from enum import Enum


class ExhibitionStatusEnum(str, Enum):
    """
    展览状态枚举，值与 ORM 模型的 status property 返回值一致
    """
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    ENDED = "ended"


class ExhibitionBase(BaseModel):
    title: str
    cover_image: str
    venue: str
    start_date: datetime
    end_date: datetime
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    ticket_info: Optional[str] = None
    description: Optional[str] = None
    official_link: Optional[str] = None


class ExhibitionCreate(ExhibitionBase):
    """创建展览时的请求体，忽略前端可能传入的额外字段（如 status）"""

    model_config = {"extra": "ignore"}


class ExhibitionUpdate(BaseModel):
    title: Optional[str] = None
    cover_image: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    ticket_info: Optional[str] = None
    description: Optional[str] = None
    official_link: Optional[str] = None


class ExhibitionOut(ExhibitionBase):
    """
    返回给前端的展览数据，status 通过 model_validator 根据日期自动计算
    """
    id: int
    created_at: datetime
    updated_at: datetime
    status: Optional[ExhibitionStatusEnum] = None
    is_favorited: Optional[bool] = False

    model_config = {"from_attributes": True}

    # NOTE: 使用 model_validator 替代 @property，解决 Pydantic 字段与 property 冲突的问题
    @model_validator(mode="after")
    def compute_status(self) -> "ExhibitionOut":
        """根据当前时间与展览起止时间自动计算状态"""
        now = datetime.now()
        if now < self.start_date:
            self.status = ExhibitionStatusEnum.UPCOMING
        elif now > self.end_date:
            self.status = ExhibitionStatusEnum.ENDED
        else:
            self.status = ExhibitionStatusEnum.ONGOING
        return self
